import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User can switch to sign up and login', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Verify Onboarding Screen Loads
    await expect(page.getByText('SkillStack')).toBeVisible();

    // The default mode is Login. Switch to Sign Up
    await page.getByRole('button', { name: 'Need an account? Sign Up' }).click();

    // Verify Sign Up fields
    await expect(page.getByPlaceholder('USERNAME')).toBeVisible();
    await expect(page.getByPlaceholder('EMAIL ADDRESS')).toBeVisible();
    await expect(page.getByPlaceholder('PASSWORD')).toBeVisible();

    // Switch back to Login
    await page.getByRole('button', { name: 'Already have an account? Login' }).click();
    
    // Fill out the login form
    // Note: in a real environment we would use test credentials or intercept the network.
    // Here we will just verify the form elements accept input.
    await page.getByPlaceholder('EMAIL ADDRESS').fill('test@example.com');
    await page.getByPlaceholder('PASSWORD').fill('password123');
    
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeEnabled();
  });
});
