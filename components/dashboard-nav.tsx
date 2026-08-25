"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
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
  Receipt,
  Flame,
  Heart,
  Shield,
  Coffee,
  FileText,
  ScrollText,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/fire", label: "FIRE", icon: Flame },
  { href: "/dashboard/couple", label: "Couple", icon: Heart },
];

const adminNavItem = { href: "/dashboard/admin", label: "Admin", icon: Shield };

type Theme = "light" | "dark";

const THEME_CHANGE_EVENT = "track-my-worth-theme-change";

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function NavContent({
  userEmail,
  pathname,
  onSignOut,
  onNavigate,
  theme,
  onThemeChange,
  isDarkSidebar = false,
  isAdmin = false,
}: {
  userEmail: string;
  pathname: string;
  onSignOut: () => void;
  onNavigate?: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  isDarkSidebar?: boolean;
  isAdmin?: boolean;
}) {
  const allNavItems = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4 shrink-0">
        <Image src="/track-my-worth-mark.svg" alt="" width={28} height={28} priority />
        <span className="text-lg font-bold">Track My Worth</span>
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
        <div
          className={cn(
            "mb-3 rounded-xl border p-2.5",
            isDarkSidebar ? "border-sidebar-border bg-sidebar-accent/45" : "border-border bg-muted/50"
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-3.5 w-3.5 text-sidebar-primary" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-sidebar-primary" />
            )}
            <span className={cn("text-xs font-semibold", isDarkSidebar ? "text-sidebar-foreground" : "text-foreground")}>
              Appearance
            </span>
          </div>
          <div className="grid grid-cols-2 rounded-lg bg-black/10 p-0.5" aria-label="Color theme">
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={theme === option}
                onClick={() => onThemeChange(option)}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold capitalize transition-all",
                  theme === option
                    ? isDarkSidebar
                      ? "bg-sidebar text-sidebar-foreground shadow-sm"
                      : "bg-background text-foreground shadow-sm"
                    : isDarkSidebar
                      ? "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option === "light" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                {option}
              </button>
            ))}
          </div>
        </div>
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
        <Link
          href="/privacy"
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isDarkSidebar
              ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              : "text-foreground hover:bg-secondary"
          )}
          onClick={onNavigate}
        >
          <FileText className="mr-2 h-4 w-4" />
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isDarkSidebar
              ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              : "text-foreground hover:bg-secondary"
          )}
          onClick={onNavigate}
        >
          <ScrollText className="mr-2 h-4 w-4" />
          Terms of Service
        </Link>
        <Link
          href="/delete-account"
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isDarkSidebar
              ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              : "text-foreground hover:bg-secondary"
          )}
          onClick={onNavigate}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Link>
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
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function handleThemeChange(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem("track-my-worth-theme", nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

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
              theme={theme}
              onThemeChange={handleThemeChange}
              isAdmin={isAdmin}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Image src="/track-my-worth-mark.svg" alt="" width={24} height={24} priority />
          <span className="font-bold">Track My Worth</span>
        </div>
      </div>
      <div className="lg:hidden h-14" /> {/* Spacer for fixed mobile nav */}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <NavContent
          userEmail={userEmail}
          pathname={pathname}
          onSignOut={handleSignOut}
          theme={theme}
          onThemeChange={handleThemeChange}
          isDarkSidebar
          isAdmin={isAdmin}
        />
      </aside>
    </>
  );
}
