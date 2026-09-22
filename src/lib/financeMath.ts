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
