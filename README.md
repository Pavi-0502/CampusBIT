# CampusBid — Give It a Second Life. Bid It Fair.

> **Campus-Exclusive Fair Auction Platform for Graduating Students & Juniors**  
> Replacing chaotic, unorganized WhatsApp campus selling groups with a transparent, anti-sniping, real-time auction marketplace.

---

## 🏆 Project Overview

**CampusBid** is a full-stack, production-ready campus marketplace application built for college ecosystems. Every year, graduating seniors give away or dump valuable gear—bicycles, scientific calculators, engineering textbooks, laptops, hostel furniture, and appliances—while incoming juniors scramble to buy them at inflated prices or endure endless WhatsApp bargaining, ghosting, and scamming.

CampusBid solves this with a **student-exclusive auction engine** strictly verified by institutional email domains (`@bit.edu`, `@iitb.ac.in`, etc.), featuring:
- **Fair Anti-Sniping Protection**: 30-second countdown extensions prevent bot snipers.
- **Strict Minimum Bid Increments**: Server-enforced financial validations using exact integer paise.
- **Private Automatic Proxy Bidding**: Confidentially outbids challengers up to a student's private maximum limit.
- **Seller Approval & Campus Handover Workflow**: Ensures sellers retain reserve price approval and buyers inspect items in person at hostel common rooms before final sale confirmation.
- **AI Campus Assistant**: Natural-language conversational search that translates queries into structured filters and proposes authorized bids (Rule 14 compliant).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS, React Router v7, Lucide Icons, Canvas Confetti |
| **Form & Validation** | React Hook Form, Zod |
| **Backend & Database** | PostgreSQL, Supabase Auth, Supabase Storage, Supabase Realtime, PostgreSQL Stored Functions & Triggers |
| **AI Integration** | Gemini API & Intelligent Structured Query Translator |
| **Testing** | Vitest (Automated test suite verifying all critical auction business rules) |
| **Deployment** | Vercel (`vercel.json` rewrites included), Supabase Database Migrations |

---

## 📐 Auction Business Rules (Mandatory System Invariants)

CampusBid enforces 15 critical business rules at both the database level (PostgreSQL functions & RLS) and the TypeScript application engine:

1. **Rule 1 (Starting Bid)**: The first accepted bid must be $\ge$ `starting_price_paise`.
2. **Rule 2 (Minimum Increment)**: Every subsequent bid must be $\ge$ $\text{current\_leading\_bid} + \text{minimum\_bid\_increment}$.
3. **Rule 3 (Closing)**: Rejects all new bids once the trusted server closing time has elapsed.
4. **Rule 4 (Server Time Enforcement)**: Bid acceptance strictly relies on database/server timestamps (`clock_timestamp()`). Client-side clocks are purely informational.
5. **Rule 5 (Atomic Bidding)**: Transactions acquire row-level locks (`SELECT ... FOR UPDATE`) to prevent concurrent race condition bypasses.
6. **Rule 6 (Public Bid History & Privacy)**: All accepted bids are immutably logged with timestamps and pseudonymized identities (e.g. *Swift Falcon #412*). Sensitive email addresses and phone numbers are never leaked.
7. **Rule 7 (Last-Minute Anti-Sniping Extension)**: If a valid bid is placed in the final 30 seconds before closing, the closing time automatically extends to **60 seconds after the accepted bid**. Repeated sniper bids trigger successive 60-second extensions.
8. **Rule 8 (Auction Closing & Provisional Winner)**: Upon closing, the highest valid bid becomes the provisional winner. If no bids were placed, the status transitions to `UNSOLD`.
9. **Rule 9 (Seller Decision Rights)**: The seller can **Approve** (reserving item for winner) or **Reject** (recording rejection outcome and releasing item) the provisional winning price.
10. **Rule 10 (Campus Handover Assurance)**: The sale is completed (`SOLD`) only after confirmed physical campus exchange.
11. **Rule 11 (Failed Pickup Workflow)**: Missed handovers are recorded with audit reasons, gracefully releasing reservations without rewriting history.
12. **Rule 12 (Audited Cancellations)**: Sellers can cancel eligible active auctions (with 0 bids) by providing a recorded reason; already completed sales cannot be cancelled.
13. **Rule 13 (Private Automatic Proxy Bidding)**: Maximum budgets are strictly confidential. Competing auto-bids are evaluated deterministically; equal maximums are resolved in favor of earlier registration timestamp.
14. **Rule 14 (AI Authorization Guardrail)**: The AI assistant is strictly prohibited from placing bids autonomously. It may propose a bid, which requires explicit student authorization.
15. **Rule 15 (Informational Countdown)**: Frontend countdowns are synchronized with server timestamps.

---

## 🗄️ Database Architecture (12 PostgreSQL Tables)

All SQL migrations are stored under `supabase/migrations/`:

- `20261028000001_initial_schema.sql`:
  - `profiles`: Student details, campus domain restriction, hostel block, ratings, sale/purchase counters.
  - `auctions`: Listing title, category, condition, starting price, min increment, current price, ends_at, sniper_extended_count.
  - `auction_images`: Multiple photo storage paths and display sort order.
  - `bids`: Immutable transaction log of all manual and proxy bids.
  - `auto_bid_settings`: Private user proxy limits (Row Level Security protected).
  - `questions` & `answers`: Chronological campus Q&A with reporting flags.
  - `watchlist`: Personalized saved auctions.
  - `saved_searches`: Search criteria matching alerts.
  - `notifications`: In-app and browser notifications.
  - `sales`: Handover lifecycle tracking (`PENDING_APPROVAL`, `RESERVED_FOR_PICKUP`, `HANDOVER_COMPLETED`, `PICKUP_FAILED`).
  - `audit_logs`: Secure system event trail.
- `20261028000002_functions_and_rules.sql`:
  - `place_bid()`: Atomic transactional bidding function with anti-snipe logic.
  - `close_auction()`: Evaluates provisional winners or marks unsold.
  - `decide_auction_sale()`: Approve/reject winning price.
  - `confirm_handover()`: Completes campus physical handover.
  - `record_failed_pickup()`: Handles missed pickups safely.
  - `cancel_auction()`: Handles auditable seller cancellations.
  - Row Level Security (RLS) policies for complete data confidentiality.

---

## 🧪 Automated Test Suite (17 Tests Passing)

Automated tests in `src/tests/` verify every auction rule in isolation using **Vitest**:

```bash
npm test
```

### Verified Scenarios:
- ✅ **Rule 1**: First bid at starting price accepted; first bid below starting price rejected.
- ✅ **Rule 2**: Subsequent bid at current + min increment accepted; bid below increment rejected.
- ✅ **Rule 3 & 4**: Bids after closing timestamp rejected; closed status bids rejected; seller self-bidding rejected.
- ✅ **Rule 7**: Bids $> 30\text{s}$ do not extend timer; bids within final 30 seconds extend closing to accepted timestamp $+ 60\text{s}$; repeated extensions work properly.
- ✅ **Rule 8**: Closed auction with 0 bids marked `UNSOLD`; closed auction with bids selects highest valid bidder as provisional winner.
- ✅ **Rule 13**: Automatic proxy bidding advances price by minimum required increment; competing proxy bids resolve deterministically; earlier registration wins equal-maximum ties; proxy never exceeds buyer's maximum.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js $\ge 18$ (Node 24 recommended)
- npm or pnpm

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/campusbid.git
cd campusbid
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Contents of `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Gemini API Key for AI Assistant
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Campus Verification Settings
VITE_CAMPUS_DOMAIN=bit.edu
VITE_CAMPUS_NAME=Birla Institute of Technology
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 🎮 Interactive Hackathon Demo Mode Workflow

When external Supabase credentials are not configured, CampusBid automatically activates an **Interactive Demo Environment**. This is not a static mockup—it is a fully functional, stateful bidding system that implements all 15 auction rules!

### Demonstration Guide for Judges:
1. **Quick Role Switcher**:
   - Use the role switcher in the top banner to toggle between:
     - **Aarav Sharma** (Final Year CSE — Seller of Mountain Cycle & Lenovo Laptop)
     - **Priya Patel** (1st Year ECE — Buyer currently leading the Cycle auction)
     - **Rohan Verma** (3rd Year Mech — Seller of Calculator & GATE books)
2. **Experience Anti-Sniping in Real Time**:
   - Open auction `#auc-sniper-demo-07` (*Boat Rockerz Headphones*), which has a countdown under 2 minutes.
   - Place a bid when the countdown is under 30 seconds.
   - Notice the countdown immediately extend by 60 seconds with the "+1m sniper ext" badge!
3. **Test Private Proxy Auto-Bidding**:
   - Open any active listing and click **"Set Private Auto-Bid Budget"**.
   - Input a maximum limit (e.g. ₹4,500).
   - Switch user to a competing student and place bids—watch the auto-bidding engine defend the leading position up to the budget!
4. **Seller Decision & Handover Confirmation**:
   - Switch to **Aarav Sharma** and navigate to the **Seller Hub**.
   - Review closed auction `#auc-awaiting-decision-08` (*Ergonomic Mesh Chair*).
   - Click **"Approve Price"** to reserve the item for the winner.
   - Click **"Confirm Campus Handover"** to finalize the exchange.
5. **Ask the Campus AI Assistant**:
   - Click the **AI Assistant** button in the top navigation.
   - Try: *"Find cycles under ₹4,000"*, *"Show Casio calculator"*, or *"Closing in next hour"*.
   - View structured matches, honest explanations, and test authorized proposed bids (Rule 14).

---

## ☁️ Supabase Production Setup Instructions

To connect CampusBid to a live Supabase PostgreSQL instance:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Execute `supabase/migrations/20261028000001_initial_schema.sql` followed by `supabase/migrations/20261028000002_functions_and_rules.sql`.
4. Run `supabase/seed.sql` to populate sample campus listings.
5. In **Project Settings -> API**, copy your Project URL and Anon Public Key into your `.env` file.
6. Enable **Supabase Realtime** for `auctions` and `bids` tables under Database -> Replication.
7. Restart the dev server or deploy to Vercel!

---

## 📄 License
MIT License. Built with ❤️ for college student communities.
