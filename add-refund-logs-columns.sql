-- Ajoute des colonnes de log pour les remboursements Stripe
-- À exécuter dans Supabase (SQL Editor)

alter table public.reservations
  add column if not exists refund_amount numeric,
  add column if not exists refunded_at timestamptz,
  add column if not exists caution_released_at timestamptz;
