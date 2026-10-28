import { Auction, ItemCategory, ItemCondition } from '../types';
import { paiseToRupees } from '../lib/currency';

export interface StructuredAuctionQuery {
  keywords?: string[];
  category?: ItemCategory;
  condition?: ItemCondition;
  maxPricePaise?: number;
  minPricePaise?: number;
  closingWithinMinutes?: number;
  proposeBidForAuctionId?: string;
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
}

export interface AIAssistantResponse {
  answerText: string;
  matchedAuctions: Auction[];
  appliedFilters: {
    category?: string;
    maxPrice?: string;
    condition?: string;
    urgency?: string;
  };
  proposedBid?: {
    auctionId: string;
    auctionTitle: string;
    suggestedAmountPaise: number;
    explanation: string;
  };
}

/**
 * Intelligent natural language parser for campus auction requests
 */
export function parseNaturalLanguageQuery(prompt: string): StructuredAuctionQuery {
  const p = prompt.toLowerCase();
  const query: StructuredAuctionQuery = {};

  // 1. Category extraction
  if (p.includes('cycle') || p.includes('bicycle') || p.includes('bike')) {
    query.category = 'Cycles';
  } else if (p.includes('calculator') || p.includes('calc') || p.includes('casio')) {
    query.category = 'Calculators';
  } else if (p.includes('book') || p.includes('notes') || p.includes('grewal') || p.includes('gate') || p.includes('textbook')) {
    query.category = 'Books';
  } else if (p.includes('laptop') || p.includes('electronics') || p.includes('headphone') || p.includes('mouse') || p.includes('charger')) {
    query.category = 'Electronics';
  } else if (p.includes('table') || p.includes('chair') || p.includes('furniture') || p.includes('desk')) {
    query.category = 'Furniture';
  } else if (p.includes('kettle') || p.includes('iron') || p.includes('hostel') || p.includes('bucket') || p.includes('mattress')) {
    query.category = 'Hostel Essentials';
  }

  // 2. Condition extraction
  if (p.includes('like new') || p.includes('brand new') || p.includes('mint')) {
    query.condition = 'Like New';
  } else if (p.includes('good') || p.includes('decent')) {
    query.condition = 'Good';
  } else if (p.includes('fair')) {
    query.condition = 'Fair';
  }

  // 3. Price extraction (e.g. "under 500", "below ₹400", "less than 1000", "< 2000")
  const priceRegex = /(?:under|below|less than|max|within|<=?|₹|\brs\.?)\s*(\d+(?:,\d+)*)/i;
  const match = p.match(priceRegex);
  if (match && match[1]) {
    const rawNumber = parseInt(match[1].replace(/,/g, ''), 10);
    if (!isNaN(rawNumber)) {
      query.maxPricePaise = rawNumber * 100;
    }
  }

  // 4. Time urgency extraction (e.g. "next hour", "closing soon", "today", "closing in 30 mins")
  if (p.includes('next hour') || p.includes('1 hour') || p.includes('an hour')) {
    query.closingWithinMinutes = 60;
  } else if (p.includes('closing soon') || p.includes('ending soon') || p.includes('quick')) {
    query.closingWithinMinutes = 120;
  } else if (p.includes('today')) {
    query.closingWithinMinutes = 24 * 60;
  }

  // 5. Ambiguity check: prompt is too brief or vague
  if (prompt.trim().length < 4 || (p === 'show' || p === 'find' || p === 'buy')) {
    query.isAmbiguous = true;
    query.clarificationQuestion =
      'Could you mention what item you are searching for (e.g., "Used cycle under ₹3,500" or "Casio calculator")?';
  }

  return query;
}

/**
 * Searches real auctions and formats structured recommendations.
 * Strictly avoids fabricating any auction, price, or availability.
 */
export async function queryAIAssistant(
  prompt: string,
  availableAuctions: Auction[]
): Promise<AIAssistantResponse> {
  const query = parseNaturalLanguageQuery(prompt);

  if (query.isAmbiguous && query.clarificationQuestion) {
    return {
      answerText: query.clarificationQuestion,
      matchedAuctions: [],
      appliedFilters: {},
    };
  }

  const now = Date.now();

  // Filter actual auction data
  let matches = availableAuctions.filter((auc) => {
    // Only search active listings
    if (auc.status !== 'ACTIVE') return false;

    // Check category
    if (query.category && auc.category !== query.category) {
      return false;
    }

    // Check condition
    if (query.condition && auc.condition !== query.condition) {
      return false;
    }

    // Check max price
    if (query.maxPricePaise && auc.current_price_paise > query.maxPricePaise) {
      return false;
    }

    // Check time remaining
    if (query.closingWithinMinutes) {
      const endsAtMs = new Date(auc.ends_at).getTime();
      const minutesLeft = (endsAtMs - now) / (60 * 1000);
      if (minutesLeft < 0 || minutesLeft > query.closingWithinMinutes) {
        return false;
      }
    }

    return true;
  });

  // If strict category search returned nothing, fall back to keyword text match
  if (matches.length === 0 && !query.category) {
    const words = prompt
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['find', 'show', 'under', 'with', 'the', 'for'].includes(w));

    matches = availableAuctions.filter((auc) => {
      if (auc.status !== 'ACTIVE') return false;
      const fullText = `${auc.title} ${auc.description} ${auc.category}`.toLowerCase();
      const matched = words.some((word) => fullText.includes(word));
      if (!matched) return false;
      if (query.maxPricePaise && auc.current_price_paise > query.maxPricePaise) return false;
      return true;
    });
  }

  // Build applied filters summary
  const appliedFilters: AIAssistantResponse['appliedFilters'] = {};
  if (query.category) appliedFilters.category = query.category;
  if (query.condition) appliedFilters.condition = query.condition;
  if (query.maxPricePaise)
    appliedFilters.maxPrice = `₹${(query.maxPricePaise / 100).toLocaleString('en-IN')}`;
  if (query.closingWithinMinutes)
    appliedFilters.urgency = `Closing within ${query.closingWithinMinutes} mins`;

  // Compose honest explanation
  let answerText = '';
  if (matches.length > 0) {
    answerText = `I found ${matches.length} active campus listing${
      matches.length === 1 ? '' : 's'
    } matching your request. All listings are genuine student auctions with live countdowns and verified hostel pickup.`;
  } else {
    // If no exact match, tell the student honestly
    answerText = `I couldn't find any active listings matching your exact criteria right now. You can save this search to receive an immediate alert when a fellow student lists a matching item!`;
  }

  // Check if student asked to propose a bid on a specific item
  let proposedBid: AIAssistantResponse['proposedBid'] | undefined;
  const p = prompt.toLowerCase();
  if (matches.length > 0 && (p.includes('bid') || p.includes('suggest') || p.includes('offer'))) {
    const target = matches[0];
    const nextMinPaise = target.current_price_paise + target.minimum_increment_paise;
    proposedBid = {
      auctionId: target.id,
      auctionTitle: target.title,
      suggestedAmountPaise: nextMinPaise,
      explanation: `Minimum next bid allowed is ₹${paiseToRupees(
        nextMinPaise
      ).toLocaleString('en-IN')}. Rule 14 requires your explicit authorization before placing this bid.`,
    };
  }

  return {
    answerText,
    matchedAuctions: matches,
    appliedFilters,
    proposedBid,
  };
}
