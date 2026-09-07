import { expect, test } from '@playwright/test';

import { switchDemoRole } from './support';

test('a guest filters listings, inquires, and can switch into the landlord demo', async ({
  page,
}) => {
  await page.goto('/listings?type=condominium');

  await expect(page.getByText('Showing 2 of 6 rentals')).toBeVisible();

  await page.getByRole('link', { name: /view .* details/i }).first().click();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Inquire about this property' }).click();
  await page.getByLabel('Message').fill('May I schedule a viewing this Saturday?');
  await page.getByRole('button', { name: 'Send inquiry' }).click();

  await expect(page.getByText('Inquiry saved in this prototype')).toBeVisible();

  await switchDemoRole(page, 'Landlord demo');

  await expect(page.getByRole('heading', { name: 'Portfolio overview' })).toBeVisible();
});

test('applied filters survive a reload because they live in the URL', async ({
  page,
  isMobile,
}) => {
  // Desktop shows the filter rail; compact viewports open the same form in a drawer.
  const openFilters = async () => {
    if (isMobile) await page.getByRole('button', { name: 'Filters' }).click();
  };

  await page.goto('/listings');
  await openFilters();

  await page.getByLabel('Search by name or area').fill('Cebu');
  await page.getByRole('button', { name: 'Apply filters' }).click();

  await expect(page).toHaveURL(/q=Cebu/);
  await expect(page.getByText('Showing 1 of 6 rentals')).toBeVisible();

  await page.reload();
  await openFilters();

  await expect(page.getByLabel('Search by name or area')).toHaveValue('Cebu');
  await expect(page.getByText('Showing 1 of 6 rentals')).toBeVisible();
});

test('saving a listing keeps it on the saved page', async ({ page }) => {
  await page.goto('/listings/prop-makati-01');

  await page.getByRole('button', { name: 'Save Sampaguita Residences' }).click();
  await expect(
    page.getByRole('button', { name: 'Remove Sampaguita Residences from saved' }),
  ).toBeVisible();

  await page.goto('/saved');

  await expect(page.getByRole('heading', { name: 'Sampaguita Residences' })).toBeVisible();
});
