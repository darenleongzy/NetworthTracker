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

export default async function AdminPage() {
  // Check if current user is admin
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch all data in parallel
  const [signupSettings, waitlistData, waitlistStats, emailData, emailStats, adFreeUsers] = await Promise.all([
    getSignupSettings(),
    getWaitlistEntries(1, 20),
    getWaitlistStats(),
    getEmailQueueEntries(1, 20),
    getEmailQueueStats(),
    getAdFreeUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Manage signup limits, waitlist, and email queue
        </p>
      </div>

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
