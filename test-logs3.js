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

  const response = await page.goto("http://localhost:3000/");
  console.log("STATUS:", response.status());
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "screenshot.png" });
  await browser.close();
})();
