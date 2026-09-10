const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  // Intercept session
  await context.route("**/api/auth/session", route => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { name: "Test Manager", email: "test@example.com", role: "Manager", employeeId: "cm0m0c0xx0000000000000000" },
        expires: "9999-12-31T23:59:59.999Z"
      })
    });
  });

  const page = await context.newPage();
  
  page.on("pageerror", err => console.log("PAGE ERROR:", err));
  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("CONSOLE ERROR:", msg.text());
    }
  });

  console.log("Visiting /...");
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(5000);
  console.log("URL:", page.url());
  
  console.log("Visiting /chat...");
  await page.goto("http://localhost:3000/chat");
  await page.waitForTimeout(5000);
  console.log("URL:", page.url());

  await browser.close();
})();
