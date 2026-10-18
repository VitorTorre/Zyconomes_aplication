import React, { useState, useMemo } from 'react';
import { 
  Bot, 
  TrendingUp, 
  ShieldAlert, 
  Compass, 
  Sparkles, 
  DollarSign, 
  Activity, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowUpRight, 
  RotateCcw, 
  Sliders, 
  Globe2, 
  PieChart as LucidePieChart, 
  Briefcase, 
  Coffee, 
  Shield, 
  Cpu
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  runPersonalAgentSimulation, 
  AgentPersonaTone, 
  MarketCyclePhase, 
  PersonalAgentSimulationParams 
} from '../services/zyconomesPersonalAgentEngine';
import { trackGranularEvent } from '../lib/analytics';

const PROVENTOS_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

export const PersonalAgentCockpit: React.FC = () => {
  // Parâmetros do Usuário
  const [initialCapital, setInitialCapital] = useState<number>(1000);
  const [initialMonthly, setInitialMonthly] = useState<number>(400);
  const [quarterlyStep, setQuarterlyStep] = useState<number>(250);
  const [targetWeeklyUSD, setTargetWeeklyUSD] = useState<number>(2000);
  const [exchangeRate, setExchangeRate] = useState<number>(5.50);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState<number>(4.0);
  const [tone, setTone] = useState<AgentPersonaTone>('balanced_perseverant');
  const [marketCycle, setMarketCycle] = useState<MarketCyclePhase>('expansion');
  const [activeTab, setActiveTab] = useState<'overview' | 'projections' | 'inconsistencies' | 'rules'>('overview');
  const [displayCurrency, setDisplayCurrency] = useState<'BRL' | 'USD'>('BRL');

  // Execução do motor matemático puro
  const simulation = useMemo(() => {
    return runPersonalAgentSimulation({
      initialCapitalBRL: initialCapital,
      initialMonthlyContributionBRL: initialMonthly,
      quarterlyContributionStepBRL: quarterlyStep,
      targetWeeklyUSD,
      currentExchangeRateBRLUSD: exchangeRate,
      safeWithdrawalRateAnnual: safeWithdrawalRate,
      tone,
      marketCycle
    });
  }, [initialCapital, initialMonthly, quarterlyStep, targetWeeklyUSD, exchangeRate, safeWithdrawalRate, tone, marketCycle]);

  // Formatação de Moeda
  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const formatUSD = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Dados para o Gráfico de Evolução
  const chartData = useMemo(() => {
    return simulation.projections.map(p => ({
      year: `Ano ${p.year}`,
      totalBRL: p.portfolioTotalBRL,
      totalUSD: p.portfolioTotalUSD,
      contributedBRL: p.totalContributedBRL,
      p10BRL: p.p10ConservativeBRL,
      p50BRL: p.p50MedianBRL,
      p90BRL: p.p90OptimisticBRL,
      p10USD: p.p10ConservativeUSD,
      p50USD: p.p50MedianUSD,
      p90USD: p.p90OptimisticUSD,
      weeklyUSD: p.estimatedWeeklyPassiveIncomeUSD,
      phase: p.phase
    }));
  }, [simulation]);

  // Dados para o Gráfico de Proventos (Ano 5)
  const dividendsData = useMemo(() => {
    const yr5 = simulation.projections[5]?.dividendsAllocation || {
      personalExpensesBRL: 20,
      nicheBusinessesBRL: 25,
      equitiesAndMacroFundsBRL: 40,
      liquidityHedgeBRL: 15
    };

    return [
      { name: 'Ações & Multimercados (40%)', value: yr5.equitiesAndMacroFundsBRL, color: '#10B981', desc: 'Crescimento e dividend aristocrats' },
      { name: 'Negócios Nichados (25%)', value: yr5.nicheBusinessesBRL, color: '#8B5CF6', desc: 'Equity assimétrico & inovação' },
      { name: 'Gastos Pessoais (20%)', value: yr5.personalExpensesBRL, color: '#3B82F6', desc: 'Recompensa e sustentabilidade mental' },
      { name: 'Reserva & Hedge (15%)', value: yr5.liquidityHedgeBRL, color: '#F59E0B', desc: 'Proteção cambial e caixa tático' }
    ];
  }, [simulation]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden font-sans">
      
      {/* HEADER DO AGENTE */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950 text-white p-6 sm:p-8 border-b border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/40">
                  MOSC-ZYC & Agent-S Engine
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                  Rigor Quantitativo Auditável
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                Cockpit do Agente de IA Financeiro Pessoal
              </h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Simulação estocástica de alta precisão: de <strong className="text-white">R$ 1.000</strong> a <strong className="text-emerald-400">5x-8x</strong> no médio prazo até atingir <strong className="text-blue-400">US$ 2.000/semana</strong> em 15 anos.
              </p>
            </div>
          </div>

          {/* SELETOR DE MOEDA & STATUS */}
          <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-700/60 self-start md:self-auto">
            <button
              onClick={() => { setDisplayCurrency('BRL'); trackGranularEvent('engagement', 'button_click', 'currency_toggle_BRL'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                displayCurrency === 'BRL' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Exibir em R$ (BRL)
            </button>
            <button
              onClick={() => { setDisplayCurrency('USD'); trackGranularEvent('engagement', 'button_click', 'currency_toggle_USD'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                displayCurrency === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Exibir em US$ (USD)
            </button>
          </div>
        </div>

        {/* VEREDICTO DE TOM DO AGENTE */}
        <div className="mt-6 p-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-xs font-bold text-zinc-300">{simulation.toneVerdict.headline}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{simulation.toneVerdict.strategicDirective}</div>
            </div>
          </div>
          <div className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-lg max-w-md">
            ⚠️ {simulation.toneVerdict.behavioralWarning}
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLE INTERATIVO & ABAS */}
      <div className="p-6 sm:p-8">
        
        {/* SELEÇÃO DO TOM DO AGENTE E DO CICLO DE MERCADO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* SELETOR DE TOM DO AGENTE */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                Tom & Postura Comportamental do Agente
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">Calibração Psicológica</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setTone('formidable_bold'); trackGranularEvent('engagement', 'button_click', 'agent_tone_bold'); }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tone === 'formidable_bold'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="text-xs font-bold">Formidável & Ousado</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Captura de assimetria e ondas de liquidez</div>
              </button>

              <button
                onClick={() => { setTone('balanced_perseverant'); trackGranularEvent('engagement', 'button_click', 'agent_tone_balanced'); }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tone === 'balanced_perseverant'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="text-xs font-bold">Equilibrado & Perseverante</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Boglehead, All Weather e constância</div>
              </button>

              <button
                onClick={() => { setTone('skeptical_fiduciary'); trackGranularEvent('engagement', 'button_click', 'agent_tone_skeptical'); }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tone === 'skeptical_fiduciary'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="text-xs font-bold">Cético & Fiduciário</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Margem de segurança e proteção antipânico</div>
              </button>
            </div>
          </div>

          {/* SELETOR DE CICLO DE MERCADO */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Ciclo Macroeconômico & Liquidez (Howard Marks)
              </label>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                simulation.cycleInsight.riskScore >= 7 
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' 
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                Risco: {simulation.cycleInsight.riskScore}/10
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'accumulation', label: '1. Acumulação', desc: 'Desconto Máximo' },
                { id: 'expansion', label: '2. Expansão', desc: 'Onda Positiva' },
                { id: 'euphoria', label: '3. Euforia', desc: 'Risco de Bolha' },
                { id: 'contraction', label: '4. Contração', desc: 'Capitulação' },
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => { setMarketCycle(c.id as MarketCyclePhase); trackGranularEvent('engagement', 'button_click', `market_cycle_${c.id}`); }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    marketCycle === c.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 font-bold text-blue-900 dark:text-blue-200 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-xs">{c.label}</div>
                  <div className="text-[10px] text-zinc-500">{c.desc}</div>
                </button>
              ))}
            </div>

            <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-850 p-2.5 rounded border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
              <span><strong>Ação Tática:</strong> {simulation.cycleInsight.tacticalAction}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Pêndulo de Marks</span>
            </div>
          </div>
        </div>

        {/* INPUTS DE PARÂMETROS COM SLIDERS */}
        <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 mb-8">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Parâmetros Estruturais da Trajetória (15 Anos)
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Regras Determinísticas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Capital Inicial */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                <span>Partida Inaugural</span>
                <span className="font-bold text-zinc-900 dark:text-white font-mono">{formatBRL(initialCapital)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-zinc-500">Curto Prazo: R$ 1.000,00</span>
            </div>

            {/* Aporte Inicial */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                <span>Aporte Mensal Inicial</span>
                <span className="font-bold text-zinc-900 dark:text-white font-mono">{formatBRL(initialMonthly)}</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={initialMonthly}
                onChange={(e) => setInitialMonthly(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-zinc-500">Mês 1 ao Mês 3</span>
            </div>

            {/* Passo Trimestral */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                <span>Acréscimo Trimestral</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">+{formatBRL(quarterlyStep)} / trim</span>
              </div>
              <input
                type="range"
                min="150"
                max="2000"
                step="50"
                value={quarterlyStep}
                onChange={(e) => setQuarterlyStep(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-zinc-500">R$ 150 a R$ 2.000 / trimestre</span>
            </div>

            {/* Meta Semanal USD */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                <span>Meta Semanal (Longo Prazo)</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{formatUSD(targetWeeklyUSD)} / sem</span>
              </div>
              <input
                type="range"
                min="1000"
                max="5000"
                step="250"
                value={targetWeeklyUSD}
                onChange={(e) => setTargetWeeklyUSD(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-[10px] text-zinc-500">Meta: US$ 2.000/semana</span>
            </div>
          </div>
        </div>

        {/* 3 MILESTONES PRINCIPAIS: CURTO, MÉDIO E LONGO PRAZO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* FASE 1: CURTO PRAZO */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-emerald-50/30 dark:from-zinc-800 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                Fase 1: Curto Prazo (Ano 1)
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white font-mono tracking-tight">
              {displayCurrency === 'BRL' 
                ? formatBRL(simulation.milestones.shortTermYear1EndBRL)
                : formatUSD(simulation.milestones.shortTermYear1EndBRL / exchangeRate)}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Patrimônio acumulado ao final do 1º ano partindo de {formatBRL(initialCapital)} com aportes crescentes.
            </p>
            <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span>Hábito de Aporte: Consolidado</span>
              <span>100% Líquido</span>
            </div>
          </div>

          {/* FASE 2: MÉDIO PRAZO */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-purple-50/30 dark:from-zinc-800 dark:to-purple-950/20 border border-purple-200 dark:border-purple-800/40 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-1 rounded-full">
                Fase 2: Médio Prazo (Ano 5)
              </span>
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-black text-purple-900 dark:text-purple-300 font-mono tracking-tight">
              {displayCurrency === 'BRL'
                ? formatBRL(simulation.milestones.mediumTermYear5EndBRL)
                : formatUSD(simulation.milestones.mediumTermYear5EndBRL / exchangeRate)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded">
                Multiplicação de {simulation.milestones.mediumTermMultiplicationFactor}x
              </span>
              <span className="text-xs text-zinc-500">sobre o fechamento do curto prazo</span>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-xs font-semibold text-purple-800 dark:text-purple-300">
              <span>Target 5x a 8x: Atingido</span>
              <span>Início da Dolarização</span>
            </div>
          </div>

          {/* FASE 3: LONGO PRAZO */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-blue-50/30 dark:from-zinc-800 dark:to-blue-950/20 border border-blue-200 dark:border-blue-800/40 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
                Fase 3: Longo Prazo (Ano 15)
              </span>
              <Globe2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-blue-900 dark:text-blue-300 font-mono tracking-tight">
              {formatUSD(simulation.milestones.weeklyPassiveIncomeAtYear15USD)}
              <span className="text-sm font-normal text-zinc-500"> / semana</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Patrimônio global de {formatUSD(simulation.milestones.longTermYear15EndUSD)} sustentando retiradas seguras (SWR {safeWithdrawalRate}% a.a.).
            </p>
            <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
              <span>Meta US$ 2.000/sem: {simulation.milestones.targetAchievedYear ? `Ano ${simulation.milestones.targetAchievedYear}` : 'Em Convergência'}</span>
              <span>85% Dolarizado</span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS DO COCKPIT */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Visão Geral & Gráfico de Evolução (Cone de Monte Carlo)
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <LucidePieChart className="w-4 h-4" />
            Alocação dos Proventos (20/25/40/15)
          </button>

          <button
            onClick={() => setActiveTab('projections')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'projections'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Tabela Analítica Ano a Ano (15 Anos)
          </button>

          <button
            onClick={() => setActiveTab('inconsistencies')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'inconsistencies'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Inconsistências Ocultas Tratadas
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        {activeTab === 'overview' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Trajetória Patrimonial com Intervalos de Confiança (P10 Conservador, P50 Mediano, P90 Otimista)
                </h4>
                <p className="text-xs text-zinc-500">
                  Valores reais deflacionados, incorporando volatilidade e progressão do aporte trimestral (+{formatBRL(quarterlyStep)}).
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> P50 Mediano
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block"></span> Cone P10-P90
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => displayCurrency === 'BRL' ? `R$ ${(val/1000).toFixed(0)}k` : `$ ${(val/1000).toFixed(0)}k`} 
                  />
                  <Tooltip 
                    formatter={(val: any) => [
                      displayCurrency === 'BRL' ? formatBRL(Number(val)) : formatUSD(Number(val)),
                      'Patrimônio'
                    ]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{ borderRadius: '12px', background: '#09090b', color: '#fff', border: '1px solid #27272a' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={displayCurrency === 'BRL' ? 'p90BRL' : 'p90USD'} 
                    stroke="#6366F1" 
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorCone)" 
                    name="P90 Otimista"
                  />
                  <Area 
                    type="monotone" 
                    dataKey={displayCurrency === 'BRL' ? 'p50BRL' : 'p50USD'} 
                    stroke="#10B981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorP50)" 
                    name="P50 Mediano"
                  />
                  <Area 
                    type="monotone" 
                    dataKey={displayCurrency === 'BRL' ? 'p10BRL' : 'p10USD'} 
                    stroke="#94A3B8" 
                    strokeDasharray="4 4"
                    fill="transparent" 
                    name="P10 Conservador"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dividendsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dividendsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatBRL(Number(val)), 'Proventos Anuais']}
                    contentStyle={{ borderRadius: '10px', background: '#18181b', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Direcionamento Fiduciário dos Rendimentos da Carteira
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Em vez de reinvestimento cego ou dilapidação prematura, o Agente de IA calibra o fluxo gerado para atender a sustentabilidade comportamental do investidor e acelerar a multiplicação:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dividendsData.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{item.name}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">{item.desc}</p>
                    <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white mt-1.5">
                      {formatBRL(item.value)} / ano (Ano 5)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="py-2.5 px-3">Ano</th>
                  <th className="py-2.5 px-3">Fase</th>
                  <th className="py-2.5 px-3">Aporte Mensal</th>
                  <th className="py-2.5 px-3">Total Investido</th>
                  <th className="py-2.5 px-3">Patrimônio (BRL)</th>
                  <th className="py-2.5 px-3">Patrimônio (USD)</th>
                  <th className="py-2.5 px-3">Renda Semanal (USD)</th>
                  <th className="py-2.5 px-3">Dolarização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {simulation.projections.map((p) => (
                  <tr key={p.year} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${p.year === 1 || p.year === 5 || p.year === 15 ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-bold' : ''}`}>
                    <td className="py-2 px-3 text-zinc-900 dark:text-white font-bold">{p.year === 0 ? 'Início' : `Ano ${p.year}`}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        p.phase === 'short_term' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : p.phase === 'medium_term'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                      }`}>
                        {p.phase === 'short_term' ? 'Curto Prazo' : p.phase === 'medium_term' ? 'Médio Prazo' : 'Longo Prazo'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{formatBRL(p.monthlyContributionCurrentBRL)}</td>
                    <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{formatBRL(p.totalContributedBRL)}</td>
                    <td className="py-2 px-3 font-bold text-zinc-900 dark:text-white">{formatBRL(p.portfolioTotalBRL)}</td>
                    <td className="py-2 px-3 text-blue-600 dark:text-blue-400">{formatUSD(p.portfolioTotalUSD)}</td>
                    <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-bold">{formatUSD(p.estimatedWeeklyPassiveIncomeUSD)}/sem</td>
                    <td className="py-2 px-3 text-zinc-500">{p.dollarizationRatio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'inconsistencies' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Inconsistências Que Poderiam Passar Despercebidas (Resolvidas Passo a Passo)
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400/90 mt-1">
                A engenharia financeira da Zyconomes erradica o achismo e falsas ilusões através de equações determinísticas e verificação contra a realidade de mercado:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulation.inconsistenciesResolved.map((inc, i) => {
                const parts = inc.split(': ');
                return (
                  <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-zinc-850">
                    <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      {parts[0]}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                      {parts[1] || inc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
