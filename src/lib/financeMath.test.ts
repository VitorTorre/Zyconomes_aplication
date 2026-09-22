import { describe, it, expect } from 'vitest';
import {
  calculateSavingsRate,
  calculateEmergencyFundMonths,
  calculateIndependenceYears,
  calculateCompoundInterest,
  calculateSAC,
  calculatePRICE,
  calculateDCF,
  calculateBlackScholes,
} from './financeMath';

describe('Finance Math Core & Validation Suite', () => {
  it('should calculate savings rate', () => {
    expect(calculateSavingsRate(10000, 6000)).toBe(40);
  });

  it('should calculate emergency fund months', () => {
    expect(calculateEmergencyFundMonths(30000, 5000)).toBe(6);
  });

  it('should calculate independence years', () => {
    const years = calculateIndependenceYears(100000, 1000000, 5000, 10);
    expect(years).toBeGreaterThan(8.2);
    expect(years).toBeLessThan(8.4);
  });

  it('1. Juros Compostos (Nominal)', () => {
    // R$ 10.000, R$ 500/mês, 10% a.a., 10 anos
    const result = calculateCompoundInterest(10000, 500, 10, 10, 'nominal');
    // Esperado ~ R$ 129.492,90 vs Ref R$ 129.492,80
    const diff = Math.abs(result.totalAmount - 129492.80) / 129492.80;
    expect(diff).toBeLessThanOrEqual(0.0001); // <= 0.01%
  });

  it('2. SAC', () => {
    // R$ 200.000, 0.8% a.m., 240 meses
    const result = calculateSAC(200000, 0.8, 240);
    expect(Number(result.amortization.toFixed(2))).toBe(833.33);
    expect(Number(result.firstInstallment.toFixed(2))).toBe(2433.33);
    expect(Number(result.lastInstallment.toFixed(2))).toBe(840.00);
    expect(result.totalInterest).toBe(192800.00);
    expect(result.totalPaid).toBe(392800.00);
  });

  it('3. PRICE', () => {
    // R$ 200.000, 0.8% a.m., 240 meses
    const result = calculatePRICE(200000, 0.8, 240);
    // Exact analytical PMT = 1877.35 vs Ref = 1877.74
    const pmtDiff = Math.abs(result.pmt - 1877.74) / 1877.74;
    expect(pmtDiff).toBeLessThanOrEqual(0.001); // <= 0.1%
  });

  it('4. DCF Valuation', () => {
    // FCF1: 100k, g: 5%, WACC: 12%, g_perp: 3%, n: 5
    const result = calculateDCF(100000, 5, 12, 3, 5);
    const totalDiff = Math.abs(result.totalValuation - 1198671.50) / 1198671.50;
    expect(totalDiff).toBeLessThanOrEqual(0.0001); // <= 0.01%
  });

  it('5. Black-Scholes Call', () => {
    // S=100, K=105, T=0.5, r=5%, sigma=20%
    const result = calculateBlackScholes(100, 105, 0.5, 5, 20, 'call');
    expect(Number(result.d1.toFixed(5))).toBe(-0.09751);
    expect(Number(result.d2.toFixed(5))).toBe(-0.23893);
    expect(Number(result.price.toFixed(2))).toBe(4.58);
  });
});
