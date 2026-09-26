/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { FinancialDataProvider, useFinancialData } from '../src/context/FinancialDataContext';

describe('FinancialDataContext - Lightweight State Management Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FinancialDataProvider>{children}</FinancialDataProvider>
  );

  it('initializes with expected default financial values and derived calculations', () => {
    const { result } = renderHook(() => useFinancialData(), { wrapper });

    expect(result.current.income).toBe(8500);
    expect(result.current.expenses).toBe(5200);
    expect(result.current.savings).toBe(15000);
    expect(result.current.freeCashFlow).toBe(3300);
    expect(result.current.savingsRate).toBeCloseTo(38.82, 1);
    expect(result.current.emergencyReserveTarget).toBe(5200 * 6);
    expect(result.current.emergencyFundMonths).toBeCloseTo(15000 / 5200, 1);
    expect(result.current.recommendedTargetWealth).toBe(5200 * 12 * 25);
  });

  it('updates financial data and recomputes derived metrics in real time', () => {
    const { result } = renderHook(() => useFinancialData(), { wrapper });

    act(() => {
      result.current.setIncome(12000);
      result.current.setExpenses(6000);
      result.current.setSavings(36000);
    });

    expect(result.current.income).toBe(12000);
    expect(result.current.expenses).toBe(6000);
    expect(result.current.savings).toBe(36000);
    expect(result.current.freeCashFlow).toBe(6000);
    expect(result.current.savingsRate).toBe(50);
    expect(result.current.emergencyReserveTarget).toBe(36000);
    expect(result.current.emergencyFundMonths).toBe(6);
    expect(result.current.recommendedTargetWealth).toBe(6000 * 12 * 25);
  });

  it('synchronizes all calculator components via syncAllCalculators', () => {
    const { result } = renderHook(() => useFinancialData(), { wrapper });

    act(() => {
      result.current.setIncome(10000);
      result.current.setExpenses(5000);
      result.current.setSavings(25000);
      result.current.setCurrentWealth(10000);
    });

    act(() => {
      result.current.syncAllCalculators();
    });

    // Surplus (5000) should propagate to monthlyContribution and wealthContribution
    expect(result.current.monthlyContribution).toBe(5000);
    expect(result.current.wealthContribution).toBe(5000);
    // Savings (25000) > currentWealth (10000) -> currentWealth updated
    expect(result.current.currentWealth).toBe(25000);
    // Target wealth set to 300x expenses (5000 * 300 = 1,500,000)
    expect(result.current.targetWealth).toBe(1500000);
  });

  it('applies monthly free cash flow surplus to investments', () => {
    const { result } = renderHook(() => useFinancialData(), { wrapper });

    act(() => {
      result.current.setIncome(15000);
      result.current.setExpenses(8000);
    });

    act(() => {
      result.current.applySurplusToInvestments();
    });

    expect(result.current.freeCashFlow).toBe(7000);
    expect(result.current.monthlyContribution).toBe(7000);
    expect(result.current.wealthContribution).toBe(7000);
  });

  it('resets state cleanly to factory defaults', () => {
    const { result } = renderHook(() => useFinancialData(), { wrapper });

    act(() => {
      result.current.setIncome(25000);
      result.current.setLoanAmount(900000);
      result.current.resetToDefaults();
    });

    expect(result.current.income).toBe(8500);
    expect(result.current.expenses).toBe(5200);
    expect(result.current.loanAmount).toBe(250000);
  });

  it('throws a descriptive error when used outside FinancialDataProvider', () => {
    expect(() => {
      renderHook(() => useFinancialData());
    }).toThrow('useFinancialData must be used within a FinancialDataProvider');
  });
});
