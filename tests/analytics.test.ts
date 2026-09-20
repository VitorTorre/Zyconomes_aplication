import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackEvent, trackSimulationCompleted, trackCheckoutStarted, getLocalAnalyticsHistory } from '../src/lib/analytics';

describe('Analytics & Conversion Funnel Tests', () => {
  beforeEach(() => {
    // Reset window mock objects
    (global as any).window = {
      dataLayer: [],
      gtag: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (global as any).localStorage = {
      store: {} as Record<string, string>,
      getItem: function (key: string) { return this.store[key] || null; },
      setItem: function (key: string, val: string) { this.store[key] = val; },
      removeItem: function (key: string) { delete this.store[key]; },
    };
  });

  it('pushes simulation_completed event to dataLayer and calls gtag', () => {
    trackEvent('simulation_completed', {
      toolName: 'Juros Compostos',
      value: 150000,
      initialDeposit: 10000,
    });

    // Verify dataLayer push
    const dataLayer = (window as any).dataLayer;
    expect(dataLayer.length).toBeGreaterThan(0);
    const lastEvent = dataLayer[dataLayer.length - 1];
    expect(lastEvent.event).toBe('simulation_completed');
    expect(lastEvent.toolName).toBe('Juros Compostos');
    expect(lastEvent.value).toBe(150000);

    // Verify gtag call
    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'simulation_completed',
      expect.objectContaining({
        event_category: 'conversion',
        event_label: 'Juros Compostos',
        value: 150000,
      })
    );
  });

  it('pushes checkout_started event with proper pricing tier and conversion label', () => {
    trackCheckoutStarted('Zyconomes Premium', 19.90);

    const dataLayer = (window as any).dataLayer;
    const checkoutEvent = dataLayer.find((e: any) => e.event === 'checkout_started');
    expect(checkoutEvent).toBeDefined();
    expect(checkoutEvent.planName).toBe('Zyconomes Premium');
    expect(checkoutEvent.value).toBe(19.90);
    expect(checkoutEvent.currency).toBe('BRL');
  });

  it('retains recent events in client history buffer without exceeding bounds', () => {
    for (let i = 0; i < 20; i++) {
      trackEvent(`test_event_${i}`, { index: i });
    }

    const history = getLocalAnalyticsHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history.length).toBeLessThanOrEqual(100);
  });
});
