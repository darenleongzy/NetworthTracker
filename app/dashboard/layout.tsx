import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { NavProgress } from "@/components/nav-progress";
import { DashboardAd } from "@/components/dashboard-ad";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user is admin
  const { data: adminRecord } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const isAdmin = !!adminRecord;

  // Fail closed: a missing migration or lookup failure must never override a
  // user's ad-free status.
  const { data: adFreeRecord, error: adFreeError } = await supabase
    .from("ad_free_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const showDashboardAd = !adFreeError && !adFreeRecord;

  return (
    <div className="flex min-h-screen bg-background">
      <NavProgress />
      <DashboardNav userEmail={user.email ?? ""} isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto bg-background p-6 pt-20 lg:p-8 lg:pt-8">
        {children}
        <DashboardAd show={showDashboardAd} />
      </main>
    </div>
  );
}
