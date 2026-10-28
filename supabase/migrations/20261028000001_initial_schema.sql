-- =====================================================================
-- CampusBid PostgreSQL Schema Migration: 001_initial_schema.sql
-- Normalized schema for student-exclusive campus auction platform
-- =====================================================================

-- 1. Create Enums
CREATE TYPE auction_status AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'ACTIVE',
    'ENDED',
    'UNSOLD',
    'AWAITING_SELLER_DECISION',
    'REJECTED',
    'RESERVED',
    'SOLD',
    'CANCELLED'
);

CREATE TYPE item_category AS ENUM (
    'Cycles',
    'Calculators',
    'Books',
    'Electronics',
    'Furniture',
    'Hostel Essentials',
    'Accessories',
    'Other'
);

CREATE TYPE item_condition AS ENUM (
    'Like New',
    'Good',
    'Fair',
    'Needs Repair'
);

CREATE TYPE bid_type AS ENUM (
    'MANUAL',
    'AUTOMATIC'
);

CREATE TYPE sale_status AS ENUM (
    'PENDING_APPROVAL',
    'RESERVED_FOR_PICKUP',
    'HANDOVER_COMPLETED',
    'PICKUP_FAILED',
    'REJECTED_BY_SELLER',
    'CANCELLED'
);

CREATE TYPE notification_type AS ENUM (
    'NEW_BID',
    'OUTBID',
    'LEADING_BIDDER',
    'ENDING_SOON',
    'AUCTION_CLOSED',
    'AUCTION_WON',
    'SELLER_APPROVED',
    'SELLER_REJECTED',
    'RESERVATION_UPDATE',
    'HANDOVER_CONFIRMED',
    'PICKUP_FAILED',
    'SAVED_SEARCH_MATCH',
    'QUESTION_ANSWERED'
);

-- =====================================================================
-- 2. Profiles Table
-- =====================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    pseudonym TEXT NOT NULL,
    avatar_url TEXT,
    campus_domain TEXT NOT NULL, -- e.g. bit.edu, iitb.ac.in, campus.edu
    hostel_block TEXT,
    room_number TEXT,
    phone_number TEXT,
    bio TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5.00),
    total_sales INT DEFAULT 0,
    total_purchases INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 3. Auctions Table
-- All prices stored in integer paise (1 INR = 100 paise)
-- =====================================================================
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 120),
    description TEXT NOT NULL CHECK (char_length(description) >= 10),
    category item_category NOT NULL,
    condition item_condition NOT NULL,
    starting_price_paise BIGINT NOT NULL CHECK (starting_price_paise > 0),
    minimum_increment_paise BIGINT NOT NULL CHECK (minimum_increment_paise > 0),
    current_price_paise BIGINT NOT NULL CHECK (current_price_paise >= starting_price_paise),
    current_leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    status auction_status NOT NULL DEFAULT 'ACTIVE',
    seller_decision TEXT CHECK (seller_decision IN ('APPROVE', 'REJECT', 'PENDING')),
    provisional_winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    winning_bid_paise BIGINT,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id),
    cancelled_at TIMESTAMPTZ,
    sniper_extended_count INT NOT NULL DEFAULT 0,
    view_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ends_after_starts CHECK (ends_at > starts_at)
);

-- =====================================================================
-- 4. Auction Images Table
-- =====================================================================
CREATE TABLE auction_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 5. Bids Table
-- =====================================================================
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    bid_type bid_type NOT NULL DEFAULT 'MANUAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 6. Auto Bid Settings Table (Proxy Bidding)
-- Max amount is strictly confidential to the bidder
-- =====================================================================
CREATE TABLE auto_bid_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    maximum_amount_paise BIGINT NOT NULL CHECK (maximum_amount_paise > 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (auction_id, bidder_id)
);

-- =====================================================================
-- 7. Questions Table
-- =====================================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    asker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL CHECK (char_length(question_text) >= 5 AND char_length(question_text) <= 500),
    reported BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 8. Answers Table
-- =====================================================================
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL CHECK (char_length(answer_text) >= 2 AND char_length(answer_text) <= 1000),
    reported BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 9. Watchlist Table
-- =====================================================================
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, auction_id)
);

-- =====================================================================
-- 10. Saved Searches Table
-- =====================================================================
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    query TEXT,
    category item_category,
    condition item_condition,
    maximum_price_paise BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 11. Notifications Table
-- =====================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 12. Sales Table
-- =====================================================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL UNIQUE REFERENCES auctions(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    winning_bid_id UUID REFERENCES bids(id) ON DELETE RESTRICT,
    agreed_price_paise BIGINT NOT NULL CHECK (agreed_price_paise > 0),
    status sale_status NOT NULL DEFAULT 'PENDING_APPROVAL',
    seller_decision_at TIMESTAMPTZ,
    reserved_at TIMESTAMPTZ,
    handover_confirmed_at TIMESTAMPTZ,
    failed_pickup_at TIMESTAMPTZ,
    outcome_reason TEXT,
    campus_pickup_location TEXT DEFAULT 'Hostel Common Room / Main Gate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 13. Audit Logs Table
-- =====================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- Indexes for Performance
-- =====================================================================
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_category ON auctions(category);
CREATE INDEX idx_auctions_ends_at ON auctions(ends_at);
CREATE INDEX idx_auctions_seller_id ON auctions(seller_id);
CREATE INDEX idx_bids_auction_id_created ON bids(auction_id, created_at DESC);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX idx_auto_bids_auction ON auto_bid_settings(auction_id) WHERE active = TRUE;
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_sales_seller ON sales(seller_id);
CREATE INDEX idx_sales_buyer ON sales(buyer_id);
