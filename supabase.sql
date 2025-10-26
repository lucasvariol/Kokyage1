-- This SQL script sets up the database schema and row‑level security policies
-- for the Kokyage application when using Supabase. You need to run this
-- script once in the Supabase SQL editor after creating your project.

-- Enable pgcrypto extension for UUID generation (if not already enabled)
create extension if not exists pgcrypto;

-- Table to store additional profile information for each user
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamp with time zone default now()
);

-- Allow users to manage their own profile rows
alter table profiles enable row level security;
create policy "Allow authenticated read own profile" on profiles
  for select using (auth.uid() = id);
create policy "Allow user to insert own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "Allow user to update own profile" on profiles
  for update using (auth.uid() = id);

-- Table to store property listings
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  city text not null,
  address text not null,
  price_per_night numeric not null,
  created_at timestamp with time zone default now(),
  nb_voyageurs integer
);

-- Ensure status column exists to track listing lifecycle
alter table listings add column if not exists status text;

-- Enable RLS on listings
alter table listings enable row level security;

-- Anyone can read listings
create policy "Public read listings" on listings
  for select using (true);

-- Only owners can insert listings (owner_id must be current user)
create policy "Only owner can insert listing" on listings
  for insert with check (auth.uid() = owner_id);

-- Only owners can update or delete their listings
create policy "Only owner can update listing" on listings
  for update using (auth.uid() = owner_id);
create policy "Only owner can delete listing" on listings
  for delete using (auth.uid() = owner_id);

-- Optional: store property owner's email for validation workflow
alter table listings add column if not exists owner_email text;

-- FR columns requested: email_proprietaire and id_proprietaire
alter table listings add column if not exists email_proprietaire text;
alter table listings add column if not exists id_proprietaire uuid;

-- Table to store bookings made by users
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  total numeric not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS on bookings
alter table bookings enable row level security;

-- Users can read their own bookings and owners can read bookings for their listings
create policy "User and owner can read booking" on bookings
  for select using (
    auth.uid() = user_id
    or auth.uid() = (select owner_id from listings where id = listing_id)
  );

-- Users can insert bookings for listings they don't own
create policy "User can book listings they don't own" on bookings
  for insert with check (
    auth.uid() = user_id
    and auth.uid() <> (select owner_id from listings where id = listing_id)
  );

-- Users can delete their own bookings
create policy "User can delete own booking" on bookings
  for delete using (auth.uid() = user_id);

-- Table to store temporary tokens for owner verification
create table if not exists pending_owner_verification (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  listing_id uuid not null references listings(id) on delete cascade,
  token text not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS on pending_owner_verification
alter table pending_owner_verification enable row level security;

-- Only system can manage these tokens (no user access needed)
create policy "System only access" on pending_owner_verification
  for all using (false);