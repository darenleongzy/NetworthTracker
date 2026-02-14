"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Wallet,
  LogOut,
  Menu,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
];

function NavContent({
  userEmail,
  pathname,
  onSignOut,
  isDarkSidebar = false,
}: {
  userEmail: string;
  pathname: string;
  onSignOut: () => void;
  isDarkSidebar?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <TrendingUp className={cn("h-6 w-6", isDarkSidebar && "text-sidebar-primary")} />
        <span className="text-lg font-bold">NetWorth</span>
      </div>
      <div className={cn("h-px", isDarkSidebar ? "bg-sidebar-border" : "bg-border")} />
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={cn(
                "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isDarkSidebar
                  ? pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  : pathname === item.href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </button>
          </Link>
        ))}
      </nav>
      <div className={cn("h-px", isDarkSidebar ? "bg-sidebar-border" : "bg-border")} />
      <div className="p-4 space-y-2">
        <p className={cn("text-xs truncate", isDarkSidebar ? "text-sidebar-foreground/60" : "text-muted-foreground")}>
          {userEmail}
        </p>
        <button
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isDarkSidebar
              ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              : "text-foreground hover:bg-secondary"
          )}
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function DashboardNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-2 border-b bg-background px-4 py-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent
              userEmail={userEmail}
              pathname={pathname}
              onSignOut={handleSignOut}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <span className="font-bold">NetWorth</span>
        </div>
      </div>
      <div className="lg:hidden h-14" /> {/* Spacer for fixed mobile nav */}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <NavContent
          userEmail={userEmail}
          pathname={pathname}
          onSignOut={handleSignOut}
          isDarkSidebar
        />
      </aside>
    </>
  );
}
