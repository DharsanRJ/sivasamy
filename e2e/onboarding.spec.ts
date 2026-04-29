import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Full Onboarding & Navigation Flow', () => {
  test('User can select persona, upload resume, navigate to dashboard, check matrix, and logout', async ({ page }) => {
    // 1. Intercept Supabase Auth Requests
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      const json = {
        access_token: 'fake-jwt',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh',
        user: { id: 'test-user-id', email: 'test@example.com' }
      };
      await route.fulfill({ json });
    });

    await page.route('**/auth/v1/logout', async route => {
      await route.fulfill({ status: 200 });
    });

    // 2. Intercept Supabase Skills Fetch Request (Empty to trigger onboarding)
    await page.route('**/rest/v1/skills?*', async route => {
      await route.fulfill({ json: [] });
    });
    
    // Intercept Practice Logs
    await page.route('**/rest/v1/practice_logs?*', async route => {
      await route.fulfill({ json: [] });
    });

    // 3. Intercept Backend API Upload Resume
    await page.route('**/api/users/*/resume/upload', async route => {
      await route.fulfill({ json: { success: true, message: "Parsed" } });
    });

    // Ensure dummy.pdf exists
    const dummyPdfPath = path.resolve('e2e', 'dummy.pdf');
    if (!fs.existsSync(dummyPdfPath)) {
      fs.writeFileSync(dummyPdfPath, '%PDF-1.4 dummy content');
    }

    // Navigate to App
    await page.goto('/');

    // 4. Login
    await page.getByPlaceholder('EMAIL ADDRESS').fill('test@example.com');
    await page.getByPlaceholder('PASSWORD').fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // 5. Choose Job Switcher
    // We should see "Initialize Matrix" and "Phase 01: Persona Selection"
    await expect(page.getByText('Phase 01: Persona Selection')).toBeVisible({ timeout: 10000 });
    await page.getByText('Job Switcher').click();

    // 6. Upload Resume
    // We should be in Phase 02
    await expect(page.getByText('Phase 02: Goal Calibration')).toBeVisible();
    
    // Playwright file upload intercept
    // Click the "RESUME INGESTION" option to trigger the file upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('RESUME INGESTION').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(dummyPdfPath);

    // Wait for upload success
    await expect(page.getByText('RESUME UPLOADED! AI REVIEWING...')).toBeVisible({ timeout: 10000 });

    // Wait for the redirect to Step 3 (System Active)
    await expect(page.getByText('Calibration Complete')).toBeVisible({ timeout: 10000 });

    // 7. Move to Dashboard
    await page.getByRole('button', { name: 'ACCESS DASHBOARD' }).click();

    // Verify we are on Dashboard
    await expect(page.getByText('MATRIX', { exact: true })).toBeVisible({ timeout: 10000 });

    // 8. Click Matrix
    await page.getByText('MATRIX', { exact: true }).click();
    await expect(page.getByText('The Matrix')).toBeVisible(); // This is the SectionHeader in Tracker.tsx

    // 9. Click Logout
    await page.getByRole('button', { name: 'Logout' }).click();

    // Verify we are back to Onboarding (Login screen)
    await expect(page.getByText('Access Required')).toBeVisible({ timeout: 10000 });
  });
});
