import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingDown, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  HelpCircle, 
  PiggyBank, 
  Flame, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  Clock, 
  Award, 
  ArrowUpRight,
  TrendingUp,
  Percent,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  simulateAcceleratedLoanPayoff, 
  simulateDebtPayoffComparison, 
  calculatePayoffVsInvestOpportunity,
  DebtItem,
  safeNumber
} from '../lib/financeMath';
import { trackGranularEvent } from '../lib/analytics';
import { safeMonetaryInput, safeRateInput, safeParseNumber } from '../lib/inputEncapsulator';

interface DebtPayoffAcceleratorProps {
  initialLoanAmount?: number;
  initialLoanRate?: number;
  initialLoanYears?: number;
  onSyncContext?: (amount: number, rate: number, years: number) => void;
}

export const DebtPayoffAccelerator: React.FC<DebtPayoffAcceleratorProps> = ({
  initialLoanAmount = 300000,
  initialLoanRate = 10.5,
  initialLoanYears = 30,
  onSyncContext,
}) => {
  const [subTab, setSubTab] = useState<'mortgage' | 'avalanche_snowball' | 'opportunity_cost' | 'assets_pay_liabilities'>('mortgage');

  // Parâmetros do Financiamento Habitacional / Empréstimo
  const [loanAmount, setLoanAmount] = useState<number>(initialLoanAmount);
  const [annualRate, setAnnualRate] = useState<number>(initialLoanRate);
  const [loanYears, setLoanYears] = useState<number>(initialLoanYears);
  const [amortSystem, setAmortSystem] = useState<'SAC' | 'PRICE'>('SAC');
  const [amortStrategy, setAmortStrategy] = useState<'reduce_term' | 'reduce_installment'>('reduce_term');
  const [extraMonthly, setExtraMonthly] = useState<number>(600);
  const [extraPeriodic, setExtraPeriodic] = useState<number>(5000);
  const [periodicInterval, setPeriodicInterval] = useState<number>(24); // 24 meses (bienal - FGTS)

  // Parâmetros para Múltiplas Dívidas (Avalanche vs Bola de Neve)
  const [debts, setDebts] = useState<DebtItem[]>([
    { id: '1', name: 'Cartão de Crédito Rotativo', balance: 4500, annualRatePercent: 180, minPayment: 250 },
    { id: '2', name: 'Cheque Especial', balance: 3200, annualRatePercent: 130, minPayment: 180 },
    { id: '3', name: 'Empréstimo Pessoal Bancário', balance: 14000, annualRatePercent: 42, minPayment: 520 },
    { id: '4', name: 'Financiamento de Veículo', balance: 28000, annualRatePercent: 21, minPayment: 890 },
  ]);
  const [extraDebtBudget, setExtraDebtBudget] = useState<number>(500);

  // Parâmetros de Custo de Oportunidade
  const [investmentReturn, setInvestmentReturn] = useState<number>(11.5); // CDI Bruto anual
  const [irRate, setIrRate] = useState<number>(15); // IR Regressivo

  // Parâmetros Ativos Pagando Passivos
  const [fiiDividendYieldAnnual, setFiiDividendYieldAnnual] = useState<number>(10.0); // DY 10% a.a. isento

  // Simulação do Financiamento Acelerado
  const loanSimulation = useMemo(() => {
    return simulateAcceleratedLoanPayoff({
      principal: loanAmount,
      annualRatePercent: annualRate,
      totalMonths: loanYears * 12,
      system: amortSystem,
      extraMonthlyContribution: extraMonthly,
      extraPeriodicContribution: extraPeriodic,
      periodicIntervalMonths: periodicInterval,
      amortizationStrategy: amortStrategy,
    });
  }, [loanAmount, annualRate, loanYears, amortSystem, amortStrategy, extraMonthly, extraPeriodic, periodicInterval]);

  // Simulação Avalanche vs Bola de Neve
  const debtComparison = useMemo(() => {
    return simulateDebtPayoffComparison(debts, extraDebtBudget);
  }, [debts, extraDebtBudget]);

  // Custo de Oportunidade
  const oppCost = useMemo(() => {
    return calculatePayoffVsInvestOpportunity(annualRate, investmentReturn, irRate);
  }, [annualRate, investmentReturn, irRate]);

  // Capital necessário em FIIs/Ações para pagar a prestação
  const monthlyInstallment = loanSimulation.firstInstallmentOriginal;
  const capitalNeededForDividends = useMemo(() => {
    const monthlyRate = fiiDividendYieldAnnual / 100 / 12;
    return monthlyRate > 0 ? monthlyInstallment / monthlyRate : 0;
  }, [monthlyInstallment, fiiDividendYieldAnnual]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER DO ACELERADOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 dark:bg-red-500/20 p-3 rounded-2xl text-red-600 dark:text-red-400">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Acelerador de Quitação de Financiamento & Passivos
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" /> Fiduciário de Crédito
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Engenharia financeira para aniquilar juros bancários de imóveis, casas e dívidas através de amortizações extraordinárias e estratégias de mercado.
            </p>
          </div>
        </div>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => { setSubTab('mortgage'); trackGranularEvent('engagement', 'button_click', 'Acelerador Imobiliario SAC'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'mortgage'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5 text-red-600" />
          Quitação Habitacional (SAC vs PRICE)
        </button>
        <button
          type="button"
          onClick={() => { setSubTab('avalanche_snowball'); trackGranularEvent('engagement', 'button_click', 'Avalanche vs Bola de Neve'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'avalanche_snowball'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          Avalanche vs Bola de Neve (Múltiplas Dívidas)
        </button>
        <button
          type="button"
          onClick={() => { setSubTab('opportunity_cost'); trackGranularEvent('engagement', 'button_click', 'Custo de Oportunidade'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'opportunity_cost'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-blue-600" />
          Quitar vs Investir (Arbitragem)
        </button>
        <button
          type="button"
          onClick={() => { setSubTab('assets_pay_liabilities'); trackGranularEvent('engagement', 'button_click', 'Ativos Pagando Passivos'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'assets_pay_liabilities'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          Ativos Pagando o Financiamento
        </button>
      </div>

      {/* ABA 1: ACELERADOR DE FINANCIAMENTO HABITACIONAL (SAC vs PRICE) */}
      {subTab === 'mortgage' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* PAINEL DE ENTRADAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Saldo Devedor / Financiado (R$)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => {
                  const val = safeMonetaryInput(e.target.value, 'loanAmount', loanAmount);
                  setLoanAmount(val);
                  onSyncContext?.(val, annualRate, loanYears);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono text-base font-bold text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Taxa CET Efetiva Anual (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={annualRate}
                onChange={(e) => {
                  const val = safeRateInput(e.target.value, 'annualRate', annualRate);
                  setAnnualRate(val);
                  onSyncContext?.(loanAmount, val, loanYears);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono text-base font-bold text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Prazo Contratado (Anos)
              </label>
              <input
                type="number"
                value={loanYears}
                onChange={(e) => {
                  const val = safeParseNumber(e.target.value, loanYears, 1, 50, 'loanYears').value;
                  setLoanYears(val);
                  onSyncContext?.(loanAmount, annualRate, val);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono text-base font-bold text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Sistema de Amortização
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAmortSystem('SAC')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                    amortSystem === 'SAC'
                      ? 'bg-[#1A1F71] text-white border-[#1A1F71]'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  SAC (Decrescente)
                </button>
                <button
                  type="button"
                  onClick={() => setAmortSystem('PRICE')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                    amortSystem === 'PRICE'
                      ? 'bg-[#1A1F71] text-white border-[#1A1F71]'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  PRICE (Parcela Fixa)
                </button>
              </div>
            </div>

            {/* SEGUNDA LINHA: AMORTIZAÇÃO EXTRAORDINÁRIA */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Aporte Extra Mensal (R$)
              </label>
              <input
                type="number"
                step="50"
                value={extraMonthly}
                onChange={(e) => setExtraMonthly(safeMonetaryInput(e.target.value, 'extraMonthly', extraMonthly))}
                placeholder="Ex: 500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 font-mono text-base font-bold text-emerald-900 dark:text-emerald-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                <PiggyBank className="w-3.5 h-3.5" /> Aporte Periódico (FGTS/13º) (R$)
              </label>
              <input
                type="number"
                step="500"
                value={extraPeriodic}
                onChange={(e) => setExtraPeriodic(safeMonetaryInput(e.target.value, 'extraPeriodic', extraPeriodic))}
                placeholder="Ex: 5000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 font-mono text-base font-bold text-emerald-900 dark:text-emerald-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Periodicidade do Aporte Periódico
              </label>
              <select
                value={periodicInterval}
                onChange={(e) => setPeriodicInterval(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono text-sm font-bold text-zinc-900 dark:text-white"
              >
                <option value={12}>Anual (13º / Bônus - a cada 12 meses)</option>
                <option value={24}>Bienal (FGTS Habitacional - a cada 2 anos)</option>
                <option value={36}>Trienal (a cada 3 anos)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Destino da Amortização
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAmortStrategy('reduce_term')}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border cursor-pointer text-center ${
                    amortStrategy === 'reduce_term'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                  }`}
                  title="Elimina juros futuros em cascata (Recomendado pelo mercado)"
                >
                  Reduzir Prazo (★)
                </button>
                <button
                  type="button"
                  onClick={() => setAmortStrategy('reduce_installment')}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border cursor-pointer text-center ${
                    amortStrategy === 'reduce_installment'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                  }`}
                  title="Alivia a prestação mensal imediata"
                >
                  Reduzir Parcela
                </button>
              </div>
            </div>
          </div>

          {/* PAINEL DE RESULTADOS DE IMPACTO FIDUCIÁRIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* CARD 1: TEMPO ECONOMIZADO */}
            <div className="bg-gradient-to-br from-emerald-950 to-zinc-900 text-white p-5 rounded-2xl border border-emerald-800/40 shadow-lg relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-between">
                <span>Tempo de Vida Poupado</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-3xl font-black text-white">
                {loanSimulation.yearsSaved} Anos
              </div>
              <div className="text-xs text-emerald-200/80 mt-1">
                De {loanYears} anos ({loanYears * 12} meses) para <strong>{(loanSimulation.acceleratedTotalMonths / 12).toFixed(1)} anos</strong> ({loanSimulation.acceleratedTotalMonths} meses).
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" /> -{loanSimulation.monthsSaved} prestações eliminadas
              </div>
            </div>

            {/* CARD 2: JUROS POUPADOS */}
            <div className="bg-gradient-to-br from-zinc-950 to-blue-950 text-white p-5 rounded-2xl border border-blue-800/40 shadow-lg relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center justify-between">
                <span>Juros Não Pagos ao Banco</span>
                <TrendingDown className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 text-3xl font-black text-white">
                {formatBRL(loanSimulation.interestSaved)}
              </div>
              <div className="text-xs text-blue-200/80 mt-1">
                Economia de <strong>{loanSimulation.interestSavedPercent.toFixed(1)}%</strong> do custo de juros contratado.
              </div>
              <div className="mt-3 text-[11px] text-zinc-400">
                Juros Originais: {formatBRL(loanSimulation.originalTotalInterest)}
              </div>
            </div>

            {/* CARD 3: MULTIPLICADOR DE ALAVANCAGEM DA AMORTIZAÇÃO */}
            <div className="bg-gradient-to-br from-zinc-950 to-purple-950 text-white p-5 rounded-2xl border border-purple-800/40 shadow-lg relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center justify-between">
                <span>Multiplicador de Amortização</span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 text-3xl font-black text-purple-200">
                {loanSimulation.leverageMultiplier}x
              </div>
              <div className="text-xs text-purple-300/80 mt-1">
                A cada <strong>R$ 1,00</strong> aportado antecipadamente, você cortou <strong>R$ {loanSimulation.leverageMultiplier.toFixed(2)}</strong> em juros bancários futuros!
              </div>
              <div className="mt-3 text-[11px] text-zinc-400">
                Total Extra Aportado: {formatBRL(loanSimulation.totalExtraContributed)}
              </div>
            </div>

            {/* CARD 4: PARCELA E TOTAL FINAL */}
            <div className="bg-zinc-100 dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Custo Global Comparado</span>
                <Award className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="mt-2 text-xl font-black text-zinc-900 dark:text-white">
                {formatBRL(loanSimulation.totalAcceleratedPaid)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Sem acelerador você pagaria <strong className="text-red-500 line-through">{formatBRL(loanSimulation.totalOriginalPaid)}</strong>.
              </div>
              <div className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 1ª Parcela: {formatBRL(loanSimulation.firstInstallmentOriginal)}
              </div>
            </div>

          </div>

          {/* GRÁFICO COMPARATIVO: CURVA DO SALDO DEVEDOR */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-emerald-500" />
                  Curva de Amortização: Padrão Bancário vs. Acelerador Zyconomes
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Visualização do saldo devedor principal ao longo dos anos. A linha verde demonstra como aportes extras eliminam o saldo devedor anos antes do vencimento contratual.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-red-500">
                  <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500 inline-block"></span>
                  Sem Aportes Extras (Original)
                </span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500 inline-block"></span>
                  Com Amortização Acelerada
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={loanSimulation.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOriginal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorAccelerated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#888888" 
                    fontSize={11} 
                    tickFormatter={(val) => `Ano ${val}`}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={11} 
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', color: '#ffffff', border: '1px solid #27272a', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [
                      formatBRL(Number(value)),
                      name === 'originalBalance' ? 'Saldo Original' : 'Saldo Acelerado'
                    ]}
                    labelFormatter={(label) => `Ano ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="originalBalance" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorOriginal)" 
                    name="originalBalance"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="acceleratedBalance" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAccelerated)" 
                    name="acceleratedBalance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* NOTA FIDUCIÁRIA RESOLUÇÃO BACEN */}
            <div className="mt-4 p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Garantia Legal no Brasil (Resolução BACEN nº 3.516/2007):</strong> Nenhum banco ou agente financeiro pode cobrar qualquer taxa, tarifa ou penalidade por amortização extraordinária ou liquidação antecipada de dívidas. O desconto dos juros futuros é obrigatório por lei.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: AVALANCHE VS BOLA DE NEVE (MÚLTIPLAS DÍVIDAS) */}
      {subTab === 'avalanche_snowball' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Quitação de Múltiplos Passivos: Método Avalanche vs. Bola de Neve
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  O Método Avalanche prioriza a dívida com maior taxa de juros (menor custo matemático). O Método Bola de Neve elimina o menor saldo primeiro (maior alívio psicológico).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Orçamento Extra Mensal (R$):
                </label>
                <input
                  type="number"
                  step="50"
                  value={extraDebtBudget}
                  onChange={(e) => setExtraDebtBudget(Number(e.target.value))}
                  className="w-32 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono text-sm font-bold"
                />
              </div>
            </div>

            {/* TABELA DE DÍVIDAS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-400 uppercase">
                    <th className="py-2 px-3">Passivo / Dívida</th>
                    <th className="py-2 px-3">Saldo Devedor</th>
                    <th className="py-2 px-3">Taxa Anual (%)</th>
                    <th className="py-2 px-3">Parcela Mínima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {debts.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-white dark:hover:bg-zinc-800/50">
                      <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {d.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">{formatBRL(d.balance)}</td>
                      <td className="py-2.5 px-3 font-mono text-red-600 font-bold">{d.annualRatePercent}% a.a.</td>
                      <td className="py-2.5 px-3 font-mono">{formatBRL(d.minPayment)}/mês</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPARAÇÃO DOS DOIS MÉTODOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AVALANCHE */}
            <div className="p-6 bg-gradient-to-br from-indigo-950 to-zinc-900 text-white rounded-2xl border border-indigo-800/50 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-700/50">
                  Método Avalanche (Ótimo Matemático)
                </span>
                <span className="text-xs text-indigo-300 font-bold">Menor Juros Pagos</span>
              </div>
              <h4 className="text-xl font-black text-white">
                Livre em {debtComparison.avalanche.monthsToDebtFree} meses
              </h4>
              <p className="text-xs text-indigo-200/80 mt-1">
                Juros Totais Pagos: <strong>{formatBRL(debtComparison.avalanche.totalInterestPaid)}</strong>
              </p>
              
              <div className="mt-4 pt-4 border-t border-indigo-900/60">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-2">Ordem de Eliminação:</div>
                <div className="space-y-1.5">
                  {debtComparison.avalanche.payoffOrder.map((po, i) => (
                    <div key={po.debtId} className="flex items-center justify-between text-xs bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                      <span className="text-zinc-200">{i + 1}. {po.debtName}</span>
                      <span className="font-mono text-emerald-400 font-bold">Mês {po.monthPaidOff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOLA DE NEVE */}
            <div className="p-6 bg-gradient-to-br from-zinc-950 to-zinc-900 text-white rounded-2xl border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700">
                  Método Bola de Neve (Psicológico)
                </span>
                <span className="text-xs text-zinc-400 font-bold">Vitórias Rápidas</span>
              </div>
              <h4 className="text-xl font-black text-white">
                Livre em {debtComparison.snowball.monthsToDebtFree} meses
              </h4>
              <p className="text-xs text-zinc-300 mt-1">
                Juros Totais Pagos: <strong>{formatBRL(debtComparison.snowball.totalInterestPaid)}</strong>
              </p>
              
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-2">Ordem de Eliminação:</div>
                <div className="space-y-1.5">
                  {debtComparison.snowball.payoffOrder.map((po, i) => (
                    <div key={po.debtId} className="flex items-center justify-between text-xs bg-zinc-800/40 px-3 py-1.5 rounded-lg">
                      <span className="text-zinc-300">{i + 1}. {po.debtName}</span>
                      <span className="font-mono text-emerald-400 font-bold">Mês {po.monthPaidOff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {debtComparison.interestDifference > 0 && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                O método Avalanche economiza <strong>{formatBRL(debtComparison.interestDifference)}</strong> adicionais em juros comparado à Bola de Neve.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: CUSTO DE OPORTUNIDADE (QUITAR VS INVESTIR) */}
      {subTab === 'opportunity_cost' && (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-600" />
              Arbitragem de Taxas: Quitar Financiamento ou Investir no Mercado?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Avaliação do custo de oportunidade matemático. Ao amortizar uma dívida, você obtém uma rentabilidade líquida garantida igual ao CET do contrato, isenta de imposto de renda e com risco zero.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Taxa CET da Dívida (% a.a.)
              </label>
              <input
                type="number"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Rendimento Bruto Alternativo (% a.a.)
              </label>
              <input
                type="number"
                step="0.1"
                value={investmentReturn}
                onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-400">Ex: 100% CDI ou Tesouro IPCA+</span>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Alíquota de Imposto de Renda (%)
              </label>
              <input
                type="number"
                value={irRate}
                onChange={(e) => setIrRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-400">Tabela regressiva (15% a 22.5%)</span>
            </div>
          </div>

          {/* VEREDITO FIDUCIÁRIO */}
          <div className={`p-5 rounded-2xl border ${
            oppCost.favorsAmortizing
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
              : oppCost.favorsInvesting
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300'
          }`}>
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
              {oppCost.favorsAmortizing ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> Veredito: Priorize a Amortização Antecipada
                </span>
              ) : oppCost.favorsInvesting ? (
                <span className="text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <TrendingUp className="w-5 h-5" /> Veredito: Mantenha o Capital Investido
                </span>
              ) : (
                <span className="text-zinc-700 dark:text-zinc-300">Zona de Paridade Financeira</span>
              )}
            </div>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {oppCost.recommendation}
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-zinc-400 block">CET do Empréstimo:</span>
                <strong className="text-red-500">{oppCost.loanCETAnnual.toFixed(2)}% a.a.</strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Investimento Bruto:</span>
                <strong>{oppCost.investmentGrossAnnual.toFixed(2)}% a.a.</strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Investimento Líquido:</span>
                <strong className="text-emerald-500">{oppCost.investmentNetAnnual.toFixed(2)}% a.a.</strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Spread Líquido:</span>
                <strong>{oppCost.spreadAnnual > 0 ? `+${oppCost.spreadAnnual.toFixed(2)}` : oppCost.spreadAnnual.toFixed(2)}% a.a.</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: ATIVOS PAGANDO PASSIVOS */}
      {subTab === 'assets_pay_liabilities' && (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Engenharia de Renda Passiva: Proventos Pagando a Prestação Habitacional
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Descubra quanto patrimônio alocado em Fundos Imobiliários (FIIs) ou Dividendos isentos é necessário para que os proventos cubram integralmente a prestação do imóvel sem comprometer o salário ativo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Valor da Parcela Mensal (R$)
              </label>
              <input
                type="number"
                value={Math.round(monthlyInstallment)}
                disabled
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-900 font-mono font-bold text-zinc-700 dark:text-zinc-300"
              />
              <span className="text-[10px] text-zinc-400">Calculado a partir do financiamento SAC/PRICE ativo</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Dividend Yield Anual dos Ativos (% a.a.)
              </label>
              <input
                type="number"
                step="0.5"
                value={fiiDividendYieldAnnual}
                onChange={(e) => setFiiDividendYieldAnnual(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-400">Ex: Portfólio de FIIs de Tijolo e Papel de alta qualidade</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-950 via-zinc-900 to-indigo-950 text-white p-6 rounded-2xl border border-emerald-800/50 shadow-lg">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
              Patrimônio Alvo para Autossustentação da Dívida
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white">
              {formatBRL(capitalNeededForDividends)}
            </div>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Com esse patrimônio rendendo <strong>{fiiDividendYieldAnnual}% ao ano</strong> isento de imposto, você recebe <strong>{formatBRL(monthlyInstallment)} por mês</strong> em dividendos. O imóvel paga a si mesmo enquanto seu salário permanece 100% livre para acumulação e gastos pessoais!
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
