import { describe, it, expect } from 'vitest';
import { resolveAutoBids } from '../services/autoBidEngine';
import { Auction, AutoBidSetting } from '../types';

const baseAuction: Auction = {
  id: 'auc-autobid-1',
  seller_id: 'seller-1',
  title: 'Scientific Calculator',
  description: 'Casio ClassWiz',
  category: 'Calculators',
  condition: 'Like New',
  starting_price_paise: 50000, // ₹500
  minimum_increment_paise: 5000, // ₹50
  current_price_paise: 50000, // ₹500
  current_leader_id: 'manual-bidder',
  starts_at: new Date(Date.now() - 3600000).toISOString(),
  ends_at: new Date(Date.now() + 3600000).toISOString(),
  status: 'ACTIVE',
  sniper_extended_count: 0,
  view_count: 10,
  images: [],
  created_at: new Date(Date.now() - 3600000).toISOString(),
  updated_at: new Date(Date.now() - 3600000).toISOString(),
  bids_count: 1,
};

const mockResolver = (userId: string) => `Student (${userId})`;

describe('Rule 13: Automatic Proxy Bidding Engine', () => {
  it('automatically places minimum increment bid to beat previous leader up to max limit', () => {
    // Current price is ₹500. Min next bid is ₹550.
    // Auto-bidder sets max of ₹800.
    const autoBids: AutoBidSetting[] = [
      {
        id: 'ab-1',
        auction_id: 'auc-autobid-1',
        bidder_id: 'student-A',
        maximum_amount_paise: 80000, // ₹800 max
        active: true,
        created_at: new Date(Date.now() - 1000).toISOString(),
        updated_at: new Date(Date.now() - 1000).toISOString(),
      },
    ];

    const result = resolveAutoBids(baseAuction, autoBids, mockResolver);

    // Auto-bidder should lead with required increment ₹550 (55000)
    expect(result.updatedAuction.current_leader_id).toBe('student-A');
    expect(result.updatedAuction.current_price_paise).toBe(55000);
    expect(result.newBids.length).toBe(1);
    expect(result.newBids[0].amount_paise).toBe(55000);
    expect(result.newBids[0].bid_type).toBe('AUTOMATIC');
  });

  it('handles competing auto-bids deterministically and never exceeds confirmed maximum', () => {
    // Student A has max ₹800 (80000)
    // Student B has higher max ₹1000 (100000)
    const competingAutoBids: AutoBidSetting[] = [
      {
        id: 'ab-A',
        auction_id: 'auc-autobid-1',
        bidder_id: 'student-A',
        maximum_amount_paise: 80000,
        active: true,
        created_at: new Date(Date.now() - 2000).toISOString(),
        updated_at: new Date(Date.now() - 2000).toISOString(),
      },
      {
        id: 'ab-B',
        auction_id: 'auc-autobid-1',
        bidder_id: 'student-B',
        maximum_amount_paise: 100000,
        active: true,
        created_at: new Date(Date.now() - 1000).toISOString(),
        updated_at: new Date(Date.now() - 1000).toISOString(),
      },
    ];

    const result = resolveAutoBids(baseAuction, competingAutoBids, mockResolver);

    // Student B has higher maximum, so Student B must win the duel
    expect(result.updatedAuction.current_leader_id).toBe('student-B');
    // Price advances to beat Student A's max of 80000 + 5000 increment = 85000 (₹850)
    expect(result.updatedAuction.current_price_paise).toBe(85000);
    // Student B's bid must not exceed their own maximum (100000)
    expect(result.updatedAuction.current_price_paise).toBeLessThanOrEqual(100000);
  });

  it('breaks ties deterministically using earlier creation timestamp (Rule 13 policy)', () => {
    // Both students set equal maximum of ₹900 (90000)
    // Student 1 set it earlier (created_at 5000ms ago) than Student 2 (created_at 1000ms ago)
    const now = Date.now();
    const equalAutoBids: AutoBidSetting[] = [
      {
        id: 'ab-early',
        auction_id: 'auc-autobid-1',
        bidder_id: 'student-early',
        maximum_amount_paise: 90000,
        active: true,
        created_at: new Date(now - 5000).toISOString(),
        updated_at: new Date(now - 5000).toISOString(),
      },
      {
        id: 'ab-late',
        auction_id: 'auc-autobid-1',
        bidder_id: 'student-late',
        maximum_amount_paise: 90000,
        active: true,
        created_at: new Date(now - 1000).toISOString(),
        updated_at: new Date(now - 1000).toISOString(),
      },
    ];

    const result = resolveAutoBids(baseAuction, equalAutoBids, mockResolver);

    // The student who registered earlier takes precedence according to documented tie-breaking policy
    expect(result.updatedAuction.current_leader_id).toBe('student-early');
  });

  it('does not bid if candidate maximum is less than the required next increment', () => {
    // Current price is ₹500, next required is ₹550. Student max is only ₹520.
    const underBudgetAutoBid: AutoBidSetting[] = [
      {
        id: 'ab-under',
        auction_id: 'auc-autobid-1',
        bidder_id: 'student-underbudget',
        maximum_amount_paise: 52000, // ₹520 is less than ₹550
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const result = resolveAutoBids(baseAuction, underBudgetAutoBid, mockResolver);
    expect(result.newBids.length).toBe(0);
    expect(result.updatedAuction.current_leader_id).toBe('manual-bidder');
    expect(result.updatedAuction.current_price_paise).toBe(50000);
  });
});
