-- Update the listing_ratings view to only include published reviews
-- Run this SQL in your Supabase SQL Editor

CREATE OR REPLACE VIEW public.listing_ratings AS
SELECT 
  listing_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM public.reviews
WHERE is_published = TRUE
GROUP BY listing_id;
