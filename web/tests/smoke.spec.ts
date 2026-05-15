// Read-only smoke tests against the live production site.
// Run with: npx playwright test --project=smoke
// These tests never log in and never write data.
import { test, expect } from '@playwright/test';

test.describe('Production smoke — landing', () => {
  test('page loads and shows hero heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2 })).toContainText('Burpees');
  });

  test('CTA button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /start 60-day free access/i })).toBeVisible();
  });

  test('sign in link is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /already a member/i })).toBeVisible();
  });
});

test.describe('Production smoke — login page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
});

test.describe('Production smoke — pricing page', () => {
  test('renders pricing cards', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /workout tracks/i })).toBeVisible();
    await expect(page.getByText('BEGINNER', { exact: true })).toBeVisible();
    await expect(page.getByText('ADVANCED', { exact: true })).toBeVisible();
  });

  test('shows trust badges', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/secure payments via stripe/i)).toBeVisible();
  });
});
