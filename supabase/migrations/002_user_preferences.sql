-- User preferences table for base currency
create table user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  base_currency text not null default 'USD',
  updated_at timestamptz default now() not null
);

-- Exchange rates cache
create table exchange_rates (
  base_currency text not null,
  target_currency text not null,
  rate numeric not null,
  fetched_at timestamptz default now() not null,
  primary key (base_currency, target_currency)
);

-- Indexes
create index idx_exchange_rates_base on exchange_rates(base_currency);

-- Updated_at trigger
create trigger user_preferences_updated_at before update on user_preferences
  for each row execute function update_updated_at();

-- Row Level Security
alter table user_preferences enable row level security;
alter table exchange_rates enable row level security;

-- User preferences: users can only access their own
create policy "Users can view own preferences"
  on user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences"
  on user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences"
  on user_preferences for update using (auth.uid() = user_id);

-- Exchange rates: readable/writable by all authenticated users (shared cache)
create policy "Authenticated users can view exchange rates"
  on exchange_rates for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert exchange rates"
  on exchange_rates for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update exchange rates"
  on exchange_rates for update using (auth.role() = 'authenticated');
