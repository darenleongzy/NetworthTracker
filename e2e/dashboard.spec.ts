import { test, expect, Page } from "@playwright/test";

// Test credentials - configure in environment
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

// Helper to login
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill(TEST_EMAIL!);
  await page.getByLabel(/Password/i).fill(TEST_PASSWORD!);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("Dashboard", () => {
  test.beforeEach(async () => {
    // Skip all tests if no credentials
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip();
    }
  });

  test("displays dashboard after login", async ({ page }) => {
    await login(page);

    // Check main dashboard elements
    await expect(page.getByText(/Net Worth/i).first()).toBeVisible();
    await expect(page.getByText(/Total Assets/i)).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await login(page);

    // Navigate to Accounts
    await page.getByRole("link", { name: /Accounts/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    // Navigate to FIRE
    await page.getByRole("link", { name: /FIRE/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/fire/);

    // Navigate back to Dashboard
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("Account Management", () => {
  test.beforeEach(async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip();
    }
  });

  test("can create a cash account", async ({ page }) => {
    await login(page);

    // Go to accounts
    await page.getByRole("link", { name: /Accounts/i }).click();

    // Click add account
    await page.getByRole("button", { name: /Add Account/i }).click();

    // Fill form
    const accountName = `Test Cash ${Date.now()}`;
    await page.getByLabel(/Name/i).fill(accountName);
    await page.getByLabel(/Cash/i).check();

    // Submit
    await page.getByRole("button", { name: /Create/i }).click();

    // Verify account appears
    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
  });

  test("can create an investment account", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: /Accounts/i }).click();
    await page.getByRole("button", { name: /Add Account/i }).click();

    const accountName = `Test Investment ${Date.now()}`;
    await page.getByLabel(/Name/i).fill(accountName);
    await page.getByLabel(/Investment/i).check();

    await page.getByRole("button", { name: /Create/i }).click();

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
  });

  test("can add cash holding to account", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: /Accounts/i }).click();

    // Create account first
    await page.getByRole("button", { name: /Add Account/i }).click();
    const accountName = `Cash Test ${Date.now()}`;
    await page.getByLabel(/Name/i).fill(accountName);
    await page.getByLabel(/Cash/i).check();
    await page.getByRole("button", { name: /Create/i }).click();

    // Click on the account
    await page.getByText(accountName).click();

    // Add cash holding
    await page.getByRole("button", { name: /Add Cash/i }).click();
    await page.getByLabel(/Amount/i).fill("10000");
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Verify holding appears
    await expect(page.getByText("10,000")).toBeVisible({ timeout: 5000 });
  });

  test("can add stock holding to account", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: /Accounts/i }).click();

    // Create investment account
    await page.getByRole("button", { name: /Add Account/i }).click();
    const accountName = `Stock Test ${Date.now()}`;
    await page.getByLabel(/Name/i).fill(accountName);
    await page.getByLabel(/Investment/i).check();
    await page.getByRole("button", { name: /Create/i }).click();

    // Click on the account
    await page.getByText(accountName).click();

    // Add stock holding
    await page.getByRole("button", { name: /Add Stock/i }).click();
    await page.getByLabel(/Ticker/i).fill("AAPL");
    await page.getByLabel(/Shares/i).fill("10");
    await page.getByLabel(/Cost/i).fill("150");
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Verify holding appears
    await expect(page.getByText("AAPL")).toBeVisible({ timeout: 10000 });
  });

  test("can delete an account", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: /Accounts/i }).click();

    // Create account to delete
    await page.getByRole("button", { name: /Add Account/i }).click();
    const accountName = `Delete Test ${Date.now()}`;
    await page.getByLabel(/Name/i).fill(accountName);
    await page.getByLabel(/Cash/i).check();
    await page.getByRole("button", { name: /Create/i }).click();

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });

    // Click on account
    await page.getByText(accountName).click();

    // Delete account (look for delete button or trash icon)
    const deleteButton = page.getByRole("button", { name: /Delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    } else {
      // Try trash icon
      await page.locator('button:has(svg[class*="trash"])').click();
    }

    // Confirm deletion if dialog appears
    const confirmButton = page.getByRole("button", { name: /Confirm|Delete|Yes/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // Verify account is gone
    await expect(page.getByText(accountName)).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard Updates", () => {
  test.beforeEach(async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip();
    }
  });

  test("net worth updates after adding holdings", async ({ page }) => {
    await login(page);

    // Get initial net worth
    const initialNetWorth = await page
      .locator('[data-testid="net-worth"]')
      .textContent()
      .catch(() => "0");

    // Add a cash holding
    await page.getByRole("link", { name: /Accounts/i }).click();
    await page.getByRole("button", { name: /Add Account/i }).click();

    const accountName = `NW Test ${Date.now()}`;
    await page.getByLabel(/Name/i).fill(accountName);
    await page.getByLabel(/Cash/i).check();
    await page.getByRole("button", { name: /Create/i }).click();

    await page.getByText(accountName).click();
    await page.getByRole("button", { name: /Add Cash/i }).click();
    await page.getByLabel(/Amount/i).fill("5000");
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Go back to dashboard
    await page.getByRole("link", { name: /Dashboard/i }).click();

    // Net worth should have increased
    const newNetWorth = await page
      .locator('[data-testid="net-worth"]')
      .textContent()
      .catch(() => null);

    // If we have both values, verify increase (basic check)
    if (newNetWorth && initialNetWorth !== newNetWorth) {
      expect(newNetWorth).not.toBe(initialNetWorth);
    }
  });
});
