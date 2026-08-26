-- Couple operations are authenticated-only. Their function bodies also check
-- auth.uid(), but revoking anon execution prevents public RPC probing.
revoke all on function public.is_connected_couple(uuid, uuid) from anon;
revoke all on function public.create_couple_invite(text) from anon;
revoke all on function public.respond_to_couple_invite(uuid, boolean) from anon;
revoke all on function public.resend_couple_invite(uuid) from anon;
revoke all on function public.update_couple_goal(uuid, numeric, boolean) from anon;
