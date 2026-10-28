import { Auction, Bid, AutoBidSetting, Notification } from '../types';
import { processBidPlacement } from './auctionEngine';

export interface AutoBidResolutionResult {
  updatedAuction: Auction;
  newBids: Bid[];
  newNotifications: Notification[];
}

/**
 * Deterministic Auto-Bidding / Proxy Bidding Engine (Rule 13)
 *
 * Deterministic Policy:
 * 1. Collect all active auto-bids for the given auction.
 * 2. Filter out the current leading bidder (they don't need to outbid themselves).
 * 3. Sort candidates:
 *    a) Primary: maximum_amount_paise DESC (higher willingness to pay wins).
 *    b) Tie-breaker: created_at ASC (first student to set the maximum wins the tie).
 * 4. Calculate required bid: current_price_paise + minimum_increment_paise.
 * 5. If the highest candidate's maximum >= required bid, generate the proxy bid.
 * 6. If multiple auto-bidders compete, deterministically advance up to the necessary increment.
 * 7. Recursion is strictly bounded (max 5 iterations) to prevent infinite loops.
 */
export function resolveAutoBids(
  auction: Auction,
  autoBidSettings: AutoBidSetting[],
  bidderPseudonymResolver: (userId: string) => string,
  nowTimestamp: number = Date.now(),
  maxIterations: number = 5
): AutoBidResolutionResult {
  let currentAuction = { ...auction };
  const generatedBids: Bid[] = [];
  const generatedNotifications: Notification[] = [];

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Find active auto bids on this auction, excluding current leader
    const candidateAutoBids = autoBidSettings
      .filter(
        (ab) =>
          ab.auction_id === currentAuction.id &&
          ab.active &&
          ab.bidder_id !== currentAuction.current_leader_id
      )
      .sort((a, b) => {
        if (b.maximum_amount_paise !== a.maximum_amount_paise) {
          return b.maximum_amount_paise - a.maximum_amount_paise; // Higher max first
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Earlier registration wins ties
      });

    if (candidateAutoBids.length === 0) {
      break;
    }

    const topCandidate = candidateAutoBids[0];
    const requiredBid =
      currentAuction.current_price_paise + currentAuction.minimum_increment_paise;

    // Check if candidate can afford the required bid
    if (topCandidate.maximum_amount_paise < requiredBid) {
      // Cannot outbid; topCandidate is out of budget
      break;
    }

    // Determine the next bid amount
    // If there is a second competitor auto-bidder, we may need to match/beat their max
    const secondCandidate = candidateAutoBids[1];
    let bidAmount = requiredBid;

    if (
      secondCandidate &&
      secondCandidate.maximum_amount_paise >= requiredBid &&
      secondCandidate.bidder_id !== topCandidate.bidder_id
    ) {
      // Competitor will push the price up to secondCandidate.maximum_amount_paise + increment
      const pushAmount =
        secondCandidate.maximum_amount_paise + currentAuction.minimum_increment_paise;
      bidAmount = Math.min(topCandidate.maximum_amount_paise, pushAmount);
    }

    const pseudonym = bidderPseudonymResolver(topCandidate.bidder_id);

    const placementResult = processBidPlacement(
      currentAuction,
      topCandidate.bidder_id,
      pseudonym,
      bidAmount,
      'AUTOMATIC',
      nowTimestamp
    );

    if (!placementResult.success || !placementResult.auction || !placementResult.bid) {
      break;
    }

    currentAuction = placementResult.auction;
    generatedBids.push(placementResult.bid);
    if (placementResult.notifications) {
      generatedNotifications.push(...placementResult.notifications);
    }
  }

  return {
    updatedAuction: currentAuction,
    newBids: generatedBids,
    newNotifications: generatedNotifications,
  };
}
