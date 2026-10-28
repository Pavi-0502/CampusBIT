-- =====================================================================
-- CampusBid PostgreSQL Functions, RLS Policies and Triggers
-- Migration: 002_functions_and_rules.sql
-- =====================================================================

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_bid_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- RLS POLICIES
-- =====================================================================

-- Profiles: Anyone can view public profiles; only owner can update their own
CREATE POLICY "Public profiles are viewable by all authenticated users"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auctions: Anyone can view active/ended/scheduled auctions; seller can insert/update eligible
CREATE POLICY "Auctions are viewable by everyone"
    ON auctions FOR SELECT USING (true);

CREATE POLICY "Sellers can create auctions"
    ON auctions FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own draft or active auctions"
    ON auctions FOR UPDATE USING (auth.uid() = seller_id);

-- Auction Images
CREATE POLICY "Auction images are viewable by everyone"
    ON auction_images FOR SELECT USING (true);

CREATE POLICY "Sellers can manage images for their auctions"
    ON auction_images FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auctions
            WHERE auctions.id = auction_images.auction_id
            AND auctions.seller_id = auth.uid()
        )
    );

-- Bids: Everyone can view bids (pseudonymized on frontend); only authenticated users can insert via trusted RPC
CREATE POLICY "Bids are viewable by everyone"
    ON bids FOR SELECT USING (true);

-- Auto Bid Settings: STRICT PRIVACY - ONLY the bidder can view and edit their own max limit!
CREATE POLICY "Users can only view their own auto-bid settings"
    ON auto_bid_settings FOR SELECT USING (auth.uid() = bidder_id);

CREATE POLICY "Users can create their own auto-bid setting"
    ON auto_bid_settings FOR INSERT WITH CHECK (auth.uid() = bidder_id);

CREATE POLICY "Users can update their own auto-bid setting"
    ON auto_bid_settings FOR UPDATE USING (auth.uid() = bidder_id);

CREATE POLICY "Users can delete their own auto-bid setting"
    ON auto_bid_settings FOR DELETE USING (auth.uid() = bidder_id);

-- Questions: Viewable by all; asker can insert
CREATE POLICY "Questions are viewable by everyone"
    ON questions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can ask questions"
    ON questions FOR INSERT WITH CHECK (auth.uid() = asker_id);

-- Answers: Viewable by all; only auction seller can answer
CREATE POLICY "Answers are viewable by everyone"
    ON answers FOR SELECT USING (true);

CREATE POLICY "Only auction sellers can answer questions"
    ON answers FOR INSERT WITH CHECK (
        auth.uid() = seller_id AND
        EXISTS (
            SELECT 1 FROM questions q
            JOIN auctions a ON a.id = q.auction_id
            WHERE q.id = answers.question_id
            AND a.seller_id = auth.uid()
        )
    );

-- Watchlist: Private to the user
CREATE POLICY "Users can view their own watchlist"
    ON watchlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their watchlist"
    ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their watchlist"
    ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- Saved Searches: Private to user
CREATE POLICY "Users manage their own saved searches"
    ON saved_searches FOR ALL USING (auth.uid() = user_id);

-- Notifications: Private to user
CREATE POLICY "Users manage their own notifications"
    ON notifications FOR ALL USING (auth.uid() = user_id);

-- Sales: Viewable by involved buyer or seller
CREATE POLICY "Sales viewable by seller or buyer"
    ON sales FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Audit logs: Read only by authenticated users for their actions
CREATE POLICY "Audit logs select"
    ON audit_logs FOR SELECT USING (auth.uid() = actor_id);


-- =====================================================================
-- CORE AUCTION ENGINE FUNCTIONS (TRANSACTIONAL & SECURE)
-- =====================================================================

-- 1. ATOMIC BID PLACEMENT
CREATE OR REPLACE FUNCTION place_bid(
    p_auction_id UUID,
    p_bidder_id UUID,
    p_amount_paise BIGINT,
    p_bid_type bid_type DEFAULT 'MANUAL'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_new_ends_at TIMESTAMPTZ;
    v_sniper_extended BOOLEAN := FALSE;
    v_previous_leader UUID;
    v_previous_price BIGINT;
    v_bid_id UUID;
    v_outbid_user UUID;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_min_required BIGINT;
BEGIN
    -- Acquire exclusive row lock on auction to prevent concurrent race conditions
    SELECT * INTO v_auction
    FROM auctions
    WHERE id = p_auction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    -- Rule 3 & 4: Check if auction is active and within valid server time
    IF v_auction.status != 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not currently active');
    END IF;

    IF v_now >= v_auction.ends_at THEN
        -- Mark as ended immediately
        UPDATE auctions SET status = 'ENDED', updated_at = v_now WHERE id = p_auction_id;
        RETURN jsonb_build_object('success', false, 'error', 'Auction has already closed');
    END IF;

    -- Self-bidding prevention
    IF v_auction.seller_id = p_bidder_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sellers cannot bid on their own listings');
    END IF;

    -- Rule 1 & Rule 2: Minimum bid calculations
    IF v_auction.current_leader_id IS NULL THEN
        -- First bid must be >= starting price
        v_min_required := v_auction.starting_price_paise;
    ELSE
        -- Subsequent bid must be >= current_price + minimum_increment
        v_min_required := v_auction.current_price_paise + v_auction.minimum_increment_paise;
    END IF;

    IF p_amount_paise < v_min_required THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bid must be at least ₹' || (v_min_required / 100)::TEXT,
            'minimum_required_paise', v_min_required
        );
    END IF;

    v_previous_leader := v_auction.current_leader_id;
    v_previous_price := v_auction.current_price_paise;
    v_new_ends_at := v_auction.ends_at;

    -- Rule 7: Anti-sniping extension rule
    -- If valid bid accepted in final 30 seconds before closing, extend ends_at to 60 seconds after accepted bid
    IF (v_auction.ends_at - v_now) <= INTERVAL '30 seconds' THEN
        v_new_ends_at := v_now + INTERVAL '60 seconds';
        v_sniper_extended := TRUE;
    END IF;

    -- Record the accepted bid
    INSERT INTO bids (auction_id, bidder_id, amount_paise, bid_type, created_at)
    VALUES (p_auction_id, p_bidder_id, p_amount_paise, p_bid_type, v_now)
    RETURNING id INTO v_bid_id;

    -- Update auction state atomically
    UPDATE auctions
    SET
        current_price_paise = p_amount_paise,
        current_leader_id = p_bidder_id,
        ends_at = v_new_ends_at,
        sniper_extended_count = CASE WHEN v_sniper_extended THEN sniper_extended_count + 1 ELSE sniper_extended_count END,
        updated_at = v_now
    WHERE id = p_auction_id;

    -- Send notifications
    -- 1. Notify previous leader that they were outbid
    IF v_previous_leader IS NOT NULL AND v_previous_leader != p_bidder_id THEN
        INSERT INTO notifications (user_id, type, title, message, related_auction_id)
        VALUES (
            v_previous_leader,
            'OUTBID',
            'You were outbid!',
            'Someone placed a higher bid of ₹' || (p_amount_paise / 100)::TEXT || ' on ' || v_auction.title,
            p_auction_id
        );
    END IF;

    -- 2. Notify seller about new leading bid
    INSERT INTO notifications (user_id, type, title, message, related_auction_id)
    VALUES (
        v_auction.seller_id,
        'NEW_BID',
        'New bid on your listing',
        'New leading bid of ₹' || (p_amount_paise / 100)::TEXT || ' received for ' || v_auction.title,
        p_auction_id
    );

    -- 3. Audit log
    INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, details)
    VALUES (
        p_bidder_id,
        'auction',
        p_auction_id,
        'BID_PLACED',
        jsonb_build_object(
            'bid_id', v_bid_id,
            'amount_paise', p_amount_paise,
            'extended', v_sniper_extended,
            'ends_at', v_new_ends_at
        )
    );

    -- Return success payload
    RETURN jsonb_build_object(
        'success', true,
        'bid_id', v_bid_id,
        'amount_paise', p_amount_paise,
        'current_price_paise', p_amount_paise,
        'current_leader_id', p_bidder_id,
        'extended', v_sniper_extended,
        'ends_at', v_new_ends_at
    );
END;
$$;


-- 2. CLOSE EXPIRED AUCTION & PROVISIONAL WINNER EVALUATION
CREATE OR REPLACE FUNCTION close_auction(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_highest_bid RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_sale_id UUID;
BEGIN
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.status NOT IN ('ACTIVE', 'SCHEDULED') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not active');
    END IF;

    IF v_now < v_auction.ends_at THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction has not ended yet');
    END IF;

    -- Find highest valid bid
    SELECT * INTO v_highest_bid
    FROM bids
    WHERE auction_id = p_auction_id
    ORDER BY amount_paise DESC, created_at ASC
    LIMIT 1;

    IF v_highest_bid IS NULL THEN
        -- Rule 8: No valid bids -> mark as UNSOLD
        UPDATE auctions
        SET status = 'UNSOLD', updated_at = v_now
        WHERE id = p_auction_id;

        INSERT INTO notifications (user_id, type, title, message, related_auction_id)
        VALUES (
            v_auction.seller_id,
            'AUCTION_CLOSED',
            'Auction ended with no bids',
            'Your auction "' || v_auction.title || '" ended without any bids.',
            p_auction_id
        );

        RETURN jsonb_build_object('status', 'UNSOLD');
    ELSE
        -- Rule 8: Highest valid bid selected as provisional winner
        UPDATE auctions
        SET
            status = 'AWAITING_SELLER_DECISION',
            provisional_winner_id = v_highest_bid.bidder_id,
            winning_bid_paise = v_highest_bid.amount_paise,
            seller_decision = 'PENDING',
            updated_at = v_now
        WHERE id = p_auction_id;

        -- Create sales record
        INSERT INTO sales (
            auction_id,
            seller_id,
            buyer_id,
            winning_bid_id,
            agreed_price_paise,
            status
        ) VALUES (
            p_auction_id,
            v_auction.seller_id,
            v_highest_bid.bidder_id,
            v_highest_bid.id,
            v_highest_bid.amount_paise,
            'PENDING_APPROVAL'
        ) RETURNING id INTO v_sale_id;

        -- Notify seller to approve or reject
        INSERT INTO notifications (user_id, type, title, message, related_auction_id)
        VALUES (
            v_auction.seller_id,
            'AUCTION_CLOSED',
            'Auction closed! Decision required',
            'Your auction "' || v_auction.title || '" closed at ₹' || (v_highest_bid.amount_paise / 100)::TEXT || '. Please approve or reject the final bid.',
            p_auction_id
        );

        -- Notify provisional winner
        INSERT INTO notifications (user_id, type, title, message, related_auction_id)
        VALUES (
            v_highest_bid.bidder_id,
            'AUCTION_WON',
            'You are the provisional winner!',
            'You placed the winning bid of ₹' || (v_highest_bid.amount_paise / 100)::TEXT || ' on "' || v_auction.title || '". Awaiting seller confirmation.',
            p_auction_id
        );

        RETURN jsonb_build_object(
            'status', 'AWAITING_SELLER_DECISION',
            'winner_id', v_highest_bid.bidder_id,
            'winning_amount_paise', v_highest_bid.amount_paise,
            'sale_id', v_sale_id
        );
    END IF;
END;
$$;


-- 3. SELLER DECISION (APPROVE OR REJECT WINNING PRICE)
CREATE OR REPLACE FUNCTION decide_auction_sale(
    p_auction_id UUID,
    p_seller_id UUID,
    p_decision TEXT, -- 'APPROVE' or 'REJECT'
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_sale RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.seller_id != p_seller_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the seller can decide this auction');
    END IF;

    IF v_auction.status != 'AWAITING_SELLER_DECISION' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not awaiting seller decision');
    END IF;

    SELECT * INTO v_sale FROM sales WHERE auction_id = p_auction_id FOR UPDATE;

    IF p_decision = 'APPROVE' THEN
        -- Rule 9: Approval reserves item for winner
        UPDATE auctions
        SET
            status = 'RESERVED',
            seller_decision = 'APPROVE',
            updated_at = v_now
        WHERE id = p_auction_id;

        UPDATE sales
        SET
            status = 'RESERVED_FOR_PICKUP',
            seller_decision_at = v_now,
            reserved_at = v_now,
            updated_at = v_now
        WHERE id = v_sale.id;

        INSERT INTO notifications (user_id, type, title, message, related_auction_id)
        VALUES (
            v_sale.buyer_id,
            'SELLER_APPROVED',
            'Seller accepted your bid! Item Reserved',
            'The seller approved your winning bid for "' || v_auction.title || '". Coordinate campus handover now.',
            p_auction_id
        );

        RETURN jsonb_build_object('success', true, 'status', 'RESERVED');

    ELSIF p_decision = 'REJECT' THEN
        -- Rule 9: Rejection records outcome, prevents treatment as confirmed sale
        UPDATE auctions
        SET
            status = 'REJECTED',
            seller_decision = 'REJECT',
            updated_at = v_now
        WHERE id = p_auction_id;

        UPDATE sales
        SET
            status = 'REJECTED_BY_SELLER',
            seller_decision_at = v_now,
            outcome_reason = COALESCE(p_reason, 'Seller declined final price'),
            updated_at = v_now
        WHERE id = v_sale.id;

        INSERT INTO notifications (user_id, type, title, message, related_auction_id)
        VALUES (
            v_sale.buyer_id,
            'SELLER_REJECTED',
            'Bid declined by seller',
            'The seller decided not to complete the sale for "' || v_auction.title || '". Reason: ' || COALESCE(p_reason, 'Reserve not met.'),
            p_auction_id
        );

        RETURN jsonb_build_object('success', true, 'status', 'REJECTED');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid decision');
    END IF;
END;
$$;


-- 4. CONFIRM CAMPUS HANDOVER (Rule 10)
CREATE OR REPLACE FUNCTION confirm_handover(
    p_sale_id UUID,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale RECORD;
    v_auction RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sale record not found');
    END IF;

    IF v_sale.seller_id != p_actor_id AND v_sale.buyer_id != p_actor_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    IF v_sale.status != 'RESERVED_FOR_PICKUP' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sale is not currently reserved for pickup');
    END IF;

    UPDATE sales
    SET
        status = 'HANDOVER_COMPLETED',
        handover_confirmed_at = v_now,
        updated_at = v_now
    WHERE id = p_sale_id;

    UPDATE auctions
    SET
        status = 'SOLD',
        updated_at = v_now
    WHERE id = v_sale.auction_id;

    -- Update statistics
    UPDATE profiles SET total_sales = total_sales + 1 WHERE id = v_sale.seller_id;
    UPDATE profiles SET total_purchases = total_purchases + 1 WHERE id = v_sale.buyer_id;

    -- Notifications
    INSERT INTO notifications (user_id, type, title, message, related_auction_id)
    VALUES (
        v_sale.buyer_id,
        'HANDOVER_CONFIRMED',
        'Handover Completed!',
        'Campus handover confirmed! Give the item a great second life.',
        v_sale.auction_id
    );

    INSERT INTO notifications (user_id, type, title, message, related_auction_id)
    VALUES (
        v_sale.seller_id,
        'HANDOVER_CONFIRMED',
        'Handover Completed!',
        'Campus handover confirmed! Sale is officially complete.',
        v_sale.auction_id
    );

    RETURN jsonb_build_object('success', true, 'status', 'SOLD');
END;
$$;


-- 5. RECORD FAILED PICKUP (Rule 11)
CREATE OR REPLACE FUNCTION record_failed_pickup(
    p_sale_id UUID,
    p_actor_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sale record not found');
    END IF;

    IF v_sale.seller_id != p_actor_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only seller can record failed pickup');
    END IF;

    IF v_sale.status != 'RESERVED_FOR_PICKUP' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sale is not currently reserved for pickup');
    END IF;

    UPDATE sales
    SET
        status = 'PICKUP_FAILED',
        failed_pickup_at = v_now,
        outcome_reason = COALESCE(p_reason, 'Buyer failed to appear for campus pickup'),
        updated_at = v_now
    WHERE id = p_sale_id;

    -- Release auction back or mark as UNSOLD
    UPDATE auctions
    SET
        status = 'UNSOLD',
        updated_at = v_now
    WHERE id = v_sale.auction_id;

    INSERT INTO notifications (user_id, type, title, message, related_auction_id)
    VALUES (
        v_sale.buyer_id,
        'PICKUP_FAILED',
        'Reservation Cancelled - Pickup Missed',
        'Your pickup was marked as failed: ' || COALESCE(p_reason, 'Did not arrive at agreed time.'),
        v_sale.auction_id
    );

    RETURN jsonb_build_object('success', true, 'status', 'UNSOLD');
END;
$$;


-- 6. CANCEL AUCTION (Rule 12)
CREATE OR REPLACE FUNCTION cancel_auction(
    p_auction_id UUID,
    p_actor_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.seller_id != p_actor_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the listing seller can cancel this auction');
    END IF;

    -- Cannot cancel already completed sales or reserved auctions without cancellation workflow
    IF v_auction.status IN ('SOLD', 'CANCELLED') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel an already completed or cancelled auction');
    END IF;

    UPDATE auctions
    SET
        status = 'CANCELLED',
        cancellation_reason = p_reason,
        cancelled_by = p_actor_id,
        cancelled_at = v_now,
        updated_at = v_now
    WHERE id = p_auction_id;

    -- If there were active bidders, notify them
    IF v_auction.current_leader_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, related_auction_id)
        VALUES (
            v_auction.current_leader_id,
            'AUCTION_CLOSED',
            'Listing Cancelled by Seller',
            'The seller cancelled auction "' || v_auction.title || '". Reason: ' || COALESCE(p_reason, 'Cancelled by owner'),
            p_auction_id
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'CANCELLED');
END;
$$;
