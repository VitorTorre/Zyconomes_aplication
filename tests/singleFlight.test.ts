import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateUserCoalesced, invalidateUserCache } from '../src/middleware/auth';

describe('Single-Flight Promise Coalescing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mocks an async function and verifies that 50 concurrent calls trigger only one underlying execution', async () => {
    const testUid = 'coalesce-user-concurrency-test';
    const testEmail = 'concurrency.test@zyconomes.com';
    invalidateUserCache(testUid);

    // Mock an expensive asynchronous database or API operation
    const mockAsyncFunction = vi.fn().mockImplementation(async (uid: string, email: string) => {
      // Simulate asynchronous network/db I/O delay
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        id: 101,
        uid,
        email,
        tier: 'premium',
        resolvedAt: Date.now(),
      };
    });

    // Fire 50 concurrent calls simultaneously
    const concurrentCalls = Array.from({ length: 50 }, () =>
      getOrCreateUserCoalesced(testUid, testEmail, mockAsyncFunction)
    );

    const results = await Promise.all(concurrentCalls);

    // CRITICAL ASSERTION: Exactly one underlying execution occurred
    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);

    // Verify all 50 calls received the exact same coalesced result
    expect(results).toHaveLength(50);
    const firstResult = results[0];
    results.forEach((result) => {
      expect(result).toEqual(firstResult);
      expect(result.uid).toBe(testUid);
      expect(result.email).toBe(testEmail);
      expect(result.tier).toBe('premium');
    });
  });

  it('handles errors gracefully so subsequent calls are not permanently blocked if an in-flight call fails', async () => {
    const errorUid = 'error-user-single-flight';
    const errorEmail = 'error@zyconomes.com';
    invalidateUserCache(errorUid);

    const failingMock = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      throw new Error('Database connection timeout');
    });

    // 10 concurrent failing calls
    const failingCalls = Array.from({ length: 10 }, () =>
      getOrCreateUserCoalesced(errorUid, errorEmail, failingMock).catch((err) => err)
    );

    const results = await Promise.all(failingCalls);
    expect(failingMock).toHaveBeenCalledTimes(1);
    results.forEach((err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Database connection timeout');
    });

    // After failure completes and in-flight lookup is cleared, a subsequent call can retry
    const recoveredMock = vi.fn().mockResolvedValue({ id: 202, uid: errorUid, email: errorEmail, tier: 'free' });
    const recovered = await getOrCreateUserCoalesced(errorUid, errorEmail, recoveredMock);
    expect(recoveredMock).toHaveBeenCalledTimes(1);
    expect(recovered.id).toBe(202);
  });
});
