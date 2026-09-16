import { test, expect } from "@playwright/test";

test("E2E full system traversal", async ({ page }) => {
  await page.goto("/login");
  
  // Click E2E Test Login
  await page.getByRole("button", { name: "E2E Test Login" }).click();
  
  // Wait for dashboard to load
  await page.waitForURL("**/");
  
  // 2. Dashboard UI
  await expect(page.getByText("E2E Test User")).toBeVisible();
  
  // 3. Settings Module
  await page.goto("/settings");
  await expect(page.getByText("Personal Information")).toBeVisible();
  
  // 4. Team Page
  await page.goto("/team");
  await expect(page.getByText("Team Directory")).toBeVisible();
  
  // 5. Chat Module
  await page.goto("/chat");
  await expect(page.getByText("Select a conversation")).toBeVisible();
  
  // 6. Leads / Kanban
  await page.goto("/leads/new");
  await expect(page.getByText("New Lead")).toBeVisible();
  
  // 7. PTO
  await page.goto("/pto/new");
  
  // 8. Sign out
  await page.goto("/");
});
