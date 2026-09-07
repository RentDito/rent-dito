import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('marketplace discovery', () => {
  it('leads with a search entry point and featured rentals on the home page', async () => {
    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /find a rental you can trust/i,
    );
    expect(screen.getByLabelText('Where do you want to live?')).toBeVisible();

    const featured = await screen.findByRole('region', { name: 'Featured rentals' });
    expect(within(featured).getAllByRole('article').length).toBeGreaterThan(0);
  });

  it('filters listings and preserves applied filters in the URL', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/listings' });

    await user.selectOptions(await screen.findByLabelText('Property type'), 'condominium');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(window.location.search).toContain('type=condominium');

    const results = await screen.findByRole('region', { name: 'Search results' });
    const cards = within(results).getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(results).getByText('Showing 2 of 6 rentals')).toBeVisible();
  });

  it('explains a filter no-match without discarding the filters', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/listings' });

    await user.type(await screen.findByLabelText('Search by name or area'), 'Baguio');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(await screen.findByText('No rentals match these filters')).toBeVisible();
    expect(screen.getByLabelText('Search by name or area')).toHaveValue('Baguio');
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeVisible();
  });

  it('submits an inquiry with property context and durable confirmation', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/listings/prop-makati-01' });

    await user.click(await screen.findByRole('button', { name: 'Inquire about this property' }));
    await user.type(
      screen.getByLabelText('Message'),
      'May I schedule a viewing this Saturday morning?',
    );
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }));

    expect(await screen.findByText('Inquiry saved in this prototype')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rejects an inquiry that is too short to be useful', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/listings/prop-makati-01' });

    await user.click(await screen.findByRole('button', { name: 'Inquire about this property' }));
    await user.type(screen.getByLabelText('Message'), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }));

    expect(
      await screen.findByText('Please write at least 10 characters so the landlord can help.'),
    ).toBeVisible();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('saves a listing and keeps it on the saved page', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/listings/prop-makati-01' });

    const save = await screen.findByRole('button', { name: 'Save Sampaguita Residences' });
    expect(save).toHaveAttribute('aria-pressed', 'false');

    await user.click(save);
    expect(
      await screen.findByRole('button', { name: 'Remove Sampaguita Residences from saved' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('link', { name: 'Saved' }));

    const saved = await screen.findByRole('region', { name: 'Saved rentals' });
    expect(within(saved).getByRole('heading', { name: 'Sampaguita Residences' })).toBeVisible();
  });
});
