import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('application shells', () => {
  it('switches from guest to landlord and navigates to the correct workspace', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/', viewport: 'desktop' });

    await user.click(screen.getByRole('button', { name: 'View as' }));
    await user.click(screen.getByRole('menuitem', { name: 'Landlord demo' }));

    const nav = await screen.findByRole('navigation', { name: 'Landlord workspace' });
    expect(nav).toBeVisible();
    expect(within(nav).getByRole('link', { name: 'Properties' })).toBeVisible();
    expect(window.location.pathname).toBe('/landlord');
  });

  it('provides tenant primary destinations in mobile bottom navigation', async () => {
    renderApp({ route: '/tenant', role: 'tenant', viewport: 'mobile' });

    const nav = await screen.findByRole('navigation', { name: 'Tenant mobile navigation' });
    expect(nav).toBeVisible();
    expect(within(nav).getByRole('link', { name: 'Payments' })).toHaveAttribute(
      'href',
      '/tenant/payments',
    );
    expect(screen.queryByRole('navigation', { name: 'Tenant workspace' })).not.toBeInTheDocument();
  });

  it('marks the current workspace destination for assistive technology', async () => {
    renderApp({ route: '/landlord/properties', role: 'landlord', viewport: 'desktop' });

    const nav = await screen.findByRole('navigation', { name: 'Landlord workspace' });
    expect(within(nav).getByRole('link', { name: 'Properties' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps marketplace navigation and a skip link on public routes', async () => {
    renderApp({ route: '/', viewport: 'desktop' });

    expect(
      await screen.findByRole('navigation', { name: 'Marketplace navigation' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument();
  });

  it('uses the supplied RentDito artwork in the public brand link', async () => {
    renderApp({ route: '/', viewport: 'desktop' });

    const brand = await screen.findByRole('link', { name: 'RentDito home' });
    expect(brand.querySelector('img')).toHaveAttribute('src', '/icons/logo.png');
  });

  it('uses the same supplied artwork in workspace branding', async () => {
    renderApp({ route: '/landlord', role: 'landlord', viewport: 'desktop' });

    const brand = await screen.findByRole('link', { name: 'RentDito home' });
    expect(brand.querySelector('img')).toHaveAttribute('src', '/icons/logo.png');
  });

  it('offers a way back from an unknown route', async () => {
    renderApp({ route: '/does-not-exist' });

    expect(
      await screen.findByRole('heading', { name: 'We could not find that page' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Go to RentDito home' })).toBeVisible();
  });
});
