import { afterEach, describe, expect, it } from "vitest";
import { getAdSenseDashboardConfig } from "./ads";

const originalEnvironment = {
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED,
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
  slot: process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_ADS_ENABLED = originalEnvironment.enabled;
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT = originalEnvironment.client;
  process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT = originalEnvironment.slot;
});

describe("getAdSenseDashboardConfig", () => {
  it("stays disabled unless the explicit feature flag is enabled", () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "false";
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-1234567890123456";
    process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT = "1234567890";

    expect(getAdSenseDashboardConfig()).toBeNull();
  });

  it("requires a valid publisher client and numeric ad-unit slot", () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "true";
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "not-a-publisher-id";
    process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT = "slot-name";

    expect(getAdSenseDashboardConfig()).toBeNull();
  });

  it("returns the configured placement only when all values are valid", () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "true";
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-1234567890123456";
    process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT = "1234567890";

    expect(getAdSenseDashboardConfig()).toEqual({
      client: "ca-pub-1234567890123456",
      slot: "1234567890",
    });
  });
});
