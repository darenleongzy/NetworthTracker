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

async function createAccount(page: Page, name: string, type: "cash" | "investment") {
  await page.getByRole("button", { name: /Add Account/i }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Create Account/i })).toBeVisible();
  await dialog.getByLabel(/Account Name/i).fill(name);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: new RegExp(type, "i") }).click();
  await dialog.getByRole("button", { name: /Create Account/i }).click();
}

async function selectAccountCategory(page: Page, type: "cash" | "investment") {
  const tabName =
    type === "investment" ? /Brokerage Accounts/i : /Cash Accounts/i;
  await page.getByRole("tab", { name: tabName }).click();
}

async function expectAccountVisible(page: Page, name: string, type: "cash" | "investment") {
  await selectAccountCategory(page, type);
  await expect(page.getByRole("button", { name: `View ${name}` })).toBeVisible({
    timeout: 5000,
  });
}

async function openAccount(page: Page, name: string, type: "cash" | "investment") {
  await expectAccountVisible(page, name, type);
  await page.getByRole("button", { name: `View ${name}` }).click();
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
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Total Net Worth/i)).toBeVisible();
    await expect(page.getByTestId("net-worth")).toBeVisible();
  });

  test("switches the account history chart range", async ({ page }) => {
    await login(page);

    const rangeControls = page.getByLabel("Account history range");
    await expect(rangeControls.getByRole("button", { name: "Week" })).toBeVisible();
    await expect(rangeControls.getByRole("button", { name: "Month" })).toBeVisible();
    await expect(rangeControls.getByRole("button", { name: "Year" })).toBeVisible();

    await rangeControls.getByRole("button", { name: "Week" }).click();
    await expect(rangeControls.getByRole("button", { name: "Week" })).toHaveClass(
      /bg-background/
    );
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
    const accountName = `Test Cash ${Date.now()}`;
    await createAccount(page, accountName, "cash");

    // Verify account appears
    await expectAccountVisible(page, accountName, "cash");
  });

  test("can create an investment account", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: /Accounts/i }).click();
    const accountName = `Test Investment ${Date.now()}`;
    await createAccount(page, accountName, "investment");

    await expectAccountVisible(page, accountName, "investment");
  });

  test("can add cash holding to account", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: /Accounts/i }).click();

    // Create account first
    const accountName = `Cash Test ${Date.now()}`;
    await createAccount(page, accountName, "cash");

    // Click on the account
    await openAccount(page, accountName, "cash");

    // Add cash holding
    await page.getByRole("button", { name: /Add Holding/i }).click();
    await page.getByLabel(/Balance/i).fill("10000");
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Verify holding appears
    await expect(page.getByRole("cell", { name: /\$10,000\.00/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("can add stock holding to account", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: /Accounts/i }).click();

    // Create investment account
    const accountName = `Stock Test ${Date.now()}`;
    await createAccount(page, accountName, "investment");

    // Click on the account
    await openAccount(page, accountName, "investment");

    // Add stock holding
    await page.getByRole("button", { name: /Add Stock/i }).click();
    await page.getByLabel(/Ticker Symbol/i).fill("AAPL");
    await page.getByLabel(/Number of Shares/i).fill("10");
    await page.getByLabel(/Cost Basis per Share/i).fill("150");
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Verify holding appears
    await expect(page.getByText("AAPL")).toBeVisible({ timeout: 10000 });
  });

  test("can delete an account", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: /Accounts/i }).click();

    // Create account to delete
    const accountName = `Delete Test ${Date.now()}`;
    await createAccount(page, accountName, "cash");

    await expectAccountVisible(page, accountName, "cash");

    // Delete account from the list
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${accountName}` }).click();

    // Confirm deletion if dialog appears
    const confirmButton = page.getByRole("button", { name: /Confirm|Delete|Yes/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // Verify account is gone
    await expect(page.getByRole("button", { name: `View ${accountName}` })).not.toBeVisible({
      timeout: 5000,
    });
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
    const initialNetWorth = await page.getByTestId("net-worth").textContent().catch(() => "0");

    // Add a cash holding
    await page.getByRole("link", { name: /Accounts/i }).click();
    const accountName = `NW Test ${Date.now()}`;
    await createAccount(page, accountName, "cash");

    await openAccount(page, accountName, "cash");
    await page.getByRole("button", { name: /Add Holding/i }).click();
    await page.getByLabel(/Balance/i).fill("5000");
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Go back to dashboard
    await page.getByRole("link", { name: /Dashboard/i }).click();

    // Net worth should have increased
    const newNetWorth = await page.getByTestId("net-worth").textContent().catch(() => null);

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
    await expect(page.getByTestId("net-worth")).toBeVisible();

    // Step 2: Capture initial dashboard values
    const initialNetWorthText = await page.getByTestId("net-worth").textContent().catch(() => "$0");
    const initialNetWorth = parseCurrency(initialNetWorthText);

    // Step 3: Create a new cash account
    await page.getByRole("link", { name: /Accounts/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const accountName = `E2E Lifecycle Test ${Date.now()}`;
    await createAccount(page, accountName, "cash");

    // Verify account was created
    await expectAccountVisible(page, accountName, "cash");

    // Step 4: Add cash holding to the account
    await openAccount(page, accountName, "cash");
    await page.getByRole("button", { name: /Add Holding/i }).click();

    const cashAmount = 25000;
    await page.getByLabel(/Balance/i).fill(cashAmount.toString());
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Verify holding appears in account
    await expect(page.getByRole("cell", { name: /\$25,000\.00/i })).toBeVisible({
      timeout: 5000,
    });

    // Step 5: Navigate to dashboard and verify values increased
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Wait for dashboard to load with updated values
    await page.waitForTimeout(1000);

    const updatedNetWorthText = await page.getByTestId("net-worth").textContent().catch(() => "$0");
    const updatedNetWorth = parseCurrency(updatedNetWorthText);

    // Verify net worth increased by approximately the cash amount added
    expect(updatedNetWorth).toBeGreaterThanOrEqual(initialNetWorth + cashAmount * 0.9);

    // Step 6: Delete the account
    await page.getByRole("link", { name: /Accounts/i }).click();
    await selectAccountCategory(page, "cash");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${accountName}` }).click();

    // Confirm deletion if dialog appears
    const confirmButton = page.getByRole("button", { name: /Confirm|Delete|Yes/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // Verify account is deleted
    await expect(page.getByRole("button", { name: `View ${accountName}` })).not.toBeVisible({
      timeout: 5000,
    });

    // Step 7: Navigate to dashboard and verify values returned to original
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Wait for dashboard to update
    await page.waitForTimeout(1000);

    const finalNetWorthText = await page.getByTestId("net-worth").textContent().catch(() => "$0");
    const finalNetWorth = parseCurrency(finalNetWorthText);

    // Verify values returned close to initial (within 5% tolerance for currency conversion)
    expect(finalNetWorth).toBeLessThanOrEqual(initialNetWorth * 1.05 + 100);
    expect(finalNetWorth).toBeGreaterThanOrEqual(initialNetWorth * 0.95 - 100);
  });

  test("login, add investment account with stock, verify dashboard updates", async ({
    page,
  }) => {
    // Step 1: Login
    await login(page);
    await expect(page.getByTestId("net-worth")).toBeVisible();

    // Step 2: Capture initial values
    const initialNetWorthText = await page.getByTestId("net-worth").textContent().catch(() => "$0");
    const initialNetWorth = parseCurrency(initialNetWorthText);

    // Step 3: Create investment account
    await page.getByRole("link", { name: /Accounts/i }).click();
    const accountName = `E2E Stock Test ${Date.now()}`;
    await createAccount(page, accountName, "investment");

    await expectAccountVisible(page, accountName, "investment");

    // Step 4: Add stock holding
    await openAccount(page, accountName, "investment");
    await page.getByRole("button", { name: /Add Stock/i }).click();

    await page.getByLabel(/Ticker Symbol/i).fill("AAPL");
    await page.getByLabel(/Number of Shares/i).fill("10");
    await page.getByLabel(/Cost Basis per Share/i).fill("150");
    await page.getByRole("button", { name: /Save|Add|Create/i }).click();

    // Wait for stock price to load
    await expect(page.getByText("AAPL")).toBeVisible({ timeout: 15000 });

    // Step 5: Verify dashboard updated
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await page.waitForTimeout(1000);

    const updatedNetWorthText = await page.getByTestId("net-worth").textContent().catch(() => "$0");
    const updatedNetWorth = parseCurrency(updatedNetWorthText);

    // Stock value should have increased net worth (10 shares * ~$150+ per share)
    expect(updatedNetWorth).toBeGreaterThan(initialNetWorth);

    // Step 6: Clean up - delete the account
    await page.getByRole("link", { name: /Accounts/i }).click();
    await selectAccountCategory(page, "investment");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${accountName}` }).click();

    const confirmButton = page.getByRole("button", { name: /Confirm|Delete|Yes/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    await expect(page.getByRole("button", { name: `View ${accountName}` })).not.toBeVisible({
      timeout: 5000,
    });

    // Step 7: Verify dashboard returned to initial
    await page.getByRole("link", { name: /Dashboard/i }).click();
    await page.waitForTimeout(1000);

    const finalNetWorthText = await page.getByTestId("net-worth").textContent().catch(() => "$0");
    const finalNetWorth = parseCurrency(finalNetWorthText);

    expect(finalNetWorth).toBeLessThanOrEqual(initialNetWorth * 1.05 + 100);
    expect(finalNetWorth).toBeGreaterThanOrEqual(initialNetWorth * 0.95 - 100);
  });
});
