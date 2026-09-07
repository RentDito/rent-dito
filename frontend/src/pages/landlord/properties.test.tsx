import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('landlord portfolio', () => {
  it('shows the landlord portfolio priorities without relying on charts', async () => {
    renderApp({ route: '/landlord', role: 'landlord' });

    expect(await screen.findByRole('group', { name: 'Expected this month' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Collected this month' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Overdue' })).toBeVisible();

    const vacant = screen.getByRole('group', { name: 'Vacant units' });
    expect(within(vacant).getByText('2')).toBeVisible();

    const inquiries = screen.getByRole('group', { name: 'Open inquiries' });
    expect(within(inquiries).getByText('1')).toBeVisible();

    const occupancy = screen.getByRole('group', { name: 'Occupancy' });
    expect(within(occupancy).getByText('20%')).toBeVisible();
  });

  it('states the displayed and total property count and filters by status', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/landlord/properties', role: 'landlord' });

    expect(await screen.findByText('Showing 2 of 2 properties')).toBeVisible();

    await user.selectOptions(screen.getByLabelText('Unit status'), 'occupied');
    expect(await screen.findByText('Showing 1 of 2 properties')).toBeVisible();

    await user.type(screen.getByLabelText('Search properties'), 'zzzz');
    expect(await screen.findByText('No properties match these filters')).toBeVisible();
  });

  it('confirms a safe unit status change and keeps the result visible', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/landlord/properties/prop-makati-01', role: 'landlord' });

    await user.click(await screen.findByRole('button', { name: 'Change status for Unit 10A' }));
    await user.selectOptions(screen.getByLabelText('New unit status'), 'maintenance');
    await user.click(screen.getByRole('button', { name: 'Review change' }));

    const dialog = screen.getByRole('dialog', { name: 'Change unit status' });
    expect(within(dialog).getByText(/hidden from search/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Confirm status change' }));

    const row = await screen.findByRole('listitem', { name: 'Unit 10A' });
    expect(within(row).getByText('Maintenance')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps a rejected status change inline with the corrective action', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/landlord/properties/prop-makati-01', role: 'landlord' });

    await user.click(await screen.findByRole('button', { name: 'Change status for Unit 6A' }));
    await user.selectOptions(screen.getByLabelText('New unit status'), 'available');
    await user.click(screen.getByRole('button', { name: 'Review change' }));
    await user.click(screen.getByRole('button', { name: 'Confirm status change' }));

    expect(
      await screen.findByText('End the active tenancy before making this unit available.'),
    ).toBeVisible();
    expect(screen.getByRole('dialog', { name: 'Change unit status' })).toBeVisible();
  });
});
