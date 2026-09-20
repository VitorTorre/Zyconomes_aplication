import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  isDemoTokenAllowed, 
  getUserCached, 
  setCachedUser, 
  getCacheStats,
  getOrCreateUserCoalesced,
  invalidateUserCache 
} from '../src/middleware/auth';

describe('Auth Middleware & Security Tests', () => {
  describe('Demo Token Production Guard [GAP-004]', () => {
    it('MUST BLOCK demo token when NODE_ENV is production, even if ENABLE_DEMO_LOGIN is true', () => {
      const allowed = isDemoTokenAllowed('demo-email-token-123', {
        nodeEnv: 'production',
        enableDemo: 'true',
      });
      expect(allowed).toBe(false);
    });

    it('MUST BLOCK demo token when ENABLE_DEMO_LOGIN is not true in development', () => {
      const allowed = isDemoTokenAllowed('demo-email-token-123', {
        nodeEnv: 'development',
        enableDemo: 'false',
      });
      expect(allowed).toBe(false);
    });

    it('MUST BLOCK arbitrary tokens that do not match demo pattern', () => {
      const allowed = isDemoTokenAllowed('some-random-hacker-token', {
        nodeEnv: 'development',
        enableDemo: 'true',
      });
      expect(allowed).toBe(false);
    });

    it('ALLOWS demo token ONLY when development AND ENABLE_DEMO_LOGIN is true', () => {
      const allowed = isDemoTokenAllowed('demo-email-token-123', {
        nodeEnv: 'development',
        enableDemo: 'true',
      });
      expect(allowed).toBe(true);
    });

    it('ALLOWS configured DEMO_TOKEN in development with flag active', () => {
      const allowed = isDemoTokenAllowed('custom-secure-secret-demo', {
        nodeEnv: 'development',
        enableDemo: 'true',
        demoToken: 'custom-secure-secret-demo',
      });
      expect(allowed).toBe(true);
    });
  });

  describe('LRU User Cache [GAP-001]', () => {
    it('correctly sets and retrieves user from memory LRU cache', () => {
      const mockUser = { id: 999, uid: 'uid-test-123', email: 'test@zyconomes.com', tier: 'premium' };
      setCachedUser('uid-test-123', mockUser);
      
      const cached = getUserCached('uid-test-123');
      expect(cached).toBeDefined();
      expect(cached.email).toBe('test@zyconomes.com');
      expect(cached.tier).toBe('premium');
    });

    it('returns undefined for non-existent cache keys', () => {
      const cached = getUserCached('non-existent-uid-999');
      expect(cached).toBeUndefined();
    });

    it('exposes cache telemetry metrics', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('savedUpserts');
      expect(stats).toHaveProperty('cachedUsersCount');
      expect(stats).toHaveProperty('hitRatio');
    });
  });

  describe('Single-Flight Promise Coalescing [High Concurrency]', () => {
    it('deve coalescer 50 requests concorrentes em 1 consulta ao banco', async () => {
      const uid = 'concurrent-user-test-777';
      const email = 'investidor.concorrente@zyconomes.com';
      invalidateUserCache(uid);

      let dbCallCount = 0;
      const mockDbQuery = vi.fn().mockImplementation(async () => {
        dbCallCount++;
        // Simula latência de I/O de rede com o PostgreSQL
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          id: 777,
          uid,
          email,
          tier: 'premium',
          createdAt: new Date(),
        };
      });

      // 50 requisições simultâneas disparadas em paralelo
      const promises = Array(50)
        .fill(null)
        .map(() => getOrCreateUserCoalesced(uid, email, mockDbQuery));

      const results = await Promise.all(promises);

      // Verificação crítica: exatamente 1 consulta física ao banco foi efetuada
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
      expect(results.length).toBe(50);
      results.forEach((user) => {
        expect(user).toBeDefined();
        expect(user.uid).toBe(uid);
        expect(user.email).toBe(email);
        expect(user.tier).toBe('premium');
      });
    });
  });
});
