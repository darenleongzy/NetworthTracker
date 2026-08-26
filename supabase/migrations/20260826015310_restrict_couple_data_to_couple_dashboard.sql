-- Couple accounts must not appear in the standard account, expense, FIRE, or
-- dashboard queries. Remove the broad read policies and expose partner data
-- only through a purpose-built function used by Couple Mode.
drop policy if exists "Connected partners can view linked accounts" on public.accounts;
drop policy if exists "Connected partners can view linked cash holdings" on public.cash_holdings;
drop policy if exists "Connected partners can view linked stock holdings" on public.stock_holdings;

-- Be explicit about both the existing row and the replacement row for updates.
-- This prevents an owner from changing an account or holding to another user.
alter policy "Users can update own accounts" on public.accounts
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can update own cash holdings" on public.cash_holdings
  using (
    account_id in (select id from public.accounts where user_id = (select auth.uid()))
  )
  with check (
    account_id in (select id from public.accounts where user_id = (select auth.uid()))
  );

alter policy "Users can update own stock holdings" on public.stock_holdings
  using (
    account_id in (select id from public.accounts where user_id = (select auth.uid()))
  )
  with check (
    account_id in (select id from public.accounts where user_id = (select auth.uid()))
  );

create or replace function public.get_connected_partner_account_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', account.id,
        'user_id', account.user_id,
        'name', account.name,
        'type', account.type,
        'created_at', account.created_at,
        'updated_at', account.updated_at,
        'cash_holdings', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', cash_holding.id,
                'account_id', cash_holding.account_id,
                'balance', cash_holding.balance,
                'currency', cash_holding.currency,
                'label', cash_holding.label,
                'updated_at', cash_holding.updated_at
              )
              order by cash_holding.updated_at
            )
            from public.cash_holdings as cash_holding
            where cash_holding.account_id = account.id
          ),
          '[]'::jsonb
        ),
        'stock_holdings', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', stock_holding.id,
                'account_id', stock_holding.account_id,
                'ticker', stock_holding.ticker,
                'shares', stock_holding.shares,
                'cost_basis_per_share', stock_holding.cost_basis_per_share,
                'updated_at', stock_holding.updated_at
              )
              order by stock_holding.updated_at
            )
            from public.stock_holdings as stock_holding
            where stock_holding.account_id = account.id
          ),
          '[]'::jsonb
        )
      )
      order by account.created_at
    ),
    '[]'::jsonb
  )
  from public.accounts as account
  where public.is_connected_couple((select auth.uid()), account.user_id);
$$;

revoke all on function public.get_connected_partner_account_data() from public;
revoke all on function public.get_connected_partner_account_data() from anon;
grant execute on function public.get_connected_partner_account_data() to authenticated;
