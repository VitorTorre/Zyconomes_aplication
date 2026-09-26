import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  safeNumber, 
  calculateSavingsRate, 
  calculateEmergencyFundMonths, 
  calculateIndependenceYears,
  calculateCompoundInterest,
  calculatePRICE
} from '../lib/financeMath';
import { auditLogger } from '../lib/auditLogger';

export interface FinancialDataState {
  // Diagnóstico & Orçamento
  income: number;
  expenses: number;
  savings: number;

  // Juros Compostos
  monthlyContribution: number;
  interestRate: number;
  years: number;

  // Amortização de Dívidas (Price/SAC)
  loanAmount: number;
  loanRate: number;
  loanYears: number;

  // Independência Financeira
  currentWealth: number;
  targetWealth: number;
  wealthContribution: number;
  wealthRate: number;

  // Alocação Institucional & IA
  aiAmount: number;
  aiProfile: 'Conservador' | 'Moderado' | 'Agressivo';
  selectedStrategyId: string;

  // Estado de sincronização automática inter-calculadoras
  autoSyncEnabled: boolean;
}

export interface FinancialDerivedMetrics {
  freeCashFlow: number;
  savingsRate: number;
  emergencyFundMonths: number;
  emergencyReserveTarget: number;
  recommendedTargetWealth: number;
  yearsToTarget: number;
  remainingMonths: number;
  compoundResult: number;
  compoundTotalInvested: number;
  compoundTotalInterest: number;
  loanPmt: number;
  loanTotalInterest: number;
  lastSyncTimestamp: number | null;
}

export interface FinancialDataContextValue extends FinancialDataState, FinancialDerivedMetrics {
  setIncome: (val: number) => void;
  setExpenses: (val: number) => void;
  setSavings: (val: number) => void;
  setMonthlyContribution: (val: number) => void;
  setInterestRate: (val: number) => void;
  setYears: (val: number) => void;
  setLoanAmount: (val: number) => void;
  setLoanRate: (val: number) => void;
  setLoanYears: (val: number) => void;
  setCurrentWealth: (val: number) => void;
  setTargetWealth: (val: number) => void;
  setWealthContribution: (val: number) => void;
  setWealthRate: (val: number) => void;
  setAiAmount: (val: number) => void;
  setAiProfile: (val: 'Conservador' | 'Moderado' | 'Agressivo') => void;
  setSelectedStrategyId: (val: string) => void;
  setAutoSyncEnabled: (val: boolean) => void;

  updateField: <K extends keyof FinancialDataState>(field: K, value: FinancialDataState[K]) => void;
  updateMultiple: (partial: Partial<FinancialDataState>) => void;
  syncAllCalculators: () => void;
  applySurplusToInvestments: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_FINANCIAL_STATE: FinancialDataState = {
  income: 8500,
  expenses: 5200,
  savings: 15000,
  monthlyContribution: 1000,
  interestRate: 10,
  years: 10,
  loanAmount: 250000,
  loanRate: 11.5,
  loanYears: 30,
  currentWealth: 50000,
  targetWealth: 1000000,
  wealthContribution: 2500,
  wealthRate: 9,
  aiAmount: 100000,
  aiProfile: 'Moderado',
  selectedStrategyId: 'family-office-br',
  autoSyncEnabled: true,
};

const FinancialDataContext = createContext<FinancialDataContextValue | undefined>(undefined);

function loadStorageValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === 'undefined' || raw === 'null') {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function persistStorageValue(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[FinancialDataContext] Failed to persist key ${key} to localStorage:`, err);
  }
}

export const FinancialDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização com tolerância e fallback gracioso a partir do localStorage existente
  const [income, setIncomeState] = useState<number>(() => loadStorageValue('zyc_income', DEFAULT_FINANCIAL_STATE.income));
  const [expenses, setExpensesState] = useState<number>(() => loadStorageValue('zyc_expenses', DEFAULT_FINANCIAL_STATE.expenses));
  const [savings, setSavingsState] = useState<number>(() => loadStorageValue('zyc_savings', DEFAULT_FINANCIAL_STATE.savings));
  const [monthlyContribution, setMonthlyContributionState] = useState<number>(() => loadStorageValue('zyc_pmt', DEFAULT_FINANCIAL_STATE.monthlyContribution));
  const [interestRate, setInterestRateState] = useState<number>(() => loadStorageValue('zyc_rate', DEFAULT_FINANCIAL_STATE.interestRate));
  const [years, setYearsState] = useState<number>(() => loadStorageValue('zyc_years', DEFAULT_FINANCIAL_STATE.years));
  const [loanAmount, setLoanAmountState] = useState<number>(() => loadStorageValue('zyc_loan_amt', DEFAULT_FINANCIAL_STATE.loanAmount));
  const [loanRate, setLoanRateState] = useState<number>(() => loadStorageValue('zyc_loan_rate', DEFAULT_FINANCIAL_STATE.loanRate));
  const [loanYears, setLoanYearsState] = useState<number>(() => loadStorageValue('zyc_loan_years', DEFAULT_FINANCIAL_STATE.loanYears));
  const [currentWealth, setCurrentWealthState] = useState<number>(() => loadStorageValue('zyc_cur_wealth', DEFAULT_FINANCIAL_STATE.currentWealth));
  const [targetWealth, setTargetWealthState] = useState<number>(() => loadStorageValue('zyc_tgt_wealth', DEFAULT_FINANCIAL_STATE.targetWealth));
  const [wealthContribution, setWealthContributionState] = useState<number>(() => loadStorageValue('zyc_wealth_pmt', DEFAULT_FINANCIAL_STATE.wealthContribution));
  const [wealthRate, setWealthRateState] = useState<number>(() => loadStorageValue('zyc_wealth_rate', DEFAULT_FINANCIAL_STATE.wealthRate));
  const [aiAmount, setAiAmountState] = useState<number>(() => loadStorageValue('zyc_ai_amount', DEFAULT_FINANCIAL_STATE.aiAmount));
  const [aiProfile, setAiProfileState] = useState<'Conservador' | 'Moderado' | 'Agressivo'>(() => loadStorageValue('zyc_ai_profile', DEFAULT_FINANCIAL_STATE.aiProfile));
  const [selectedStrategyId, setSelectedStrategyIdState] = useState<string>(() => loadStorageValue('zyc_selected_strategy', DEFAULT_FINANCIAL_STATE.selectedStrategyId));
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState<boolean>(() => loadStorageValue('zyc_autosync_enabled', DEFAULT_FINANCIAL_STATE.autoSyncEnabled));
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(Date.now());

  // Efeitos de persistência individual
  useEffect(() => { persistStorageValue('zyc_income', income); }, [income]);
  useEffect(() => { persistStorageValue('zyc_expenses', expenses); }, [expenses]);
  useEffect(() => { persistStorageValue('zyc_savings', savings); }, [savings]);
  useEffect(() => { persistStorageValue('zyc_pmt', monthlyContribution); }, [monthlyContribution]);
  useEffect(() => { persistStorageValue('zyc_rate', interestRate); }, [interestRate]);
  useEffect(() => { persistStorageValue('zyc_years', years); }, [years]);
  useEffect(() => { persistStorageValue('zyc_loan_amt', loanAmount); }, [loanAmount]);
  useEffect(() => { persistStorageValue('zyc_loan_rate', loanRate); }, [loanRate]);
  useEffect(() => { persistStorageValue('zyc_loan_years', loanYears); }, [loanYears]);
  useEffect(() => { persistStorageValue('zyc_cur_wealth', currentWealth); }, [currentWealth]);
  useEffect(() => { persistStorageValue('zyc_tgt_wealth', targetWealth); }, [targetWealth]);
  useEffect(() => { persistStorageValue('zyc_wealth_pmt', wealthContribution); }, [wealthContribution]);
  useEffect(() => { persistStorageValue('zyc_wealth_rate', wealthRate); }, [wealthRate]);
  useEffect(() => { persistStorageValue('zyc_ai_amount', aiAmount); }, [aiAmount]);
  useEffect(() => { persistStorageValue('zyc_ai_profile', aiProfile); }, [aiProfile]);
  useEffect(() => { persistStorageValue('zyc_selected_strategy', selectedStrategyId); }, [selectedStrategyId]);
  useEffect(() => { persistStorageValue('zyc_autosync_enabled', autoSyncEnabled); }, [autoSyncEnabled]);

  // Cálculos Derivados Puros e Exatos
  const derived = useMemo<FinancialDerivedMetrics>(() => {
    const freeCashFlow = income - expenses;
    const savingsRate = calculateSavingsRate(income, expenses);
    const emergencyFundMonths = calculateEmergencyFundMonths(savings, expenses);
    const emergencyReserveTarget = expenses * 6;
    
    // Regra dos 4% (Trinity Study) para meta patrimonial recomendada: 300x despesas mensais (25 anos de despesas)
    const recommendedTargetWealth = Math.max(100000, expenses * 12 * 25);

    const yearsToTarget = calculateIndependenceYears(currentWealth, targetWealth, wealthContribution, wealthRate);
    const remainingMonths = yearsToTarget * 12;

    const compoundCalculation = calculateCompoundInterest(savings, monthlyContribution, interestRate, years, 'nominal');

    let priceCalculation = { pmt: 0, totalInterest: 0 };
    try {
      const monthlyLoanRate = (loanRate / 12);
      const months = loanYears * 12;
      if (loanAmount > 0 && months > 0) {
        priceCalculation = calculatePRICE(loanAmount, monthlyLoanRate, months);
      }
    } catch {
      priceCalculation = { pmt: 0, totalInterest: 0 };
    }

    return {
      freeCashFlow: safeNumber(freeCashFlow),
      savingsRate: safeNumber(savingsRate),
      emergencyFundMonths: safeNumber(emergencyFundMonths),
      emergencyReserveTarget: safeNumber(emergencyReserveTarget),
      recommendedTargetWealth: safeNumber(recommendedTargetWealth),
      yearsToTarget: safeNumber(yearsToTarget),
      remainingMonths: safeNumber(remainingMonths),
      compoundResult: safeNumber(compoundCalculation.totalAmount),
      compoundTotalInvested: safeNumber(compoundCalculation.totalInvested),
      compoundTotalInterest: safeNumber(compoundCalculation.totalInterest),
      loanPmt: safeNumber(priceCalculation.pmt),
      loanTotalInterest: safeNumber(priceCalculation.totalInterest),
      lastSyncTimestamp,
    };
  }, [income, expenses, savings, monthlyContribution, interestRate, years, loanAmount, loanRate, loanYears, currentWealth, targetWealth, wealthContribution, wealthRate, lastSyncTimestamp]);

  // Setters inteligentes com propagação reativa opcional quando autoSyncEnabled = true
  const setIncome = useCallback((val: number) => {
    const cleanVal = safeNumber(val);
    setIncomeState(cleanVal);
    if (autoSyncEnabled) {
      setLastSyncTimestamp(Date.now());
    }
  }, [autoSyncEnabled]);

  const setExpenses = useCallback((val: number) => {
    const cleanVal = safeNumber(val);
    setExpensesState(cleanVal);
    if (autoSyncEnabled) {
      // Ajusta dinamicamente a meta recomendada de independência caso o usuário ainda use a base padrão
      setLastSyncTimestamp(Date.now());
    }
  }, [autoSyncEnabled]);

  const setSavings = useCallback((val: number) => {
    const cleanVal = safeNumber(val);
    setSavingsState(cleanVal);
    if (autoSyncEnabled) {
      setLastSyncTimestamp(Date.now());
    }
  }, [autoSyncEnabled]);

  const setMonthlyContribution = useCallback((val: number) => {
    setMonthlyContributionState(safeNumber(val));
  }, []);

  const setInterestRate = useCallback((val: number) => {
    setInterestRateState(safeNumber(val));
  }, []);

  const setYears = useCallback((val: number) => {
    setYearsState(safeNumber(val));
  }, []);

  const setLoanAmount = useCallback((val: number) => {
    setLoanAmountState(safeNumber(val));
  }, []);

  const setLoanRate = useCallback((val: number) => {
    setLoanRateState(safeNumber(val));
  }, []);

  const setLoanYears = useCallback((val: number) => {
    setLoanYearsState(safeNumber(val));
  }, []);

  const setCurrentWealth = useCallback((val: number) => {
    setCurrentWealthState(safeNumber(val));
  }, []);

  const setTargetWealth = useCallback((val: number) => {
    setTargetWealthState(safeNumber(val));
  }, []);

  const setWealthContribution = useCallback((val: number) => {
    setWealthContributionState(safeNumber(val));
  }, []);

  const setWealthRate = useCallback((val: number) => {
    setWealthRateState(safeNumber(val));
  }, []);

  const setAiAmount = useCallback((val: number) => {
    setAiAmountState(safeNumber(val));
  }, []);

  const setAiProfile = useCallback((val: 'Conservador' | 'Moderado' | 'Agressivo') => {
    setAiProfileState(val);
  }, []);

  const setSelectedStrategyId = useCallback((val: string) => {
    setSelectedStrategyIdState(val);
  }, []);

  const setAutoSyncEnabled = useCallback((val: boolean) => {
    setAutoSyncEnabledState(val);
  }, []);

  const updateField = useCallback(<K extends keyof FinancialDataState>(field: K, value: FinancialDataState[K]) => {
    switch (field) {
      case 'income': setIncomeState(value as number); break;
      case 'expenses': setExpensesState(value as number); break;
      case 'savings': setSavingsState(value as number); break;
      case 'monthlyContribution': setMonthlyContributionState(value as number); break;
      case 'interestRate': setInterestRateState(value as number); break;
      case 'years': setYearsState(value as number); break;
      case 'loanAmount': setLoanAmountState(value as number); break;
      case 'loanRate': setLoanRateState(value as number); break;
      case 'loanYears': setLoanYearsState(value as number); break;
      case 'currentWealth': setCurrentWealthState(value as number); break;
      case 'targetWealth': setTargetWealthState(value as number); break;
      case 'wealthContribution': setWealthContributionState(value as number); break;
      case 'wealthRate': setWealthRateState(value as number); break;
      case 'aiAmount': setAiAmountState(value as number); break;
      case 'aiProfile': setAiProfileState(value as any); break;
      case 'selectedStrategyId': setSelectedStrategyIdState(value as string); break;
      case 'autoSyncEnabled': setAutoSyncEnabledState(value as boolean); break;
    }
  }, []);

  const updateMultiple = useCallback((partial: Partial<FinancialDataState>) => {
    if (partial.income !== undefined) setIncomeState(partial.income);
    if (partial.expenses !== undefined) setExpensesState(partial.expenses);
    if (partial.savings !== undefined) setSavingsState(partial.savings);
    if (partial.monthlyContribution !== undefined) setMonthlyContributionState(partial.monthlyContribution);
    if (partial.interestRate !== undefined) setInterestRateState(partial.interestRate);
    if (partial.years !== undefined) setYearsState(partial.years);
    if (partial.loanAmount !== undefined) setLoanAmountState(partial.loanAmount);
    if (partial.loanRate !== undefined) setLoanRateState(partial.loanRate);
    if (partial.loanYears !== undefined) setLoanYearsState(partial.loanYears);
    if (partial.currentWealth !== undefined) setCurrentWealthState(partial.currentWealth);
    if (partial.targetWealth !== undefined) setTargetWealthState(partial.targetWealth);
    if (partial.wealthContribution !== undefined) setWealthContributionState(partial.wealthContribution);
    if (partial.wealthRate !== undefined) setWealthRateState(partial.wealthRate);
    if (partial.aiAmount !== undefined) setAiAmountState(partial.aiAmount);
    if (partial.aiProfile !== undefined) setAiProfileState(partial.aiProfile);
    if (partial.selectedStrategyId !== undefined) setSelectedStrategyIdState(partial.selectedStrategyId);
    if (partial.autoSyncEnabled !== undefined) setAutoSyncEnabledState(partial.autoSyncEnabled);
    setLastSyncTimestamp(Date.now());
  }, []);

  // Sincronização inteligente explícita entre todos os subsistemas de cálculo
  const syncAllCalculators = useCallback(() => {
    const surplus = Math.max(0, income - expenses);
    const recommendedTarget = Math.max(100000, expenses * 12 * 25);

    // Se houver sobra orçamentária, alinha aportes mensais
    if (surplus > 0) {
      setMonthlyContributionState(surplus);
      setWealthContributionState(surplus);
    }
    
    // Alinha patrimônio atual com a poupança/reserva se o patrimônio estiver zerado ou menor
    if (savings > currentWealth) {
      setCurrentWealthState(savings);
    }

    // Se o capital de IA for o padrão e o patrimônio/poupança for expressivo, alinha
    if (aiAmount === 100000 && currentWealth > 0) {
      setAiAmountState(currentWealth);
    }

    setTargetWealthState(recommendedTarget);
    setLastSyncTimestamp(Date.now());

    auditLogger.recordAuditEvent({
      category: 'STATE_PERSISTENCE',
      severity: 'INFO',
      action: 'CALCULATORS_CROSS_SYNCED',
      details: { income, expenses, surplus, recommendedTarget, savings },
      source: 'client',
    });
  }, [income, expenses, savings, currentWealth, aiAmount]);

  // Aplica o fluxo de caixa livre mensal diretamente como aporte de investimentos
  const applySurplusToInvestments = useCallback(() => {
    const surplus = Math.max(0, income - expenses);
    if (surplus > 0) {
      setMonthlyContributionState(surplus);
      setWealthContributionState(surplus);
      setLastSyncTimestamp(Date.now());
    }
  }, [income, expenses]);

  // Restaura padrões de fábrica com segurança
  const resetToDefaults = useCallback(() => {
    setIncomeState(DEFAULT_FINANCIAL_STATE.income);
    setExpensesState(DEFAULT_FINANCIAL_STATE.expenses);
    setSavingsState(DEFAULT_FINANCIAL_STATE.savings);
    setMonthlyContributionState(DEFAULT_FINANCIAL_STATE.monthlyContribution);
    setInterestRateState(DEFAULT_FINANCIAL_STATE.interestRate);
    setYearsState(DEFAULT_FINANCIAL_STATE.years);
    setLoanAmountState(DEFAULT_FINANCIAL_STATE.loanAmount);
    setLoanRateState(DEFAULT_FINANCIAL_STATE.loanRate);
    setLoanYearsState(DEFAULT_FINANCIAL_STATE.loanYears);
    setCurrentWealthState(DEFAULT_FINANCIAL_STATE.currentWealth);
    setTargetWealthState(DEFAULT_FINANCIAL_STATE.targetWealth);
    setWealthContributionState(DEFAULT_FINANCIAL_STATE.wealthContribution);
    setWealthRateState(DEFAULT_FINANCIAL_STATE.wealthRate);
    setAiAmountState(DEFAULT_FINANCIAL_STATE.aiAmount);
    setAiProfileState(DEFAULT_FINANCIAL_STATE.aiProfile);
    setSelectedStrategyIdState(DEFAULT_FINANCIAL_STATE.selectedStrategyId);
    setAutoSyncEnabledState(DEFAULT_FINANCIAL_STATE.autoSyncEnabled);
    setLastSyncTimestamp(Date.now());
  }, []);

  const value = useMemo<FinancialDataContextValue>(() => ({
    // State
    income,
    expenses,
    savings,
    monthlyContribution,
    interestRate,
    years,
    loanAmount,
    loanRate,
    loanYears,
    currentWealth,
    targetWealth,
    wealthContribution,
    wealthRate,
    aiAmount,
    aiProfile,
    selectedStrategyId,
    autoSyncEnabled,

    // Derived
    ...derived,

    // Actions
    setIncome,
    setExpenses,
    setSavings,
    setMonthlyContribution,
    setInterestRate,
    setYears,
    setLoanAmount,
    setLoanRate,
    setLoanYears,
    setCurrentWealth,
    setTargetWealth,
    setWealthContribution,
    setWealthRate,
    setAiAmount,
    setAiProfile,
    setSelectedStrategyId,
    setAutoSyncEnabled,
    updateField,
    updateMultiple,
    syncAllCalculators,
    applySurplusToInvestments,
    resetToDefaults,
  }), [
    income,
    expenses,
    savings,
    monthlyContribution,
    interestRate,
    years,
    loanAmount,
    loanRate,
    loanYears,
    currentWealth,
    targetWealth,
    wealthContribution,
    wealthRate,
    aiAmount,
    aiProfile,
    selectedStrategyId,
    autoSyncEnabled,
    derived,
    setIncome,
    setExpenses,
    setSavings,
    setMonthlyContribution,
    setInterestRate,
    setYears,
    setLoanAmount,
    setLoanRate,
    setLoanYears,
    setCurrentWealth,
    setTargetWealth,
    setWealthContribution,
    setWealthRate,
    setAiAmount,
    setAiProfile,
    setSelectedStrategyId,
    setAutoSyncEnabled,
    updateField,
    updateMultiple,
    syncAllCalculators,
    applySurplusToInvestments,
    resetToDefaults,
  ]);

  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
};

export function useFinancialData(): FinancialDataContextValue {
  const context = useContext(FinancialDataContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
}
