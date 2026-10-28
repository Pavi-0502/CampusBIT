import { describe, it, expect } from 'vitest';
import { processBidPlacement } from '../services/auctionEngine';
import { Auction } from '../types';

describe('Rule 7: Last-Minute Anti-Sniping Extension', () => {
  it('does NOT extend auction closing time if bid is placed more than 30 seconds before closing', () => {
    const now = 1000000;
    const endsAt = now + 120 * 1000; // 120s left (outside 30s window)

    const auction: Auction = {
      id: 'auc-sniper-1',
      seller_id: 'seller-1',
      title: 'Cycle',
      description: 'Mountain cycle',
      category: 'Cycles',
      condition: 'Good',
      starting_price_paise: 200000,
      minimum_increment_paise: 10000,
      current_price_paise: 200000,
      current_leader_id: null,
      starts_at: new Date(now - 10000).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      status: 'ACTIVE',
      sniper_extended_count: 0,
      view_count: 5,
      images: [],
      created_at: new Date(now - 10000).toISOString(),
      updated_at: new Date(now - 10000).toISOString(),
      bids_count: 0,
    };

    const res = processBidPlacement(auction, 'bidder-1', 'Bidder #1', 200000, 'MANUAL', now);
    expect(res.success).toBe(true);
    expect(res.sniperExtended).toBe(false);
    expect(res.auction?.ends_at).toBe(new Date(endsAt).toISOString());
    expect(res.auction?.sniper_extended_count).toBe(0);
  });

  it('extends closing time to 60 seconds after accepted bid if bid placed in final 30 seconds', () => {
    const now = 1000000;
    const endsAt = now + 15 * 1000; // Only 15s remaining! (Within 30s sniper window)

    const auction: Auction = {
      id: 'auc-sniper-2',
      seller_id: 'seller-1',
      title: 'Calculator',
      description: 'Casio fx991CW',
      category: 'Calculators',
      condition: 'Like New',
      starting_price_paise: 60000,
      minimum_increment_paise: 5000,
      current_price_paise: 60000,
      current_leader_id: null,
      starts_at: new Date(now - 10000).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      status: 'ACTIVE',
      sniper_extended_count: 0,
      view_count: 5,
      images: [],
      created_at: new Date(now - 10000).toISOString(),
      updated_at: new Date(now - 10000).toISOString(),
      bids_count: 0,
    };

    const res = processBidPlacement(auction, 'bidder-2', 'Bidder #2', 60000, 'MANUAL', now);
    expect(res.success).toBe(true);
    expect(res.sniperExtended).toBe(true);

    // Rule 7: New ends_at must be exactly accepted_bid_time (now) + 60 seconds
    const expectedNewEndsAt = new Date(now + 60 * 1000).toISOString();
    expect(res.auction?.ends_at).toBe(expectedNewEndsAt);
    expect(res.auction?.sniper_extended_count).toBe(1);
  });

  it('applies repeated extensions when another valid bid arrives during the new final 30 seconds', () => {
    const now1 = 1000000;
    const initialEndsAt = now1 + 20 * 1000; // 20s remaining

    const auction: Auction = {
      id: 'auc-sniper-3',
      seller_id: 'seller-1',
      title: 'Hostel Desk',
      description: 'Wooden desk',
      category: 'Furniture',
      condition: 'Good',
      starting_price_paise: 100000,
      minimum_increment_paise: 10000,
      current_price_paise: 100000,
      current_leader_id: null,
      starts_at: new Date(now1 - 5000).toISOString(),
      ends_at: new Date(initialEndsAt).toISOString(),
      status: 'ACTIVE',
      sniper_extended_count: 0,
      view_count: 5,
      images: [],
      created_at: new Date(now1 - 5000).toISOString(),
      updated_at: new Date(now1 - 5000).toISOString(),
      bids_count: 0,
    };

    // First sniper bid at now1
    const res1 = processBidPlacement(auction, 'bidder-A', 'Bidder A', 100000, 'MANUAL', now1);
    expect(res1.sniperExtended).toBe(true);
    expect(res1.auction?.sniper_extended_count).toBe(1);
    const endsAtAfterBid1 = new Date(now1 + 60 * 1000).getTime(); // now1 + 60s

    // Second sniper bid arrives 40 seconds later (now2 = now1 + 40s; 20s left before endsAtAfterBid1)
    const now2 = now1 + 40 * 1000;
    const res2 = processBidPlacement(res1.auction!, 'bidder-B', 'Bidder B', 110000, 'MANUAL', now2);

    expect(res2.success).toBe(true);
    expect(res2.sniperExtended).toBe(true);
    expect(res2.auction?.sniper_extended_count).toBe(2);

    // Rule 7 repeated extension: new ends_at = now2 + 60s
    const expectedNewEndsAt2 = new Date(now2 + 60 * 1000).toISOString();
    expect(res2.auction?.ends_at).toBe(expectedNewEndsAt2);
  });
});
