import { describe, it, expect } from 'vitest';
import { validateProductionBoot } from '../server';

describe('Boot Fail-Fast Verification Tests [Production Reliability]', () => {
  it('throws FATAL Error in production when DATABASE_URL is missing', () => {
    expect(() => {
      validateProductionBoot({
        NODE_ENV: 'production',
        DATABASE_URL: '',
      });
    }).toThrow(/FATAL: Missing critical production environment variables: DATABASE_URL/);
  });

  it('passes in production when critical variables are present', () => {
    expect(() => {
      validateProductionBoot({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/zyconomes',
      });
    }).not.toThrow();
  });

  it('throws FATAL Error when REQUIRE_PRODUCTION_STRIPE is true but stripe keys are missing', () => {
    expect(() => {
      validateProductionBoot({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/db',
        REQUIRE_PRODUCTION_STRIPE: 'true',
        STRIPE_SECRET_KEY: '',
      });
    }).toThrow(/FATAL: Missing critical production environment variables/);
  });

  it('ignores missing production vars in development mode', () => {
    expect(() => {
      validateProductionBoot({
        NODE_ENV: 'development',
        DATABASE_URL: '',
      });
    }).not.toThrow();
  });
});
