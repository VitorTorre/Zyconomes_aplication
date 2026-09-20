import { describe, it, expect } from 'vitest';
import { validateProductionBoot } from '../server';

describe('Boot Fail-Fast Verification Tests [Production Reliability]', () => {
  it('throws FATAL Error in production when database config is missing', () => {
    expect(() => {
      validateProductionBoot({
        NODE_ENV: 'production',
        DATABASE_URL: '',
        AUDIT_HMAC_SECRET: 'test_hmac_secret',
        SUPERADMIN_STEP_UP_SECRET: 'test_step_up',
      });
    }).toThrow(/FATAL: Missing critical production environment variables.*DATABASE_URL ou credenciais Cloud SQL/);
  });

  it('passes in production when DATABASE_URL and critical variables are present', () => {
    expect(() => {
      validateProductionBoot({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/zyconomes',
        AUDIT_HMAC_SECRET: 'test_hmac_secret',
        SUPERADMIN_STEP_UP_SECRET: 'test_step_up',
      });
    }).not.toThrow();
  });

  it('passes in production when Cloud SQL variables (SQL_*) and critical variables are present', () => {
    expect(() => {
      validateProductionBoot({
        NODE_ENV: 'production',
        SQL_HOST: '/app/cloudsql/project:region:instance',
        SQL_DB_NAME: 'cloud_sql_db',
        SQL_USER: 'app_user',
        SQL_PASSWORD: 'app_password',
        AUDIT_HMAC_SECRET: 'test_hmac_secret',
        SUPERADMIN_STEP_UP_SECRET: 'test_step_up',
      });
    }).not.toThrow();
  });

  it('throws FATAL Error when REQUIRE_PRODUCTION_STRIPE is true but stripe keys are missing', () => {
    expect(() => {
      validateProductionBoot({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/db',
        AUDIT_HMAC_SECRET: 'test_hmac_secret',
        SUPERADMIN_STEP_UP_SECRET: 'test_step_up',
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
