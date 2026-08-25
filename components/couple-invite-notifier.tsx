"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { dismissCoupleInviteNotification, respondToCoupleInvite } from "@/lib/couple-actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type InviteNotification = { id: string; connectionId: string; inviterEmail: string };

export function CoupleInviteNotifier() {
  const router = useRouter();
  const [notification, setNotification] = useState<InviteNotification | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadInvite() {
      const { data } = await supabase
        .from("couple_invite_notifications")
        .select("id, connection_id, couple_connections!inner(inviter_email, status)")
        .is("dismissed_at", null)
        .eq("couple_connections.status", "pending")
        .order("last_notified_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const connection = data?.couple_connections as { inviter_email?: string } | null;
      if (active && data && connection?.inviter_email) {
        setNotification({ id: data.id, connectionId: data.connection_id, inviterEmail: connection.inviter_email });
      }
    }

    void loadInvite();
    const interval = window.setInterval(() => void loadInvite(), 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  async function respond(accept: boolean) {
    if (!notification) return;
    setResponding(true);
    try {
      await respondToCoupleInvite(notification.connectionId, accept);
      toast.success(accept ? "Couple Mode connected" : "Invite declined");
      setNotification(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to respond to invite");
    } finally {
      setResponding(false);
    }
  }

  async function dismiss() {
    if (!notification) return;
    try {
      await dismissCoupleInviteNotification(notification.id);
      setNotification(null);
    } catch {
      toast.error("Unable to dismiss invite");
    }
  }

  return (
    <Dialog open={Boolean(notification)} onOpenChange={(open) => { if (!open) void dismiss(); }}>
      <DialogContent showCloseButton={false} className="max-w-md overflow-hidden p-0">
        <div className="bg-[linear-gradient(135deg,#15334c,#197470)] p-6 text-white"><Heart className="h-8 w-8 fill-emerald-200 text-emerald-200" /><p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Couple Mode</p><DialogTitle className="mt-2 text-2xl">A shared picture is waiting.</DialogTitle></div>
        <div className="p-6"><DialogHeader><DialogDescription className="text-sm leading-6"><strong className="text-foreground">{notification?.inviterEmail}</strong> invited you to connect your financial dashboards. You can accept now or decide later from the Couple tab.</DialogDescription></DialogHeader><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button onClick={() => void respond(true)} loading={responding} className="flex-1">Accept invite</Button><Button variant="outline" disabled={responding} onClick={() => void dismiss()} className="flex-1">Decide later</Button></div>{responding ? <Loader2 className="mx-auto mt-3 h-4 w-4 animate-spin text-primary" /> : null}</div>
      </DialogContent>
    </Dialog>
  );
}
