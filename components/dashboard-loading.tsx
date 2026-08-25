const summaryWidths = ["w-32", "w-24", "w-28", "w-24", "w-28"];

function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />;
}

export function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Preparing your financial dashboard</span>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
            <div className="h-5 w-5 animate-pulse rounded-full bg-primary/55" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-44 animate-pulse rounded-md bg-foreground/15" />
            <p className="text-sm text-muted-foreground">Preparing your financial dashboard</p>
          </div>
        </div>
        <Shimmer className="h-10 w-full sm:w-44" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryWidths.map((width, index) => (
          <div
            className="relative min-h-32 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 p-5 shadow-sm"
            key={index}
          >
            <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative space-y-5">
              <div className="h-3 w-20 animate-pulse rounded bg-white/30" />
              <div className={`h-8 ${width} animate-pulse rounded-lg bg-white/45`} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ChartSkeleton titleWidth="w-40" />
        <DonutSkeleton titleWidth="w-32" />
        <DonutSkeleton titleWidth="w-44" />
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Shimmer className="h-5 w-32" />
          <Shimmer className="h-8 w-28" />
        </div>
        <div className="flex h-56 items-end gap-3 px-2">
          {[36, 58, 44, 70, 52, 78, 64, 88, 72, 94, 82, 100].map((height, index) => (
            <div
              className="flex-1 animate-pulse rounded-t-md bg-primary/20"
              key={index}
              style={{ height: `${height}%`, animationDelay: `${index * 75}ms` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ChartSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Shimmer className={`h-5 ${titleWidth}`} />
        <Shimmer className="h-8 w-28" />
      </div>
      <div className="relative h-60 overflow-hidden rounded-xl bg-slate-50">
        <div className="absolute inset-x-5 bottom-7 top-6 border-b border-l border-dashed border-slate-200" />
        <div className="absolute inset-x-8 bottom-11 h-24 rounded-full border-t-4 border-primary/25" />
        <div className="absolute inset-x-8 bottom-11 h-20 animate-pulse rounded-t-[999px] bg-primary/10" />
      </div>
    </div>
  );
}

function DonutSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <Shimmer className={`h-5 ${titleWidth}`} />
      <div className="flex h-60 items-center justify-center">
        <div className="flex h-36 w-36 animate-pulse items-center justify-center rounded-full border-[22px] border-primary/20">
          <div className="h-8 w-14 rounded-md bg-slate-200" />
        </div>
      </div>
      <div className="mx-auto flex max-w-56 justify-center gap-3">
        <Shimmer className="h-3 w-12" />
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3 w-10" />
      </div>
    </div>
  );
}
