-- ============================================================
-- HMS MASTER PROFILE SYNCHRONIZATION FIX
-- ============================================================
-- Directions: Copy the ENTIRE script below and run it in your 
-- Supabase SQL Editor (Dashboard > SQL Editor > New Query).
-- ============================================================

-- 1. DROP AND REPREPARE ROLE CONSTRAINT
-- This ensures the 'staff' role is recognized by the database.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin','doctor','nurse','receptionist','pharmacy','laboratory','accounts','staff'));

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- Ensures doctors and staff can read their own profiles.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. INSERT/REPAIR STAFF PROFILES
-- This logic looks at every user in your Auth system and 
-- ensures they have a valid entry in the profiles table.
INSERT INTO public.profiles (user_id, full_name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data ->> 'full_name', email),
  COALESCE(raw_user_meta_data ->> 'role', 'staff')
FROM auth.users
ON CONFLICT (user_id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 4. VERIFY ADMIN PERSISTENCE
-- Specifically ensures admin123@gmail.com is set to 'admin' role if it exists.
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin123@gmail.com');

-- 5. RELAX INSERT POLICIES
-- Allows the app to auto-create profiles if they are missing.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR public.get_my_role() = 'admin');
