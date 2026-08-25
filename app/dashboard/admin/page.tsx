import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignupSettingsPanel } from "@/components/admin/signup-settings";
import { WaitlistTable } from "@/components/admin/waitlist-table";
import { EmailQueue } from "@/components/admin/email-queue";
import { AdWhitelist } from "@/components/admin/ad-whitelist";
import {
  isCurrentUserAdmin,
  getSignupSettings,
  getWaitlistEntries,
  getWaitlistStats,
  getEmailQueueEntries,
  getEmailQueueStats,
  getAdFreeUsers,
} from "@/lib/admin-actions";
import { Settings, Users, Mail, BadgeDollarSign } from "lucide-react";

const DEFAULT_SIGNUP_SETTINGS = {
  signup_enabled: true,
  signup_limit: 100,
  current_signup_count: 0,
  remaining_slots: 100,
};

export default async function AdminPage() {
  // Check if current user is admin
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Each panel is independent. A missing optional admin feature must not make
  // the whole admin workspace unavailable.
  const results = await Promise.allSettled([
    getSignupSettings(),
    getWaitlistEntries(1, 20),
    getWaitlistStats(),
    getEmailQueueEntries(1, 20),
    getEmailQueueStats(),
    getAdFreeUsers(),
  ]);
  const failures: string[] = [];
  const getResult = <T,>(result: PromiseSettledResult<T>, fallback: T, source: string) => {
    if (result.status === "fulfilled") return result.value;

    failures.push(source);
    console.error(
      JSON.stringify({
        level: "error",
        message: "admin_panel_data_load_failed",
        source,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })
    );
    return fallback;
  };

  const signupSettings = getResult(results[0], DEFAULT_SIGNUP_SETTINGS, "signup settings");
  const waitlistData = getResult(results[1], { entries: [], total: 0 }, "waitlist entries");
  const waitlistStats = getResult(
    results[2],
    { pending: 0, invited: 0, signed_up: 0, total: 0 },
    "waitlist statistics"
  );
  const emailData = getResult(results[3], { entries: [], total: 0 }, "email queue");
  const emailStats = getResult(results[4], { pending: 0, sent: 0, failed: 0 }, "email statistics");
  const adFreeUsers = getResult(results[5], [], "ad-free users");

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Manage signup limits, waitlist, and email queue
        </p>
      </div>

      {failures.length > 0 ? (
        <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Some admin data is temporarily unavailable ({failures.join(", ")}). Other controls are still available.
        </div>
      ) : null}

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Signup Settings
          </TabsTrigger>
          <TabsTrigger value="waitlist">
            <Users className="mr-2 h-4 w-4" />
            Waitlist
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="mr-2 h-4 w-4" />
            Email Queue
          </TabsTrigger>
          <TabsTrigger value="ads">
            <BadgeDollarSign className="mr-2 h-4 w-4" />
            Ads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <SignupSettingsPanel initialSettings={signupSettings} />
        </TabsContent>

        <TabsContent value="waitlist">
          <WaitlistTable
            initialEntries={waitlistData.entries}
            initialStats={waitlistStats}
            totalCount={waitlistData.total}
          />
        </TabsContent>

        <TabsContent value="emails">
          <EmailQueue
            initialEntries={emailData.entries}
            initialStats={emailStats}
            totalCount={emailData.total}
          />
        </TabsContent>

        <TabsContent value="ads">
          <AdWhitelist initialUsers={adFreeUsers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
