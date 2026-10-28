export type ItemCategory =
  | 'Cycles'
  | 'Calculators'
  | 'Books'
  | 'Electronics'
  | 'Furniture'
  | 'Hostel Essentials'
  | 'Accessories'
  | 'Other';

export type ItemCondition = 'Like New' | 'Good' | 'Fair' | 'Needs Repair';

export type AuctionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ENDED'
  | 'UNSOLD'
  | 'AWAITING_SELLER_DECISION'
  | 'REJECTED'
  | 'RESERVED'
  | 'SOLD'
  | 'CANCELLED';

export type BidType = 'MANUAL' | 'AUTOMATIC';

export type SaleStatus =
  | 'PENDING_APPROVAL'
  | 'RESERVED_FOR_PICKUP'
  | 'HANDOVER_COMPLETED'
  | 'PICKUP_FAILED'
  | 'REJECTED_BY_SELLER'
  | 'CANCELLED';

export type NotificationType =
  | 'NEW_BID'
  | 'OUTBID'
  | 'LEADING_BIDDER'
  | 'ENDING_SOON'
  | 'AUCTION_CLOSED'
  | 'AUCTION_WON'
  | 'SELLER_APPROVED'
  | 'SELLER_REJECTED'
  | 'RESERVATION_UPDATE'
  | 'HANDOVER_CONFIRMED'
  | 'PICKUP_FAILED'
  | 'SAVED_SEARCH_MATCH'
  | 'QUESTION_ANSWERED';

export interface Profile {
  id: string;
  display_name: string;
  pseudonym: string;
  avatar_url?: string;
  campus_domain: string;
  hostel_block?: string;
  room_number?: string;
  phone_number?: string;
  bio?: string;
  rating: number;
  total_sales: number;
  total_purchases: number;
  created_at: string;
}

export interface Auction {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: ItemCategory;
  condition: ItemCondition;
  starting_price_paise: number;
  minimum_increment_paise: number;
  current_price_paise: number;
  current_leader_id?: string | null;
  starts_at: string;
  ends_at: string;
  status: AuctionStatus;
  seller_decision?: 'APPROVE' | 'REJECT' | 'PENDING' | null;
  provisional_winner_id?: string | null;
  winning_bid_paise?: number | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  sniper_extended_count: number;
  view_count: number;
  images: string[];
  created_at: string;
  updated_at: string;
  // Hydrated helper fields
  seller?: Profile;
  current_leader_pseudonym?: string;
  bids_count?: number;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount_paise: number;
  bid_type: BidType;
  created_at: string;
  bidder_pseudonym?: string;
  bidder_avatar?: string;
}

export interface AutoBidSetting {
  id: string;
  auction_id: string;
  bidder_id: string;
  maximum_amount_paise: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  auction_id: string;
  asker_id: string;
  question_text: string;
  reported: boolean;
  created_at: string;
  asker_pseudonym?: string;
  answer?: Answer;
}

export interface Answer {
  id: string;
  question_id: string;
  seller_id: string;
  answer_text: string;
  reported: boolean;
  created_at: string;
  seller_name?: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  auction_id: string;
  created_at: string;
  auction?: Auction;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  query?: string;
  category?: ItemCategory;
  condition?: ItemCondition;
  maximum_price_paise?: number;
  active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_auction_id?: string;
  read_at?: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  auction_id: string;
  seller_id: string;
  buyer_id: string;
  winning_bid_id: string;
  agreed_price_paise: number;
  status: SaleStatus;
  seller_decision_at?: string;
  reserved_at?: string;
  handover_confirmed_at?: string;
  failed_pickup_at?: string;
  outcome_reason?: string;
  campus_pickup_location?: string;
  created_at: string;
  updated_at: string;
  auction?: Auction;
  buyer?: Profile;
  seller?: Profile;
}

export interface AuctionFilterState {
  searchQuery: string;
  category: ItemCategory | 'All';
  condition: ItemCondition | 'All';
  minPrice: string;
  maxPrice: string;
  statusTab: 'active' | 'ending-soon' | 'completed';
  sortBy: 'ending-soon' | 'newest' | 'price-asc' | 'price-desc' | 'bids-count';
}
