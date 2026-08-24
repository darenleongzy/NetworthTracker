create policy "Users can update own snapshots"
  on public.net_worth_snapshots
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
