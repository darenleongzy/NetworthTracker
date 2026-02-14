-- Expenses table
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric not null,
  currency text not null default 'USD',
  category text not null,  -- 'recurring' | 'non_recurring'
  subcategory text not null,
  description text,
  expense_date date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index idx_expenses_user_id on expenses(user_id);
create index idx_expenses_user_date on expenses(user_id, expense_date);
create index idx_expenses_category on expenses(user_id, category);

-- Updated_at trigger
create trigger expenses_updated_at before update on expenses
  for each row execute function update_updated_at();

-- Row Level Security
alter table expenses enable row level security;

-- Expenses: users can only access their own
create policy "Users can view own expenses"
  on expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses"
  on expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses"
  on expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses"
  on expenses for delete using (auth.uid() = user_id);
