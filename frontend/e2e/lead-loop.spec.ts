import { expect, test } from "@playwright/test";

/**
 * Smoke E2E: login → capture lead → convert → move Kanban with reason.
 * Requires frontend (:5173) and backend (:8000) with demo credentials.
 */
test("agent lead to kanban loop", async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@demo.test");
  await page.getByLabel("Password").fill("demo12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/($|\?)/, { timeout: 25_000 });
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

  await page.goto("/leads");
  await page.getByRole("button", { name: /Capture lead/i }).first().click();
  const stamp = Date.now();
  const name = `E2E Lead ${stamp}`;
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(`e2e-${stamp}@example.com`);
  await page.getByRole("button", { name: /^Capture$/i }).click();
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });

  await page.getByText(name).first().click();
  await expect(page.getByRole("button", { name: /^Convert$/i })).toBeVisible({
    timeout: 10_000,
  });

  // Wait until pipeline + stage auto-select (not placeholders).
  const convertPanel = page.getByText("Convert to opportunity").locator("..");
  await expect(convertPanel.getByRole("combobox").nth(0)).not.toHaveText(
    /Pipeline|Select/i,
    { timeout: 15_000 },
  );
  await expect(convertPanel.getByRole("combobox").nth(1)).not.toHaveText(
    /Starting stage|Select/i,
    { timeout: 15_000 },
  );

  const convertResponse = page.waitForResponse(
    (r) => r.url().includes("/convert/") && r.request().method() === "POST",
    { timeout: 20_000 },
  );
  await page.getByRole("button", { name: /^Convert$/i }).click();
  const res = await convertResponse;
  expect(res.ok()).toBeTruthy();

  await page.goto("/pipeline");
  await expect(page.getByRole("heading", { name: /Pipeline/i })).toBeVisible({
    timeout: 15_000,
  });

  // Converted deals are titled like "Buy — {lead name}".
  const card = page.getByRole("button").filter({ hasText: name }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();

  await expect(page.getByText(/Move .+ to:/i)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Contacted" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByPlaceholder(/Reason/i).fill("E2E stage move");
  await dialog.getByRole("button", { name: /Move deal/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
});
