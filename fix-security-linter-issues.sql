-- Fix Supabase Security Linter Issues
-- 1. Remove SECURITY DEFINER from listing_ratings view
-- 2. Enable RLS on disponibilities table

-- ============================================================
-- 1. Fix Security Definer View (listing_ratings)
-- ============================================================

-- Drop the existing view completely to remove SECURITY DEFINER
DROP VIEW IF EXISTS public.listing_ratings CASCADE;

-- Recreate the view with explicit SECURITY INVOKER (default, but we specify it explicitly)
CREATE VIEW public.listing_ratings 
WITH (security_invoker = true) AS
SELECT 
  listing_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM public.reviews
WHERE is_published = TRUE
GROUP BY listing_id;

-- Grant access to the view
GRANT SELECT ON public.listing_ratings TO anon, authenticated;

-- ============================================================
-- 2. Enable RLS on disponibilities table
-- ============================================================

-- Enable Row Level Security
ALTER TABLE public.disponibilities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view disponibilities (public data for checking availability)
CREATE POLICY "Anyone can view disponibilities"
  ON public.disponibilities
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Only listing owners can insert their own listing's disponibilities
CREATE POLICY "Owners can insert their listing disponibilities"
  ON public.disponibilities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    listing_id IN (
      SELECT id FROM public.listings 
      WHERE owner_id = auth.uid()
    )
  );

-- Policy: Only listing owners can update their own listing's disponibilities
CREATE POLICY "Owners can update their listing disponibilities"
  ON public.disponibilities
  FOR UPDATE
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM public.listings 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT id FROM public.listings 
      WHERE owner_id = auth.uid()
    )
  );

-- Policy: Only listing owners can delete their own listing's disponibilities
CREATE POLICY "Owners can delete their listing disponibilities"
  ON public.disponibilities
  FOR DELETE
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM public.listings 
      WHERE owner_id = auth.uid()
    )
  );

-- Policy: System can manage disponibilities for reservations (via service role)
-- This is handled automatically by service role key which bypasses RLS

-- ============================================================
-- Verification Queries
-- ============================================================

-- Check if RLS is enabled on disponibilities
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'disponibilities';

-- List all policies on disponibilities
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'disponibilities';

-- Check listing_ratings view definition
SELECT definition 
FROM pg_views 
WHERE viewname = 'listing_ratings';
