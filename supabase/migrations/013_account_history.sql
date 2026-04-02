create table account_history_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  event_label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table account_value_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  account_type account_type not null,
  total_value numeric not null,
  currency text not null default 'USD',
  snapshot_date date not null,
  created_at timestamptz default now() not null,
  unique(account_id, snapshot_date)
);

create index idx_account_history_events_user_created
  on account_history_events(user_id, created_at desc);
create index idx_account_history_events_account_created
  on account_history_events(account_id, created_at desc);
create index idx_account_value_snapshots_user_date
  on account_value_snapshots(user_id, snapshot_date);
create index idx_account_value_snapshots_account_date
  on account_value_snapshots(account_id, snapshot_date);

alter table account_history_events enable row level security;
alter table account_value_snapshots enable row level security;

create policy "Users can view own account history events"
  on account_history_events for select using (auth.uid() = user_id);
create policy "Users can insert own account history events"
  on account_history_events for insert with check (auth.uid() = user_id);

create policy "Users can view own account value snapshots"
  on account_value_snapshots for select using (auth.uid() = user_id);
create policy "Users can insert own account value snapshots"
  on account_value_snapshots for insert with check (auth.uid() = user_id);
create policy "Users can update own account value snapshots"
  on account_value_snapshots for update using (auth.uid() = user_id);
