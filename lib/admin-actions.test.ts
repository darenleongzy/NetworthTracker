import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache first (no dependencies)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Create mock outside of vi.mock to avoid hoisting issues
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockInvoke = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
      functions: {
        invoke: mockInvoke,
      },
    })
  ),
}));

// Import after mocks
import {
  getSignupSettings,
  checkSignupAvailability,
  joinWaitlist,
  isCurrentUserAdmin,
  updateSignupSettings,
  getWaitlistEntries,
  getWaitlistStats,
  inviteWaitlistUsers,
} from "./admin-actions";

// Helper to create chainable query mock
function createQueryMock(result: { data: unknown; error: unknown; count?: number }) {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  // Make the mock itself thenable for non-single queries
  Object.assign(mock, {
    then: (resolve: (value: typeof result) => void) => resolve({ ...result, count: result.count }),
  });
  return mock;
}

describe("admin-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSignupSettings", () => {
    it("returns signup settings from database", async () => {
      const mockSettings = {
        signup_enabled: true,
        signup_limit: 100,
        current_signup_count: 25,
      };

      mockFrom.mockReturnValue(
        createQueryMock({ data: mockSettings, error: null })
      );

      const result = await getSignupSettings();

      expect(result).toEqual({
        signup_enabled: true,
        signup_limit: 100,
        current_signup_count: 25,
        remaining_slots: 75,
      });
      expect(mockFrom).toHaveBeenCalledWith("app_settings");
    });

    it("returns default settings when table doesn't exist", async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: "Table not found" } })
      );

      const result = await getSignupSettings();

      expect(result).toEqual({
        signup_enabled: true,
        signup_limit: 100,
        current_signup_count: 0,
        remaining_slots: 100,
      });
    });

    it("calculates remaining slots as 0 when limit reached", async () => {
      const mockSettings = {
        signup_enabled: true,
        signup_limit: 50,
        current_signup_count: 60,
      };

      mockFrom.mockReturnValue(
        createQueryMock({ data: mockSettings, error: null })
      );

      const result = await getSignupSettings();

      expect(result.remaining_slots).toBe(0);
    });
  });

  describe("checkSignupAvailability", () => {
    it("returns available true when signup enabled and slots remain", async () => {
      mockFrom.mockReturnValue(
        createQueryMock({
          data: { signup_enabled: true, signup_limit: 100, current_signup_count: 50 },
          error: null,
        })
      );

      const result = await checkSignupAvailability();

      expect(result.available).toBe(true);
      expect(result.remainingSlots).toBe(50);
    });

    it("returns available false when signup disabled", async () => {
      mockFrom.mockReturnValue(
        createQueryMock({
          data: { signup_enabled: false, signup_limit: 100, current_signup_count: 50 },
          error: null,
        })
      );

      const result = await checkSignupAvailability();

      expect(result.available).toBe(false);
    });

    it("returns available false when no slots remain", async () => {
      mockFrom.mockReturnValue(
        createQueryMock({
          data: { signup_enabled: true, signup_limit: 100, current_signup_count: 100 },
          error: null,
        })
      );

      const result = await checkSignupAvailability();

      expect(result.available).toBe(false);
      expect(result.remainingSlots).toBe(0);
    });

    it("shows limited banner when 20 or fewer slots remain", async () => {
      mockFrom.mockReturnValue(
        createQueryMock({
          data: { signup_enabled: true, signup_limit: 100, current_signup_count: 85 },
          error: null,
        })
      );

      const result = await checkSignupAvailability();

      expect(result.showLimitedBanner).toBe(true);
      expect(result.remainingSlots).toBe(15);
    });

    it("does not show limited banner when more than 20 slots remain", async () => {
      mockFrom.mockReturnValue(
        createQueryMock({
          data: { signup_enabled: true, signup_limit: 100, current_signup_count: 50 },
          error: null,
        })
      );

      const result = await checkSignupAvailability();

      expect(result.showLimitedBanner).toBe(false);
    });
  });

  describe("joinWaitlist", () => {
    it("returns error for invalid email format", async () => {
      const result = await joinWaitlist("invalid-email");

      expect(result).toEqual({
        success: false,
        error: "Invalid email address",
      });
    });

    it("returns error if email already signed up", async () => {
      const existingMock = createQueryMock({
        data: { id: "1", status: "signed_up" },
        error: null,
      });
      mockFrom.mockReturnValue(existingMock);

      const result = await joinWaitlist("test@example.com");

      expect(result).toEqual({
        success: false,
        error: "This email has already signed up",
      });
    });

    it("returns error if email already invited", async () => {
      const existingMock = createQueryMock({
        data: { id: "1", status: "invited" },
        error: null,
      });
      mockFrom.mockReturnValue(existingMock);

      const result = await joinWaitlist("test@example.com");

      expect(result).toEqual({
        success: false,
        error: "You've been invited! Check your email to sign up",
      });
    });

    it("returns error if email already on waitlist", async () => {
      const existingMock = createQueryMock({
        data: { id: "1", status: "pending" },
        error: null,
      });
      mockFrom.mockReturnValue(existingMock);

      const result = await joinWaitlist("test@example.com");

      expect(result).toEqual({
        success: false,
        error: "This email is already on the waitlist",
      });
    });

    it("successfully adds email to waitlist", async () => {
      // First call checks for existing, second inserts to waitlist, third queues email
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Check existing - not found
          return createQueryMock({ data: null, error: null });
        }
        // Insert operations succeed
        return createQueryMock({ data: {}, error: null });
      });

      const result = await joinWaitlist("new@example.com");

      expect(result).toEqual({ success: true });
    });

    it("returns error when insert fails", async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryMock({ data: null, error: null });
        }
        return createQueryMock({ data: null, error: { message: "Insert failed" } });
      });

      const result = await joinWaitlist("new@example.com");

      expect(result).toEqual({
        success: false,
        error: "Failed to join waitlist",
      });
    });

    it("converts email to lowercase", async () => {
      let callCount = 0;
      const insertMock = vi.fn().mockReturnThis();
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryMock({ data: null, error: null });
        }
        return {
          ...createQueryMock({ data: {}, error: null }),
          insert: insertMock,
        };
      });

      await joinWaitlist("TEST@EXAMPLE.COM");

      expect(insertMock).toHaveBeenCalledWith({ email: "test@example.com" });
    });
  });

  describe("isCurrentUserAdmin", () => {
    it("returns false when not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(false);
    });

    it("returns false when user is not admin", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: null })
      );

      const result = await isCurrentUserAdmin();

      expect(result).toBe(false);
    });

    it("returns true when user is admin", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-123" } },
        error: null,
      });
      mockFrom.mockReturnValue(
        createQueryMock({ data: { id: "admin-record-1" }, error: null })
      );

      const result = await isCurrentUserAdmin();

      expect(result).toBe(true);
    });
  });

  describe("updateSignupSettings", () => {
    it("throws error when not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(updateSignupSettings(true, 100)).rejects.toThrow(
        "Not authenticated"
      );
    });

    it("throws error when not admin", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: null })
      );

      await expect(updateSignupSettings(true, 100)).rejects.toThrow(
        "Not authorized"
      );
    });

    it("updates settings when admin", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-123" } },
        error: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Admin check
          return createQueryMock({ data: { id: "admin-record" }, error: null });
        }
        // Update operation
        return createQueryMock({ data: {}, error: null });
      });

      await expect(updateSignupSettings(false, 50)).resolves.not.toThrow();
    });
  });

  describe("getWaitlistEntries", () => {
    it("throws error when not admin", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: null })
      );

      await expect(getWaitlistEntries()).rejects.toThrow("Not authorized");
    });

    it("returns paginated waitlist entries", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-123" } },
        error: null,
      });

      const mockEntries = [
        { id: "1", email: "test1@example.com", status: "pending" },
        { id: "2", email: "test2@example.com", status: "invited" },
      ];

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryMock({ data: { id: "admin-record" }, error: null });
        }
        return createQueryMock({ data: mockEntries, error: null, count: 2 });
      });

      const result = await getWaitlistEntries(1, 20);

      expect(result.entries).toEqual(mockEntries);
    });
  });

  describe("getWaitlistStats", () => {
    it("returns correct stats", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-123" } },
        error: null,
      });

      const mockEntries = [
        { status: "pending" },
        { status: "pending" },
        { status: "invited" },
        { status: "signed_up" },
      ];

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryMock({ data: { id: "admin-record" }, error: null });
        }
        return createQueryMock({ data: mockEntries, error: null });
      });

      const result = await getWaitlistStats();

      expect(result).toEqual({
        pending: 2,
        invited: 1,
        signed_up: 1,
        total: 4,
      });
    });
  });

  describe("inviteWaitlistUsers", () => {
    it("returns error when no pending users", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-123" } },
        error: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryMock({ data: { id: "admin-record" }, error: null });
        }
        return createQueryMock({ data: [], error: null });
      });

      const result = await inviteWaitlistUsers(5);

      expect(result).toEqual({
        invited: 0,
        error: "No pending users to invite",
      });
    });

    it("invites pending users and increases limit", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-123" } },
        error: null,
      });

      const pendingUsers = [
        { id: "w1", email: "user1@example.com" },
        { id: "w2", email: "user2@example.com" },
      ];

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Admin check
          return createQueryMock({ data: { id: "admin-record" }, error: null });
        }
        if (callCount === 2) {
          // Fetch pending users
          return createQueryMock({ data: pendingUsers, error: null });
        }
        if (callCount === 5) {
          // Get current settings
          return createQueryMock({ data: { signup_limit: 100 }, error: null });
        }
        // Other operations (update status, insert emails, update limit)
        return createQueryMock({ data: {}, error: null });
      });

      const result = await inviteWaitlistUsers(5);

      expect(result.invited).toBe(2);
    });
  });
});
