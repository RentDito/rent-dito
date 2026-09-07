import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('tenant workspace', () => {
  it('puts the next due amount and due date first on the tenant dashboard', async () => {
    renderApp({ route: '/tenant', role: 'tenant' });

    const due = await screen.findByRole('region', { name: 'Next payment due' });
    expect(within(due).getByText('₱18,000')).toBeVisible();
    expect(within(due).getByText('Aug 1, 2026')).toBeVisible();
    expect(within(due).getByText('Overdue')).toBeVisible();
    expect(within(due).getByRole('link', { name: 'Pay this due' })).toBeVisible();
  });

  it('shows the current rental facts and the landlord contact', async () => {
    renderApp({ route: '/tenant/rental', role: 'tenant' });

    expect(await screen.findByRole('heading', { name: 'My rental' })).toBeVisible();
    expect(screen.getByText('Sampaguita Residences')).toBeVisible();
    expect(screen.getByText('Unit 6A')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Landlord contact' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Record payment' })).not.toBeInTheDocument();
  });

  it('separates dues still to pay from payment history', async () => {
    renderApp({ route: '/tenant/payments', role: 'tenant' });

    expect(await screen.findByRole('region', { name: 'Dues to pay' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Payment history' })).toBeVisible();
    expect(screen.getByRole('table', { name: 'Payments you have made' })).toBeVisible();
  });

  it('completes a simulated payment and opens a durable receipt', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/tenant/payments/due-august-01/pay', role: 'tenant' });

    expect(await screen.findByText('Prototype payment simulation')).toBeVisible();
    expect(screen.getByText('₱0')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Choose payment method' }));
    await user.click(screen.getByRole('radio', { name: 'GCash demo' }));
    await user.click(screen.getByRole('button', { name: 'Review payment' }));
    await user.click(screen.getByRole('button', { name: 'Confirm simulated payment' }));

    expect(await screen.findByRole('heading', { name: 'Payment receipt' })).toBeVisible();
    expect(screen.getByText(/RD-2026-/)).toBeVisible();
    expect(screen.getByText('GCash demo')).toBeVisible();
    expect(screen.getByText('Recorded in this prototype')).toBeVisible();
  });

  it('reports a simulated failure and creates no payment record', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/tenant/payments/due-august-01/pay', role: 'tenant' });

    await user.click(await screen.findByRole('button', { name: 'Choose payment method' }));
    await user.click(screen.getByRole('radio', { name: 'GCash demo' }));
    await user.click(screen.getByRole('checkbox', { name: 'Simulate a failed payment' }));
    await user.click(screen.getByRole('button', { name: 'Review payment' }));
    await user.click(screen.getByRole('button', { name: 'Confirm simulated payment' }));

    expect(await screen.findByText('No payment was recorded')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Payment receipt' })).not.toBeInTheDocument();
  });

  it('never asks for real financial credentials', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/tenant/payments/due-august-01/pay', role: 'tenant' });

    await user.click(await screen.findByRole('button', { name: 'Choose payment method' }));

    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/account number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/otp/i)).not.toBeInTheDocument();
  });

  it('shows the tenant inquiry thread with property context', async () => {
    renderApp({ route: '/tenant/inquiries', role: 'tenant' });

    expect(
      await screen.findByText('Is the study lounge open in the evenings?'),
    ).toBeVisible();
    expect(screen.getByText('Yes, it is open until 10 pm daily.')).toBeVisible();
  });
});
