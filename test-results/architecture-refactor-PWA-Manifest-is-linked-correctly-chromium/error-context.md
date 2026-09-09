# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: architecture-refactor.spec.ts >> PWA Manifest is linked correctly
- Location: e2e\architecture-refactor.spec.ts:6:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | // Since it's hard to do full DB auth in CI without seeding, we will just test the public routes,
  4  | // the manifest, and ensure the build renders without React errors (Error boundaries).
  5  | 
  6  | test("PWA Manifest is linked correctly", async ({ page }) => {
> 7  |   await page.goto("/");
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  8  |   const manifest = await page.locator('link[rel="manifest"]').getAttribute("href");
  9  |   expect(manifest).toBe("/manifest.json");
  10 | });
  11 | 
  12 | test("Error Boundary catches errors without crashing app", async ({ page }) => {
  13 |   // We can't easily force a render error in production without code changes,
  14 |   // but we can verify the ErrorBoundary component is loaded in the bundle.
  15 |   await page.goto("/login"); // or any public page
  16 |   expect(await page.title()).not.toBe("Internal Server Error");
  17 | });
  18 | 
  19 | test("Notification Manager queues notifications", async ({ page }) => {
  20 |   // We can test this by evaluating the notifier in the browser context if we expose it,
  21 |   // but let's just ensure the sonner toaster container is present.
  22 |   await page.goto("/");
  23 |   // The layout should mount the toaster
  24 |   const toaster = page.locator('section[data-sonner-toaster="true"]');
  25 |   // It might only appear when a toast is triggered, so we just check no errors on load
  26 |   const hasErrors = await page.evaluate(() => window.onerror !== null);
  27 |   expect(hasErrors).toBe(false);
  28 | });
  29 | 
  30 | 
```