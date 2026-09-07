import { expect, test } from '@playwright/test';

import { startAs } from './support';

test.beforeEach(async ({ page }) => {
  await startAs(page, 'landlord');
});

test('a landlord changes a unit status through the review dialog', async ({ page }) => {
  await page.goto('/landlord/properties/prop-makati-01');

  await expect(page.getByRole('heading', { name: 'Property details' })).toBeVisible();

  await page.getByRole('button', { name: 'Change status for Unit 10A' }).click();
  await page.getByLabel('New unit status').selectOption('maintenance');
  await page.getByRole('button', { name: 'Review change' }).click();
  await page.getByRole('button', { name: 'Confirm status change' }).click();

  const row = page.getByRole('listitem').filter({ hasText: 'Unit 10A' });
  await expect(row.getByText('Maintenance')).toBeVisible();

  // The public listing must agree with the workspace immediately.
  await page.goto('/listings/prop-makati-01');
  const publicRow = page.getByRole('listitem').filter({ hasText: 'Unit 10A' });
  await expect(publicRow.getByText('Maintenance')).toBeVisible();
});

test('a landlord cannot free a unit that still has an active tenancy', async ({ page }) => {
  await page.goto('/landlord/properties/prop-makati-01');

  await page.getByRole('button', { name: 'Change status for Unit 6A' }).click();
  await page.getByLabel('New unit status').selectOption('available');
  await page.getByRole('button', { name: 'Review change' }).click();
  await page.getByRole('button', { name: 'Confirm status change' }).click();

  await expect(
    page.getByText('End the active tenancy before making this unit available.'),
  ).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Change unit status' })).toBeVisible();
});

test('a landlord records a payment and the balance follows', async ({ page }) => {
  await page.goto('/landlord/tenants/tenancy-active-01');

  const outstanding = page.getByRole('group', { name: 'Outstanding balance' });
  await expect(outstanding.getByText('₱38,200')).toBeVisible();

  await page.getByRole('button', { name: 'Record payment' }).click();
  await page.getByLabel('Amount received').fill('18000');
  await page.getByLabel('Payment method').selectOption('bank-transfer');
  await page.getByRole('button', { name: 'Review payment' }).click();
  await page.getByRole('button', { name: 'Confirm payment record' }).click();

  await expect(page.getByText('Payment recorded')).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Outstanding balance' }).getByText('₱20,200'),
  ).toBeVisible();
});

test('a landlord replies to an inquiry that needs an answer', async ({ page }) => {
  await page.goto('/landlord/inquiries');

  await page
    .getByRole('button', { name: 'Reply to Sampaguita Residences inquiry' })
    .click();
  await page.getByLabel('Your reply').fill('Yes, Unit 8B is free from 15 September.');
  await page.getByRole('button', { name: 'Send reply' }).click();

  await expect(page.getByText('Reply saved in this prototype')).toBeVisible();
  await expect(page.getByText('Yes, Unit 8B is free from 15 September.')).toBeVisible();
});
