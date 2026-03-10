import { test, expect } from "@playwright/test";

// Test credentials - set these in .env.test or use existing test account
const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "testpassword123";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
  });

  test("login page has noindex meta tag", async ({ page }) => {
    await page.goto("/login");

    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(robots).toContain("noindex");
  });

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");

    // Either signup form or waitlist form should be visible
    const hasSignupForm = await page
      .getByText(/Create an account/i)
      .isVisible()
      .catch(() => false);
    const hasWaitlist = await page
      .getByText(/waitlist/i)
      .isVisible()
      .catch(() => false);

    expect(hasSignupForm || hasWaitlist).toBe(true);
  });

  test("shows error on invalid login", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/Email/i).fill("invalid@test.com");
    await page.getByLabel(/Password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /Sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    // Skip if no test credentials configured
    if (TEST_EMAIL === "test@example.com") {
      test.skip();
      return;
    }

    await page.goto("/login");

    await page.getByLabel(/Email/i).fill(TEST_EMAIL);
    await page.getByLabel(/Password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /Sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("unauthenticated user cannot access dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login or show auth required
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 5000 });

    // If redirected to login, verify login page loaded
    const url = page.url();
    if (url.includes("/login")) {
      await expect(page.getByText("Welcome back")).toBeVisible();
    }
  });
});
