import { Profile, Auction, Bid, Question, Notification, AutoBidSetting, Sale } from '../types';

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'user-aarav',
    display_name: 'Aarav Sharma',
    pseudonym: 'Aarav (4th Yr CSE)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    campus_domain: 'bit.edu',
    hostel_block: 'Godavari Block B',
    room_number: 'B-304',
    phone_number: '+91 98765 43210',
    bio: '4th Year CSE graduating in May 2026. Clearing hostel room essentials and gear.',
    rating: 4.95,
    total_sales: 6,
    total_purchases: 3,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'user-priya',
    display_name: 'Priya Patel',
    pseudonym: 'Priya (1st Yr ECE)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    campus_domain: 'bit.edu',
    hostel_block: 'Cauvery Block A',
    room_number: 'A-112',
    phone_number: '+91 98111 22334',
    bio: '1st Year ECE student. Looking for good condition cycle and engineering accessories.',
    rating: 5.0,
    total_sales: 0,
    total_purchases: 4,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-rohan',
    display_name: 'Rohan Verma',
    pseudonym: 'Rohan (3rd Yr Mech)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    campus_domain: 'bit.edu',
    hostel_block: 'Narmada Block C',
    room_number: 'C-215',
    phone_number: '+91 98222 33445',
    bio: '3rd Year Mechanical Engineering. Upgrading books and hostel setup.',
    rating: 4.8,
    total_sales: 4,
    total_purchases: 5,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'user-ananya',
    display_name: 'Ananya Iyer',
    pseudonym: 'Ananya (2nd Yr EE)',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    campus_domain: 'bit.edu',
    hostel_block: 'Ganga Block D',
    room_number: 'D-108',
    phone_number: '+91 98333 44556',
    bio: '2nd Year Electrical. Passionate about robotics and competitive programming.',
    rating: 4.9,
    total_sales: 1,
    total_purchases: 7,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'user-vikram',
    display_name: 'Vikram Malhotra',
    pseudonym: 'Vikram (Graduating IT)',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    campus_domain: 'bit.edu',
    hostel_block: 'Brahmaputra Block E',
    room_number: 'E-401',
    phone_number: '+91 98444 55667',
    bio: 'Graduating IT batch. Moving to Bangalore for job next month.',
    rating: 4.98,
    total_sales: 12,
    total_purchases: 2,
    created_at: new Date(Date.now() - 80 * 86400000).toISOString(),
  },
];

// Helper to calculate future timestamps relative to now
const now = Date.now();
const minutes = (m: number) => new Date(now + m * 60 * 1000).toISOString();
const hours = (h: number) => new Date(now + h * 3600 * 1000).toISOString();
const days = (d: number) => new Date(now + d * 86400 * 1000).toISOString();
const pastHours = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

export const INITIAL_AUCTIONS: Auction[] = [
  {
    id: 'auc-cycle-01',
    seller_id: 'user-aarav',
    title: 'Hero Sprint Pro 21-Speed Mountain Cycle (Dual Disc Brakes)',
    description:
      'Selling my faithful 21-speed Hero Sprint Pro. Serviced last month at the campus gate repair shop. Brand new rear tyre tube installed, smooth Shimano Tourney gears, front suspension working perfectly. Ideal for daily commute between Godavari hostel and academic blocks. Includes free heavy-duty number lock and LED headlight.',
    category: 'Cycles',
    condition: 'Good',
    starting_price_paise: 250000, // ₹2,500
    minimum_increment_paise: 10000, // ₹100
    current_price_paise: 380000, // ₹3,800
    current_leader_id: 'user-priya',
    starts_at: pastHours(24),
    ends_at: minutes(12), // 12 minutes left - ending very soon!
    status: 'ACTIVE',
    sniper_extended_count: 0,
    view_count: 142,
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(24),
    updated_at: pastHours(1),
  },
  {
    id: 'auc-calc-02',
    seller_id: 'user-rohan',
    title: 'Casio FX-991CW ClassWiz Non-Programmable Scientific Calculator',
    description:
      'Official Casio ClassWiz FX-991CW calculator. Allowed in all semester exams and GATE engineering exams. 540+ functions, high-resolution natural textbook display, QR code visualization. Used for only one semester in 2nd year. Protective snap-on hard case included with zero scratches.',
    category: 'Calculators',
    condition: 'Like New',
    starting_price_paise: 60000, // ₹600
    minimum_increment_paise: 5000, // ₹50
    current_price_paise: 95000, // ₹950
    current_leader_id: 'user-ananya',
    starts_at: pastHours(12),
    ends_at: hours(3), // 3 hours left
    status: 'ACTIVE',
    sniper_extended_count: 0,
    view_count: 89,
    images: [
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(12),
    updated_at: pastHours(2),
  },
  {
    id: 'auc-books-03',
    seller_id: 'user-rohan',
    title: 'Complete GATE CS Preparation Bundle + B.S. Grewal Math (Latest 44th Edition)',
    description:
      'Complete set for Computer Science & IT engineering students: 1. Higher Engineering Mathematics by B.S. Grewal (44th Ed.), 2. Made Easy GATE CS 30-year chapterwise solved papers, 3. Tanenbaum Computer Networks, 4. Cormen Algorithms (CLRS) photocopied binding. Clean pages with minimal pencil highlights.',
    category: 'Books',
    condition: 'Good',
    starting_price_paise: 80000, // ₹800
    minimum_increment_paise: 5000, // ₹50
    current_price_paise: 135000, // ₹1,350
    current_leader_id: 'user-priya',
    starts_at: pastHours(30),
    ends_at: days(2), // 2 days left
    status: 'ACTIVE',
    sniper_extended_count: 0,
    view_count: 175,
    images: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(30),
    updated_at: pastHours(3),
  },
  {
    id: 'auc-laptop-04',
    seller_id: 'user-aarav',
    title: 'Lenovo IdeaPad Slim 3 (AMD Ryzen 5 5500U, 16GB RAM, 512GB SSD)',
    description:
      'Upgrading to company-issued laptop after campus placement. 15.6" FHD Anti-glare display, AMD Ryzen 5 6-core processor, upgraded 16GB Dual-Channel DDR4 RAM, 512GB NVMe SSD. Battery health is at 88% (gives 4-5 hours of coding/lectures). Original 65W fast charger and laptop sleeve included.',
    category: 'Electronics',
    condition: 'Good',
    starting_price_paise: 1800000, // ₹18,000
    minimum_increment_paise: 50000, // ₹500
    current_price_paise: 2450000, // ₹24,500
    current_leader_id: 'user-vikram',
    starts_at: pastHours(48),
    ends_at: hours(6), // 6 hours left
    status: 'ACTIVE',
    sniper_extended_count: 0,
    view_count: 310,
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(48),
    updated_at: pastHours(4),
  },
  {
    id: 'auc-table-05',
    seller_id: 'user-vikram',
    title: 'Solid Engineered Wood Hostel Study Table with 3-Tier Bookshelf Rack',
    description:
      'Spacious study table custom-fitted for standard hostel rooms. Dimensions: 100cm W x 55cm D x 120cm H. Has dedicated laptop area, three upper shelves for binders/books, and cable management grommet. Solid build, water-resistant top surface, does not wobble.',
    category: 'Furniture',
    condition: 'Good',
    starting_price_paise: 120000, // ₹1,200
    minimum_increment_paise: 10000, // ₹100
    current_price_paise: 170000, // ₹1,700
    current_leader_id: 'user-ananya',
    starts_at: pastHours(18),
    ends_at: minutes(45), // 45 mins left
    status: 'ACTIVE',
    sniper_extended_count: 0,
    view_count: 98,
    images: [
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(18),
    updated_at: pastHours(2),
  },
  {
    id: 'auc-hostel-06',
    seller_id: 'user-vikram',
    title: 'Hostel Survival Duo: Prestige 1.5L Kettle & Philips 1000W Dry Iron',
    description:
      'Essential hostel room appliances bundle: 1. Prestige 1.5L Stainless Steel Electric Kettle (ideal for midnight Maggi, coffee, boiled eggs), 2. Philips Linus dry iron with non-stick American Heritage soleplate. Both in flawless working condition. Campus hostel approved wattage.',
    category: 'Hostel Essentials',
    condition: 'Like New',
    starting_price_paise: 70000, // ₹700
    minimum_increment_paise: 5000, // ₹50
    current_price_paise: 115000, // ₹1,150
    current_leader_id: 'user-priya',
    starts_at: pastHours(40),
    ends_at: days(1), // 1 day left
    status: 'ACTIVE',
    sniper_extended_count: 0,
    view_count: 154,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(40),
    updated_at: pastHours(5),
  },
  {
    id: 'auc-sniper-demo-07',
    seller_id: 'user-rohan',
    title: 'Boat Rockerz 450 Bluetooth Wireless On-Ear Headphones (Matte Black)',
    description:
      'Quick test auction ending in less than 2 minutes! Test the 30-second anti-sniping extension rule by placing a bid right now. 40mm dynamic drivers, 15 hours battery playback, plush ear cushions with aux cable and mic.',
    category: 'Electronics',
    condition: 'Good',
    starting_price_paise: 50000, // ₹500
    minimum_increment_paise: 5000, // ₹50
    current_price_paise: 65000, // ₹650
    current_leader_id: 'user-ananya',
    starts_at: pastHours(2),
    ends_at: minutes(1.5), // 90 seconds left! Perfect for testing sniper extension
    status: 'ACTIVE',
    sniper_extended_count: 0,
    view_count: 67,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(2),
    updated_at: pastHours(1),
  },
  {
    id: 'auc-awaiting-decision-08',
    seller_id: 'user-aarav',
    title: 'Ergonomic Mesh Office Chair with Lumbar Support & Hydraulic Lift',
    description:
      'Comfortable ergonomic chair used for coding throughout senior year. Auction closed and awaiting seller approval. Demonstrate seller decision workflow (Approve or Reject winning bid).',
    category: 'Furniture',
    condition: 'Good',
    starting_price_paise: 150000, // ₹1,500
    minimum_increment_paise: 10000, // ₹100
    current_price_paise: 220000, // ₹2,200
    current_leader_id: 'user-rohan',
    provisional_winner_id: 'user-rohan',
    winning_bid_paise: 220000,
    seller_decision: 'PENDING',
    starts_at: pastHours(48),
    ends_at: pastHours(2), // Already closed
    status: 'AWAITING_SELLER_DECISION',
    sniper_extended_count: 1,
    view_count: 188,
    images: [
      'https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(48),
    updated_at: pastHours(2),
  },
  {
    id: 'auc-sold-demo-09',
    seller_id: 'user-vikram',
    title: 'Logitech MX Master 2S Wireless Bluetooth Rechargeable Mouse',
    description:
      'Hyper-fast scroll wheel, multi-device flow cross-computer control. Successfully sold and handed over at Hostel Common Room.',
    category: 'Accessories',
    condition: 'Like New',
    starting_price_paise: 150000, // ₹1,500
    minimum_increment_paise: 10000, // ₹100
    current_price_paise: 240000, // ₹2,400
    current_leader_id: 'user-priya',
    provisional_winner_id: 'user-priya',
    winning_bid_paise: 240000,
    seller_decision: 'APPROVE',
    starts_at: pastHours(72),
    ends_at: pastHours(24),
    status: 'SOLD',
    sniper_extended_count: 0,
    view_count: 220,
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: pastHours(72),
    updated_at: pastHours(20),
  },
];

export const INITIAL_BIDS: Bid[] = [
  // Cycle bids
  {
    id: 'bid-c-1',
    auction_id: 'auc-cycle-01',
    bidder_id: 'user-rohan',
    amount_paise: 250000,
    bid_type: 'MANUAL',
    created_at: pastHours(20),
  },
  {
    id: 'bid-c-2',
    auction_id: 'auc-cycle-01',
    bidder_id: 'user-ananya',
    amount_paise: 280000,
    bid_type: 'MANUAL',
    created_at: pastHours(16),
  },
  {
    id: 'bid-c-3',
    auction_id: 'auc-cycle-01',
    bidder_id: 'user-priya',
    amount_paise: 320000,
    bid_type: 'MANUAL',
    created_at: pastHours(8),
  },
  {
    id: 'bid-c-4',
    auction_id: 'auc-cycle-01',
    bidder_id: 'user-rohan',
    amount_paise: 350000,
    bid_type: 'MANUAL',
    created_at: pastHours(4),
  },
  {
    id: 'bid-c-5',
    auction_id: 'auc-cycle-01',
    bidder_id: 'user-priya',
    amount_paise: 380000,
    bid_type: 'AUTOMATIC',
    created_at: pastHours(1),
  },

  // Calculator bids
  {
    id: 'bid-k-1',
    auction_id: 'auc-calc-02',
    bidder_id: 'user-priya',
    amount_paise: 60000,
    bid_type: 'MANUAL',
    created_at: pastHours(10),
  },
  {
    id: 'bid-k-2',
    auction_id: 'auc-calc-02',
    bidder_id: 'user-vikram',
    amount_paise: 80000,
    bid_type: 'MANUAL',
    created_at: pastHours(6),
  },
  {
    id: 'bid-k-3',
    auction_id: 'auc-calc-02',
    bidder_id: 'user-ananya',
    amount_paise: 95000,
    bid_type: 'MANUAL',
    created_at: pastHours(2),
  },

  // Books bids
  {
    id: 'bid-b-1',
    auction_id: 'auc-books-03',
    bidder_id: 'user-ananya',
    amount_paise: 80000,
    bid_type: 'MANUAL',
    created_at: pastHours(25),
  },
  {
    id: 'bid-b-2',
    auction_id: 'auc-books-03',
    bidder_id: 'user-priya',
    amount_paise: 135000,
    bid_type: 'MANUAL',
    created_at: pastHours(3),
  },

  // Chair bids (Awaiting decision)
  {
    id: 'bid-ch-1',
    auction_id: 'auc-awaiting-decision-08',
    bidder_id: 'user-priya',
    amount_paise: 150000,
    bid_type: 'MANUAL',
    created_at: pastHours(30),
  },
  {
    id: 'bid-ch-2',
    auction_id: 'auc-awaiting-decision-08',
    bidder_id: 'user-rohan',
    amount_paise: 220000,
    bid_type: 'MANUAL',
    created_at: pastHours(2),
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    auction_id: 'auc-cycle-01',
    asker_id: 'user-priya',
    question_text: 'Are both gear shifters original Shimano or replaced? Any rust on chain?',
    reported: false,
    created_at: pastHours(18),
    answer: {
      id: 'ans-1',
      question_id: 'q-1',
      seller_id: 'user-aarav',
      answer_text: 'Both front and rear derailleurs are original Shimano Tourney! Chain was lubricated and cleaned during last service, no rust.',
      reported: false,
      created_at: pastHours(17),
    },
  },
  {
    id: 'q-2',
    auction_id: 'auc-cycle-01',
    asker_id: 'user-rohan',
    question_text: 'Can I do a test ride near Godavari block basketball court before final handover?',
    reported: false,
    created_at: pastHours(10),
    answer: {
      id: 'ans-2',
      question_id: 'q-2',
      seller_id: 'user-aarav',
      answer_text: 'Yes absolutely! Once auction closes and bid is confirmed, we can meet right outside Godavari gate for inspection.',
      reported: false,
      created_at: pastHours(9),
    },
  },
  {
    id: 'q-3',
    auction_id: 'auc-laptop-04',
    asker_id: 'user-vikram',
    question_text: 'Does this model have an empty M.2 NVMe slot for second SSD expansion?',
    reported: false,
    created_at: pastHours(36),
    answer: {
      id: 'ans-3',
      question_id: 'q-3',
      seller_id: 'user-aarav',
      answer_text: 'Yes, it has a secondary 2.5-inch SATA bay plus M.2 slot. Currently 512GB NVMe is in the main slot.',
      reported: false,
      created_at: pastHours(35),
    },
  },
];

export const INITIAL_AUTO_BIDS: AutoBidSetting[] = [
  {
    id: 'ab-1',
    auction_id: 'auc-cycle-01',
    bidder_id: 'user-priya',
    maximum_amount_paise: 450000, // ₹4,500 private maximum
    active: true,
    created_at: pastHours(8),
    updated_at: pastHours(8),
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-chair-01',
    auction_id: 'auc-awaiting-decision-08',
    seller_id: 'user-aarav',
    buyer_id: 'user-rohan',
    winning_bid_id: 'bid-ch-2',
    agreed_price_paise: 220000,
    status: 'PENDING_APPROVAL',
    campus_pickup_location: 'Godavari Block Common Room',
    created_at: pastHours(2),
    updated_at: pastHours(2),
  },
  {
    id: 'sale-mouse-02',
    auction_id: 'auc-sold-demo-09',
    seller_id: 'user-vikram',
    buyer_id: 'user-priya',
    winning_bid_id: 'bid-m-1',
    agreed_price_paise: 240000,
    status: 'HANDOVER_COMPLETED',
    seller_decision_at: pastHours(23),
    reserved_at: pastHours(23),
    handover_confirmed_at: pastHours(20),
    campus_pickup_location: 'Campus Student Activity Center',
    created_at: pastHours(24),
    updated_at: pastHours(20),
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-priya',
    type: 'LEADING_BIDDER',
    title: "You're the highest bidder!",
    message: 'Your bid of ₹3,800 is currently leading for Hero Sprint Pro Cycle.',
    related_auction_id: 'auc-cycle-01',
    read_at: null,
    created_at: pastHours(1),
  },
  {
    id: 'notif-2',
    user_id: 'user-aarav',
    type: 'AUCTION_CLOSED',
    title: 'Auction closed - Decision required',
    message: 'Ergonomic Mesh Chair closed at ₹2,200. Please approve or reject the final bid.',
    related_auction_id: 'auc-awaiting-decision-08',
    read_at: null,
    created_at: pastHours(2),
  },
  {
    id: 'notif-3',
    user_id: 'user-rohan',
    type: 'OUTBID',
    title: 'You were outbid!',
    message: 'Someone placed a higher bid of ₹3,800 on Hero Sprint Pro 21-Speed Cycle.',
    related_auction_id: 'auc-cycle-01',
    read_at: pastHours(1),
    created_at: pastHours(1),
  },
];
