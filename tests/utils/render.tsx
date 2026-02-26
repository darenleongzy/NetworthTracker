import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

// Wrapper component for providing context (if needed)
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Custom render function that wraps components with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render };
