import { describe, it, expect } from 'vitest';
import { 
  simulateAcceleratedLoanPayoff, 
  simulateDebtPayoffComparison, 
  calculatePayoffVsInvestOpportunity 
} from '../src/lib/financeMath';

describe('Acelerador de Quitação de Dívidas & Financiamento (SAC vs PRICE)', () => {
  it('calcula amortização extraordinária reduzindo prazo no sistema SAC', () => {
    // Financiamento imobiliário comum de R$ 300.000 a 10% a.a. por 360 meses (30 anos)
    const result = simulateAcceleratedLoanPayoff({
      principal: 300000,
      annualRatePercent: 10,
      totalMonths: 360,
      system: 'SAC',
      extraMonthlyContribution: 1000, // Aporte extra de R$ 1.000 todo mês
      extraPeriodicContribution: 5000, // FGTS/Bônus de R$ 5.000 a cada 24 meses
      periodicIntervalMonths: 24,
      amortizationStrategy: 'reduce_term',
    });

    expect(result.originalTotalMonths).toBe(360);
    expect(result.acceleratedTotalMonths).toBeLessThan(200); // Corta de 30 para ~15 anos
    expect(result.monthsSaved).toBeGreaterThan(150);
    expect(result.yearsSaved).toBeGreaterThan(14);
    expect(result.interestSaved).toBeGreaterThan(150000); // Poupa mais de R$ 150k em juros
    expect(result.leverageMultiplier).toBeGreaterThan(0.7);
    expect(result.timeline.length).toBeGreaterThan(10);
  });

  it('calcula amortização extraordinária no sistema PRICE', () => {
    const result = simulateAcceleratedLoanPayoff({
      principal: 200000,
      annualRatePercent: 12,
      totalMonths: 240, // 20 anos
      system: 'PRICE',
      extraMonthlyContribution: 800,
      amortizationStrategy: 'reduce_term',
    });

    expect(result.originalTotalMonths).toBe(240);
    expect(result.acceleratedTotalMonths).toBeLessThan(200); // Encurta o financiamento
    expect(result.interestSaved).toBeGreaterThan(50000);
    expect(result.interestSavedPercent).toBeGreaterThan(15);
  });

  it('compara estratégias Avalanche vs Bola de Neve para múltiplas dívidas', () => {
    const debts = [
      { id: '1', name: 'Cartão de Crédito', balance: 5000, annualRatePercent: 150, minPayment: 250 },
      { id: '2', name: 'Cheque Especial', balance: 3000, annualRatePercent: 120, minPayment: 150 },
      { id: '3', name: 'Empréstimo Pessoal', balance: 15000, annualRatePercent: 35, minPayment: 500 },
      { id: '4', name: 'Financiamento Carro', balance: 30000, annualRatePercent: 18, minPayment: 850 },
    ];

    const comparison = simulateDebtPayoffComparison(debts, 600); // R$ 600 de folga extra

    // Método Avalanche deve pagar menos juros ou igual à Bola de Neve
    expect(comparison.avalanche.totalInterestPaid).toBeLessThanOrEqual(comparison.snowball.totalInterestPaid);
    expect(comparison.avalanche.monthsToDebtFree).toBeGreaterThan(0);
    expect(comparison.snowball.monthsToDebtFree).toBeGreaterThan(0);
    expect(comparison.avalanche.payoffOrder.length).toBe(4);
  });

  it('calcula arbitragem de taxa e custo de oportunidade (Quitar vs Investir)', () => {
    // Cenário 1: Financiamento caro (CET 13% a.a.) vs CDB 100% CDI (10.5% bruto -> 8.9% líquido)
    const amortizeCase = calculatePayoffVsInvestOpportunity(13.0, 10.5, 15);
    expect(amortizeCase.favorsAmortizing).toBe(true);
    expect(amortizeCase.favorsInvesting).toBe(false);
    expect(amortizeCase.recommendation).toContain('Priorize amortizar a dívida');

    // Cenário 2: Financiamento subsidiado MCMV (CET 5% a.a.) vs CDI 12% bruto (10.2% líquido)
    const investCase = calculatePayoffVsInvestOpportunity(5.0, 12.0, 15);
    expect(investCase.favorsInvesting).toBe(true);
    expect(investCase.favorsAmortizing).toBe(false);
    expect(investCase.recommendation).toContain('Mantenha os recursos investidos');
  });
});
