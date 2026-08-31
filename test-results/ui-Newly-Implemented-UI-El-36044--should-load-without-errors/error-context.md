# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.ts >> Newly Implemented UI Elements E2E >> Approvals Data Table should load without errors
- Location: e2e\ui.spec.ts:47:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="text"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "The Golden Fork" [level=1] [ref=e5]
      - paragraph [ref=e6]: Sign in to your employee account
    - button "Sign in with Google" [ref=e7]
  - alert [ref=e13]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Newly Implemented UI Elements E2E', () => {
  4  |   test('Command Palette should open and function without errors', async ({ page }) => {
  5  |     // We assume the app is running on localhost:3000
  6  |     await page.goto('http://localhost:3000/login');
  7  |     
  8  |     // Login
  9  |     await page.fill('input[type="text"]', 'EMP002');
  10 |     await page.fill('input[type="password"]', 'pass123');
  11 |     await page.click('button[type="submit"]');
  12 | 
  13 |     // Wait for navigation to dashboard
  14 |     await page.waitForURL('http://localhost:3000/');
  15 | 
  16 |     // Trigger Command Palette via Ctrl+K
  17 |     await page.keyboard.press('Control+k');
  18 | 
  19 |     // Verify it opens
  20 |     const cmdInput = page.locator('[placeholder="Type a command or search..."]');
  21 |     await expect(cmdInput).toBeVisible();
  22 | 
  23 |     // Close Command Palette
  24 |     await page.keyboard.press('Escape');
  25 |     await expect(cmdInput).toBeHidden();
  26 |   });
  27 | 
  28 |   test('Settings Page should load Tabs and render correctly', async ({ page }) => {
  29 |     await page.goto('http://localhost:3000/login');
  30 |     await page.fill('input[type="text"]', 'EMP001'); // Manager
  31 |     await page.fill('input[type="password"]', 'pass123');
  32 |     await page.click('button[type="submit"]');
  33 | 
  34 |     await page.goto('http://localhost:3000/settings');
  35 | 
  36 |     // Check tabs
  37 |     await expect(page.locator('text="Personal Info"')).toBeVisible();
  38 |     await expect(page.locator('text="System Admin"')).toBeVisible();
  39 | 
  40 |     // Click System Admin
  41 |     await page.click('text="System Admin"');
  42 | 
  43 |     // Verify system admin content
  44 |     await expect(page.locator('text="System Broadcast"')).toBeVisible();
  45 |   });
  46 | 
  47 |   test('Approvals Data Table should load without errors', async ({ page }) => {
  48 |     await page.goto('http://localhost:3000/login');
> 49 |     await page.fill('input[type="text"]', 'EMP001'); // Manager
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  50 |     await page.fill('input[type="password"]', 'pass123');
  51 |     await page.click('button[type="submit"]');
  52 | 
  53 |     await page.goto('http://localhost:3000/approvals');
  54 | 
  55 |     // Verify table renders
  56 |     await expect(page.locator('text="Pending Sales Conversions"')).toBeVisible();
  57 |   });
  58 | });
  59 | 
```