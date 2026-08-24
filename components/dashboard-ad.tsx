"use client";

import { useEffect, useRef } from "react";
import { getAdSenseDashboardConfig } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface DashboardAdProps {
  show: boolean;
}

export function DashboardAd({ show }: DashboardAdProps) {
  const config = getAdSenseDashboardConfig();
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!adRef.current || adRef.current.dataset.initialized) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adRef.current.dataset.initialized = "true";
    } catch {
      // An ad failure must not affect a signed-in user's dashboard.
    }
  }, []);

  if (!show || !config) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className="mx-auto mt-8 w-full max-w-5xl border-t pt-5"
    >
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
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
    </aside>
  );
}
