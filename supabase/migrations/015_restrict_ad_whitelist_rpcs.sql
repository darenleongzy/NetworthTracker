-- Explicitly revoke anonymous access for linked projects that applied migration
-- 014 before the role-level revoke was added.
revoke all on function public.admin_get_ad_free_users() from anon;
revoke all on function public.admin_set_user_ad_free_by_email(text, boolean) from anon;
