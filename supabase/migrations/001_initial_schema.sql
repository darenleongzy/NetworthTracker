-- Create custom types
create type account_type as enum ('cash', 'investment');

-- Accounts table
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type account_type not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Cash holdings
create table cash_holdings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade not null,
  balance numeric not null default 0,
  currency text not null default 'USD',
  updated_at timestamptz default now() not null
);

-- Stock holdings
create table stock_holdings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade not null,
  ticker text not null,
  shares numeric not null default 0,
  cost_basis_per_share numeric not null default 0,
  updated_at timestamptz default now() not null
);

-- Stock price cache
create table stock_prices (
  ticker text primary key,
  price numeric not null,
  fetched_at timestamptz default now() not null
);

-- Net worth snapshots
create table net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  total_value numeric not null,
  cash_value numeric not null,
  investment_value numeric not null,
  snapshot_date date not null,
  created_at timestamptz default now() not null,
  unique(user_id, snapshot_date)
);

-- Indexes
create index idx_accounts_user_id on accounts(user_id);
create index idx_cash_holdings_account_id on cash_holdings(account_id);
create index idx_stock_holdings_account_id on stock_holdings(account_id);
create index idx_snapshots_user_date on net_worth_snapshots(user_id, snapshot_date);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger accounts_updated_at before update on accounts
  for each row execute function update_updated_at();
create trigger cash_holdings_updated_at before update on cash_holdings
  for each row execute function update_updated_at();
create trigger stock_holdings_updated_at before update on stock_holdings
  for each row execute function update_updated_at();

-- Row Level Security
alter table accounts enable row level security;
alter table cash_holdings enable row level security;
alter table stock_holdings enable row level security;
alter table stock_prices enable row level security;
alter table net_worth_snapshots enable row level security;

-- Accounts: users can only access their own
create policy "Users can view own accounts"
  on accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts"
  on accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts"
  on accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts"
  on accounts for delete using (auth.uid() = user_id);

-- Cash holdings: via account ownership
create policy "Users can view own cash holdings"
  on cash_holdings for select using (
    account_id in (select id from accounts where user_id = auth.uid())
  );
create policy "Users can insert own cash holdings"
  on cash_holdings for insert with check (
    account_id in (select id from accounts where user_id = auth.uid())
  );
create policy "Users can update own cash holdings"
  on cash_holdings for update using (
    account_id in (select id from accounts where user_id = auth.uid())
  );
create policy "Users can delete own cash holdings"
  on cash_holdings for delete using (
    account_id in (select id from accounts where user_id = auth.uid())
  );

-- Stock holdings: via account ownership
create policy "Users can view own stock holdings"
  on stock_holdings for select using (
    account_id in (select id from accounts where user_id = auth.uid())
  );
create policy "Users can insert own stock holdings"
  on stock_holdings for insert with check (
    account_id in (select id from accounts where user_id = auth.uid())
  );
create policy "Users can update own stock holdings"
  on stock_holdings for update using (
    account_id in (select id from accounts where user_id = auth.uid())
  );
create policy "Users can delete own stock holdings"
  on stock_holdings for delete using (
    account_id in (select id from accounts where user_id = auth.uid())
  );

-- Stock prices: readable by all authenticated users
create policy "Authenticated users can view stock prices"
  on stock_prices for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert stock prices"
  on stock_prices for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update stock prices"
  on stock_prices for update using (auth.role() = 'authenticated');

-- Net worth snapshots: users can only access their own
create policy "Users can view own snapshots"
  on net_worth_snapshots for select using (auth.uid() = user_id);
create policy "Users can insert own snapshots"
  on net_worth_snapshots for insert with check (auth.uid() = user_id);
