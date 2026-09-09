export interface IdempotencyRecord {
  actorId: string;
  key: string;
  operation: string;
  requestHash: string;
  responseStatus?: number;
  responseBody?: unknown;
}

export type IdempotencyClaim =
  | { kind: 'claimed' }
  | { kind: 'existing'; record: IdempotencyRecord };

export interface IdempotencyStore {
  claim(record: IdempotencyRecord): Promise<IdempotencyClaim>;
  complete(
    actorId: string,
    key: string,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void>;
  release(actorId: string, key: string): Promise<void>;
}

export interface IdempotentResponse<T> {
  statusCode: number;
  body: T;
}

export class IdempotencyConflictError extends Error {
  readonly statusCode = 409;
  readonly code: 'IDEMPOTENCY_KEY_REUSED' | 'IDEMPOTENCY_REQUEST_IN_PROGRESS';

  constructor(code: IdempotencyConflictError['code'], message: string) {
    super(message);
    this.name = 'IdempotencyConflictError';
    this.code = code;
  }
}

export function createIdempotencyRunner(store: IdempotencyStore) {
  return async function runIdempotent<T>(
    actorId: string,
    key: string,
    operation: string,
    requestHash: string,
    work: () => Promise<IdempotentResponse<T>>,
  ): Promise<IdempotentResponse<T>> {
    const claim = await store.claim({ actorId, key, operation, requestHash });

    if (claim.kind === 'existing') {
      if (
        claim.record.operation !== operation ||
        claim.record.requestHash !== requestHash
      ) {
        throw new IdempotencyConflictError(
          'IDEMPOTENCY_KEY_REUSED',
          'This idempotency key was already used for a different request.',
        );
      }

      if (claim.record.responseStatus === undefined) {
        throw new IdempotencyConflictError(
          'IDEMPOTENCY_REQUEST_IN_PROGRESS',
          'The matching request is still being processed.',
        );
      }

      return {
        statusCode: claim.record.responseStatus,
        body: claim.record.responseBody as T,
      };
    }

    let response: IdempotentResponse<T>;
    try {
      response = await work();
    } catch (error) {
      await store.release(actorId, key);
      throw error;
    }

    await store.complete(actorId, key, response.statusCode, response.body);
    return response;
  };
}
