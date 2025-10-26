-- Allow participants of a reservation to read the other participant's profile name
-- Run in Supabase SQL editor once

-- Ensure RLS is enabled on profiles (should already be the case)
alter table profiles enable row level security;

-- Existing policy likely restricts to auth.uid() = id; we add a complementary policy
-- that allows reading the other user's profile when there is a reservation linking them.

drop policy if exists "participants can read other profile name" on profiles;
create policy "participants can read other profile name"
  on profiles for select
  using (
    auth.uid() = id
    OR exists (
      select 1 from reservations r
      where (
        (r.user_id = auth.uid() and r.host_id = profiles.id)
        or (r.host_id = auth.uid() and r.user_id = profiles.id)
      )
    )
  );
