-- Add FIRE calculator settings to user_preferences
alter table user_preferences
  add column fire_current_age integer default 35,
  add column fire_swr numeric default 4,
  add column fire_growth_rate numeric default 7,
  add column fire_inflation_rate numeric default 3,
  add column fire_include_cpf_srs boolean default false,
  add column fire_expense_mode text default 'tracked',
  add column fire_manual_expenses numeric default 0,
  add column fire_savings_mode text default 'manual',
  add column fire_manual_savings numeric default 0;
