-- Enable RLS and allow participants (host or guest) to read their reservations
-- Run this in Supabase SQL editor once

-- Ensure RLS is enabled on reservations
alter table reservations enable row level security;
-- Optional: enforce RLS strictly
-- alter table reservations force row level security;

-- Drop and recreate read policy to avoid duplicate errors
drop policy if exists "participants can read reservation" on reservations;
create policy "participants can read reservation"
  on reservations for select
  using (auth.uid() = user_id or auth.uid() = host_id);
