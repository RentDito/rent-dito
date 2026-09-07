import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button/Button';
import { Card, StatCard } from './Card/Card';
import { DataTable } from './DataTable/DataTable';
import { Dialog } from './Dialog/Dialog';
import { Drawer } from './Drawer/Drawer';
import { EmptyState, InlineAlert, SectionError } from './Feedback/Feedback';
import { Field } from './Field/Field';
import { Skeleton } from './Skeleton/Skeleton';
import { StatusBadge } from './StatusBadge/StatusBadge';

describe('Field', () => {
  it('associates the label, hint, and error with the control', () => {
    render(
      <Field
        label="Message"
        hint="Landlords usually reply within a day."
        error="Write at least 10 characters"
      >
        <textarea />
      </Field>,
    );

    const control = screen.getByLabelText('Message');
    expect(control).toHaveAccessibleDescription(
      'Landlords usually reply within a day. Write at least 10 characters',
    );
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Write at least 10 characters');
  });

  it('keeps the accessible name clean when the field is required', () => {
    render(
      <Field label="Amount received" required>
        <input type="number" />
      </Field>,
    );

    expect(screen.getByLabelText('Amount received')).toBeRequired();
  });
});

describe('Dialog', () => {
  it('labels the surface, moves focus inside, and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Dialog open title="Change unit status" onClose={onClose}>
        <Button>Confirm change</Button>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Change unit status' });
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Confirm change' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the trigger when it closes', async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [open, setOpen] = useState(false);

      return (
        <>
          <Button onClick={() => setOpen(true)}>Open review</Button>
          <Dialog open={open} title="Review change" onClose={() => setOpen(false)}>
            <Button onClick={() => setOpen(false)}>Confirm status change</Button>
          </Dialog>
        </>
      );
    };

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open review' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Confirm status change' }));

    expect(trigger).toHaveFocus();
  });

  it('renders nothing while closed', () => {
    render(
      <Dialog open={false} title="Hidden dialog" onClose={() => {}}>
        <p>Body</p>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Drawer', () => {
  it('labels the surface and exposes a named close control', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Drawer open title="Filters" onClose={onClose}>
        <Field label="Property type">
          <select>
            <option value="condominium">Condominium</option>
          </select>
        </Field>
      </Drawer>,
    );

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close Filters' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('StatusBadge', () => {
  it('renders status as readable text instead of colour alone', () => {
    render(<StatusBadge tone="danger">Overdue</StatusBadge>);

    expect(screen.getByText('Overdue')).toBeVisible();
  });
});

describe('Button', () => {
  it('announces a busy state and blocks repeat submissions while loading', () => {
    render(<Button loading>Send inquiry</Button>);

    const button = screen.getByRole('button', { name: 'Send inquiry' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });
});

describe('Card', () => {
  it('links a card heading to its region and renders a text-first statistic', () => {
    render(
      <>
        <Card title="Next payment due">
          <p>Body copy</p>
        </Card>
        <StatCard label="Overdue" value="PHP 18,000" description="1 unpaid due" tone="danger" />
      </>,
    );

    expect(screen.getByRole('region', { name: 'Next payment due' })).toBeVisible();
    const stat = screen.getByRole('group', { name: 'Overdue' });
    expect(within(stat).getByText('PHP 18,000')).toBeVisible();
    expect(within(stat).getByText('1 unpaid due')).toBeVisible();
  });
});

describe('DataTable', () => {
  interface Row {
    id: string;
    unit: string;
    status: string;
  }

  const columns = [
    { key: 'unit', header: 'Unit', cell: (row: Row) => row.unit },
    { key: 'status', header: 'Status', cell: (row: Row) => row.status, mobileLabel: 'Unit status' },
  ];

  it('renders a real table and carries mobile labels for narrow layouts', () => {
    render(
      <DataTable
        caption="Units in Sampaguita Residences"
        columns={columns}
        rows={[{ id: 'unit-1', unit: 'Unit 6A', status: 'Occupied' }]}
        rowKey={(row) => row.id}
      />,
    );

    expect(screen.getByRole('table', { name: 'Units in Sampaguita Residences' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'Occupied' })).toHaveAttribute(
      'data-label',
      'Unit status',
    );
  });

  it('shows a true-empty message instead of an empty grid', () => {
    render(
      <DataTable
        caption="Units"
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        emptyMessage="No units yet."
      />,
    );

    expect(screen.getByText('No units yet.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('feedback states', () => {
  it('announces recoverable errors and offers a retry action', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<SectionError title="We could not load your dues" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('We could not load your dues');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty states and polite inline notices', () => {
    render(
      <>
        <EmptyState title="No saved listings yet" description="Save a home to compare it later." />
        <InlineAlert tone="info" title="Prototype payment simulation" />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'No saved listings yet' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Prototype payment simulation');
  });
});

describe('Skeleton', () => {
  it('hides shape-preserving placeholders from assistive technology', () => {
    render(<Skeleton lines={3} data-testid="dues-skeleton" />);

    expect(screen.getByTestId('dues-skeleton')).toHaveAttribute('aria-hidden', 'true');
  });
});
