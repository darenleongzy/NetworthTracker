import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./signup-form";

// Mock the Supabase client
const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    mockSignUp.mockResolvedValue({ data: null, error: null });
  });

  describe("rendering", () => {
    it("renders the signup form", () => {
      render(<SignupForm />);

      expect(screen.getByText("Create an account")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    });

    it("renders limited banner when showLimitedBanner is true", () => {
      render(<SignupForm showLimitedBanner={true} remainingSlots={10} />);

      expect(screen.getByText(/10/)).toBeInTheDocument();
    });

    it("does not render limited banner when showLimitedBanner is false", () => {
      render(<SignupForm showLimitedBanner={false} remainingSlots={10} />);

      // The number 10 should not appear in a banner context
      const container = screen.queryByText(/spots? left/i);
      expect(container).not.toBeInTheDocument();
    });

    it("renders sign in link", () => {
      render(<SignupForm />);

      const signInLink = screen.getByRole("link", { name: "Sign in" });
      expect(signInLink).toHaveAttribute("href", "/login");
    });
  });

  describe("form validation", () => {
    it("requires email field", () => {
      render(<SignupForm />);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toBeRequired();
    });

    it("requires password field", () => {
      render(<SignupForm />);

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toBeRequired();
    });

    it("enforces minimum password length", () => {
      render(<SignupForm />);

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("minLength", "6");
    });
  });

  describe("form submission", () => {
    it("calls signUp with correct credentials", async () => {
      mockSignUp.mockResolvedValue({ error: null });

      render(<SignupForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      await userEvent.type(screen.getByLabelText("Password"), "password123");

      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
          options: {
            emailRedirectTo: expect.stringContaining("/auth/callback"),
          },
        });
      });
    });

    it("shows loading state during submission", async () => {
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<SignupForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      await userEvent.type(screen.getByLabelText("Password"), "password123");

      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      expect(
        screen.getByRole("button", { name: "Creating account..." })
      ).toBeDisabled();
    });

    it("displays error message on signup failure", async () => {
      mockSignUp.mockResolvedValue({
        error: { message: "Email already registered" },
      });

      render(<SignupForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      await userEvent.type(screen.getByLabelText("Password"), "password123");

      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      await waitFor(() => {
        expect(screen.getByText("Email already registered")).toBeInTheDocument();
      });
    });

    it("shows success state after successful signup", async () => {
      mockSignUp.mockResolvedValue({ error: null });

      render(<SignupForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      await userEvent.type(screen.getByLabelText("Password"), "password123");

      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      await waitFor(() => {
        expect(screen.getByText("Check your email")).toBeInTheDocument();
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      });
    });

    it("shows back to login button after success", async () => {
      mockSignUp.mockResolvedValue({ error: null });

      render(<SignupForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      await userEvent.type(screen.getByLabelText("Password"), "password123");

      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Back to login" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("input handling", () => {
    it("updates email state on input change", async () => {
      render(<SignupForm />);

      const emailInput = screen.getByLabelText("Email");
      await userEvent.type(emailInput, "new@example.com");

      expect(emailInput).toHaveValue("new@example.com");
    });

    it("updates password state on input change", async () => {
      render(<SignupForm />);

      const passwordInput = screen.getByLabelText("Password");
      await userEvent.type(passwordInput, "newpassword");

      expect(passwordInput).toHaveValue("newpassword");
    });

    it("clears error when form is resubmitted", async () => {
      mockSignUp
        .mockResolvedValueOnce({ error: { message: "First error" } })
        .mockResolvedValueOnce({ error: null });

      render(<SignupForm />);

      await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
      await userEvent.type(screen.getByLabelText("Password"), "password123");

      // First submission - error
      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second submission - clear error
      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
      });
    });
  });
});
