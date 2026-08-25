import { Skeleton } from "@/components/ui/skeleton";

export default function CoupleLoading() {
  return (
    <div className="mx-auto max-w-[1300px] space-y-5" role="status" aria-live="polite">
      <section className="rounded-[2rem] border border-primary/15 bg-primary/10 p-6 sm:p-8"><Skeleton className="h-4 w-28 bg-white/20" /><Skeleton className="mt-5 h-14 w-3/4 bg-white/20" /><Skeleton className="mt-4 h-4 w-1/2 bg-white/15" /></section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)}</section>
      <section className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-80 rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></section>
    </div>
  );
}
