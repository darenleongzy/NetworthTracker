import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("displays correctly with SEO elements", async ({ page }) => {
    await page.goto("/");

    // Check main heading
    await expect(
      page.getByRole("heading", { name: /Track Your Net Worth/i })
    ).toBeVisible();

    // Check CTA buttons
    await expect(
      page.getByRole("link", { name: /Request Access/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Sign In/i }).first()
    ).toBeVisible();

    // Check dashboard preview section
    await expect(
      page.getByRole("heading", { name: /See Your Finances at a Glance/i })
    ).toBeVisible();

    // Check feature cards
    await expect(page.getByText("Visual Dashboard")).toBeVisible();
    await expect(page.getByText("Live Stock Prices")).toBeVisible();
    await expect(page.getByText("Secure & Private")).toBeVisible();
  });

  test("has correct meta tags", async ({ page }) => {
    await page.goto("/");

    // Check title
    const title = await page.title();
    expect(title).toContain("Net Worth Tracker");

    // Check meta description
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toContain("net worth");

    // Check OG tags
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toBeTruthy();

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("og-image.png");
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Sign In/i }).first().click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
  });

  test("navigates to signup page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Request Access/i }).first().click();
    await expect(page).toHaveURL("/signup");
  });
});

test.describe("SEO Files", () => {
  test("robots.txt is accessible and correct", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);

    const content = await page.content();
    expect(content).toContain("User-Agent: *");
    expect(content).toContain("Disallow: /dashboard/");
    expect(content).toContain("Sitemap:");
  });

  test("sitemap.xml is accessible and valid", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);

    const content = await page.content();
    expect(content).toContain("urlset");
    expect(content).toContain("trackmyworth.xyz");
  });
});
