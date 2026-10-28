import { Auction, Bid, AutoBidSetting, Notification } from '../types';

export interface BidPlacementResult {
  success: boolean;
  error?: string;
  bid?: Bid;
  auction?: Auction;
  sniperExtended?: boolean;
  generatedAutoBids?: Bid[];
  notifications?: Notification[];
}

/**
 * Validates a bid against Rule 1, Rule 2, Rule 3, and self-bidding restrictions
 */
export function validateBid(
  auction: Auction,
  bidderId: string,
  amountPaise: number,
  nowTimestamp: number = Date.now()
): { valid: boolean; error?: string; minRequiredPaise: number } {
  // Check self-bidding
  if (auction.seller_id === bidderId) {
    return {
      valid: false,
      error: 'Sellers cannot bid on their own listings.',
      minRequiredPaise: 0,
    };
  }

  // Rule 3: Check closing
  const endsAtMs = new Date(auction.ends_at).getTime();
  if (auction.status !== 'ACTIVE' || nowTimestamp >= endsAtMs) {
    return {
      valid: false,
      error: 'Auction has closed and is no longer accepting bids.',
      minRequiredPaise: 0,
    };
  }

  // Calculate required minimum amount
  let minRequiredPaise = 0;
  if (!auction.current_leader_id || auction.bids_count === 0) {
    // Rule 1: First bid must be >= starting price
    minRequiredPaise = auction.starting_price_paise;
  } else {
    // Rule 2: Subsequent bid must be >= current_price + minimum_increment
    minRequiredPaise = auction.current_price_paise + auction.minimum_increment_paise;
  }

  if (amountPaise < minRequiredPaise) {
    return {
      valid: false,
      error: `Bid must be at least ₹${(minRequiredPaise / 100).toLocaleString('en-IN')}`,
      minRequiredPaise,
    };
  }

  return { valid: true, minRequiredPaise };
}

/**
 * Executes a bid placement according to rules 1-7, including anti-sniping extension
 */
export function processBidPlacement(
  auction: Auction,
  bidderId: string,
  bidderPseudonym: string,
  amountPaise: number,
  bidType: 'MANUAL' | 'AUTOMATIC' = 'MANUAL',
  nowTimestamp: number = Date.now()
): BidPlacementResult {
  const validation = validateBid(auction, bidderId, amountPaise, nowTimestamp);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const nowIso = new Date(nowTimestamp).toISOString();
  const endsAtMs = new Date(auction.ends_at).getTime();
  const secondsLeft = (endsAtMs - nowTimestamp) / 1000;

  // Rule 7: Last-minute extension rule
  // If valid bid accepted during final 30 seconds, extend closing to 60 seconds after accepted bid
  let newEndsAt = auction.ends_at;
  let sniperExtended = false;
  if (secondsLeft <= 30 && secondsLeft >= 0) {
    newEndsAt = new Date(nowTimestamp + 60 * 1000).toISOString();
    sniperExtended = true;
  }

  const newBid: Bid = {
    id: `bid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    auction_id: auction.id,
    bidder_id: bidderId,
    bidder_pseudonym: bidderPseudonym,
    amount_paise: amountPaise,
    bid_type: bidType,
    created_at: nowIso,
  };

  const updatedAuction: Auction = {
    ...auction,
    current_price_paise: amountPaise,
    current_leader_id: bidderId,
    current_leader_pseudonym: bidderPseudonym,
    ends_at: newEndsAt,
    sniper_extended_count: sniperExtended
      ? auction.sniper_extended_count + 1
      : auction.sniper_extended_count,
    updated_at: nowIso,
    bids_count: (auction.bids_count || 0) + 1,
  };

  const notifications: Notification[] = [];

  // Outbid notification for previous leader
  if (auction.current_leader_id && auction.current_leader_id !== bidderId) {
    notifications.push({
      id: `notif-${Date.now()}-outbid`,
      user_id: auction.current_leader_id,
      type: 'OUTBID',
      title: 'You were outbid!',
      message: `Someone placed a higher bid of ₹${(amountPaise / 100).toLocaleString('en-IN')} on "${auction.title}".`,
      related_auction_id: auction.id,
      read_at: null,
      created_at: nowIso,
    });
  }

  // Seller notification
  notifications.push({
    id: `notif-${Date.now()}-newbid`,
    user_id: auction.seller_id,
    type: 'NEW_BID',
    title: 'New Leading Bid!',
    message: `New bid of ₹${(amountPaise / 100).toLocaleString('en-IN')} received on "${auction.title}".`,
    related_auction_id: auction.id,
    read_at: null,
    created_at: nowIso,
  });

  return {
    success: true,
    bid: newBid,
    auction: updatedAuction,
    sniperExtended,
    notifications,
  };
}

/**
 * Rule 8: Evaluates auction closing state
 */
export function evaluateAuctionClosing(
  auction: Auction,
  allBids: Bid[],
  nowTimestamp: number = Date.now()
): {
  status: 'ACTIVE' | 'UNSOLD' | 'AWAITING_SELLER_DECISION';
  provisionalWinnerId?: string | null;
  winningBidPaise?: number | null;
} {
  const endsAtMs = new Date(auction.ends_at).getTime();
  if (nowTimestamp < endsAtMs) {
    return { status: 'ACTIVE' };
  }

  const auctionBids = allBids
    .filter((b) => b.auction_id === auction.id)
    .sort((a, b) => b.amount_paise - a.amount_paise || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (auctionBids.length === 0) {
    return {
      status: 'UNSOLD',
      provisionalWinnerId: null,
      winningBidPaise: null,
    };
  }

  const winningBid = auctionBids[0];
  return {
    status: 'AWAITING_SELLER_DECISION',
    provisionalWinnerId: winningBid.bidder_id,
    winningBidPaise: winningBid.amount_paise,
  };
}
