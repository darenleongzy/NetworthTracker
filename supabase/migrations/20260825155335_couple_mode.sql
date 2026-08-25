-- Couple Mode: invite, consent, shared dashboard, and shared goal settings.
-- Partners can view linked account values after acceptance, while all mutations
-- remain protected by the existing account-owner policies.

create type public.couple_connection_status as enum ('pending', 'connected', 'declined', 'ended');

create table public.couple_connections (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  inviter_email text not null,
  invitee_email text not null,
  status public.couple_connection_status not null default 'pending',
  goal_amount numeric not null default 0 check (goal_amount >= 0),
  goal_include_cpf boolean not null default false,
  invite_sent_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (inviter_id <> invitee_id)
);

create unique index couple_connections_pair_unique
  on public.couple_connections (least(inviter_id, invitee_id), greatest(inviter_id, invitee_id));
create index couple_connections_inviter_status_idx on public.couple_connections (inviter_id, status);
create index couple_connections_invitee_status_idx on public.couple_connections (invitee_id, status);

create trigger couple_connections_updated_at
  before update on public.couple_connections
  for each row execute function public.update_updated_at();

create table public.couple_invite_notifications (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.couple_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dismissed_at timestamptz,
  last_notified_at timestamptz not null default now(),
  resend_count integer not null default 0 check (resend_count >= 0),
  created_at timestamptz not null default now(),
  unique (connection_id, user_id)
);

create index couple_invite_notifications_user_idx
  on public.couple_invite_notifications (user_id, dismissed_at, last_notified_at desc);

alter table public.couple_connections enable row level security;
alter table public.couple_invite_notifications enable row level security;

create or replace function public.is_connected_couple(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select first_user_id <> second_user_id and exists (
    select 1
    from public.couple_connections
    where status = 'connected'
      and (
        (inviter_id = first_user_id and invitee_id = second_user_id)
        or (inviter_id = second_user_id and invitee_id = first_user_id)
      )
  );
$$;

create policy "Couple members can view their connection"
  on public.couple_connections for select
  to authenticated
  using ((select auth.uid()) in (inviter_id, invitee_id));

create policy "Users can view their own couple notifications"
  on public.couple_invite_notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can dismiss their own couple notifications"
  on public.couple_invite_notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Connected partners may read one another's account data. Existing owner-only
-- policies still exclusively control account and holding mutations.
create policy "Connected partners can view linked accounts"
  on public.accounts for select
  to authenticated
  using (public.is_connected_couple((select auth.uid()), user_id));

create policy "Connected partners can view linked cash holdings"
  on public.cash_holdings for select
  to authenticated
  using (
    exists (
      select 1 from public.accounts
      where accounts.id = cash_holdings.account_id
        and public.is_connected_couple((select auth.uid()), accounts.user_id)
    )
  );

create policy "Connected partners can view linked stock holdings"
  on public.stock_holdings for select
  to authenticated
  using (
    exists (
      select 1 from public.accounts
      where accounts.id = stock_holdings.account_id
        and public.is_connected_couple((select auth.uid()), accounts.user_id)
    )
  );

create or replace function public.create_couple_invite(target_email text)
returns table (connection_id uuid, invitee_email text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  sender_id uuid := auth.uid();
  sender_email text;
  target_id uuid;
  normalized_target_email text := lower(trim(target_email));
  created_connection_id uuid;
begin
  if sender_id is null then
    raise exception 'Not authenticated';
  end if;

  select email into sender_email from auth.users where id = sender_id;
  select id into target_id from auth.users where lower(email) = normalized_target_email;

  if target_id is null then
    raise exception 'No Track My Worth account was found for that email';
  end if;
  if target_id = sender_id then
    raise exception 'You cannot invite yourself';
  end if;

  if exists (
    select 1 from public.couple_connections
    where (inviter_id = sender_id or invitee_id = sender_id or inviter_id = target_id or invitee_id = target_id)
      and status in ('pending', 'connected')
  ) then
    raise exception 'One of you already has an active couple connection or invite';
  end if;

  insert into public.couple_connections (inviter_id, invitee_id, inviter_email, invitee_email)
  values (sender_id, target_id, coalesce(sender_email, ''), normalized_target_email)
  returning id into created_connection_id;

  insert into public.couple_invite_notifications (connection_id, user_id)
  values (created_connection_id, target_id);

  return query select created_connection_id, normalized_target_email;
end;
$$;

create or replace function public.respond_to_couple_invite(connection_id uuid, accept_invite boolean)
returns public.couple_connection_status
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status public.couple_connection_status := case when accept_invite then 'connected' else 'declined' end;
begin
  update public.couple_connections
  set status = next_status,
      accepted_at = case when accept_invite then now() else null end
  where id = connection_id
    and invitee_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'This invite is no longer available';
  end if;

  update public.couple_invite_notifications
  set dismissed_at = now()
  where couple_invite_notifications.connection_id = respond_to_couple_invite.connection_id
    and user_id = auth.uid();

  return next_status;
end;
$$;

create or replace function public.resend_couple_invite(connection_id uuid)
returns table (invitee_email text, resend_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  next_resend_count integer;
  recipient_email text;
begin
  select invitee_email into recipient_email
  from public.couple_connections
  where id = connection_id and inviter_id = auth.uid() and status = 'pending';

  if recipient_email is null then
    raise exception 'Only the sender can re-notify an active invite';
  end if;

  update public.couple_invite_notifications
  set dismissed_at = null,
      last_notified_at = now(),
      resend_count = resend_count + 1
  where couple_invite_notifications.connection_id = resend_couple_invite.connection_id
  returning couple_invite_notifications.resend_count into next_resend_count;

  update public.couple_connections set invite_sent_at = now() where id = connection_id;
  return query select recipient_email, coalesce(next_resend_count, 0);
end;
$$;

create or replace function public.update_couple_goal(
  connection_id uuid,
  next_goal_amount numeric,
  next_goal_include_cpf boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if next_goal_amount < 0 then
    raise exception 'Goal amount must be positive';
  end if;

  update public.couple_connections
  set goal_amount = next_goal_amount,
      goal_include_cpf = next_goal_include_cpf
  where id = connection_id
    and status = 'connected'
    and auth.uid() in (inviter_id, invitee_id);

  if not found then
    raise exception 'You cannot update this couple goal';
  end if;
end;
$$;

revoke all on function public.is_connected_couple(uuid, uuid) from public;
revoke all on function public.create_couple_invite(text) from public;
revoke all on function public.respond_to_couple_invite(uuid, boolean) from public;
revoke all on function public.resend_couple_invite(uuid) from public;
revoke all on function public.update_couple_goal(uuid, numeric, boolean) from public;
grant execute on function public.create_couple_invite(text) to authenticated;
grant execute on function public.respond_to_couple_invite(uuid, boolean) to authenticated;
grant execute on function public.resend_couple_invite(uuid) to authenticated;
grant execute on function public.update_couple_goal(uuid, numeric, boolean) to authenticated;
grant execute on function public.is_connected_couple(uuid, uuid) to authenticated;
