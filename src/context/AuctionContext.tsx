import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Auction,
  Bid,
  AutoBidSetting,
  Question,
  Answer,
  WatchlistItem,
  SavedSearch,
  Sale,
  ItemCategory,
  ItemCondition,
} from '../types';
import {
  INITIAL_AUCTIONS,
  INITIAL_BIDS,
  INITIAL_AUTO_BIDS,
  INITIAL_QUESTIONS,
  INITIAL_SALES,
  DEMO_PROFILES,
} from '../data/initialDemoData';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { processBidPlacement, evaluateAuctionClosing } from '../services/auctionEngine';
import { resolveAutoBids } from '../services/autoBidEngine';
import { generatePseudonym } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface CreateAuctionInput {
  title: string;
  description: string;
  category: ItemCategory;
  condition: ItemCondition;
  starting_price_paise: number;
  minimum_increment_paise: number;
  ends_at: string;
  images: string[];
}

interface AuctionContextType {
  auctions: Auction[];
  bids: Bid[];
  questions: Question[];
  sales: Sale[];
  watchlist: WatchlistItem[];
  savedSearches: SavedSearch[];
  getAuctionById: (id: string) => Auction | undefined;
  getBidsForAuction: (auctionId: string) => Bid[];
  getQuestionsForAuction: (auctionId: string) => Question[];
  getUserAutoBidForAuction: (auctionId: string) => AutoBidSetting | undefined;
  isItemInWatchlist: (auctionId: string) => boolean;
  placeBid: (auctionId: string, amountPaise: number) => Promise<{ success: boolean; error?: string; sniperExtended?: boolean }>;
  setAutoBid: (auctionId: string, maxAmountPaise: number) => Promise<{ success: boolean; error?: string }>;
  removeAutoBid: (auctionId: string) => Promise<void>;
  askQuestion: (auctionId: string, questionText: string) => Promise<{ success: boolean; error?: string }>;
  answerQuestion: (questionId: string, answerText: string) => Promise<{ success: boolean; error?: string }>;
  toggleWatchlist: (auctionId: string) => Promise<void>;
  createAuction: (input: CreateAuctionInput) => Promise<{ success: boolean; auctionId?: string; error?: string }>;
  cancelAuction: (auctionId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  approveSale: (auctionId: string) => Promise<{ success: boolean; error?: string }>;
  rejectSale: (auctionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  confirmHandover: (saleId: string) => Promise<{ success: boolean; error?: string }>;
  recordFailedPickup: (saleId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  saveSearch: (search: Omit<SavedSearch, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  removeSavedSearch: (id: string) => Promise<void>;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allDemoProfiles } = useAuth();
  const { addNotification } = useNotifications();

  const [auctions, setAuctions] = useState<Auction[]>(() => {
    // Hydrate initial demo auctions with seller profile info
    return INITIAL_AUCTIONS.map((auc) => {
      const seller = DEMO_PROFILES.find((p) => p.id === auc.seller_id);
      const bidsCount = INITIAL_BIDS.filter((b) => b.auction_id === auc.id).length;
      return {
        ...auc,
        seller,
        bids_count: bidsCount,
        current_leader_pseudonym: auc.current_leader_id
          ? DEMO_PROFILES.find((p) => p.id === auc.current_leader_id)?.pseudonym ||
            generatePseudonym(auc.current_leader_id)
          : undefined,
      };
    });
  });

  const [bids, setBids] = useState<Bid[]>(() => {
    return INITIAL_BIDS.map((b) => {
      const bidder = DEMO_PROFILES.find((p) => p.id === b.bidder_id);
      return {
        ...b,
        bidder_pseudonym: bidder?.pseudonym || generatePseudonym(b.bidder_id),
        bidder_avatar: bidder?.avatar_url,
      };
    });
  });

  const [autoBids, setAutoBids] = useState<AutoBidSetting[]>(INITIAL_AUTO_BIDS);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    {
      id: 'wl-1',
      user_id: 'user-priya',
      auction_id: 'auc-cycle-01',
      created_at: new Date().toISOString(),
    },
  ]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: 'ss-1',
      user_id: 'user-priya',
      query: 'cycle',
      category: 'Cycles',
      maximum_price_paise: 400000,
      active: true,
      created_at: new Date().toISOString(),
    },
  ]);

  // Pseudonym resolver
  const resolvePseudonym = useCallback(
    (userId: string) => {
      const p = allDemoProfiles.find((prof) => prof.id === userId);
      return p?.pseudonym || generatePseudonym(userId);
    },
    [allDemoProfiles]
  );

  // Periodic auction lifecycle check (Rule 8: closing & provisional winner)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAuctions((prev) =>
        prev.map((auc) => {
          if (auc.status === 'ACTIVE') {
            const endsAtMs = new Date(auc.ends_at).getTime();
            if (now >= endsAtMs) {
              const evalResult = evaluateAuctionClosing(auc, bids, now);
              if (evalResult.status === 'AWAITING_SELLER_DECISION') {
                // Create pending sale record if not existing
                setSales((prevSales) => {
                  if (prevSales.some((s) => s.auction_id === auc.id)) return prevSales;
                  const newSale: Sale = {
                    id: `sale-${Date.now()}`,
                    auction_id: auc.id,
                    seller_id: auc.seller_id,
                    buyer_id: evalResult.provisionalWinnerId!,
                    winning_bid_id: `bid-win-${auc.id}`,
                    agreed_price_paise: evalResult.winningBidPaise!,
                    status: 'PENDING_APPROVAL',
                    campus_pickup_location: 'Hostel Gate / SAC Quadrangle',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  return [...prevSales, newSale];
                });

                // Notify seller
                addNotification({
                  user_id: auc.seller_id,
                  type: 'AUCTION_CLOSED',
                  title: 'Auction Closed — Decision Required',
                  message: `Your listing "${auc.title}" closed at ₹${((evalResult.winningBidPaise || 0) / 100).toLocaleString('en-IN')}. Please approve or reject the final bid.`,
                  related_auction_id: auc.id,
                });

                // Notify winner
                if (evalResult.provisionalWinnerId) {
                  addNotification({
                    user_id: evalResult.provisionalWinnerId,
                    type: 'AUCTION_WON',
                    title: 'Provisional Winner!',
                    message: `You placed the highest bid on "${auc.title}". Awaiting seller approval.`,
                    related_auction_id: auc.id,
                  });
                }

                return {
                  ...auc,
                  status: 'AWAITING_SELLER_DECISION',
                  provisional_winner_id: evalResult.provisionalWinnerId,
                  winning_bid_paise: evalResult.winningBidPaise,
                  seller_decision: 'PENDING',
                };
              } else if (evalResult.status === 'UNSOLD') {
                addNotification({
                  user_id: auc.seller_id,
                  type: 'AUCTION_CLOSED',
                  title: 'Auction Ended with No Bids',
                  message: `Your listing "${auc.title}" closed without any bids. You may re-list it with a revised starting price.`,
                  related_auction_id: auc.id,
                });
                return {
                  ...auc,
                  status: 'UNSOLD',
                };
              }
            }
          }
          return auc;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [bids, addNotification]);

  // Helper getters
  const getAuctionById = useCallback(
    (id: string) => auctions.find((a) => a.id === id),
    [auctions]
  );

  const getBidsForAuction = useCallback(
    (auctionId: string) =>
      bids
        .filter((b) => b.auction_id === auctionId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [bids]
  );

  const getQuestionsForAuction = useCallback(
    (auctionId: string) =>
      questions
        .filter((q) => q.auction_id === auctionId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [questions]
  );

  const getUserAutoBidForAuction = useCallback(
    (auctionId: string) => {
      if (!currentUser) return undefined;
      return autoBids.find((ab) => ab.auction_id === auctionId && ab.bidder_id === currentUser.id && ab.active);
    },
    [autoBids, currentUser]
  );

  const isItemInWatchlist = useCallback(
    (auctionId: string) => {
      if (!currentUser) return false;
      return watchlist.some((w) => w.auction_id === auctionId && w.user_id === currentUser.id);
    },
    [watchlist, currentUser]
  );

  // 1. PLACE BID ACTION
  const placeBid = async (
    auctionId: string,
    amountPaise: number
  ): Promise<{ success: boolean; error?: string; sniperExtended?: boolean }> => {
    if (!currentUser) {
      return { success: false, error: 'Please sign in with campus email to place bids.' };
    }

    const auction = auctions.find((a) => a.id === auctionId);
    if (!auction) {
      return { success: false, error: 'Auction not found' };
    }

    // Try Supabase RPC if real instance is configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('place_bid', {
          p_auction_id: auctionId,
          p_bidder_id: currentUser.id,
          p_amount_paise: amountPaise,
          p_bid_type: 'MANUAL',
        });
        if (error) return { success: false, error: error.message };
        if (data && !data.success) return { success: false, error: data.error };
      } catch (err: any) {
        return { success: false, error: err.message || 'Database error' };
      }
    }

    // Local execution / Demo Mode Engine
    const pseudonym = currentUser.pseudonym || resolvePseudonym(currentUser.id);
    const result = processBidPlacement(
      auction,
      currentUser.id,
      pseudonym,
      amountPaise,
      'MANUAL',
      Date.now()
    );

    if (!result.success || !result.auction || !result.bid) {
      return { success: false, error: result.error };
    }

    let updatedAuction = result.auction;
    const newBids = [result.bid];

    // Dispatch outbid & seller notifications
    result.notifications?.forEach((n) => addNotification(n));

    // Rule 13: Resolve automatic proxy bidding against competing auto-bids
    const autoBidResult = resolveAutoBids(
      updatedAuction,
      autoBids,
      resolvePseudonym,
      Date.now()
    );

    if (autoBidResult.newBids.length > 0) {
      updatedAuction = autoBidResult.updatedAuction;
      newBids.push(...autoBidResult.newBids);
      autoBidResult.newNotifications.forEach((n) => addNotification(n));
    }

    // Update state
    setAuctions((prev) => prev.map((a) => (a.id === auctionId ? updatedAuction : a)));
    setBids((prev) => [...newBids, ...prev]);

    return {
      success: true,
      sniperExtended: result.sniperExtended,
    };
  };

  // 2. SET AUTO BID (Proxy Bidding)
  const setAutoBid = async (
    auctionId: string,
    maxAmountPaise: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Please sign in to set auto-bids.' };
    }

    const auction = auctions.find((a) => a.id === auctionId);
    if (!auction) return { success: false, error: 'Auction not found' };

    const minNext = auction.current_price_paise + auction.minimum_increment_paise;
    if (maxAmountPaise < minNext) {
      return {
        success: false,
        error: `Auto-bid maximum must be at least ₹${(minNext / 100).toLocaleString('en-IN')}`,
      };
    }

    const newSetting: AutoBidSetting = {
      id: `ab-${Date.now()}`,
      auction_id: auctionId,
      bidder_id: currentUser.id,
      maximum_amount_paise: maxAmountPaise,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update or insert
    const nextAutoBids = [
      ...autoBids.filter((ab) => !(ab.auction_id === auctionId && ab.bidder_id === currentUser.id)),
      newSetting,
    ];
    setAutoBids(nextAutoBids);

    // If current user is not leading, immediately run proxy resolution
    if (auction.current_leader_id !== currentUser.id) {
      const autoRes = resolveAutoBids(auction, nextAutoBids, resolvePseudonym, Date.now());
      if (autoRes.newBids.length > 0) {
        setAuctions((prev) => prev.map((a) => (a.id === auctionId ? autoRes.updatedAuction : a)));
        setBids((prev) => [...autoRes.newBids, ...prev]);
        autoRes.newNotifications.forEach((n) => addNotification(n));
      }
    }

    return { success: true };
  };

  const removeAutoBid = async (auctionId: string) => {
    if (!currentUser) return;
    setAutoBids((prev) =>
      prev.map((ab) =>
        ab.auction_id === auctionId && ab.bidder_id === currentUser.id
          ? { ...ab, active: false }
          : ab
      )
    );
  };

  // 3. QUESTIONS AND ANSWERS
  const askQuestion = async (
    auctionId: string,
    questionText: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in to ask questions' };

    const clean = questionText.trim();
    if (clean.length < 5) return { success: false, error: 'Question must be at least 5 characters.' };
    if (clean.length > 500) return { success: false, error: 'Question cannot exceed 500 characters.' };

    const newQ: Question = {
      id: `q-${Date.now()}`,
      auction_id: auctionId,
      asker_id: currentUser.id,
      asker_pseudonym: currentUser.pseudonym || resolvePseudonym(currentUser.id),
      question_text: clean,
      reported: false,
      created_at: new Date().toISOString(),
    };

    setQuestions((prev) => [...prev, newQ]);

    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (targetAuction) {
      addNotification({
        user_id: targetAuction.seller_id,
        type: 'NEW_BID',
        title: 'New Question Received',
        message: `A buyer asked: "${clean.substring(0, 60)}..." on ${targetAuction.title}`,
        related_auction_id: auctionId,
      });
    }

    return { success: true };
  };

  const answerQuestion = async (
    questionId: string,
    answerText: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in to answer questions' };

    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) return { success: false, error: 'Question not found' };

    const clean = answerText.trim();
    if (clean.length < 2) return { success: false, error: 'Answer must be at least 2 characters.' };

    const newAnswer: Answer = {
      id: `ans-${Date.now()}`,
      question_id: questionId,
      seller_id: currentUser.id,
      seller_name: currentUser.display_name,
      answer_text: clean,
      reported: false,
      created_at: new Date().toISOString(),
    };

    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answer: newAnswer } : q))
    );

    // Notify asker
    addNotification({
      user_id: targetQ.asker_id,
      type: 'QUESTION_ANSWERED',
      title: 'Seller Answered Your Question',
      message: `Seller responded: "${clean.substring(0, 60)}..."`,
      related_auction_id: targetQ.auction_id,
    });

    return { success: true };
  };

  // 4. WATCHLIST
  const toggleWatchlist = async (auctionId: string) => {
    if (!currentUser) return;
    const exists = watchlist.some((w) => w.auction_id === auctionId && w.user_id === currentUser.id);
    if (exists) {
      setWatchlist((prev) =>
        prev.filter((w) => !(w.auction_id === auctionId && w.user_id === currentUser.id))
      );
    } else {
      const item: WatchlistItem = {
        id: `wl-${Date.now()}`,
        user_id: currentUser.id,
        auction_id: auctionId,
        created_at: new Date().toISOString(),
      };
      setWatchlist((prev) => [...prev, item]);
    }
  };

  // 5. CREATE AUCTION
  const createAuction = async (
    input: CreateAuctionInput
  ): Promise<{ success: boolean; auctionId?: string; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in to list items' };

    const newAuctionId = `auc-${Date.now()}`;
    const newAuction: Auction = {
      id: newAuctionId,
      seller_id: currentUser.id,
      title: input.title,
      description: input.description,
      category: input.category,
      condition: input.condition,
      starting_price_paise: input.starting_price_paise,
      minimum_increment_paise: input.minimum_increment_paise,
      current_price_paise: input.starting_price_paise,
      current_leader_id: null,
      starts_at: new Date().toISOString(),
      ends_at: input.ends_at,
      status: 'ACTIVE',
      sniper_extended_count: 0,
      view_count: 1,
      images: input.images.length > 0 ? input.images : [
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seller: currentUser,
      bids_count: 0,
    };

    setAuctions((prev) => [newAuction, ...prev]);

    // Match saved searches (Section 4J)
    savedSearches.forEach((ss) => {
      if (!ss.active || ss.user_id === currentUser.id) return;
      let matches = true;
      if (ss.category && ss.category !== input.category) matches = false;
      if (ss.condition && ss.condition !== input.condition) matches = false;
      if (ss.maximum_price_paise && input.starting_price_paise > ss.maximum_price_paise) matches = false;
      if (ss.query && !input.title.toLowerCase().includes(ss.query.toLowerCase())) matches = false;

      if (matches) {
        addNotification({
          user_id: ss.user_id,
          type: 'SAVED_SEARCH_MATCH',
          title: 'Matching Listing Found!',
          message: `A new listing matching your saved search "${ss.query || ss.category}" was listed: ${input.title}`,
          related_auction_id: newAuctionId,
        });
      }
    });

    return { success: true, auctionId: newAuctionId };
  };

  // 6. CANCEL AUCTION (Rule 12)
  const cancelAuction = async (auctionId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in required' };
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc) return { success: false, error: 'Auction not found' };
    if (auc.seller_id !== currentUser.id) return { success: false, error: 'Only seller can cancel' };
    if (auc.status === 'SOLD') return { success: false, error: 'Cannot cancel an already completed sale.' };

    const now = new Date().toISOString();
    setAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId
          ? {
              ...a,
              status: 'CANCELLED',
              cancellation_reason: reason,
              cancelled_by: currentUser.id,
              cancelled_at: now,
            }
          : a
      )
    );

    if (auc.current_leader_id) {
      addNotification({
        user_id: auc.current_leader_id,
        type: 'AUCTION_CLOSED',
        title: 'Listing Cancelled by Seller',
        message: `Auction for "${auc.title}" was cancelled by the seller. Reason: ${reason}`,
        related_auction_id: auctionId,
      });
    }

    return { success: true };
  };

  // 7. SELLER DECISIONS: APPROVE / REJECT (Rule 9)
  const approveSale = async (auctionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in required' };
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc) return { success: false, error: 'Auction not found' };
    if (auc.seller_id !== currentUser.id) return { success: false, error: 'Only seller can approve' };

    const now = new Date().toISOString();

    setAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId
          ? { ...a, status: 'RESERVED', seller_decision: 'APPROVE', updated_at: now }
          : a
      )
    );

    setSales((prev) =>
      prev.map((s) =>
        s.auction_id === auctionId
          ? {
              ...s,
              status: 'RESERVED_FOR_PICKUP',
              seller_decision_at: now,
              reserved_at: now,
              updated_at: now,
            }
          : s
      )
    );

    if (auc.provisional_winner_id) {
      addNotification({
        user_id: auc.provisional_winner_id,
        type: 'SELLER_APPROVED',
        title: 'Winning Bid Approved! Item Reserved',
        message: `The seller accepted your final bid for "${auc.title}". You can now meet on campus for handover.`,
        related_auction_id: auctionId,
      });
    }

    return { success: true };
  };

  const rejectSale = async (auctionId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in required' };
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc) return { success: false, error: 'Auction not found' };
    if (auc.seller_id !== currentUser.id) return { success: false, error: 'Only seller can reject' };

    const now = new Date().toISOString();

    setAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId
          ? { ...a, status: 'REJECTED', seller_decision: 'REJECT', updated_at: now }
          : a
      )
    );

    setSales((prev) =>
      prev.map((s) =>
        s.auction_id === auctionId
          ? {
              ...s,
              status: 'REJECTED_BY_SELLER',
              seller_decision_at: now,
              outcome_reason: reason || 'Reserve price not met',
              updated_at: now,
            }
          : s
      )
    );

    if (auc.provisional_winner_id) {
      addNotification({
        user_id: auc.provisional_winner_id,
        type: 'SELLER_REJECTED',
        title: 'Bid Declined by Seller',
        message: `The seller chose not to proceed with the sale of "${auc.title}". Reason: ${reason || 'Below expected price'}.`,
        related_auction_id: auctionId,
      });
    }

    return { success: true };
  };

  // 8. HANDOVER WORKFLOW (Rule 10 & Rule 11)
  const confirmHandover = async (saleId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in required' };
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return { success: false, error: 'Sale record not found' };

    const now = new Date().toISOString();

    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: 'HANDOVER_COMPLETED',
              handover_confirmed_at: now,
              updated_at: now,
            }
          : s
      )
    );

    setAuctions((prev) =>
      prev.map((a) =>
        a.id === targetSale.auction_id ? { ...a, status: 'SOLD', updated_at: now } : a
      )
    );

    // Notify both
    addNotification({
      user_id: targetSale.buyer_id,
      type: 'HANDOVER_CONFIRMED',
      title: 'Handover Completed!',
      message: 'Campus exchange confirmed! Thanks for giving this item a second life.',
      related_auction_id: targetSale.auction_id,
    });

    addNotification({
      user_id: targetSale.seller_id,
      type: 'HANDOVER_CONFIRMED',
      title: 'Sale Completed!',
      message: 'Campus exchange confirmed! Sale is officially finished.',
      related_auction_id: targetSale.auction_id,
    });

    return { success: true };
  };

  const recordFailedPickup = async (
    saleId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in required' };
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return { success: false, error: 'Sale record not found' };

    const now = new Date().toISOString();

    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: 'PICKUP_FAILED',
              failed_pickup_at: now,
              outcome_reason: reason,
              updated_at: now,
            }
          : s
      )
    );

    // Release auction back to UNSOLD or relist
    setAuctions((prev) =>
      prev.map((a) =>
        a.id === targetSale.auction_id ? { ...a, status: 'UNSOLD', updated_at: now } : a
      )
    );

    addNotification({
      user_id: targetSale.buyer_id,
      type: 'PICKUP_FAILED',
      title: 'Pickup Missed - Reservation Cancelled',
      message: `Pickup was cancelled due to: ${reason}`,
      related_auction_id: targetSale.auction_id,
    });

    return { success: true };
  };

  // 9. SAVED SEARCHES
  const saveSearch = async (search: Omit<SavedSearch, 'id' | 'user_id' | 'created_at'>) => {
    if (!currentUser) return;
    const newSS: SavedSearch = {
      ...search,
      id: `ss-${Date.now()}`,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
    };
    setSavedSearches((prev) => [...prev, newSS]);
  };

  const removeSavedSearch = async (id: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <AuctionContext.Provider
      value={{
        auctions,
        bids,
        questions,
        sales,
        watchlist,
        savedSearches,
        getAuctionById,
        getBidsForAuction,
        getQuestionsForAuction,
        getUserAutoBidForAuction,
        isItemInWatchlist,
        placeBid,
        setAutoBid,
        removeAutoBid,
        askQuestion,
        answerQuestion,
        toggleWatchlist,
        createAuction,
        cancelAuction,
        approveSale,
        rejectSale,
        confirmHandover,
        recordFailedPickup,
        saveSearch,
        removeSavedSearch,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuctions = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuctions must be used within an AuctionProvider');
  }
  return context;
};
