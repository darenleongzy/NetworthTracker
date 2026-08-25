import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { NavProgress } from "@/components/nav-progress";

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

  return (
    <div className="flex min-h-screen bg-background">
      <NavProgress />
      <DashboardNav userEmail={user.email ?? ""} isAdmin={isAdmin} />
      <main className="app-workspace flex-1 overflow-auto p-5 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
