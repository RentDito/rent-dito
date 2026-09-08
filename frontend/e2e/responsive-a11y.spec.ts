import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { hasHorizontalOverflow, startAs } from './support';

const ROUTES = [
  { path: '/', role: 'guest' as const, name: 'home and rental search' },
  { path: '/listings/prop-makati-01', role: 'guest' as const, name: 'listing detail' },
  { path: '/landlord', role: 'landlord' as const, name: 'landlord overview' },
  { path: '/landlord/properties', role: 'landlord' as const, name: 'landlord properties' },
  { path: '/tenant', role: 'tenant' as const, name: 'tenant overview' },
  { path: '/tenant/payments', role: 'tenant' as const, name: 'tenant payments' },
];

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
};

for (const route of ROUTES) {
  test(`${route.name} has no serious accessibility violations`, async ({ page }) => {
    await startAs(page, route.role);
    await page.goto(route.path);
    await settle(page);

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );

    expect(
      blocking.map((violation) => `${violation.id}: ${violation.help}`),
      JSON.stringify(blocking, null, 2),
    ).toEqual([]);
  });

  test(`${route.name} does not scroll sideways`, async ({ page }) => {
    await startAs(page, route.role);
    await page.goto(route.path);
    await settle(page);

    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

test('workspace navigation adapts to the viewport', async ({ page, isMobile }) => {
  await startAs(page, 'tenant');
  await page.goto('/tenant');
  await settle(page);

  const sidebar = page.getByRole('navigation', { name: 'Tenant workspace' });
  const bottomNav = page.getByRole('navigation', { name: 'Tenant mobile navigation' });

  if (isMobile) {
    await expect(bottomNav).toBeVisible();
    await expect(sidebar).toHaveCount(0);
    await expect(bottomNav.getByRole('link', { name: 'Payments' })).toHaveAttribute(
      'href',
      '/tenant/payments',
    );
  } else {
    await expect(sidebar).toBeVisible();
    await expect(bottomNav).toHaveCount(0);
  }
});

test('primary actions meet the 44 pixel touch target', async ({ page }) => {
  await startAs(page, 'tenant');
  await page.goto('/tenant');
  await settle(page);

  const primary = page.getByRole('link', { name: 'Pay this due' });
  const box = await primary.boundingBox();

  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.width).toBeGreaterThanOrEqual(44);
});

test('a sticky bottom navigation never covers the last action on a page', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Bottom navigation only renders on compact viewports.');

  await startAs(page, 'tenant');
  await page.goto('/tenant/payments');
  await settle(page);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const lastAction = page.getByRole('link', { name: 'View receipt' }).last();
  await expect(lastAction).toBeVisible();

  const actionBox = await lastAction.boundingBox();
  const navBox = await page
    .getByRole('navigation', { name: 'Tenant mobile navigation' })
    .boundingBox();

  expect(actionBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
});
