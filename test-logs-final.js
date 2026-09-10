const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on("pageerror", err => console.log("PAGE ERROR:", err));
  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("CONSOLE ERROR:", msg.text());
    }
  });

  console.log("Visiting /...");
  const r1 = await page.goto("http://localhost:3000/");
  console.log("STATUS:", r1.status());
  await page.waitForTimeout(5000);
  
  console.log("Visiting /chat...");
  const r2 = await page.goto("http://localhost:3000/chat");
  console.log("STATUS:", r2.status());
  await page.waitForTimeout(5000);

  await browser.close();
})();
