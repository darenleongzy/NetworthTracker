import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { DashboardAdUnit } from "@/components/dashboard-ad-unit";

const originalEnvironment = {
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED,
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
  slot: process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_ADS_ENABLED = originalEnvironment.enabled;
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT = originalEnvironment.client;
  process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT = originalEnvironment.slot;
  window.adsbygoogle = undefined;
});

describe("DashboardAdUnit", () => {
  it("renders and initializes the configured responsive ad unit", () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "true";
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-9653219339886124";
    process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT = "9533314002";
    window.adsbygoogle = [];

    render(<DashboardAdUnit />);

    const ad = screen.getByLabelText("Advertisement").querySelector("ins");
    expect(ad).toHaveAttribute("data-ad-client", "ca-pub-9653219339886124");
    expect(ad).toHaveAttribute("data-ad-slot", "9533314002");
    expect(window.adsbygoogle).toEqual([{}]);
  });

  it("renders nothing while ads are disabled", () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "false";
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-9653219339886124";
    process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT = "9533314002";

    render(<DashboardAdUnit />);

    expect(screen.queryByLabelText("Advertisement")).not.toBeInTheDocument();
  });

  it("removes the placement when AdSense reports an unfilled slot", async () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = "true";
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-9653219339886124";
    process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT = "9533314002";
    window.adsbygoogle = [];

    render(<DashboardAdUnit />);
    const ad = screen.getByLabelText("Advertisement").querySelector("ins");

    act(() => ad?.setAttribute("data-ad-status", "unfilled"));

    await waitFor(() => {
      expect(screen.queryByLabelText("Advertisement")).not.toBeInTheDocument();
    });
  });
});
