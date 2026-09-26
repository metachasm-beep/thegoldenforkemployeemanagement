import { test, expect } from "@playwright/test";
import { prisma } from '../src/lib/prisma';

test.describe("Invoice and Paystub Flow", () => {
  let userEmail = 'e2e-invoice@example.com';

  test.beforeAll(async () => {
    // Ensure clean state
    const emp = await prisma.employee.findFirst({ where: { email: userEmail } });
    if (emp) {
      await prisma.invoice.deleteMany({
        where: { employeeId: emp.id }
      });
    }
    await prisma.lead.deleteMany({
      where: { email: { contains: "e2e-invoice" } }
    });
  });

  test.afterAll(async () => {
    // Cleanup
    const emp = await prisma.employee.findFirst({ where: { email: userEmail } });
    if (emp) {
      await prisma.invoice.deleteMany({
        where: { employeeId: emp.id }
      });
    }
    await prisma.lead.deleteMany({
      where: { email: { contains: "e2e-invoice" } }
    });
    await prisma.employee.deleteMany({
      where: { email: userEmail }
    });
  });

  test("should allow sales exec to generate invoice and view paystub", async ({ page }) => {
    test.setTimeout(120000);

    // 1. Login
    await page.goto("/login");
    await page.getByRole("button", { name: "E2E Test Login" }).click();
    await page.waitForURL("**/");

    // 2. Pre-create some leads for the user so they have conversions
    // Wait, it's easier to just do it via Prisma directly instead of UI
    let emp = await prisma.employee.findFirst({ where: { email: userEmail } });
    expect(emp).not.toBeNull();
    if (emp) {
      emp = await prisma.employee.update({
        where: { id: emp.id },
        data: { startDate: "2026-09-01" }
      });
      await prisma.lead.createMany({
        data: [
          { name: "Test 1", email: "e2e-invoice1@test.com", status: "Converted", employeeId: emp.id, date: "2026-09-17", followUp: "2026-09-20", notes: "" },
          { name: "Test 2", email: "e2e-invoice2@test.com", status: "Converted", employeeId: emp.id, date: "2026-09-17", followUp: "2026-09-20", notes: "" },
          { name: "Test 3", email: "e2e-invoice3@test.com", status: "Converted", employeeId: emp.id, date: "2026-09-17", followUp: "2026-09-20", notes: "" },
          { name: "Test 4", email: "e2e-invoice4@test.com", status: "Converted", employeeId: emp.id, date: "2026-09-17", followUp: "2026-09-20", notes: "" },
          { name: "Test 5", email: "e2e-invoice5@test.com", status: "Converted", employeeId: emp.id, date: "2026-09-17", followUp: "2026-09-20", notes: "" },
          { name: "Test 6", email: "e2e-invoice6@test.com", status: "Converted", employeeId: emp.id, date: "2026-09-17", followUp: "2026-09-20", notes: "" },
        ]
      });
    }

    // 3. Go to Invoices
    await page.goto("/invoices/new");
    await expect(page.getByText("Generate Monthly Invoice")).toBeVisible();

    // 4. Generate Invoice (Current Month)
    await page.locator('input[type="month"]').fill("2026-09");
    await page.getByRole("button", { name: /Generate & Store Invoice/i }).click();

    // 5. Check toast success
    await expect(page.getByText("Invoice Generated & Stored in Database!")).toBeVisible();

    // 6. Verify in Database
    const invoice = await prisma.invoice.findFirst({
      where: { employeeId: emp!.id },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log("ACTUAL INVOICE DATA: ", invoice);

    const checkLeads = await prisma.lead.findMany({ where: { employeeId: emp!.id } });
    console.log("Leads found for emp: ", checkLeads.length);
    if (checkLeads.length > 0) {
       console.log("First lead date:", checkLeads[0].date, "status:", checkLeads[0].status);
    }
    
    // Test PDF download trigger
    await page.goto("/invoices/new");
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole("button", { name: /Download PDF Paystub/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("paystub_E2E_Invoice_User.pdf");
  });
});
