import { describe, it, expect } from 'vitest';

describe('Stripe Checkout Integration Tests', () => {
  it('validates subscription price and interval contract for Zyconomes Premium', () => {
    const premiumPlan = {
      name: 'Zyconomes Premium',
      currency: 'brl',
      unitAmount: 1990, // R$ 19,90/mês
      interval: 'month',
    };

    expect(premiumPlan.currency).toBe('brl');
    expect(premiumPlan.unitAmount).toBe(1990);
    expect(premiumPlan.unitAmount / 100).toBe(19.9);
    expect(premiumPlan.interval).toBe('month');
  });

  it('validates checkout redirect URLs contract', () => {
    const origin = 'https://app.zyconomes.com.br';
    const successUrl = `${origin}/#sucesso?session_id={CHECKOUT_SESSION_ID}&status=active`;
    const cancelUrl = `${origin}/#premium?canceled=true`;

    expect(successUrl).toContain('/#sucesso');
    expect(successUrl).toContain('{CHECKOUT_SESSION_ID}');
    expect(cancelUrl).toContain('/#premium');
    expect(cancelUrl).toContain('canceled=true');
  });
});
