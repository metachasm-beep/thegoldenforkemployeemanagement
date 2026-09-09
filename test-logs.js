const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("pageerror", err => console.log("PAGE ERROR:", err));
  page.on("console", msg => console.log("CONSOLE:", msg.text()));
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(2000);
  await browser.close();
})();
