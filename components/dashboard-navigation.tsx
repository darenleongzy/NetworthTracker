import { DashboardNav } from "@/components/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

// This boundary lets the page skeleton stream while the optional navigation
// details are resolved. Route protection remains in the Supabase middleware.
export async function DashboardNavigation() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    return <DashboardNav userEmail="" />;
  }

  const { data: adminRecord } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", claims.sub)
    .maybeSingle();

  return <DashboardNav userEmail={claims.email ?? ""} isAdmin={Boolean(adminRecord)} />;
}
