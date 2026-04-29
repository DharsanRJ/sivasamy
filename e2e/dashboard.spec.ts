import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation & UI', () => {
  test.beforeEach(async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Inject mock user state into Zustand store to bypass login and onboarding
    await page.evaluate(() => {
      const store = (window as any).useAppStore;
      if (store) {
        store.setState({
          user: { id: 'test-user-123', email: 'test@example.com', currentStreak: 0 },
          view: 'dashboard',
          onboardingStep: 3,
          isInitialized: true,
          skills: [{ id: '1', name: 'React', proficiency: 3, status: 'Learning' }]
        });
      }
    });
  });

  test('Sidebar Navigation Works', async ({ page }) => {
    // Verify Dashboard loads by checking if MATRIX is visible
    await expect(page.getByText('MATRIX', { exact: true })).toBeVisible({ timeout: 5000 });
    
    // Navigate to Readiness
    await page.getByText('READINESS', { exact: true }).click();
    await expect(page.getByText(/Mock Interview/i)).toBeVisible(); 
    
    // Navigate to Lab
    await page.getByText('LAB', { exact: true }).click();
    await expect(page.getByText(/AI Execution Zone/i)).toBeVisible();
  });

  test('Resume Upload button is present', async ({ page }) => {
    const uploadButton = page.getByText('UPLOAD RESUME');
    await expect(uploadButton).toBeVisible();
  });
});
