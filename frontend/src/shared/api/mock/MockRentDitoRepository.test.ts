import { describe, expect, it } from 'vitest';

import { createMemoryStorage } from '@/shared/lib/storage';

import { createMockRepository } from './MockRentDitoRepository';

describe('MockRentDitoRepository', () => {
  it('persists a submitted inquiry and restores versioned seed data', async () => {
    const storage = createMemoryStorage();
    const repo = createMockRepository(storage, { delayMs: 0 });
    const before = await repo.listInquiries('tenant');

    await repo.submitInquiry({ propertyId: 'prop-makati-01', message: 'Is Unit 8B available?' });

    expect(await repo.listInquiries('tenant')).toHaveLength(before.length + 1);

    repo.resetDemoData();

    expect(await repo.listInquiries('tenant')).toHaveLength(before.length);
  });

  it('rejects marking an actively leased unit available', async () => {
    const repo = createMockRepository(createMemoryStorage(), { delayMs: 0 });

    await expect(repo.updateUnitStatus({ unitId: 'unit-occupied-01', status: 'available' })).rejects.toThrow(
      'End the active tenancy before making this unit available.',
    );
  });
});
