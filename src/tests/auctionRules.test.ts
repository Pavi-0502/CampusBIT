import { describe, it, expect } from 'vitest';
import { validateBid, processBidPlacement, evaluateAuctionClosing } from '../services/auctionEngine';
import { Auction, Bid } from '../types';

const mockBaseAuction: Auction = {
  id: 'test-auc-1',
  seller_id: 'seller-1',
  title: 'Engineering Mathematics Book',
  description: 'Good condition textbook',
  category: 'Books',
  condition: 'Good',
  starting_price_paise: 50000, // ₹500
  minimum_increment_paise: 5000, // ₹50
  current_price_paise: 50000,
  current_leader_id: null,
  starts_at: new Date(Date.now() - 3600000).toISOString(),
  ends_at: new Date(Date.now() + 3600000).toISOString(),
  status: 'ACTIVE',
  sniper_extended_count: 0,
  view_count: 10,
  images: [],
  created_at: new Date(Date.now() - 3600000).toISOString(),
  updated_at: new Date(Date.now() - 3600000).toISOString(),
  bids_count: 0,
};

describe('Rule 1: Starting Bid Validation', () => {
  it('accepts first bid exactly equal to starting price', () => {
    const res = validateBid(mockBaseAuction, 'bidder-1', 50000);
    expect(res.valid).toBe(true);
  });

  it('accepts first bid greater than starting price', () => {
    const res = validateBid(mockBaseAuction, 'bidder-1', 55000);
    expect(res.valid).toBe(true);
  });

  it('rejects first bid below the starting price', () => {
    const res = validateBid(mockBaseAuction, 'bidder-1', 49000);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Bid must be at least ₹500');
  });
});

describe('Rule 2: Minimum Bid Increment Validation', () => {
  const activeAuctionWithBid: Auction = {
    ...mockBaseAuction,
    current_price_paise: 60000, // ₹600
    current_leader_id: 'bidder-1',
    bids_count: 1,
  };

  it('accepts subsequent bid greater than or equal to current price + minimum increment', () => {
    // Required: 60000 + 5000 = 65000 (₹650)
    const validRes = validateBid(activeAuctionWithBid, 'bidder-2', 65000);
    expect(validRes.valid).toBe(true);

    const higherRes = validateBid(activeAuctionWithBid, 'bidder-2', 70000);
    expect(higherRes.valid).toBe(true);
  });

  it('rejects subsequent bid below current price + minimum increment', () => {
    // Trying to bid ₹640 (64000) when ₹650 is required
    const invalidRes = validateBid(activeAuctionWithBid, 'bidder-2', 64000);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.error).toContain('Bid must be at least ₹650');
  });
});

describe('Rule 3 & 4: Closing and Server Time Enforcement', () => {
  it('rejects bids after auction closing time has passed', () => {
    const expiredAuction: Auction = {
      ...mockBaseAuction,
      ends_at: new Date(Date.now() - 5000).toISOString(), // Ended 5 seconds ago
      status: 'ACTIVE',
    };

    const res = validateBid(expiredAuction, 'bidder-2', 60000);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Auction has closed');
  });

  it('rejects bids if status is not ACTIVE (e.g. ENDED or SOLD)', () => {
    const soldAuction: Auction = {
      ...mockBaseAuction,
      status: 'SOLD',
    };

    const res = validateBid(soldAuction, 'bidder-2', 60000);
    expect(res.valid).toBe(false);
  });

  it('rejects seller bidding on their own listing', () => {
    const res = validateBid(mockBaseAuction, 'seller-1', 60000);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Sellers cannot bid on their own listings');
  });
});

describe('Rule 8: Auction Closing & Provisional Winner Selection', () => {
  it('marks auction as UNSOLD when closed with 0 bids', () => {
    const pastAuction: Auction = {
      ...mockBaseAuction,
      ends_at: new Date(Date.now() - 1000).toISOString(),
    };

    const res = evaluateAuctionClosing(pastAuction, [], Date.now());
    expect(res.status).toBe('UNSOLD');
    expect(res.provisionalWinnerId).toBeNull();
  });

  it('selects the highest valid bid as provisional winner when closed with bids', () => {
    const pastAuction: Auction = {
      ...mockBaseAuction,
      id: 'auc-with-bids',
      ends_at: new Date(Date.now() - 1000).toISOString(),
    };

    const bids: Bid[] = [
      {
        id: 'b-1',
        auction_id: 'auc-with-bids',
        bidder_id: 'student-A',
        amount_paise: 60000,
        bid_type: 'MANUAL',
        created_at: new Date(Date.now() - 3000).toISOString(),
      },
      {
        id: 'b-2',
        auction_id: 'auc-with-bids',
        bidder_id: 'student-B',
        amount_paise: 75000, // Winning bid
        bid_type: 'MANUAL',
        created_at: new Date(Date.now() - 2000).toISOString(),
      },
    ];

    const res = evaluateAuctionClosing(pastAuction, bids, Date.now());
    expect(res.status).toBe('AWAITING_SELLER_DECISION');
    expect(res.provisionalWinnerId).toBe('student-B');
    expect(res.winningBidPaise).toBe(75000);
  });
});
