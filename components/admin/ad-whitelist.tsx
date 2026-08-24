"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAdFreeUsers, setUserAdFreeByEmail } from "@/lib/admin-actions";
import type { AdFreeUser } from "@/lib/admin-actions";

interface AdWhitelistProps {
  initialUsers: AdFreeUser[];
}

export function AdWhitelist({ initialUsers }: AdWhitelistProps) {
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();

  function refreshUsers() {
    return getAdFreeUsers().then(setUsers);
  }

  function addUser() {
    startTransition(async () => {
      try {
        await setUserAdFreeByEmail(email, true);
        await refreshUsers();
        setEmail("");
        toast.success("User added to the ad-free list");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update the ad-free list");
      }
    });
  }

  function removeUser(userEmail: string) {
    startTransition(async () => {
      try {
        await setUserAdFreeByEmail(userEmail, false);
        await refreshUsers();
        toast.success("Ads will be restored for this user");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update the ad-free list");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ad-free users</CardTitle>
        <CardDescription>
          Users on this list never receive dashboard ads. Ads are disabled globally until AdSense is configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label="User email for ad-free access"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
          />
          <Button onClick={addUser} disabled={isPending || !email.trim()}>
            Add ad-free user
          </Button>
        </div>

        {users.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No users are currently exempt from dashboard ads.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {users.map((user) => (
              <li key={user.user_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Ad-free</Badge>
                  <Button variant="outline" size="sm" onClick={() => removeUser(user.email)} disabled={isPending}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
