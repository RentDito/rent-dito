import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('Philippine presentation formatting', () => {
  it('formats whole peso amounts without centavos', () => {
    expect(formatCurrency(18500)).toBe('₱18,500');
  });

  it('formats dates in an unambiguous English Philippine style', () => {
    expect(formatDate('2026-09-15T00:00:00+08:00')).toBe('Sep 15, 2026');
  });
});
