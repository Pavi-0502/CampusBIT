-- =====================================================================
-- CampusBid Seed SQL
-- Initial sample data for demonstration & testing
-- All monetary figures stored in integer paise (1 INR = 100 paise)
-- =====================================================================

-- Note: Ensure users exist in auth.users first if testing against live Supabase Auth.
-- In production, profiles are auto-created upon student email verification.

-- Insert Seed Auctions (IDs aligned with demo data)
INSERT INTO auctions (
    id,
    seller_id,
    title,
    description,
    category,
    condition,
    starting_price_paise,
    minimum_increment_paise,
    current_price_paise,
    starts_at,
    ends_at,
    status
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Hero Sprint Pro 21-Speed Mountain Cycle (Dual Disc Brakes)',
    'Selling my faithful 21-speed Hero Sprint Pro. Serviced last month at the campus gate repair shop. Dual disc brakes, brand new rear tyre tube, Shimano Tourney gears. Free heavy-duty lock and headlight included.',
    'Cycles',
    'Good',
    250000, -- ₹2,500
    10000,  -- ₹100 min increment
    380000, -- ₹3,800
    NOW() - INTERVAL '24 hours',
    NOW() + INTERVAL '2 hours',
    'ACTIVE'
),
(
    '00000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Casio FX-991CW ClassWiz Non-Programmable Scientific Calculator',
    'Official Casio ClassWiz FX-991CW. Permitted in semester exams & GATE. 540+ functions, natural textbook display. Pristine condition with hard case.',
    'Calculators',
    'Like New',
    60000, -- ₹600
    5000,  -- ₹50
    95000, -- ₹950
    NOW() - INTERVAL '12 hours',
    NOW() + INTERVAL '5 hours',
    'ACTIVE'
),
(
    '00000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'Complete GATE CS Preparation Bundle + B.S. Grewal Math (44th Ed.)',
    'Complete engineering bundle: B.S. Grewal, Made Easy 30-year chapterwise papers, Tanenbaum Computer Networks, CLRS Algorithms photocopied binder.',
    'Books',
    'Good',
    80000,  -- ₹800
    5000,   -- ₹50
    135000, -- ₹1,350
    NOW() - INTERVAL '30 hours',
    NOW() + INTERVAL '2 days',
    'ACTIVE'
),
(
    '00000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Lenovo IdeaPad Slim 3 (AMD Ryzen 5 5500U, 16GB RAM, 512GB SSD)',
    'Senior graduating clearance. 15.6" FHD display, AMD Ryzen 5, 16GB Dual-Channel RAM, 512GB NVMe SSD. Original 65W fast charger and sleeve included.',
    'Electronics',
    'Good',
    1800000, -- ₹18,000
    50000,   -- ₹500
    2450000, -- ₹24,500
    NOW() - INTERVAL '48 hours',
    NOW() + INTERVAL '8 hours',
    'ACTIVE'
);
