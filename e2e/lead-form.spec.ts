import { test, expect } from "@playwright/test";
import { prisma } from '../src/lib/prisma';

test.describe("Lead Form UX Features", () => {
  test.setTimeout(120000);
  let userEmail = 'e2e@example.com';

  test.beforeAll(async () => {
    // Clean up any old leads with test emails just in case
    await prisma.lead.deleteMany({
      where: { email: { contains: "test-duplicate" } }
    });
  });

  test.afterAll(async () => {
    // Delete all mock data created
    await prisma.lead.deleteMany({
      where: { email: { contains: "test-duplicate" } }
    });
  });

  test("should test all new lead logging features", async ({ page }) => {
    // 1. Login
    await page.goto("/login");
    await page.getByRole("button", { name: "E2E Test Login" }).click();
    await page.waitForURL("**/");

    // 2. Go to New Lead form
    await page.goto("/leads/new");
    await expect(page.getByText("Log a New Lead")).toBeVisible();

    // 3. Test Feature 18: Inline Data Formatting (Phone)
    const phoneInput = page.getByLabel("Phone");
    await phoneInput.fill("5551234567");
    await expect(phoneInput).toHaveValue("(555) 123-4567"); // Should auto-format

    // 4. Fill other basic fields
    await page.getByLabel("Lead Name").fill("Test John Doe");
    await page.getByLabel("LinkedIn URL").fill("https://linkedin.com/in/test");
    
    // 5. Test Feature 13: Structured Objections
    await page.getByRole('button', { name: 'Price' }).click();
    await page.getByRole('button', { name: 'Timing' }).click();

    // 6. Test Feature 16: Next Action Context & Stage
    await page.getByLabel("Stage").selectOption("Proposal Sent");
    await page.getByLabel("Next Action").selectOption("Demo");

    // Feature 9 check: Follow-up should default based on Stage (we won't strictly check date string format, but ensure it's not empty)
    const followUpInput = page.getByLabel("Follow-up Date");
    const val = await followUpInput.inputValue();
    expect(val).not.toBe('');

    // 7. Test Feature 11: Real-time Duplicate Detection & Feature 8: Save & Add Another
    const emailInput = page.getByLabel("Email");
    await emailInput.fill("test-duplicate@example.com");
    await emailInput.blur(); // Trigger the blur event
    // No warning should appear initially
    await expect(page.getByText("Warning: A lead with this email already exists")).not.toBeVisible();

    // 8. Submit using "Save & Add Another"
    await page.getByRole('button', { name: "Save & Add Another" }).click();
    
    // Wait for the success toast
    await expect(page.getByText("Lead Logged Successfully!")).toBeVisible();

    // Ensure we are STILL on the /leads/new page (didn't redirect)
    await expect(page).toHaveURL(/.*\/leads\/new/);

    // Now, test Duplicate Detection by typing the same email again
    await emailInput.fill("test-duplicate@example.com");
    await emailInput.blur();
    
    // Warning SHOULD appear this time because we just saved it
    await expect(page.getByText("Warning: A lead with this email already exists")).toBeVisible();

    // 9. Test Feature 7 (Auto-Assign): Let's verify in DB that the lead was assigned to the E2E user
    const savedLead = await prisma.lead.findFirst({
      where: { email: "test-duplicate@example.com" }
    });
    
    expect(savedLead).not.toBeNull();
    expect(savedLead?.phone).toBe("(555) 123-4567");
    expect(savedLead?.objections).toContain("Price");
    expect(savedLead?.objections).toContain("Timing");
    expect(savedLead?.nextAction).toBe("Demo");
    expect(savedLead?.status).toBe("Proposal Sent");
    
    // Check auto-assignment
    const emp = await prisma.employee.findFirst({ where: { email: userEmail } });
    expect(savedLead?.employeeId).toBe(emp?.id);
  });
});
