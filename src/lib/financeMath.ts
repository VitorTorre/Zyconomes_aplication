export const safeNumber = (val: number) => (isNaN(val) || !isFinite(val) ? 0 : val);

export const calculateSavingsRate = (income: number, expenses: number) => {
  const freeCashFlow = income - expenses;
  return income > 0 ? (freeCashFlow / income) * 100 : 0;
};

export const calculateEmergencyFundMonths = (savings: number, expenses: number) => {
  return expenses > 0 ? savings / expenses : 0;
};

export const calculateIndependenceYears = (currentWealth: number, targetWealth: number, monthlyContribution: number, annualRate: number) => {
  const monthlyRate = annualRate / 100 / 12;
  const remainingMonths = monthlyRate > 0 && monthlyContribution > 0
    ? Math.log(((targetWealth * monthlyRate) + monthlyContribution) / ((currentWealth * monthlyRate) + monthlyContribution)) / Math.log(1 + monthlyRate)
    : (targetWealth - currentWealth) / (monthlyContribution || 1);
  return safeNumber(remainingMonths / 12);
};

/**
 * Cumulative Standard Normal CDF N(x)
 * Abramowitz and Stegun approximation (error < 7.5e-8)
 */
export const cdfNormal = (x: number): number => {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
};

/**
 * 1. Juros Compostos
 * Convenção Nominal: i = taxaAnual / 100 / 12
 * Convenção Efetiva: i = (1 + taxaAnual/100)^(1/12) - 1
 */
export const calculateCompoundInterest = (
  savings: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
  convention: 'nominal' | 'effective' = 'nominal'
) => {
  if (years < 0 || annualRate < 0) {
    throw new Error('Parâmetros de juros compostos inválidos: prazo e taxa devem ser não-negativos.');
  }

  const months = years * 12;
  const monthlyRate = convention === 'nominal'
    ? (annualRate / 100) / 12
    : Math.pow(1 + (annualRate / 100), 1 / 12) - 1;

  if (monthlyRate === 0) {
    const totalAmount = savings + (monthlyContribution * months);
    return {
      monthlyRate,
      totalAmount,
      totalInvested: savings + (monthlyContribution * months),
      totalInterest: 0,
    };
  }

  const compoundSavings = savings * Math.pow(1 + monthlyRate, months);
  const compoundContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  const totalAmount = compoundSavings + compoundContributions;
  const totalInvested = savings + (monthlyContribution * months);

  return {
    monthlyRate,
    totalAmount: safeNumber(totalAmount),
    totalInvested: safeNumber(totalInvested),
    totalInterest: safeNumber(totalAmount - totalInvested),
  };
};

/**
 * 2. Sistema de Amortização Constante (SAC)
 */
export const calculateSAC = (
  principal: number,
  monthlyRatePercent: number,
  months: number
) => {
  if (principal <= 0 || months <= 0 || monthlyRatePercent < 0) {
    throw new Error('Parâmetros inválidos para cálculo de SAC.');
  }

  const i = monthlyRatePercent / 100;
  const amortization = principal / months;
  const firstInstallment = amortization + (principal * i);
  const lastInstallment = amortization + (amortization * i);
  const totalInterest = ((months + 1) / 2) * principal * i;
  const totalPaid = principal + totalInterest;

  return {
    amortization: safeNumber(amortization),
    firstInstallment: safeNumber(firstInstallment),
    lastInstallment: safeNumber(lastInstallment),
    totalInterest: safeNumber(totalInterest),
    totalPaid: safeNumber(totalPaid),
  };
};

/**
 * 3. Tabela PRICE
 */
export const calculatePRICE = (
  principal: number,
  monthlyRatePercent: number,
  months: number
) => {
  if (principal <= 0 || months <= 0 || monthlyRatePercent < 0) {
    throw new Error('Parâmetros inválidos para cálculo de PRICE.');
  }

  const i = monthlyRatePercent / 100;
  if (i === 0) {
    const pmt = principal / months;
    return {
      pmt: safeNumber(pmt),
      totalPaid: safeNumber(principal),
      totalInterest: 0,
    };
  }

  const pmt = (principal * i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);
  const totalPaid = pmt * months;
  const totalInterest = totalPaid - principal;

  return {
    pmt: safeNumber(pmt),
    totalPaid: safeNumber(totalPaid),
    totalInterest: safeNumber(totalInterest),
  };
};

/**
 * 4. Valuation por Fluxo de Caixa Descontado (DCF)
 */
export const calculateDCF = (
  fcf1: number,
  gPercent: number,
  waccPercent: number,
  gPerpPercent: number,
  years: number = 5
) => {
  const g = gPercent / 100;
  const wacc = waccPercent / 100;
  const gPerp = gPerpPercent / 100;

  if (wacc <= gPerp) {
    throw new Error('WACC deve ser estritamente maior que a taxa de crescimento perpétua (g_perp).');
  }

  let explicitNPV = 0;
  for (let t = 1; t <= years; t++) {
    const fcf_t = fcf1 * Math.pow(1 + g, t - 1);
    explicitNPV += fcf_t / Math.pow(1 + wacc, t);
  }

  const fcfN1 = fcf1 * Math.pow(1 + g, years);
  const terminalValue = fcfN1 / (wacc - gPerp);
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, years);
  const totalValuation = explicitNPV + pvTerminalValue;

  return {
    explicitNPV: safeNumber(explicitNPV),
    terminalValue: safeNumber(terminalValue),
    pvTerminalValue: safeNumber(pvTerminalValue),
    totalValuation: safeNumber(totalValuation),
  };
};

/**
 * 5. Modelo Black-Scholes para Precificação de Opções
 */
export const calculateBlackScholes = (
  S: number,
  K: number,
  T: number,
  rPercent: number,
  sigmaPercent: number,
  optionType: 'call' | 'put' = 'call'
) => {
  if (S <= 0 || K <= 0 || T <= 0 || sigmaPercent <= 0) {
    throw new Error('Parâmetros inválidos para Black-Scholes: S, K, T e volatilidade devem ser positivos.');
  }

  const r = rPercent / 100;
  const sigma = sigmaPercent / 100;

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - (sigma * Math.sqrt(T));

  const Nd1 = cdfNormal(d1);
  const Nd2 = cdfNormal(d2);

  const callPrice = (S * Nd1) - (K * Math.exp(-r * T) * Nd2);
  const putPrice = (K * Math.exp(-r * T) * cdfNormal(-d2)) - (S * cdfNormal(-d1));

  return {
    d1: safeNumber(d1),
    d2: safeNumber(d2),
    Nd1: safeNumber(Nd1),
    Nd2: safeNumber(Nd2),
    price: safeNumber(optionType === 'call' ? callPrice : putPrice),
  };
};

/**
 * 6. Acelerador de Quitação de Financiamento Imobiliário e Dívidas (SAC & PRICE)
 * Simula amortização extraordinária abatendo prazo ou prestação com aportes extras e periódicos (FGTS/13º)
 */
export interface LoanSimulationParams {
  principal: number;
  annualRatePercent: number;
  totalMonths: number;
  system: 'SAC' | 'PRICE';
  extraMonthlyContribution?: number;
  extraPeriodicContribution?: number;
  periodicIntervalMonths?: number;
  amortizationStrategy?: 'reduce_term' | 'reduce_installment';
}

export interface LoanMonthPoint {
  month: number;
  year: number;
  originalBalance: number;
  acceleratedBalance: number;
  originalPayment: number;
  acceleratedPayment: number;
  interestOriginal: number;
  interestAccelerated: number;
  extraContributed: number;
}

export interface LoanSimulationResult {
  originalTotalMonths: number;
  acceleratedTotalMonths: number;
  monthsSaved: number;
  yearsSaved: number;
  originalTotalInterest: number;
  acceleratedTotalInterest: number;
  interestSaved: number;
  interestSavedPercent: number;
  totalExtraContributed: number;
  totalOriginalPaid: number;
  totalAcceleratedPaid: number;
  leverageMultiplier: number; // Juros poupados por cada R$ 1,00 aportado
  firstInstallmentOriginal: number;
  firstInstallmentAccelerated: number;
  timeline: LoanMonthPoint[];
}

export const simulateAcceleratedLoanPayoff = (params: LoanSimulationParams): LoanSimulationResult => {
  const principal = Math.max(100, safeNumber(params.principal));
  const totalMonths = Math.max(1, Math.min(600, Math.round(safeNumber(params.totalMonths))));
  const annualRate = Math.max(0.01, safeNumber(params.annualRatePercent));
  const monthlyRate = annualRate / 100 / 12;
  const extraMonthly = Math.max(0, safeNumber(params.extraMonthlyContribution || 0));
  const extraPeriodic = Math.max(0, safeNumber(params.extraPeriodicContribution || 0));
  const periodicInterval = Math.max(1, Math.round(safeNumber(params.periodicIntervalMonths || 12)));
  const system = params.system || 'SAC';
  const strategy = params.amortizationStrategy || 'reduce_term';

  // 1. Linha Base Original (Sem Aportes Extras)
  let baseBalance = principal;
  let baseTotalInterest = 0;
  let baseFirstPmt = 0;
  const baseMonthlyAmort = system === 'SAC' ? principal / totalMonths : 0;
  const basePricePmt = system === 'PRICE' 
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : 0;

  const baseBalances: number[] = [principal];
  const basePayments: number[] = [];
  const baseInterests: number[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    const interest = baseBalance * monthlyRate;
    let amort = 0;
    let pmt = 0;

    if (system === 'SAC') {
      amort = Math.min(baseBalance, baseMonthlyAmort);
      pmt = amort + interest;
    } else {
      pmt = Math.min(basePricePmt, baseBalance + interest);
      amort = pmt - interest;
    }

    if (m === 1) baseFirstPmt = pmt;
    baseBalance = Math.max(0, baseBalance - amort);
    baseTotalInterest += interest;
    baseBalances.push(baseBalance);
    basePayments.push(pmt);
    baseInterests.push(interest);

    if (baseBalance <= 0.01) break;
  }

  // 2. Linha Acelerada (Com Amortização Extraordinária)
  let accBalance = principal;
  let accTotalInterest = 0;
  let accFirstPmt = 0;
  let totalExtraPaid = 0;
  let accMonthsCount = 0;

  const timeline: LoanMonthPoint[] = [];

  // Ponto inicial mês 0
  timeline.push({
    month: 0,
    year: 0,
    originalBalance: principal,
    acceleratedBalance: principal,
    originalPayment: 0,
    acceleratedPayment: 0,
    interestOriginal: 0,
    interestAccelerated: 0,
    extraContributed: 0,
  });

  let currentTotalMonths = totalMonths;

  for (let m = 1; m <= totalMonths; m++) {
    if (accBalance <= 0.01) break;

    accMonthsCount = m;
    const interest = accBalance * monthlyRate;
    let scheduledAmort = 0;
    let scheduledPmt = 0;

    if (system === 'SAC') {
      const remainingMonths = Math.max(1, currentTotalMonths - m + 1);
      scheduledAmort = Math.min(accBalance, accBalance / remainingMonths);
      scheduledPmt = scheduledAmort + interest;
    } else {
      const remainingMonths = Math.max(1, currentTotalMonths - m + 1);
      const dynamicPricePmt = (accBalance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / (Math.pow(1 + monthlyRate, remainingMonths) - 1);
      scheduledPmt = Math.min(dynamicPricePmt, accBalance + interest);
      scheduledAmort = Math.max(0, scheduledPmt - interest);
    }

    if (m === 1) accFirstPmt = scheduledPmt;

    // Aportes Extras (Mensal + Periódico)
    let extraThisMonth = extraMonthly;
    if (m % periodicInterval === 0) {
      extraThisMonth += extraPeriodic;
    }

    let actualAmort = scheduledAmort;
    let totalPmt = scheduledPmt;

    // Aplica aporte extraordinário diretamente abatendo o saldo devedor
    const extraApplied = Math.min(Math.max(0, accBalance - scheduledAmort), extraThisMonth);
    actualAmort += extraApplied;
    totalPmt += extraApplied;
    totalExtraPaid += extraApplied;

    accBalance = Math.max(0, accBalance - actualAmort);
    accTotalInterest += interest;

    // Se a estratégia for reduzir prestação (reduce_installment), ajustamos o saldo mas mantemos o prazo final
    // Se for reduzir prazo (reduce_term), o prazo encurta naturalmente conforme o saldo zera
    if (strategy === 'reduce_installment') {
      // no next iteration remainingMonths will recalculate a lower dynamic payment
    }

    const origBal = m < baseBalances.length ? baseBalances[m] : 0;
    const origPmt = m <= basePayments.length ? basePayments[m - 1] : 0;
    const origInt = m <= baseInterests.length ? baseInterests[m - 1] : 0;

    // Amostragem inteligente para evitar estourar memória gráfica (guardar a cada 3 meses ou início/fim)
    if (m <= 24 || m % 3 === 0 || accBalance <= 0.01 || m === totalMonths) {
      timeline.push({
        month: m,
        year: Number((m / 12).toFixed(1)),
        originalBalance: Math.round(origBal),
        acceleratedBalance: Math.round(accBalance),
        originalPayment: Math.round(origPmt),
        acceleratedPayment: Math.round(totalPmt),
        interestOriginal: Math.round(origInt),
        interestAccelerated: Math.round(interest),
        extraContributed: Math.round(extraThisMonth),
      });
    }

    if (accBalance <= 0.01) break;
  }

  const monthsSaved = Math.max(0, totalMonths - accMonthsCount);
  const yearsSaved = Number((monthsSaved / 12).toFixed(1));
  const interestSaved = Math.max(0, baseTotalInterest - accTotalInterest);
  const interestSavedPercent = baseTotalInterest > 0 ? (interestSaved / baseTotalInterest) * 100 : 0;
  const leverageMultiplier = totalExtraPaid > 0 ? Number((interestSaved / totalExtraPaid).toFixed(2)) : 0;

  return {
    originalTotalMonths: totalMonths,
    acceleratedTotalMonths: accMonthsCount,
    monthsSaved,
    yearsSaved,
    originalTotalInterest: safeNumber(baseTotalInterest),
    acceleratedTotalInterest: safeNumber(accTotalInterest),
    interestSaved: safeNumber(interestSaved),
    interestSavedPercent: safeNumber(interestSavedPercent),
    totalExtraContributed: safeNumber(totalExtraPaid),
    totalOriginalPaid: safeNumber(principal + baseTotalInterest),
    totalAcceleratedPaid: safeNumber(principal + accTotalInterest + totalExtraPaid),
    leverageMultiplier,
    firstInstallmentOriginal: safeNumber(baseFirstPmt),
    firstInstallmentAccelerated: safeNumber(accFirstPmt),
    timeline,
  };
};

/**
 * 7. Comparador de Dívidas: Método Avalanche vs Bola de Neve (Snowball)
 */
export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  annualRatePercent: number;
  minPayment: number;
}

export interface DebtStrategyResult {
  monthsToDebtFree: number;
  totalInterestPaid: number;
  totalPaid: number;
  payoffOrder: { debtId: string; debtName: string; monthPaidOff: number }[];
}

export const simulateDebtPayoffComparison = (
  debts: DebtItem[],
  extraMonthlyBudget: number
): { avalanche: DebtStrategyResult; snowball: DebtStrategyResult; interestDifference: number } => {
  const validDebts = debts.filter(d => d.balance > 0);
  if (validDebts.length === 0) {
    const emptyResult: DebtStrategyResult = { monthsToDebtFree: 0, totalInterestPaid: 0, totalPaid: 0, payoffOrder: [] };
    return { avalanche: emptyResult, snowball: emptyResult, interestDifference: 0 };
  }

  const runStrategy = (strategy: 'avalanche' | 'snowball'): DebtStrategyResult => {
    // Clone debts
    let currentDebts = validDebts.map(d => ({
      ...d,
      currentBalance: d.balance,
      monthlyRate: (d.annualRatePercent / 100) / 12,
    }));

    let totalInterest = 0;
    let totalPaid = 0;
    let month = 0;
    const maxMonths = 360;
    const payoffOrder: { debtId: string; debtName: string; monthPaidOff: number }[] = [];

    while (currentDebts.some(d => d.currentBalance > 0.01) && month < maxMonths) {
      month++;
      let extraAvailable = extraMonthlyBudget;

      // 1. Paga o mínimo de todas as dívidas ativas e cobra juros
      for (const debt of currentDebts) {
        if (debt.currentBalance > 0.01) {
          const interest = debt.currentBalance * debt.monthlyRate;
          totalInterest += interest;
          debt.currentBalance += interest;

          const pmt = Math.min(debt.currentBalance, debt.minPayment);
          debt.currentBalance -= pmt;
          totalPaid += pmt;

          if (debt.currentBalance <= 0.01) {
            payoffOrder.push({ debtId: debt.id, debtName: debt.name, monthPaidOff: month });
            extraAvailable += debt.minPayment; // Efeito bola de neve: libera o valor da parcela mínima anterior
          }
        }
      }

      // 2. Ordena dívidas ativas de acordo com a estratégia
      const activeDebts = currentDebts.filter(d => d.currentBalance > 0.01);
      if (strategy === 'avalanche') {
        // Maior taxa de juros primeiro
        activeDebts.sort((a, b) => b.annualRatePercent - a.annualRatePercent);
      } else {
        // Menor saldo devedor primeiro (Snowball)
        activeDebts.sort((a, b) => a.currentBalance - b.currentBalance);
      }

      // 3. Aloca todo o valor extra na dívida prioritária
      for (const targetDebt of activeDebts) {
        if (extraAvailable <= 0) break;
        const extraAmort = Math.min(targetDebt.currentBalance, extraAvailable);
        targetDebt.currentBalance -= extraAmort;
        totalPaid += extraAmort;
        extraAvailable -= extraAmort;

        if (targetDebt.currentBalance <= 0.01 && !payoffOrder.some(p => p.debtId === targetDebt.id)) {
          payoffOrder.push({ debtId: targetDebt.id, debtName: targetDebt.name, monthPaidOff: month });
          extraAvailable += targetDebt.minPayment;
        }
      }
    }

    return {
      monthsToDebtFree: month,
      totalInterestPaid: safeNumber(totalInterest),
      totalPaid: safeNumber(totalPaid),
      payoffOrder,
    };
  };

  const avalanche = runStrategy('avalanche');
  const snowball = runStrategy('snowball');
  const interestDifference = Math.max(0, snowball.totalInterestPaid - avalanche.totalInterestPaid);

  return { avalanche, snowball, interestDifference: safeNumber(interestDifference) };
};

/**
 * 8. Custo de Oportunidade: Quitar Financiamento vs Investir em Ativos (Arbitragem de Taxa)
 */
export const calculatePayoffVsInvestOpportunity = (
  loanCETAnnualPercent: number,
  investmentReturnAnnualPercent: number,
  incomeTaxRatePercent: number = 15
) => {
  const cet = safeNumber(loanCETAnnualPercent);
  const grossReturn = safeNumber(investmentReturnAnnualPercent);
  const tax = safeNumber(incomeTaxRatePercent) / 100;
  const netReturn = grossReturn * (1 - tax);

  const spread = netReturn - cet;
  const favorsInvesting = spread > 0.5; // Spread mínimo de 50 bps a favor do investimento para compensar risco
  const favorsAmortizing = spread < -0.5;

  let recommendation = '';
  if (favorsAmortizing) {
    recommendation = `Priorize amortizar a dívida! A taxa do financiamento (${cet.toFixed(2)}% a.a.) supera o rendimento líquido do investimento (${netReturn.toFixed(2)}% a.a.). Amortizar garante um retorno líquido e isento de risco de ${cet.toFixed(2)}% ao ano.`;
  } else if (favorsInvesting) {
    recommendation = `Mantenha os recursos investidos! Seu rendimento líquido (${netReturn.toFixed(2)}% a.a.) supera o custo do financiamento (${cet.toFixed(2)}% a.a.). Você ganha um spread positivo de ${spread.toFixed(2)}% ao ano com liquidez preservada.`;
  } else {
    recommendation = `Zona de Paridade: As taxas são muito próximas (CET ${cet.toFixed(2)}% vs Investimento Líquido ${netReturn.toFixed(2)}%). A decisão deve se apoiar no seu perfil de liquidez e paz de espírito.`;
  }

  return {
    loanCETAnnual: cet,
    investmentGrossAnnual: grossReturn,
    investmentNetAnnual: safeNumber(netReturn),
    spreadAnnual: safeNumber(spread),
    favorsInvesting,
    favorsAmortizing,
    recommendation,
  };
};
