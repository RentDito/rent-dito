import type { Page } from '@playwright/test';

export type DemoRole = 'guest' | 'landlord' | 'tenant';

/**
 * Seeds the viewing role before the app boots. Faster and less brittle than
 * driving the switcher, which `marketplace.spec.ts` covers explicitly.
 */
export async function startAs(page: Page, role: DemoRole) {
  await page.addInitScript(
    ([storageKey, value]) => {
      window.localStorage.setItem(storageKey, value);
    },
    ['rentdito:demo-role', role],
  );
}

/** Drives the prototype role switcher the way a reviewer would. */
export async function switchDemoRole(page: Page, label: string) {
  await page.getByRole('button', { name: 'View as' }).click();
  await page.getByRole('menuitem', { name: label }).click();
}

/** True when the document itself scrolls sideways, which it never should. */
export async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
}
