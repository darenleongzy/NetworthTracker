import { vi } from "vitest";

// Test user for mocking auth
export const testUser = {
  id: "test-user-id",
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
};

// Chainable mock builder for Supabase queries
export function createChainableMock<T>(resolvedValue: { data: T | null; error: null } | { data: null; error: { message: string; code: string } }) {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    then: vi.fn((resolve) => resolve(resolvedValue)),
  };

  return mock;
}

// Create a mock Supabase client
export function createMockSupabaseClient(overrides: {
  userData?: typeof testUser | null;
  tableData?: Record<string, unknown>;
} = {}) {
  const userData = overrides.userData === undefined ? testUser : overrides.userData;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userData },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: userData ? { user: userData } : null },
        error: null,
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn((table: string) => {
      const data = overrides.tableData?.[table] ?? null;
      return createChainableMock({ data, error: null });
    }),
  };
}

// Default mock implementation for @/lib/supabase/server
export function mockSupabaseServer(client = createMockSupabaseClient()) {
  vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return client;
}
