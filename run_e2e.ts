import { config } from "dotenv";
config();
import { prisma } from "./src/lib/prisma";
import { execSync } from "child_process";

const mockEmail = "test.e2e.mock@goldenfork.com";

async function run() {
  console.log("Setting up mock employee...");
  const emp = await prisma.employee.upsert({
    where: { email: mockEmail },
    update: {},
    create: {
      name: "E2E Test User",
      email: mockEmail,
      role: "Manager",
      baseSalary: 50000,
      probationSalary: 30000,
      commissionRate: 5.0,
      target: 10000,
      probationDuration: 3,
      isProbation: false,
      failedMonths: 0,
      penalty: 0
    }
  });

  try {
    console.log("Running Playwright tests...");
    execSync("npx playwright test e2e/full-system.spec.ts", { stdio: "inherit" });
  } catch (err) {
    console.error("Test failed", err);
  } finally {
    console.log("Tearing down mock employee...");
    await prisma.employee.delete({
      where: { id: emp.id }
    });
    console.log("Cleanup complete.");
  }
}

run();
