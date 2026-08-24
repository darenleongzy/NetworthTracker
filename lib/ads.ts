export interface AdSenseDashboardConfig {
  client: string;
  slot: string;
}

export function getAdSenseDashboardConfig(): AdSenseDashboardConfig | null {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT;

  if (
    process.env.NEXT_PUBLIC_ADS_ENABLED !== "true" ||
    !client?.startsWith("ca-pub-") ||
    !slot ||
    !/^\d+$/.test(slot)
  ) {
    return null;
  }

  return { client, slot };
}
