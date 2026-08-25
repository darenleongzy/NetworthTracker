"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BellRing,
  Check,
  Heart,
  Landmark,
  RefreshCw,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  resendCoupleInvite,
  respondToCoupleInvite,
  sendCoupleInvite,
  updateCoupleGoal,
} from "@/lib/couple-actions";
import { formatCurrency } from "@/lib/calculations";
import { getCoupleGoalProgress } from "@/lib/couple-calculations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CoupleAssetBreakdown, CoupleConnection } from "@/lib/types";

type CoupleDashboardProps = {
  connection: CoupleConnection | null;
  currentUserId: string;
  baseCurrency: string;
  breakdown: CoupleAssetBreakdown;
};

export function CoupleDashboard({
  connection,
  currentUserId,
  baseCurrency,
  breakdown,
}: CoupleDashboardProps) {
  if (!connection) return <InvitePartner />;

  const invitedByCurrentUser = connection.inviter_id === currentUserId;
  if (connection.status === "pending") {
    return invitedByCurrentUser ? (
      <InvitePending connection={connection} />
    ) : (
      <ReceivedInvite connection={connection} />
    );
  }

  if (connection.status !== "connected") return <InvitePartner />;

  return (
    <ConnectedCoupleDashboard
      connection={connection}
      baseCurrency={baseCurrency}
      breakdown={breakdown}
      partnerEmail={invitedByCurrentUser ? connection.invitee_email : connection.inviter_email}
    />
  );
}

function InvitePartner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      await sendCoupleInvite(email);
      toast.success("Invite sent", { description: "Your partner can review it in their Couple tab." });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send invite");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-[linear-gradient(135deg,rgba(20,51,77,0.96),rgba(24,105,111,0.94))] px-5 py-7 text-white shadow-[0_28px_70px_-42px_rgba(16,185,129,0.75)] sm:px-8 sm:py-10">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full border border-white/15" />
        <div className="relative max-w-xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
            <Heart className="h-6 w-6 fill-current text-emerald-200" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">Together, with clarity</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Build your shared financial picture.</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/75 sm:text-base">
            Connect with your partner to see combined assets, understand your mix, and work toward one meaningful goal.
          </p>
        </div>
      </section>

      <Card className="border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl"><UsersRound className="h-5 w-5 text-primary" /> Invite your partner</CardTitle>
          <p className="text-sm text-muted-foreground">They need an existing Track My Worth account to accept.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="partner-email">Partner&apos;s email address</Label>
              <Input
                id="partner-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="partner@example.com"
                required
              />
            </div>
            <Button type="submit" className="mt-0 sm:mt-7" loading={sending}>
              <Send className="mr-2 h-4 w-4" /> Send invite
            </Button>
          </form>
          <p className="mt-5 rounded-xl bg-secondary/65 px-4 py-3 text-xs leading-5 text-muted-foreground">
            Connecting shares account balances and holdings for the combined view. Each person still controls changes to their own accounts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InvitePending({ connection }: { connection: CoupleConnection }) {
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await resendCoupleInvite(connection.id);
      toast.success("Reminder sent", { description: "We reopened their in-app invite and sent an email reminder." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send reminder");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-[2rem] border border-primary/20 bg-primary/10 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><BellRing className="h-5 w-5" /></div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Invite pending</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Waiting for {connection.invitee_email}</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">They will see an in-app invite when they open Track My Worth. You can send a gentle reminder if they dismissed it.</p>
          </div>
          <Button variant="outline" onClick={resend} loading={sending}>
            <RefreshCw className="mr-2 h-4 w-4" /> Send reminder
          </Button>
        </div>
      </section>
    </div>
  );
}

function ReceivedInvite({ connection }: { connection: CoupleConnection }) {
  const router = useRouter();
  const [responding, setResponding] = useState<"accept" | "decline" | null>(null);

  async function respond(accept: boolean) {
    setResponding(accept ? "accept" : "decline");
    try {
      await respondToCoupleInvite(connection.id, accept);
      toast.success(accept ? "You are now connected" : "Invite declined");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to respond to invite");
    } finally {
      setResponding(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden border-primary/25 bg-card shadow-[0_28px_70px_-42px_rgba(20,184,166,0.5)]">
        <CardContent className="p-6 sm:p-8">
          <Heart className="h-9 w-9 fill-primary text-primary" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">Couple invitation</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{connection.inviter_email} wants to plan together.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Accept to share a combined view of account balances and holdings. Your partner cannot edit your accounts.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => respond(true)} loading={responding === "accept"}><Check className="mr-2 h-4 w-4" /> Accept invite</Button>
            <Button variant="outline" onClick={() => respond(false)} disabled={responding !== null}><X className="mr-2 h-4 w-4" /> Decline</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectedCoupleDashboard({
  connection,
  baseCurrency,
  breakdown,
  partnerEmail,
}: {
  connection: CoupleConnection;
  baseCurrency: string;
  breakdown: CoupleAssetBreakdown;
  partnerEmail: string;
}) {
  const router = useRouter();
  const [goalInput, setGoalInput] = useState(String(Number(connection.goal_amount) || ""));
  const [includeCpf, setIncludeCpf] = useState(connection.goal_include_cpf);
  const [savingGoal, setSavingGoal] = useState(false);
  const goalAmount = Number(goalInput) || 0;
  const { total, progress, remaining } = getCoupleGoalProgress(breakdown, includeCpf, goalAmount);
  const allAssets = breakdown.cash + breakdown.investments + breakdown.cpf + breakdown.srs;
  const segments = [
    { label: "Cash", value: breakdown.cash, icon: WalletCards, color: "bg-emerald-400", tint: "bg-emerald-400/15", text: "text-emerald-300" },
    { label: "Investments", value: breakdown.investments, icon: TrendingUp, color: "bg-sky-400", tint: "bg-sky-400/15", text: "text-sky-300" },
    { label: "CPF", value: breakdown.cpf, icon: Landmark, color: "bg-amber-400", tint: "bg-amber-400/15", text: "text-amber-300" },
    { label: "SRS", value: breakdown.srs, icon: ShieldCheck, color: "bg-violet-400", tint: "bg-violet-400/15", text: "text-violet-300" },
  ];

  async function saveGoal() {
    setSavingGoal(true);
    try {
      await updateCoupleGoal(connection.id, goalAmount, includeCpf);
      toast.success("Shared goal saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save goal");
    } finally {
      setSavingGoal(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1300px] space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-[linear-gradient(120deg,#15334c,#197470_58%,#1e4b70)] p-6 text-white shadow-[0_30px_80px_-46px_rgba(20,184,166,0.75)] sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-emerald-100"><Heart className="h-5 w-5 fill-current" /><span className="text-xs font-bold uppercase tracking-[0.2em]">Couple Mode</span></div>
            <p className="text-sm text-white/65">Combined assets with {partnerEmail}</p>
            <p className="mt-2 text-[clamp(2.5rem,7vw,4.75rem)] font-semibold leading-none tracking-[-0.06em]">{formatCurrency(allAssets, baseCurrency)}</p>
            <p className="mt-3 text-sm text-white/70">A shared view, with individual control over every account.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm sm:min-w-72">
            <div><p className="text-xs text-white/60">Goal view</p><p className="mt-1 text-sm font-semibold">{includeCpf ? "Including CPF / SRS" : "Excluding CPF / SRS"}</p></div>
            <div><p className="text-xs text-white/60">Connected</p><p className="mt-1 text-sm font-semibold">Planning together</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {segments.map(({ label, value, icon: Icon, tint, text }) => (
          <Card key={label} className="border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between"><span className={`rounded-xl ${tint} p-2 ${text}`}><Icon className="h-4 w-4" /></span><span className="text-xs text-muted-foreground">{allAssets > 0 ? Math.round((value / allAssets) * 100) : 0}%</span></div>
              <p className="mt-5 text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">{formatCurrency(value, baseCurrency)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Shared goal</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2"><Label htmlFor="couple-goal">Target amount ({baseCurrency})</Label><Input id="couple-goal" inputMode="decimal" type="number" min="0" value={goalInput} onChange={(event) => setGoalInput(event.target.value)} placeholder="e.g. 1000000" /></div>
              <Button onClick={saveGoal} loading={savingGoal}>Save goal</Button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/55 p-4"><div><p className="text-sm font-medium">Include CPF and SRS</p><p className="mt-1 text-xs text-muted-foreground">Choose whether retirement balances count toward this goal.</p></div><Switch checked={includeCpf} onCheckedChange={setIncludeCpf} aria-label="Include CPF and SRS in goal" /></div>
            <div className="space-y-3"><div className="flex items-baseline justify-between gap-3"><p className="text-2xl font-semibold">{goalAmount > 0 ? `${progress.toFixed(1)}%` : "Set a target"}</p><p className="text-sm text-muted-foreground">{goalAmount > 0 ? `${formatCurrency(remaining, baseCurrency)} to go` : ""}</p></div><div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-[linear-gradient(90deg,#14b8a6,#38bdf8)] transition-[width] duration-500" style={{ width: `${progress}%` }} /></div><p className="text-sm text-muted-foreground">{formatCurrency(total, baseCurrency)} counted toward this goal.</p></div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="pb-3"><CardTitle>Asset mix</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {segments.map(({ label, value, color }) => {
              const percent = allAssets > 0 ? (value / allAssets) * 100 : 0;
              return <div key={label} className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{percent.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>;
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
