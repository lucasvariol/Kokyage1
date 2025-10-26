-- Table pour stocker les messages entre hosts et guests
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Index pour améliorer les performances
create index if not exists messages_reservation_id_idx on messages(reservation_id);
create index if not exists messages_sender_id_idx on messages(sender_id);
create index if not exists messages_receiver_id_idx on messages(receiver_id);
create index if not exists messages_created_at_idx on messages(created_at desc);

-- Enable RLS
alter table messages enable row level security;

-- Policy: Les utilisateurs peuvent lire les messages où ils sont sender ou receiver
create policy "Users can read their own messages" on messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Policy: Les utilisateurs peuvent insérer des messages où ils sont le sender
create policy "Users can send messages" on messages
  for insert with check (auth.uid() = sender_id);

-- Policy: Les utilisateurs peuvent update (marquer comme lu) les messages dont ils sont receiver
create policy "Users can update received messages" on messages
  for update using (auth.uid() = receiver_id);
