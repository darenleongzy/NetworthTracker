import { createClient } from "@/lib/supabase/server";
import { DashboardAdUnit } from "@/components/dashboard-ad-unit";

export async function DashboardAd() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fail closed so a whitelist lookup problem never causes an ad to render.
  const { data: adFreeRecord, error: adFreeError } = await supabase
    .from("ad_free_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adFreeError || adFreeRecord) {
    return null;
  }

  return <DashboardAdUnit />;
}
