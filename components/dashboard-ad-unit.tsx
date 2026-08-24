"use client";

import { useEffect, useRef, useState } from "react";
import { getAdSenseDashboardConfig } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function DashboardAdUnit() {
  const config = getAdSenseDashboardConfig();
  const adRef = useRef<HTMLModElement>(null);
  const [isUnfilled, setIsUnfilled] = useState(false);

  useEffect(() => {
    if (!config || !adRef.current || adRef.current.dataset.initialized) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adRef.current.dataset.initialized = "true";
    } catch {
      // An ad failure must not affect a signed-in user's dashboard.
    }
  }, [config?.client, config?.slot]);

  useEffect(() => {
    const ad = adRef.current;
    if (!config || !ad) {
      return;
    }

    const updateFillState = () => {
      setIsUnfilled(ad.dataset.adStatus === "unfilled");
    };
    const observer = new MutationObserver(updateFillState);

    updateFillState();
    observer.observe(ad, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });

    return () => observer.disconnect();
  }, [config?.client, config?.slot]);

  if (!config || isUnfilled) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className="border-y border-border/70 bg-muted/20 px-4 py-5 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Advertisement
        </p>
        <ins
          ref={adRef}
          className="adsbygoogle block min-h-[90px]"
          data-ad-client={config.client}
          data-ad-format="auto"
          data-ad-slot={config.slot}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
