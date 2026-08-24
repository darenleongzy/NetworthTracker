-- Ad-free users are managed by admins and checked server-side before ads render.
create table public.ad_free_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.ad_free_users enable row level security;

-- A signed-in user may only check whether their own account is exempt.
create policy "Users can view their own ad-free status"
  on public.ad_free_users for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Resolve the email only inside a tightly scoped admin function. auth.users is
-- not exposed through the public API, so this avoids duplicating email data.
create or replace function public.admin_get_ad_free_users()
returns table (user_id uuid, email text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  return query
  select exempt_user.id, exempt_user.email, whitelist.created_at
  from public.ad_free_users as whitelist
  join auth.users as exempt_user on exempt_user.id = whitelist.user_id
  order by whitelist.created_at desc;
end;
$$;

create or replace function public.admin_set_user_ad_free_by_email(
  target_email text,
  ad_free boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if not exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  select id into target_user_id
  from auth.users
  where lower(email) = lower(trim(target_email));

  if target_user_id is null then
    raise exception 'No account found for that email address';
  end if;

  if ad_free then
    insert into public.ad_free_users (user_id, created_by)
    values (target_user_id, auth.uid())
    on conflict (user_id) do nothing;
  else
    delete from public.ad_free_users where user_id = target_user_id;
  end if;
end;
$$;

revoke all on function public.admin_get_ad_free_users() from public;
revoke all on function public.admin_set_user_ad_free_by_email(text, boolean) from public;
revoke all on function public.admin_get_ad_free_users() from anon;
revoke all on function public.admin_set_user_ad_free_by_email(text, boolean) from anon;
grant execute on function public.admin_get_ad_free_users() to authenticated;
grant execute on function public.admin_set_user_ad_free_by_email(text, boolean) to authenticated;
