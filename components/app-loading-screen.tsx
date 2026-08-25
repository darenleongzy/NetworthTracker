import Image from "next/image";

export function AppLoadingScreen() {
  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f3f7fb] px-6 text-slate-950"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading Track My Worth</span>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(135,87,255,0.16),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(74,222,183,0.14),transparent_32%)]" />
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-[spin_2.4s_linear_infinite] rounded-[2rem] border-2 border-primary/15 border-t-primary" />
          <div className="absolute inset-2 animate-pulse rounded-[1.45rem] bg-primary/10" />
          <Image
            src="/track-my-worth-mark.svg"
            alt="Track My Worth"
            width={68}
            height={68}
            priority
            className="relative rounded-[1.25rem] shadow-lg shadow-primary/15"
          />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          Track My Worth
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">Preparing your dashboard</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Syncing your balances, activity, and latest market values.
        </p>
        <div className="mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-2/3 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary via-violet-500 to-emerald-400" />
        </div>
      </div>
    </main>
  );
}
