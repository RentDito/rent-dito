import { expect, test } from '@playwright/test';

import { startAs } from './support';

test.beforeEach(async ({ page }) => {
  await startAs(page, 'tenant');
});

test('the tenant dashboard leads with the next due', async ({ page }) => {
  await page.goto('/tenant');

  const due = page.getByRole('region', { name: 'Next payment due' });
  await expect(due.getByText('₱18,000')).toBeVisible();
  await expect(due.getByText('Aug 1, 2026')).toBeVisible();
  await expect(due.getByRole('link', { name: 'Pay this due' })).toBeVisible();
});

test('a tenant completes the simulated Pay Now flow and reaches a receipt', async ({ page }) => {
  await page.goto('/tenant/payments/due-august-01/pay');

  await expect(page.getByText('Prototype payment simulation')).toBeVisible();

  await page.getByRole('button', { name: 'Choose payment method' }).click();
  await page.getByRole('radio', { name: 'GCash demo' }).check();
  await page.getByRole('button', { name: 'Review payment' }).click();
  await page.getByRole('button', { name: 'Confirm simulated payment' }).click();

  await expect(page.getByRole('heading', { name: 'Payment receipt' })).toBeVisible();
  await expect(page.getByText(/RD-2026-/)).toBeVisible();
  await expect(page.getByText('Recorded in this prototype')).toBeVisible();

  // The receipt must survive a reload, not just the navigation that created it.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Payment receipt' })).toBeVisible();
  await expect(page.getByText(/RD-2026-/)).toBeVisible();
});

test('a simulated failure records nothing', async ({ page }) => {
  await page.goto('/tenant/payments/due-august-01/pay');

  await page.getByRole('button', { name: 'Choose payment method' }).click();
  await page.getByRole('radio', { name: 'GCash demo' }).check();
  await page.getByText('Demo utilities').click();
  await page.getByRole('checkbox', { name: 'Simulate a failed payment' }).check();
  await page.getByRole('button', { name: 'Review payment' }).click();
  await page.getByRole('button', { name: 'Confirm simulated payment' }).click();

  await expect(page.getByText('No payment was recorded')).toBeVisible();

  await page.goto('/tenant/payments');
  await expect(page.getByRole('link', { name: 'Pay August 2026 rent' })).toBeVisible();
});

test('the simulated checkout never asks for real payment credentials', async ({ page }) => {
  await page.goto('/tenant/payments/due-august-01/pay');
  await page.getByRole('button', { name: 'Choose payment method' }).click();

  for (const forbidden of [/card number/i, /account number/i, /\bcvv\b/i, /\botp\b/i]) {
    await expect(page.getByLabel(forbidden)).toHaveCount(0);
  }
});
