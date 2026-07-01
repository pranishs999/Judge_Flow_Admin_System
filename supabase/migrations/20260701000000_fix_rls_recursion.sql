-- Fix infinite recursion in profiles_select policy
-- The old policy self-referenced profiles in a subquery, causing recursion.
-- Use auth.jwt() to read the role from the JWT app_metadata instead.

DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    status = 'APPROVED'
    OR auth.uid() = id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'ADMIN')
  );
