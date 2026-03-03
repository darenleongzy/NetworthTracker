"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateSignupSettings } from "@/lib/admin-actions";
import type { SignupSettings } from "@/lib/admin-actions";

interface SignupSettingsProps {
  initialSettings: SignupSettings;
}

export function SignupSettingsPanel({ initialSettings }: SignupSettingsProps) {
  const [enabled, setEnabled] = useState(initialSettings.signup_enabled);
  const [limit, setLimit] = useState(initialSettings.signup_limit);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateSignupSettings(enabled, limit);
        toast.success("Settings updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update settings");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Signup Control</CardTitle>
          <CardDescription>
            Control whether new users can sign up for the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="signup-enabled">Signups Enabled</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, new users will only be able to join the waitlist
              </p>
            </div>
            <Switch
              id="signup-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-limit">Signup Limit</Label>
            <div className="flex items-center gap-4">
              <Input
                id="signup-limit"
                type="number"
                min={0}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                Maximum number of signups allowed
              </span>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Current Signups</p>
              <p className="text-2xl font-bold">{initialSettings.current_signup_count}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Signup Limit</p>
              <p className="text-2xl font-bold">{initialSettings.signup_limit}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Remaining Slots</p>
              <p className="text-2xl font-bold">{initialSettings.remaining_slots}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
