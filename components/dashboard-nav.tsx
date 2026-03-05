"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Wallet,
  LogOut,
  Menu,
  TrendingUp,
  Receipt,
  Flame,
  Shield,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/fire", label: "FIRE", icon: Flame },
];

const adminNavItem = { href: "/dashboard/admin", label: "Admin", icon: Shield };

function NavContent({
  userEmail,
  pathname,
  onSignOut,
  onNavigate,
  isDarkSidebar = false,
  isAdmin = false,
}: {
  userEmail: string;
  pathname: string;
  onSignOut: () => void;
  onNavigate?: () => void;
  isDarkSidebar?: boolean;
  isAdmin?: boolean;
}) {
  const allNavItems = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4 shrink-0">
        <TrendingUp className={cn("h-6 w-6", isDarkSidebar && "text-sidebar-primary")} />
        <span className="text-lg font-bold">NetWorth</span>
      </div>
      <div className={cn("h-px shrink-0", isDarkSidebar ? "bg-sidebar-border" : "bg-border")} />
      <nav className="flex-1 overflow-y-auto space-y-1 px-2 py-4">
        {allNavItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
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
      <div className={cn("h-px shrink-0", isDarkSidebar ? "bg-sidebar-border" : "bg-border")} />
      <div className="p-4 space-y-2 shrink-0">
        <p className={cn("text-xs truncate", isDarkSidebar ? "text-sidebar-foreground/60" : "text-muted-foreground")}>
          {userEmail}
        </p>
        <a
          href="https://buymeacoffee.com/dalezy"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isDarkSidebar
              ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              : "text-foreground hover:bg-secondary"
          )}
        >
          <Coffee className="mr-2 h-4 w-4" />
          Buy me a coffee
        </a>
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

export function DashboardNav({ userEmail, isAdmin = false }: { userEmail: string; isAdmin?: boolean }) {
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
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <NavContent
              userEmail={userEmail}
              pathname={pathname}
              onSignOut={handleSignOut}
              onNavigate={() => setMobileOpen(false)}
              isAdmin={isAdmin}
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
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <NavContent
          userEmail={userEmail}
          pathname={pathname}
          onSignOut={handleSignOut}
          isDarkSidebar
          isAdmin={isAdmin}
        />
      </aside>
    </>
  );
}
