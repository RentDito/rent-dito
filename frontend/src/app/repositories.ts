import { createMockRepository } from '@/shared/api/mock/MockRentDitoRepository';

/**
 * The single composition point for data access. Pages and features depend on
 * the `RentDitoRepository` contract, so a real API adapter can replace this
 * without touching any page. Tests skip the simulated latency.
 */
export const rentDitoRepository = createMockRepository(undefined, {
  delayMs: import.meta.env.MODE === 'test' ? 0 : 220,
});
