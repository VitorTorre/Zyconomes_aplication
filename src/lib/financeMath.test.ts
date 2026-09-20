import { describe, it, expect } from 'vitest';
import { calculateSavingsRate, calculateEmergencyFundMonths, calculateIndependenceYears } from './financeMath';

describe('Finance Math Core', () => {
  it('should correctly calculate the savings rate', () => {
    // Income = 10000, Expenses = 6000 -> FCF = 4000 -> 40%
    expect(calculateSavingsRate(10000, 6000)).toBe(40);
    expect(calculateSavingsRate(0, 100)).toBe(0);
  });

  it('should correctly calculate emergency fund coverage in months', () => {
    // Savings = 30000, Monthly Expenses = 5000 -> 6 months
    expect(calculateEmergencyFundMonths(30000, 5000)).toBe(6);
    expect(calculateEmergencyFundMonths(10000, 0)).toBe(0);
  });

  it('should correctly calculate years to financial independence using the logarithmic formula', () => {
    // Current Wealth = 100k, Target = 1M, Contribution = 5k/mo, Rate = 10%
    // monthlyRate = 0.1 / 12 = 0.008333
    // ln(((1000000 * 0.008333) + 5000) / ((100000 * 0.008333) + 5000)) / ln(1.008333)
    const years = calculateIndependenceYears(100000, 1000000, 5000, 10);
    expect(years).toBeGreaterThan(8.2);
    expect(years).toBeLessThan(8.4);
    
    // Test 0% rate fallback (linear)
    // 900k target gap / 5k mo = 180 months = 15 years
    const linearYears = calculateIndependenceYears(100000, 1000000, 5000, 0);
    expect(linearYears).toBe(15);
  });
});
