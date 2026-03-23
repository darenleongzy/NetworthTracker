create table cpf_account_settings (
  account_id uuid primary key references accounts(id) on delete cascade not null,
  current_age integer not null default 35 check (current_age between 18 and 100),
  monthly_salary numeric not null default 0 check (monthly_salary >= 0),
  oa_interest_rate numeric not null default 2.5 check (oa_interest_rate >= 0),
  sa_interest_rate numeric not null default 4 check (sa_interest_rate >= 0),
  ma_interest_rate numeric not null default 4 check (ma_interest_rate >= 0),
  frs_met_for_ma_overflow boolean not null default false,
  mortgage_monthly_deduction numeric not null default 0 check (mortgage_monthly_deduction >= 0),
  mortgage_payoff_age integer check (mortgage_payoff_age between 18 and 100),
  early_retirement_age integer not null default 55 check (early_retirement_age between 18 and 100),
  updated_at timestamptz default now() not null
);

create trigger cpf_account_settings_updated_at before update on cpf_account_settings
  for each row execute function update_updated_at();

alter table cpf_account_settings enable row level security;

create policy "Users can view own cpf account settings"
  on cpf_account_settings for select using (
    account_id in (select id from accounts where user_id = auth.uid())
  );

create policy "Users can insert own cpf account settings"
  on cpf_account_settings for insert with check (
    account_id in (select id from accounts where user_id = auth.uid())
  );

create policy "Users can update own cpf account settings"
  on cpf_account_settings for update using (
    account_id in (select id from accounts where user_id = auth.uid())
  );
