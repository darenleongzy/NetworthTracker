import { AlertCircle } from "lucide-react";

interface LimitedLaunchBannerProps {
  remainingSlots: number;
}

export function LimitedLaunchBanner({ remainingSlots }: LimitedLaunchBannerProps) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>
        <span className="font-medium">Limited launch:</span>{" "}
        Only <span className="font-bold">{remainingSlots}</span> spot{remainingSlots === 1 ? "" : "s"} left!
      </p>
    </div>
  );
}
