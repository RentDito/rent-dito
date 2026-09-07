import { describe, expect, it } from 'vitest';

import { getDueStatus } from './status';

describe('getDueStatus', () => {
  const now = new Date('2026-09-08T12:00:00+08:00');

  it('returns paid when paidAmount covers amount', () => {
    expect(getDueStatus({ amount: 18_000, paidAmount: 18_000, dueDate: '2026-09-01' }, now)).toBe('paid');
  });

  it('returns overdue after the unpaid due date', () => {
    expect(getDueStatus({ amount: 18_000, paidAmount: 0, dueDate: '2026-09-01' }, now)).toBe('overdue');
  });

  it('returns due-soon within seven days', () => {
    expect(getDueStatus({ amount: 18_000, paidAmount: 0, dueDate: '2026-09-12' }, now)).toBe('due-soon');
  });
});
