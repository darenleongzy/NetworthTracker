import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock console.warn and console.error in tests to reduce noise
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
