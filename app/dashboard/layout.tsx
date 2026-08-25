import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { CoupleInviteNotifier } from "@/components/couple-invite-notifier";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { NavProgress } from "@/components/nav-progress";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <NavProgress />
      <CoupleInviteNotifier />
      <Suspense fallback={<DashboardNav userEmail="" />}>
        <DashboardNavigation />
      </Suspense>
      <main className="app-workspace flex-1 overflow-auto p-4 pt-[4.5rem] sm:p-5 sm:pt-6 lg:p-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
