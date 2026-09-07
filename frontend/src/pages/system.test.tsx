import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';
import { setNavigatorOnline } from '@/test/setup';

describe('prototype system behaviour', () => {
  it('labels authentication as a prototype and allows demo entry without credentials', async () => {
    renderApp({ route: '/auth/sign-in' });

    expect(await screen.findByText('Prototype sign-in')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue as tenant demo' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue as landlord demo' })).toBeVisible();
  });

  it('enters the landlord workspace from the demo entry point', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/auth/sign-in' });

    await user.click(await screen.findByRole('button', { name: 'Continue as landlord demo' }));

    expect(await screen.findByRole('navigation', { name: 'Landlord workspace' })).toBeVisible();
  });

  it('never signs in with the presentational credential form', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/auth/sign-in' });

    await user.type(await screen.findByLabelText('Email address'), 'mateo.cruz@example.test');
    await user.type(screen.getByLabelText('Password'), 'a-long-enough-password');
    await user.click(screen.getByRole('button', { name: 'Check this form' }));

    expect(await screen.findByText('There is no account to sign in to')).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Marketplace navigation' })).toBeVisible();
  });

  it('reports validation errors on the registration screen', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/auth/register' });

    await user.click(await screen.findByRole('button', { name: 'Check this form' }));

    expect(await screen.findByText('Enter your full name.')).toBeVisible();
    expect(
      screen.getByText('Enter a Philippine mobile number, for example 0917 555 0184.'),
    ).toBeVisible();
  });

  it('blocks a transactional action offline with an explanation', async () => {
    const user = userEvent.setup();
    setNavigatorOnline(false);
    renderApp({ route: '/tenant/payments/due-august-01/pay', role: 'tenant' });

    expect(
      await screen.findByText('Reconnect to continue this simulated payment'),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Choose payment method' }));
    await user.click(screen.getByRole('radio', { name: 'GCash demo' }));
    await user.click(screen.getByRole('button', { name: 'Review payment' }));

    expect(screen.getByRole('button', { name: 'Confirm simulated payment' })).toBeDisabled();
  });

  it('explains the offline screen honestly', async () => {
    setNavigatorOnline(false);
    renderApp({ route: '/offline' });

    expect(await screen.findByRole('heading', { name: 'You are offline' })).toBeVisible();
    expect(screen.getByText('Nothing is queued while you are offline')).toBeVisible();
  });

  it('resets demo data only after explicit confirmation', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/settings', role: 'landlord' });

    await user.click(await screen.findByRole('button', { name: 'Reset demo data' }));

    const dialog = screen.getByRole('dialog', { name: 'Reset all prototype changes?' });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText('This cannot be undone')).toBeVisible();
  });

  it('returns to the role home and announces a confirmed reset', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/settings', role: 'tenant' });

    await user.click(await screen.findByRole('button', { name: 'Reset demo data' }));
    await user.click(screen.getByRole('button', { name: 'Reset everything now' }));

    expect(await screen.findByText('Demo data reset')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/tenant');
  });

  it('keeps the prototype changes when a reset is dismissed', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/settings', role: 'landlord' });

    await user.click(await screen.findByRole('button', { name: 'Reset demo data' }));
    await user.click(screen.getByRole('button', { name: 'Keep my changes' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/settings');
  });
});
