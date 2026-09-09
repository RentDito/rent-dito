import { describe, expect, it } from 'vitest';

import {
  IdempotencyConflictError,
  createIdempotencyRunner,
  type IdempotencyRecord,
  type IdempotencyStore,
} from '../src/plugins/idempotency.js';

class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  async claim(record: IdempotencyRecord) {
    const mapKey = `${record.actorId}:${record.key}`;
    const existing = this.records.get(mapKey);
    if (existing) return { kind: 'existing' as const, record: existing };
    this.records.set(mapKey, record);
    return { kind: 'claimed' as const };
  }

  async complete(
    actorId: string,
    key: string,
    responseStatus: number,
    responseBody: unknown,
  ) {
    const mapKey = `${actorId}:${key}`;
    const current = this.records.get(mapKey);
    if (!current) throw new Error('Cannot complete a missing claim');
    this.records.set(mapKey, { ...current, responseStatus, responseBody });
  }

  async release(actorId: string, key: string) {
    this.records.delete(`${actorId}:${key}`);
  }
}

const actorId = 'c836f08a-0b91-4ce7-b283-2b82477dd784';
const key = 'dd1a64b4-a1eb-4e4d-9b84-90c246a891d2';

describe('idempotent operations', () => {
  it('returns the stored response and runs matching work only once', async () => {
    const runIdempotent = createIdempotencyRunner(new MemoryIdempotencyStore());
    let executions = 0;
    const work = async () => {
      executions += 1;
      return { statusCode: 201, body: { id: 'resource-1' } };
    };

    const first = await runIdempotent(actorId, key, 'create-resource', 'hash-a', work);
    const retry = await runIdempotent(actorId, key, 'create-resource', 'hash-a', work);

    expect(first).toEqual({ statusCode: 201, body: { id: 'resource-1' } });
    expect(retry).toEqual(first);
    expect(executions).toBe(1);
  });

  it('rejects reuse of a key for a different request', async () => {
    const runIdempotent = createIdempotencyRunner(new MemoryIdempotencyStore());
    await runIdempotent(actorId, key, 'create-resource', 'hash-a', async () => ({
      statusCode: 201,
      body: { id: 'resource-1' },
    }));

    await expect(
      runIdempotent(actorId, key, 'create-resource', 'hash-b', async () => ({
        statusCode: 201,
        body: { id: 'resource-2' },
      })),
    ).rejects.toMatchObject<Partial<IdempotencyConflictError>>({
      code: 'IDEMPOTENCY_KEY_REUSED',
      statusCode: 409,
    });
  });

  it('rejects a concurrent retry while the matching request is still running', async () => {
    const store = new MemoryIdempotencyStore();
    await store.claim({ actorId, key, operation: 'create-resource', requestHash: 'hash-a' });
    const runIdempotent = createIdempotencyRunner(store);

    await expect(
      runIdempotent(actorId, key, 'create-resource', 'hash-a', async () => ({
        statusCode: 201,
        body: { id: 'resource-1' },
      })),
    ).rejects.toMatchObject<Partial<IdempotencyConflictError>>({
      code: 'IDEMPOTENCY_REQUEST_IN_PROGRESS',
      statusCode: 409,
    });
  });

  it('releases a failed claim so a corrected retry can run', async () => {
    const runIdempotent = createIdempotencyRunner(new MemoryIdempotencyStore());
    await expect(
      runIdempotent(actorId, key, 'create-resource', 'hash-a', async () => {
        throw new Error('temporary failure');
      }),
    ).rejects.toThrow('temporary failure');

    const retry = await runIdempotent(
      actorId,
      key,
      'create-resource',
      'hash-a',
      async () => ({ statusCode: 201, body: { id: 'resource-1' } }),
    );

    expect(retry.body).toEqual({ id: 'resource-1' });
  });
});
