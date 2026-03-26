import { fireEvent, render, screen } from "@testing-library/react";
import { Linking } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsScreen from "../../app/(tabs)/settings";

vi.mock("@/src/hooks/use-async-resource", () => ({
  useAsyncResource: () => ({
    data: { base_currency: "USD" },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/src/providers/session-provider", () => ({
  useSession: () => ({
    signOut: vi.fn(),
  }),
}));

vi.mock("@/src/lib/api", () => ({
  mobileApi: {
    preferences: {
      get: vi.fn(),
      updateBaseCurrency: vi.fn(),
    },
  },
}));

describe("mobile settings deletion paths", () => {
  beforeEach(() => {
    vi.mocked(Linking.openURL).mockClear();
  });

  it("opens the public deletion request path from settings", () => {
    render(<SettingsScreen />);

    fireEvent.click(screen.getByTestId("settings-delete-request-link"));

    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://trackmyworth.xyz/delete-account"
    );
  });

  it("opens an email draft for deletion requests from settings", () => {
    render(<SettingsScreen />);

    fireEvent.click(screen.getByTestId("settings-delete-request-email-link"));

    expect(Linking.openURL).toHaveBeenCalledWith(
      "mailto:trackmyworthadmin@gmail.com?subject=Account%20Deletion%20Request"
    );
  });
});
