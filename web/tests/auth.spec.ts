import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form fields and heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('shows forgot password link', async ({ page }) => {
    await expect(page.getByRole('button', { name: /forgot password/i })).toBeVisible();
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.locator('[aria-label="Email"] input').fill('nobody@example.com');
    await page.locator('[aria-label="Password"] input').fill('wrongpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });

  test('can switch to sign up form', async ({ page }) => {
    await page.getByRole('button', { name: /don't have an account/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
  });

  test('can switch back from signup to login', async ({ page }) => {
    await page.getByRole('button', { name: /don't have an account/i }).click();
    await page.getByRole('button', { name: /already have an account/i }).click();
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('navigating to / from login shows landing page', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: /start 60-day free access/i }),
    ).toBeVisible();
  });
});
