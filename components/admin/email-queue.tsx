"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { processEmailQueue, retryFailedEmail, getEmailQueueEntries } from "@/lib/admin-actions";
import type { EmailQueueEntry, EmailQueueStats } from "@/lib/admin-actions";
import { useRouter } from "next/navigation";
import { RefreshCw, RotateCcw } from "lucide-react";

interface EmailQueueProps {
  initialEntries: EmailQueueEntry[];
  initialStats: EmailQueueStats;
  totalCount: number;
}

export function EmailQueue({ initialEntries, initialStats, totalCount }: EmailQueueProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [stats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  function handleProcessQueue() {
    startTransition(async () => {
      try {
        const result = await processEmailQueue();
        if (result.error) {
          toast.error(result.error);
        } else if (result.processed) {
          toast.success("Email sent successfully");
          router.refresh();
        } else {
          toast.info("No pending emails to process");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to process queue");
      }
    });
  }

  function handleRetry(emailId: string) {
    startTransition(async () => {
      try {
        const result = await retryFailedEmail(emailId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Email marked for retry");
          // Refresh data
          const data = await getEmailQueueEntries(page, pageSize);
          setEntries(data.entries);
        }
      } catch {
        toast.error("Failed to retry email");
      }
    });
  }

  async function loadPage(newPage: number) {
    startTransition(async () => {
      try {
        const data = await getEmailQueueEntries(newPage, pageSize);
        setEntries(data.entries);
        setPage(newPage);
      } catch {
        toast.error("Failed to load emails");
      }
    });
  }

  function formatDate(date: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "sent":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sent</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getTemplateName(template: string) {
    switch (template) {
      case "waitlist_confirmation":
        return "Waitlist Confirmation";
      case "waitlist_invite":
        return "Waitlist Invite";
      default:
        return template;
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Stats</CardTitle>
          <CardDescription>
            Emails are processed at a rate of 4 per hour (every 15 minutes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manual Processing</CardTitle>
            <CardDescription>
              Process the next pending email manually (useful for testing)
            </CardDescription>
          </div>
          <Button
            onClick={handleProcessQueue}
            disabled={isPending || stats.pending === 0}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isPending ? "Processing..." : "Process Next Email"}
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Queue</CardTitle>
          <CardDescription>
            Showing {entries.length} of {totalCount} emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>To</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No emails in queue
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.to_email}</TableCell>
                    <TableCell>{getTemplateName(entry.template)}</TableCell>
                    <TableCell>
                      {getStatusBadge(entry.status)}
                      {entry.error && (
                        <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={entry.error}>
                          {entry.error}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{entry.attempts}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(entry.created_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(entry.sent_at)}</TableCell>
                    <TableCell>
                      {entry.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(entry.id)}
                          disabled={isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
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
