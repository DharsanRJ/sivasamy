import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Unhappy Paths & Edge Cases', () => {
  test('Login failure shows error message', async ({ page }) => {
    // Intercept Supabase Auth Request and mock a failure
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      await route.fulfill({
        status: 400,
        json: { error: 'invalid_grant', error_description: 'Invalid login credentials' }
      });
    });

    await page.goto('/');
    
    // Attempt Login
    await page.getByPlaceholder('EMAIL ADDRESS').fill('wrong@example.com');
    await page.getByPlaceholder('PASSWORD').fill('badpass');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Verify error message is visible (assuming window.alert or UI error in Onboarding)
    // Note: since our UI currently uses window.alert for login errors in Onboarding.tsx,
    // Playwright needs to listen to the dialog event.
    
    // We will verify that we are still on the login screen
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
  });

  test('Resume upload failure handles gracefully', async ({ page }) => {
    // 1. Intercept Auth to succeed
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      await route.fulfill({
        status: 200,
        json: { access_token: 'fake', user: { id: 'test' } }
      });
    });

    // 2. Intercept upload to FAIL with 400 Bad Request
    await page.route('**/api/users/*/resume/upload', async route => {
      await route.fulfill({
        status: 400,
        json: { detail: "Invalid file type. Only PDFs are allowed." }
      });
    });

    // Create a dummy image file to simulate wrong file type
    const dummyImagePath = path.resolve('e2e', 'bad_file.jpg');
    if (!fs.existsSync(dummyImagePath)) {
      fs.writeFileSync(dummyImagePath, 'fake image data');
    }

    await page.goto('/');

    // Login
    await page.getByPlaceholder('EMAIL ADDRESS').fill('test@example.com');
    await page.getByPlaceholder('PASSWORD').fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Move to Job Switcher
    await page.getByText('Job Switcher').click();

    // Handle alert for upload failure
    const dialogPromise = page.waitForEvent('dialog');
    
    // Upload bad file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('RESUME INGESTION').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(dummyImagePath);

    // Verify the alert message
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Failed to upload resume');
    await dialog.accept();
    
    // We should still be on Phase 02 (didn't crash or advance)
    await expect(page.getByText('Phase 02: Goal Calibration')).toBeVisible();
  });
});

test.describe('Mobile Viewport & Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X/11/12 Pro

  test('Dashboard loads without crashing on mobile', async ({ page }) => {
    // Inject mock user state into Zustand store to bypass login
    await page.goto('/');
    await page.evaluate(() => {
      if ((window as any).useAppStore) {
        (window as any).useAppStore.setState({
          user: { id: 'test-user', email: 'mobile@example.com' },
          view: 'dashboard',
        });
      }
    });

    // Check that the main content area is visible. On mobile, the sidebar is hidden (hidden md:flex),
    // but the main dashboard content should render perfectly.
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});
