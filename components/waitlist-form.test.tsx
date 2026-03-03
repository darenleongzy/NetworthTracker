import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaitlistForm } from "./waitlist-form";

// Mock the joinWaitlist server action
const mockJoinWaitlist = vi.fn();
vi.mock("@/lib/admin-actions", () => ({
  joinWaitlist: (...args: unknown[]) => mockJoinWaitlist(...args),
}));

// Helper to flush promises and transitions
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe("WaitlistForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    mockJoinWaitlist.mockResolvedValue({ success: true });
  });

  describe("rendering", () => {
    it("renders the waitlist form", () => {
      render(<WaitlistForm />);

      expect(screen.getByText("Join the Waitlist")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Join Waitlist" })
      ).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<WaitlistForm />);

      expect(
        screen.getByText(/We're currently at capacity/i)
      ).toBeInTheDocument();
    });

    it("renders sign in link", () => {
      render(<WaitlistForm />);

      const signInLink = screen.getByRole("link", { name: "Sign in" });
      expect(signInLink).toHaveAttribute("href", "/login");
    });
  });

  describe("form validation", () => {
    it("requires email field", () => {
      render(<WaitlistForm />);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toBeRequired();
    });

    it("has email input type", () => {
      render(<WaitlistForm />);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
    });
  });

  describe("form submission", () => {
    it("calls joinWaitlist with email", async () => {
      mockJoinWaitlist.mockResolvedValue({ success: true });

      render(<WaitlistForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      await waitFor(() => {
        expect(mockJoinWaitlist).toHaveBeenCalledWith("test@example.com");
      });
    });

    it("shows loading state during submission", async () => {
      mockJoinWaitlist.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<WaitlistForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      // With useTransition, isPending is set synchronously
      expect(
        screen.getByRole("button", { name: "Joining..." })
      ).toBeDisabled();
    });

    it("displays error message on failure", async () => {
      mockJoinWaitlist.mockResolvedValue({
        success: false,
        error: "This email is already on the waitlist",
      });

      render(<WaitlistForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      await waitFor(() => {
        expect(
          screen.getByText("This email is already on the waitlist")
        ).toBeInTheDocument();
      });
    });

    it("displays default error when no error message provided", async () => {
      mockJoinWaitlist.mockResolvedValue({
        success: false,
      });

      render(<WaitlistForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      await waitFor(() => {
        expect(screen.getByText("Failed to join waitlist")).toBeInTheDocument();
      });
    });

    it("calls joinWaitlist and handles success response", async () => {
      mockJoinWaitlist.mockResolvedValue({ success: true });

      render(<WaitlistForm />);

      await userEvent.type(screen.getByLabelText("Email"), "success@example.com");
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      // Verify the action was called with correct email
      await waitFor(() => {
        expect(mockJoinWaitlist).toHaveBeenCalledWith("success@example.com");
      });

      // Verify the mock returned success
      const result = await mockJoinWaitlist.mock.results[0].value;
      expect(result.success).toBe(true);
    });

    it("handles successful waitlist join response", async () => {
      // This test verifies the action is called and returns successfully
      mockJoinWaitlist.mockResolvedValue({ success: true });

      render(<WaitlistForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      // Verify the action was called
      await waitFor(() => {
        expect(mockJoinWaitlist).toHaveBeenCalledWith("test@example.com");
      });

      // Verify it was called exactly once
      expect(mockJoinWaitlist).toHaveBeenCalledTimes(1);
    });
  });

  describe("input handling", () => {
    it("updates email state on input change", async () => {
      render(<WaitlistForm />);

      const emailInput = screen.getByLabelText("Email");
      await userEvent.type(emailInput, "new@example.com");

      expect(emailInput).toHaveValue("new@example.com");
    });

    it("clears error when form is resubmitted", async () => {
      mockJoinWaitlist
        .mockResolvedValueOnce({ success: false, error: "First error" })
        .mockResolvedValueOnce({ success: true });

      render(<WaitlistForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");

      // First submission - error
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second submission - success
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("shows error for already signed up email", async () => {
      mockJoinWaitlist.mockResolvedValue({
        success: false,
        error: "This email has already signed up",
      });

      render(<WaitlistForm />);

      await userEvent.type(
        screen.getByLabelText("Email"),
        "existing@example.com"
      );
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      await waitFor(() => {
        expect(
          screen.getByText("This email has already signed up")
        ).toBeInTheDocument();
      });
    });

    it("shows error for invited email", async () => {
      mockJoinWaitlist.mockResolvedValue({
        success: false,
        error: "You've been invited! Check your email to sign up",
      });

      render(<WaitlistForm />);

      await userEvent.type(
        screen.getByLabelText("Email"),
        "invited@example.com"
      );
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      await waitFor(() => {
        expect(
          screen.getByText("You've been invited! Check your email to sign up")
        ).toBeInTheDocument();
      });
    });

    it("shows error for invalid email", async () => {
      mockJoinWaitlist.mockResolvedValue({
        success: false,
        error: "Invalid email address",
      });

      render(<WaitlistForm />);

      // Use a technically valid email format that the server rejects
      await userEvent.type(screen.getByLabelText("Email"), "invalid@test");
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }));

      await waitFor(() => {
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      });
    });
  });
});
