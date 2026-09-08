import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('marketplace discovery', () => {
  it('makes the complete rental browser the default home experience', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /find a rental you can trust/i,
    );
    expect(screen.getByLabelText('Where do you want to live?')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Browse rentals' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(await screen.findByLabelText('Property type')).toBeVisible();

    const results = await screen.findByRole('region', { name: 'Search results' });
    expect(within(results).getAllByRole('article')).toHaveLength(6);
  });

  it('filters listings and preserves applied filters in the URL', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/' });

    await user.click(await screen.findByRole('button', { name: 'Filters' }));
    await user.selectOptions(await screen.findByLabelText('Property type'), 'condominium');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(window.location.search).toContain('type=condominium');
    expect(window.location.pathname).toBe('/');

    const results = await screen.findByRole('region', { name: 'Search results' });
    const cards = within(results).getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(results).getByText('Showing 2 of 6 rentals')).toBeVisible();
  });

  it('explains a filter no-match without discarding the filters', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/' });

    await user.click(await screen.findByRole('button', { name: 'Filters' }));
    await user.type(await screen.findByLabelText('Search by name or area'), 'Baguio');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(await screen.findByText('No rentals match these filters')).toBeVisible();
    expect(window.location.search).toContain('q=Baguio');
    expect(screen.getByRole('button', { name: 'Show all rentals' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(await screen.findByLabelText('Search by name or area')).toHaveValue('Baguio');
  });

  it('redirects the former listings page to home without losing its filters', async () => {
    renderApp({ route: '/listings?type=condominium' });

    expect(await screen.findByText('Showing 2 of 6 rentals')).toBeVisible();
    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('?type=condominium');
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
