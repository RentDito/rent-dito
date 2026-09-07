import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('landlord operations', () => {
  it('searches tenants by name, property, and status', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/landlord/tenants', role: 'landlord' });

    expect(await screen.findByText('Showing 3 of 3 tenants')).toBeVisible();

    await user.selectOptions(screen.getByLabelText('Tenancy status'), 'active');
    expect(await screen.findByText('Showing 1 of 3 tenants')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Mateo Cruz' })).toBeVisible();
  });

  it('records a landlord-confirmed payment and updates the visible balance', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/landlord/tenants/tenancy-active-01', role: 'landlord' });

    const outstanding = await screen.findByRole('group', { name: 'Outstanding balance' });
    expect(within(outstanding).getByText('₱38,200')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Record payment' }));
    await user.clear(screen.getByLabelText('Amount received'));
    await user.type(screen.getByLabelText('Amount received'), '18000');
    await user.selectOptions(screen.getByLabelText('Payment method'), 'bank-transfer');
    await user.click(screen.getByRole('button', { name: 'Review payment' }));

    const dialog = screen.getByRole('dialog', { name: 'Record a payment' });
    expect(within(dialog).getByText('Mateo Cruz')).toBeVisible();
    expect(within(dialog).getByText('August 2026 rent')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Confirm payment record' }));

    expect(await screen.findByText('Payment recorded')).toBeVisible();
    expect(
      within(await screen.findByRole('group', { name: 'Outstanding balance' })).getByText(
        '₱20,200',
      ),
    ).toBeVisible();
  });

  it('refuses a payment larger than the remaining balance and records nothing', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/landlord/tenants/tenancy-active-01', role: 'landlord' });

    await user.click(await screen.findByRole('button', { name: 'Record payment' }));
    await user.clear(screen.getByLabelText('Amount received'));
    await user.type(screen.getByLabelText('Amount received'), '99999');
    await user.click(screen.getByRole('button', { name: 'Review payment' }));

    expect(
      await screen.findByText('Amount cannot be more than the ₱18,000 remaining on this due.'),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Confirm payment record' })).not.toBeInTheDocument();
  });

  it('labels inquiry status and preserves chronological context', async () => {
    renderApp({ route: '/landlord/inquiries', role: 'landlord' });

    expect(await screen.findByText('Needs reply')).toBeVisible();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(screen.getByText('Is Unit 8B still available for a September move-in?')).toBeVisible();
  });

  it('adds a landlord reply and leaves the updated thread visible', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/landlord/inquiries', role: 'landlord' });

    await user.click(
      await screen.findByRole('button', { name: 'Reply to Sampaguita Residences inquiry' }),
    );
    await user.type(
      screen.getByLabelText('Your reply'),
      'Yes, Unit 8B is free from 15 September.',
    );
    await user.click(screen.getByRole('button', { name: 'Send reply' }));

    expect(
      await screen.findByText('Yes, Unit 8B is free from 15 September.'),
    ).toBeVisible();
    expect(screen.getByText('Reply saved in this prototype')).toBeVisible();
  });

  it('separates collected payments from outstanding dues on the payments page', async () => {
    renderApp({ route: '/landlord/payments', role: 'landlord' });

    expect(await screen.findByRole('region', { name: 'Outstanding dues' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Payment history' })).toBeVisible();
    expect(screen.getByRole('table', { name: 'Payments received' })).toBeVisible();
  });
});
