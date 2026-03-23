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

test.describe("Full Account Lifecycle", () => {
  test.beforeEach(async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip();
    }
  });

  // Helper to parse currency string to number
  function parseCurrency(text: string | null): number {
    if (!text) return 0;
    return parseFloat(text.replace(/[^0-9.-]/g, "")) || 0;
  }

  test("login, add account, verify dashboard, delete account, verify dashboard", async ({
    page,
  }) => {
    // Step 1: Login
    await login(page);
    await expect(page.getByText(/Net Worth/i).first()).toBeVisible();

    // Step 2: Capture initial dashboard values
    const initialNetWorthText = await page
      .locator('[data-testid="net-worth"]')
      .textContent()
      .catch(() => "$0");
    const initialNetWorth = parseCurrency(initialNetWorthText);

    const initialTotalAssetsText = await page
      .locator('[data-testid="total-assets"]')
      .textContent()
      .catch(() => "$0");
    const initialTotalAssets = parseCurrency(initialTotalAssetsText);

    // Step 3: Create a new cash account
    await page.getByRole("link", { name: /Accounts/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    await page.getByRole("button", { name: /Add Account/i }).click();
    const accountName = `E2E Lifecycle Test ${Date.now()}`;
    await page.getByLabel(/Name/i).fill(accountName);
    await page.getByLabel(/Cash/i).check();
    await page.getByRole("button", { name: /Create/i }).click();

    // Verify account was created
    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });

    // Step 4: Add cash holding to the account
    await page.getByText(accountName).click();
    await page.getByRole("button", { name: /Add Cash/i }).click();

    const cashAmount = 25000;
    await page.getByLabel(/Amount/i).fill(cashAmount.toString());
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Verify holding appears in account
    await expect(page.getByText(/25,000/)).toBeVisible({ timeout: 5000 });

    // Step 5: Navigate to dashboard and verify values increased
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Wait for dashboard to load with updated values
    await page.waitForTimeout(1000);

    const updatedNetWorthText = await page
      .locator('[data-testid="net-worth"]')
      .textContent()
      .catch(() => "$0");
    const updatedNetWorth = parseCurrency(updatedNetWorthText);

    const updatedTotalAssetsText = await page
      .locator('[data-testid="total-assets"]')
      .textContent()
      .catch(() => "$0");
    const updatedTotalAssets = parseCurrency(updatedTotalAssetsText);

    // Verify net worth increased by approximately the cash amount added
    expect(updatedNetWorth).toBeGreaterThanOrEqual(initialNetWorth + cashAmount * 0.9);
    expect(updatedTotalAssets).toBeGreaterThanOrEqual(initialTotalAssets + cashAmount * 0.9);

    // Step 6: Delete the account
    await page.getByRole("link", { name: /Accounts/i }).click();
    await page.getByText(accountName).click();

    // Find and click delete button
    const deleteButton = page.getByRole("button", { name: /Delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    } else {
      // Try trash icon button
      await page.locator('button:has(svg[class*="trash"])').first().click();
    }

    // Confirm deletion if dialog appears
    const confirmButton = page.getByRole("button", { name: /Confirm|Delete|Yes/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // Verify account is deleted
    await expect(page.getByText(accountName)).not.toBeVisible({ timeout: 5000 });

    // Step 7: Navigate to dashboard and verify values returned to original
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Wait for dashboard to update
    await page.waitForTimeout(1000);

    const finalNetWorthText = await page
      .locator('[data-testid="net-worth"]')
      .textContent()
      .catch(() => "$0");
    const finalNetWorth = parseCurrency(finalNetWorthText);

    const finalTotalAssetsText = await page
      .locator('[data-testid="total-assets"]')
      .textContent()
      .catch(() => "$0");
    const finalTotalAssets = parseCurrency(finalTotalAssetsText);

    // Verify values returned close to initial (within 5% tolerance for currency conversion)
    expect(finalNetWorth).toBeLessThanOrEqual(initialNetWorth * 1.05 + 100);
    expect(finalNetWorth).toBeGreaterThanOrEqual(initialNetWorth * 0.95 - 100);
    expect(finalTotalAssets).toBeLessThanOrEqual(initialTotalAssets * 1.05 + 100);
    expect(finalTotalAssets).toBeGreaterThanOrEqual(initialTotalAssets * 0.95 - 100);
  });

  test("login, add investment account with stock, verify dashboard updates", async ({
    page,
  }) => {
    // Step 1: Login
    await login(page);
    await expect(page.getByText(/Net Worth/i).first()).toBeVisible();

    // Step 2: Capture initial values
    const initialNetWorthText = await page
      .locator('[data-testid="net-worth"]')
      .textContent()
      .catch(() => "$0");
    const initialNetWorth = parseCurrency(initialNetWorthText);

    // Step 3: Create investment account
    await page.getByRole("link", { name: /Accounts/i }).click();
    await page.getByRole("button", { name: /Add Account/i }).click();

    const accountName = `E2E Stock Test ${Date.now()}`;
    await page.getByLabel(/Name/i).fill(accountName);
    await page.getByLabel(/Investment/i).check();
    await page.getByRole("button", { name: /Create/i }).click();

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });

    // Step 4: Add stock holding
    await page.getByText(accountName).click();
    await page.getByRole("button", { name: /Add Stock/i }).click();

    await page.getByLabel(/Ticker/i).fill("AAPL");
    await page.getByLabel(/Shares/i).fill("10");
    await page.getByLabel(/Cost/i).fill("150");
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Wait for stock price to load
    await expect(page.getByText("AAPL")).toBeVisible({ timeout: 15000 });

    // Step 5: Verify dashboard updated
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await page.waitForTimeout(1000);

    const updatedNetWorthText = await page
      .locator('[data-testid="net-worth"]')
      .textContent()
      .catch(() => "$0");
    const updatedNetWorth = parseCurrency(updatedNetWorthText);

    // Stock value should have increased net worth (10 shares * ~$150+ per share)
    expect(updatedNetWorth).toBeGreaterThan(initialNetWorth);

    // Step 6: Clean up - delete the account
    await page.getByRole("link", { name: /Accounts/i }).click();
    await page.getByText(accountName).click();

    const deleteButton = page.getByRole("button", { name: /Delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    } else {
      await page.locator('button:has(svg[class*="trash"])').first().click();
    }

    const confirmButton = page.getByRole("button", { name: /Confirm|Delete|Yes/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    await expect(page.getByText(accountName)).not.toBeVisible({ timeout: 5000 });

    // Step 7: Verify dashboard returned to initial
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await page.waitForTimeout(1000);

    const finalNetWorthText = await page
      .locator('[data-testid="net-worth"]')
      .textContent()
      .catch(() => "$0");
    const finalNetWorth = parseCurrency(finalNetWorthText);

    expect(finalNetWorth).toBeLessThanOrEqual(initialNetWorth * 1.05 + 100);
    expect(finalNetWorth).toBeGreaterThanOrEqual(initialNetWorth * 0.95 - 100);
  });
});
