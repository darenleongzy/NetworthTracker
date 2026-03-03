"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { inviteWaitlistUsers, getWaitlistEntries } from "@/lib/admin-actions";
import type { WaitlistEntry, WaitlistStats } from "@/lib/admin-actions";
import { useRouter } from "next/navigation";

interface WaitlistTableProps {
  initialEntries: WaitlistEntry[];
  initialStats: WaitlistStats;
  totalCount: number;
}

export function WaitlistTable({ initialEntries, initialStats, totalCount }: WaitlistTableProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [stats] = useState(initialStats);
  const [inviteCount, setInviteCount] = useState(5);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  function handleInvite() {
    startTransition(async () => {
      try {
        const result = await inviteWaitlistUsers(inviteCount);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(`Invited ${result.invited} users`);
          // Refresh the data
          const data = await getWaitlistEntries(page, pageSize);
          setEntries(data.entries);
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to invite users");
      }
    });
  }

  async function loadPage(newPage: number) {
    startTransition(async () => {
      try {
        const data = await getWaitlistEntries(newPage, pageSize);
        setEntries(data.entries);
        setPage(newPage);
      } catch {
        toast.error("Failed to load waitlist");
      }
    });
  }

  function formatDate(date: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "invited":
        return <Badge variant="default">Invited</Badge>;
      case "signed_up":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Signed Up</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Invited</p>
              <p className="text-2xl font-bold">{stats.invited}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Signed Up</p>
              <p className="text-2xl font-bold">{stats.signed_up}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invite Users</CardTitle>
            <CardDescription>
              Invite pending users from the waitlist (oldest first)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              value={inviteCount}
              onChange={(e) => setInviteCount(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <Button onClick={handleInvite} disabled={isPending || stats.pending === 0}>
              {isPending ? "Inviting..." : `Invite ${inviteCount} Users`}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries</CardTitle>
          <CardDescription>
            Showing {entries.length} of {totalCount} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Signed Up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No waitlist entries yet
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(entry.created_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(entry.invited_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(entry.signed_up_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPage(page - 1)}
                disabled={page === 1 || isPending}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPage(page + 1)}
                disabled={page === totalPages || isPending}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
