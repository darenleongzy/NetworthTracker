import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export default function AccountsLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Overview Card */}
      <Card className="overflow-hidden border-slate-200/70 bg-[linear-gradient(125deg,rgba(15,23,42,0.98)_0%,rgba(30,41,59,0.96)_38%,rgba(44,98,120,0.9)_72%,rgba(77,163,176,0.88)_100%)] shadow-[0_26px_70px_-40px_rgba(15,23,42,0.65)]">
        <CardHeader>
          <Skeleton className="h-4 w-48 bg-white/20" />
          <Skeleton className="h-10 w-40 mt-2 bg-white/20" />
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-8 w-24 rounded-full bg-white/15" />
            <Skeleton className="h-8 w-36 rounded-full bg-white/15" />
            <Skeleton className="h-8 w-32 rounded-full bg-white/15" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card
            key={i}
            className="rounded-[1.35rem] border border-slate-200/80 bg-white/92 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.32)]"
          >
            <CardHeader className="flex-row items-center gap-3 space-y-0 px-4 py-4">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Account Cards */}
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card
            key={i}
            className="rounded-[1.75rem] border border-slate-200/70 bg-[linear-gradient(160deg,rgba(248,250,252,0.98),rgba(239,246,255,0.96),rgba(224,242,254,0.82))]"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                  <div className="flex gap-1">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
