-- CampusBIT student authentication and administrator approval

CREATE TABLE IF NOT EXISTS public.student_auth_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  approved_email_domain TEXT NOT NULL CHECK (approved_email_domain = lower(approved_email_domain))
);
INSERT INTO public.student_auth_config (id, approved_email_domain)
VALUES (TRUE, 'bit.edu')
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.student_auth_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS college_email TEXT,
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS academic_year TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD CONSTRAINT profiles_approval_status_check
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_college_email_unique
  ON profiles (lower(college_email))
  WHERE college_email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_unique
  ON profiles (lower(student_id))
  WHERE student_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_student_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(split_part(NEW.email, '@', 2)) <> (
    SELECT approved_email_domain FROM public.student_auth_config WHERE id = TRUE
  ) THEN
    RAISE EXCEPTION 'Registration is restricted to the approved college email domain';
  END IF;

  INSERT INTO public.profiles (
    id, display_name, pseudonym, college_email, student_id, campus_domain,
    department, academic_year, approval_status
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1)),
    lower(NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'student_id', ''),
    (SELECT approved_email_domain FROM public.student_auth_config WHERE id = TRUE),
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    NULLIF(NEW.raw_user_meta_data->>'academic_year', ''),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_student_profile();

CREATE OR REPLACE FUNCTION public.prevent_student_privilege_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id <> OLD.id
     OR NEW.campus_domain <> OLD.campus_domain
     OR NEW.approval_status <> OLD.approval_status
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Only administrators can change student approval fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_student_privilege_fields ON profiles;
CREATE TRIGGER protect_student_privilege_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_student_privilege_changes();

CREATE OR REPLACE FUNCTION public.is_eligible_student(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE u.id = p_user_id
      AND lower(split_part(u.email, '@', 2)) = (
        SELECT approved_email_domain FROM public.student_auth_config WHERE id = TRUE
      )
      AND u.email_confirmed_at IS NOT NULL
      AND p.approval_status = 'approved'
  );
$$;

DROP POLICY IF EXISTS "Public profiles are viewable by all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Students can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Students can update permitted profile fields"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Sellers can create auctions" ON auctions;
DROP POLICY IF EXISTS "Sellers can update their own draft or active auctions" ON auctions;
CREATE POLICY "Approved students can create auctions"
  ON auctions FOR INSERT WITH CHECK (public.is_eligible_student() AND auth.uid() = seller_id);
CREATE POLICY "Approved sellers can update their own auctions"
  ON auctions FOR UPDATE USING (public.is_eligible_student() AND auth.uid() = seller_id);

DROP POLICY IF EXISTS "Authenticated users can ask questions" ON questions;
CREATE POLICY "Approved students can ask questions"
  ON questions FOR INSERT WITH CHECK (public.is_eligible_student() AND auth.uid() = asker_id);

DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can add to their watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can remove from their watchlist" ON watchlist;
CREATE POLICY "Approved students can view their own watchlist"
  ON watchlist FOR SELECT USING (public.is_eligible_student() AND auth.uid() = user_id);
CREATE POLICY "Approved students can add to their watchlist"
  ON watchlist FOR INSERT WITH CHECK (public.is_eligible_student() AND auth.uid() = user_id);
CREATE POLICY "Approved students can remove from their watchlist"
  ON watchlist FOR DELETE USING (public.is_eligible_student() AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage their own saved searches" ON saved_searches;
CREATE POLICY "Approved students manage their own saved searches"
  ON saved_searches FOR ALL USING (public.is_eligible_student() AND auth.uid() = user_id)
  WITH CHECK (public.is_eligible_student() AND auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.reject_untrusted_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> NEW.bidder_id OR NOT public.is_eligible_student(NEW.bidder_id) THEN
    RAISE EXCEPTION 'Only an approved, verified student can place bids';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_verified_bidder ON bids;
CREATE TRIGGER enforce_verified_bidder
  BEFORE INSERT ON bids
  FOR EACH ROW EXECUTE FUNCTION public.reject_untrusted_bid();
