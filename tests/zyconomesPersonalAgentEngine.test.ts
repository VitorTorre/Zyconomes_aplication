import { describe, it, expect } from 'vitest';
import { 
  runPersonalAgentSimulation, 
  sanitizePersonalAgentParams,
  PersonalAgentSimulationParams 
} from '../src/services/zyconomesPersonalAgentEngine';

describe('Zyconomes Personal AI Financial Agent Engine', () => {
  it('sanitizes input parameters and enforces mathematical bounds', () => {
    const raw: Partial<PersonalAgentSimulationParams> = {
      initialCapitalBRL: -500, // deve ser corrigido para mínimo 100
      initialMonthlyContributionBRL: 10, // deve ser corrigido para mínimo 50
      quarterlyContributionStepBRL: 8000, // deve respeitar teto de 5000
      targetWeeklyUSD: -200, // mínimo 100
      currentExchangeRateBRLUSD: 0, // mínimo 2.0
    };

    const sanitized = sanitizePersonalAgentParams(raw);
    expect(sanitized.initialCapitalBRL).toBe(1000); // fallback padrão
    expect(sanitized.initialMonthlyContributionBRL).toBe(50);
    expect(sanitized.quarterlyContributionStepBRL).toBe(5000);
    expect(sanitized.targetWeeklyUSD).toBe(2000); // fallback padrão
    expect(sanitized.currentExchangeRateBRLUSD).toBe(5.50);
  });

  it('calculates short, medium and long-term milestones accurately', () => {
    const result = runPersonalAgentSimulation({
      initialCapitalBRL: 1000,
      initialMonthlyContributionBRL: 400,
      quarterlyContributionStepBRL: 200,
      targetWeeklyUSD: 2000,
      currentExchangeRateBRLUSD: 5.50,
      tone: 'balanced_perseverant',
      marketCycle: 'expansion'
    });

    expect(result.projections.length).toBe(16); // Anos 0 a 15
    expect(result.projections[0].portfolioTotalBRL).toBe(1000);
    expect(result.projections[0].phase).toBe('short_term');

    // Fechamento de ano 1 (curto prazo)
    expect(result.milestones.shortTermYear1EndBRL).toBeGreaterThan(1000);
    expect(result.projections[1].phase).toBe('medium_term');

    // Fechamento de ano 5 (médio prazo) deve apresentar multiplicação de 5x a 8x+ sobre o curto prazo
    expect(result.milestones.mediumTermYear5EndBRL).toBeGreaterThan(result.milestones.shortTermYear1EndBRL);
    expect(result.milestones.mediumTermMultiplicationFactor).toBeGreaterThanOrEqual(4.0);

    // Meta patrimonial requerida para USD 2.000/semana a 4% SWR: 2.000 * 52 / 0.04 = USD 2.600.000
    expect(result.milestones.requiredCapitalForUSD2000Weekly).toBe(2600000);

    // Fechamento de ano 15
    const year15 = result.projections[15];
    expect(year15.phase).toBe('long_term');
    expect(year15.portfolioTotalUSD).toBeGreaterThan(0);
    expect(year15.estimatedWeeklyPassiveIncomeUSD).toBeGreaterThan(0);
  });

  it('properly allocates dividends according to the 20/25/40/15 rule', () => {
    const result = runPersonalAgentSimulation({
      initialCapitalBRL: 1000,
      initialMonthlyContributionBRL: 500,
      quarterlyContributionStepBRL: 250,
    });

    const year5Alloc = result.projections[5].dividendsAllocation;
    const totalDividendsAllocated = 
      year5Alloc.personalExpensesBRL +
      year5Alloc.nicheBusinessesBRL +
      year5Alloc.equitiesAndMacroFundsBRL +
      year5Alloc.liquidityHedgeBRL;

    expect(totalDividendsAllocated).toBeGreaterThan(0);
    // Verificar proporcionalidade aproximada
    expect(year5Alloc.personalExpensesBRL / totalDividendsAllocated).toBeCloseTo(0.20, 1);
    expect(year5Alloc.nicheBusinessesBRL / totalDividendsAllocated).toBeCloseTo(0.25, 1);
    expect(year5Alloc.equitiesAndMacroFundsBRL / totalDividendsAllocated).toBeCloseTo(0.40, 1);
    expect(year5Alloc.liquidityHedgeBRL / totalDividendsAllocated).toBeCloseTo(0.15, 1);
  });

  it('adjusts tactical recommendations across market cycles', () => {
    const accumulationRes = runPersonalAgentSimulation({ marketCycle: 'accumulation' });
    expect(accumulationRes.cycleInsight.phase).toBe('accumulation');
    expect(accumulationRes.cycleInsight.riskScore).toBeLessThanOrEqual(4);

    const euphoriaRes = runPersonalAgentSimulation({ marketCycle: 'euphoria', tone: 'skeptical_fiduciary' });
    expect(euphoriaRes.cycleInsight.phase).toBe('euphoria');
    expect(euphoriaRes.cycleInsight.riskScore).toBeGreaterThanOrEqual(8);
    expect(euphoriaRes.toneVerdict.headline).toContain('Cético & Fiduciário');
  });

  it('resolves hidden inconsistencies explicitly in simulation output', () => {
    const result = runPersonalAgentSimulation({});
    expect(result.inconsistenciesResolved.length).toBeGreaterThanOrEqual(5);
    expect(result.inconsistenciesResolved[0]).toContain('Ilusão Monetária Nominal');
    expect(result.inconsistenciesResolved[1]).toContain('Equação de Trinity');
  });
});
