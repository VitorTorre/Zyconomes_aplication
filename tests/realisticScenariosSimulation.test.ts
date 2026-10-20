import { describe, it, expect } from 'vitest';
import { 
  simulateAcceleratedLoanPayoff, 
  simulateDebtPayoffComparison, 
  calculatePayoffVsInvestOpportunity,
  calculatePRICE,
  calculateSAC
} from '../src/lib/financeMath';
import { runPersonalAgentSimulation } from '../src/services/zyconomesPersonalAgentEngine';

/**
 * Suíte de Simulação e Validação Empírica de Três Grandes Cenários Realistas
 * Baseada em intervenções macroeconômicas, taxas contemporâneas e decisões fiduciárias ótimas.
 */
describe('Simulação de Três Grandes Cenários Realistas & Hipóteses Fiduciárias', () => {

  // =========================================================================
  // CENÁRIO 1: Estagflação & Juros Altos Persistentes (Selic Alta 11-13% a.a.)
  // Contexto: Financiamento habitacional SAC de R$ 380.000 em 360 meses a 11.5% a.a. CET.
  // =========================================================================
  describe('Cenário 1: Regime de Juros Altos & Intervenção de Aperto Monetário', () => {
    const loanAmount = 380000;
    const annualRate = 11.5;
    const totalMonths = 360;

    it('Hipótese 1.1 vs 1.2: Amortização extraordinária abatedora de prazo supera a inércia em mais de R$ 200.000 de economia real', () => {
      // Simulação sem aportes extras (Inércia padrão)
      const standardLoan = simulateAcceleratedLoanPayoff({
        principal: loanAmount,
        annualRatePercent: annualRate,
        totalMonths,
        system: 'SAC',
        amortizationStrategy: 'reduce_term',
        extraMonthlyContribution: 0,
        extraPeriodicContribution: 0,
        periodicIntervalMonths: 12
      });

      // Simulação com disciplina de aporte trimestral/mensal (R$ 1.200/mês extra + R$ 6.000 anuais de 13º/bônus)
      const acceleratedLoan = simulateAcceleratedLoanPayoff({
        principal: loanAmount,
        annualRatePercent: annualRate,
        totalMonths,
        system: 'SAC',
        amortizationStrategy: 'reduce_term',
        extraMonthlyContribution: 1200,
        extraPeriodicContribution: 6000,
        periodicIntervalMonths: 12
      });

      expect(standardLoan.originalTotalInterest).toBeGreaterThan(500000);
      expect(acceleratedLoan.acceleratedTotalInterest).toBeLessThan(350000);
      
      // A economia líquida de juros deve superar R$ 200.000
      expect(acceleratedLoan.interestSaved).toBeGreaterThan(200000);
      
      // Prazo reduzido de 30 anos (360 meses) para menos de 15 anos (180 meses)
      expect(acceleratedLoan.acceleratedTotalMonths).toBeLessThan(180);
      expect(acceleratedLoan.yearsSaved).toBeGreaterThan(15);
      
      // Multiplicador de alavancagem de amortização fiduciária > 0.8
      expect(acceleratedLoan.leverageMultiplier).toBeGreaterThan(0.8);
    });

    it('Hipótese 1.3: Arbitragem de custo de oportunidade favorece amortizar quando Selic líquida < CET do crédito', () => {
      // Financiamento CET 11.5% a.a. vs Selic 10.75% com IR de 17.5% (Líquido: ~8.87%)
      const opportunity = calculatePayoffVsInvestOpportunity(11.5, 10.75, 17.5);

      expect(opportunity.favorsAmortizing).toBe(true);
      expect(opportunity.favorsInvesting).toBe(false);
      expect(opportunity.spreadAnnual).toBeLessThan(-2.0); // Mais de 2 pontos percentuais de spread a favor da quitação
      expect(opportunity.recommendation).toContain('Priorize amortizar a dívida');
    });
  });

  // =========================================================================
  // CENÁRIO 2: Afrouxamento Monetário & Expansão de Liquidez (Regra 20/25/40/15)
  // Contexto: Agente de IA projetando 15 anos com progressão trimestral de R$ 150 a R$ 2.000
  // =========================================================================
  describe('Cenário 2: Ciclo de Afrouxamento & Rotação de Proventos em Negócios Nichados', () => {
    it('Hipótese 2.1: A regra dos proventos (20% pessoal, 25% nichos, 40% ações, 15% liquidez) gera sustentabilidade de longo prazo', () => {
      const simulation = runPersonalAgentSimulation({
        initialCapitalBRL: 10000,
        initialMonthlyContributionBRL: 500,
        quarterlyContributionStepBRL: 300,
        targetWeeklyUSD: 2000,
        tone: 'formidable_bold',
        marketCycle: 'expansion'
      });

      expect(simulation.projections.length).toBe(16); // Ano 0 a Ano 15
      
      const lastYear = simulation.projections[15];
      expect(lastYear.portfolioTotalBRL).toBeGreaterThan(1500000);
      
      const alloc = lastYear.dividendsAllocation;
      expect(alloc.personalExpensesBRL).toBeGreaterThan(0);
      expect(alloc.nicheBusinessesBRL).toBeGreaterThan(0);
      expect(alloc.equitiesAndMacroFundsBRL).toBeGreaterThan(0);
      expect(alloc.liquidityHedgeBRL).toBeGreaterThan(0);

      // Verificação da divisão exata de proventos: 20% pessoal, 25% nichos, 40% ações/multimercado, 15% liquidez
      const totalYieldReinvested = alloc.personalExpensesBRL + 
                                  alloc.nicheBusinessesBRL + 
                                  alloc.equitiesAndMacroFundsBRL + 
                                  alloc.liquidityHedgeBRL;
      
      const personalRatio = alloc.personalExpensesBRL / totalYieldReinvested;
      const nicheRatio = alloc.nicheBusinessesBRL / totalYieldReinvested;
      const equityRatio = alloc.equitiesAndMacroFundsBRL / totalYieldReinvested;
      const liquidityRatio = alloc.liquidityHedgeBRL / totalYieldReinvested;

      expect(personalRatio).toBeCloseTo(0.20, 2);
      expect(nicheRatio).toBeCloseTo(0.25, 2);
      expect(equityRatio).toBeCloseTo(0.40, 2);
      expect(liquidityRatio).toBeCloseTo(0.15, 2);
    });

    it('Hipótese 2.2: O modo cético fiduciário previne ilusão de riqueza comparado ao modo arriscado em cenários de contração', () => {
      const ceticSimulation = runPersonalAgentSimulation({
        initialCapitalBRL: 20000,
        quarterlyContributionStepBRL: 200,
        targetWeeklyUSD: 2000,
        tone: 'skeptical_fiduciary',
        marketCycle: 'contraction'
      });

      const riskySimulation = runPersonalAgentSimulation({
        initialCapitalBRL: 20000,
        quarterlyContributionStepBRL: 200,
        targetWeeklyUSD: 2000,
        tone: 'formidable_bold',
        marketCycle: 'contraction'
      });

      // Em contração com perfil cético, o patrimônio final P50 na projeção é mais prudente
      expect(ceticSimulation.projections[15].p50MedianBRL).toBeLessThan(riskySimulation.projections[15].p50MedianBRL);
      
      // Ambas convergem para cálculo determinístico auditável sem crashes
      expect(ceticSimulation.milestones.longTermYear15EndUSD).toBeGreaterThan(0);
      expect(riskySimulation.milestones.longTermYear15EndUSD).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // CENÁRIO 3: Choque de Crédito, Múltiplas Dívidas & Priorização Avalanche vs Bola de Neve
  // Contexto: Família com dívida de cartão/cheque (140% a.a.) + Financiamento Imobiliário (10.5% a.a.)
  // =========================================================================
  describe('Cenário 3: Choque de Crédito & Desalavancagem Familiar Urgente', () => {
    const debts = [
      { id: '1', name: 'Rotativo Cartão', balance: 15000, annualRatePercent: 145.0, minPayment: 1500 },
      { id: '2', name: 'Empréstimo Pessoal', balance: 35000, annualRatePercent: 38.0, minPayment: 1200 },
      { id: '3', name: 'Financiamento Imóvel PRICE', balance: 320000, annualRatePercent: 10.5, minPayment: 2900 }
    ];

    it('Hipótese 3.1: O método Avalanche aniquila o rotativo em tempo recorde poupando mais juros que o método Bola de Neve', () => {
      const comparison = simulateDebtPayoffComparison(
        debts,
        900 // Orçamento com R$ 900 de amortização extra mensal
      );

      // O método Avalanche prioriza a dívida de maior taxa (145% a.a.)
      expect(comparison.avalanche.payoffOrder[0].debtName).toBe('Rotativo Cartão');
      
      // O método Avalanche deve pagar menos juros totais que o Bola de Neve
      expect(comparison.avalanche.totalInterestPaid).toBeLessThanOrEqual(comparison.snowball.totalInterestPaid);
      expect(comparison.interestDifference).toBeGreaterThanOrEqual(0);
      
      // O plano liquida com ordem documentada
      expect(comparison.avalanche.payoffOrder.length).toBe(3);
    });

    it('Hipótese 3.2: O amortecimento com parcelas fixas PRICE mantém a parcela acessível enquanto SAC reduz o saldo mais rápido', () => {
      // Taxa mensal = 10.5% / 12 = 0.875% ao mês
      const monthlyRate = 10.5 / 12;
      const priceCalc = calculatePRICE(320000, monthlyRate, 360);
      const sacCalc = calculateSAC(320000, monthlyRate, 360);

      // PRICE tem parcela inicial significativamente mais baixa que a primeira parcela de SAC
      expect(priceCalc.pmt).toBeLessThan(sacCalc.firstInstallment);
      
      // Porém, SAC tem última parcela muito menor
      expect(sacCalc.lastInstallment).toBeLessThan(priceCalc.pmt);
      
      // Ambas as funções retornam valores matematicamente consistentes
      expect(priceCalc.pmt).toBeGreaterThan(2500);
      expect(sacCalc.firstInstallment).toBeGreaterThan(priceCalc.pmt);
    });
  });
});
