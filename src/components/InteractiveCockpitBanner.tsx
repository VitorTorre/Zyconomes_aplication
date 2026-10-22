import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bot, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck,
  Compass, 
  Sparkles, 
  DollarSign, 
  Activity, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight, 
  Sliders, 
  Globe2, 
  PieChart as LucidePieChart, 
  Flame, 
  Shield, 
  HelpCircle,
  Briefcase,
  Coffee,
  ChevronRight,
  Lock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  runPersonalAgentSimulation, 
  AgentPersonaTone, 
  MarketCyclePhase 
} from '../services/zyconomesPersonalAgentEngine';
import { trackGranularEvent } from '../lib/analytics';
import { 
  verifyPermanentPremiumCockpit, 
  activatePermanentPremiumCockpit 
} from '../services/zyconomesIsoComplianceManager';

export const InteractiveCockpitBanner: React.FC<{ onOpenFullCockpit: () => void }> = ({ onOpenFullCockpit }) => {
  // Verificação e Sincronização de Licença Permanente Premium
  const [isPremium, setIsPremium] = useState<boolean>(() => verifyPermanentPremiumCockpit().isPremium);

  useEffect(() => {
    const handleSync = () => setIsPremium(verifyPermanentPremiumCockpit().isPremium);
    window.addEventListener('zyconomes:tier-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('zyconomes:tier-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleOpenCockpitWithLicense = () => {
    if (!isPremium) {
      window.location.hash = 'premium';
      return;
    }
    trackGranularEvent('engagement', 'button_click', 'Acessar Cockpit Detalhado Premium');
    onOpenFullCockpit();
  };

  // Configurações do Cockpit Interativo no FinanceTemplate
  const [initialCapital, setInitialCapital] = useState<number>(1000);
  const [initialMonthly, setInitialMonthly] = useState<number>(400);
  const [quarterlyStep, setQuarterlyStep] = useState<number>(250);
  const [riskMode, setRiskMode] = useState<'skeptical' | 'balanced' | 'risky'>('balanced');
  const [marketCycle, setMarketCycle] = useState<MarketCyclePhase>('expansion');
  const [displayCurrency, setDisplayCurrency] = useState<'BRL' | 'USD'>('BRL');

  const toneMap: Record<'skeptical' | 'balanced' | 'risky', AgentPersonaTone> = {
    skeptical: 'skeptical_fiduciary',
    balanced: 'balanced_perseverant',
    risky: 'formidable_bold',
  };

  const simulation = useMemo(() => {
    return runPersonalAgentSimulation({
      initialCapitalBRL: initialCapital,
      initialMonthlyContributionBRL: initialMonthly,
      quarterlyContributionStepBRL: quarterlyStep,
      targetWeeklyUSD: 2000,
      currentExchangeRateBRLUSD: 5.50,
      safeWithdrawalRateAnnual: 4.0,
      tone: toneMap[riskMode],
      marketCycle
    });
  }, [initialCapital, initialMonthly, quarterlyStep, riskMode, marketCycle]);

  const chartData = useMemo(() => {
    return simulation.projections.map(p => ({
      year: `Ano ${p.year}`,
      total: displayCurrency === 'BRL' ? p.portfolioTotalBRL : p.portfolioTotalUSD,
      contributed: displayCurrency === 'BRL' ? p.totalContributedBRL : Math.round(p.totalContributedBRL / 5.50),
      p10: displayCurrency === 'BRL' ? p.p10ConservativeBRL : p.p10ConservativeUSD,
      p50: displayCurrency === 'BRL' ? p.p50MedianBRL : p.p50MedianUSD,
      p90: displayCurrency === 'BRL' ? p.p90OptimisticBRL : p.p90OptimisticUSD,
      weeklyUSD: p.estimatedWeeklyPassiveIncomeUSD,
      phase: p.phase
    }));
  }, [simulation, displayCurrency]);

  const formatCurrency = (val: number) => {
    if (displayCurrency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 border border-zinc-800 shadow-2xl relative overflow-hidden font-sans">
      
      {/* GLOW DE FUNDO */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER DO COCKPIT */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/50 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Cockpit Multi-Ciclos
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-amber-400" /> {isPremium ? 'PREMIUM ATIVO' : 'PLANO PREMIUM'} • ISO 42001 / 27001 / 27701
            </span>
            <span className="text-xs text-zinc-400">
              Trajetória 15 Anos • R$ 1.000 $\to$ 5x-8x $\to$ US$ 2.000/sem
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Navegador Algorítmico de Ciclos e Trajetória Patrimonial
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl mt-1 leading-relaxed">
            Alterne entre posturas de risco e fases macroeconômicas. Visualize o impacto real da divisão de proventos (20% pessoal, 25% nichos, 40% ações/multimercados, 15% liquidez).
          </p>
        </div>

        {/* BOTOES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor BRL / USD */}
          <div className="bg-zinc-800/80 p-1 rounded-xl flex items-center border border-zinc-700">
            <button
              type="button"
              onClick={() => setDisplayCurrency('BRL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayCurrency === 'BRL' ? 'bg-[#1A1F71] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              R$ BRL
            </button>
            <button
              type="button"
              onClick={() => setDisplayCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayCurrency === 'USD' ? 'bg-[#1A1F71] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              US$ USD
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCockpitWithLicense}
            className="bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-amber-300/30"
          >
            <span>{isPremium ? 'Acessar Cockpit Detalhado (Premium Ativo)' : 'Assinar Plano para Desbloquear Cockpit'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </button>
        </div>
      </div>

      {/* CONTROLES INTERATIVOS: MODOS DE RISCO E CICLOS DE MERCADO */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        
        {/* SELECTOR DE MODO DE RISCO (ARRISCADO VS CÉTICO VS EQUILIBRADO) */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            Postura Fiduciária & Modo de Risco
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setRiskMode('skeptical');
                trackGranularEvent('engagement', 'button_click', 'Modo de Risco: Cético');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                riskMode === 'skeptical'
                  ? 'bg-blue-950/70 border-blue-500 text-white ring-2 ring-blue-500/20'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Cético
                </span>
                {riskMode === 'skeptical' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <p className="text-[11px] leading-tight text-zinc-300">
                Howard Marks & Buffet: Margem de segurança máxima e drawdowns contidos.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setRiskMode('balanced');
                trackGranularEvent('engagement', 'button_click', 'Modo de Risco: Equilibrado');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                riskMode === 'balanced'
                  ? 'bg-indigo-950/70 border-indigo-500 text-white ring-2 ring-indigo-500/20'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Equilibrado
                </span>
                {riskMode === 'balanced' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] leading-tight text-zinc-300">
                Paridade de risco All-Weather: Equilíbrio ótimo entre aportes e rentabilidade.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setRiskMode('risky');
                trackGranularEvent('engagement', 'button_click', 'Modo de Risco: Arriscado');
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                riskMode === 'risky'
                  ? 'bg-purple-950/70 border-purple-500 text-white ring-2 ring-purple-500/20'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Arriscado
                </span>
                {riskMode === 'risky' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <p className="text-[11px] leading-tight text-zinc-300">
                Taleb Barbell: Assimetria convexa e aceleração para o topo de 8x.
              </p>
            </button>
          </div>
        </div>

        {/* SELECTOR DE CICLO DE MERCADO */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            Fase Atual do Ciclo Macroeconômico
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'accumulation', label: 'Acumulação', desc: 'Ativos baratos' },
              { id: 'expansion', label: 'Expansão', desc: 'Crescimento ativo' },
              { id: 'euphoria', label: 'Euforia', desc: 'Realização de lucros' },
              { id: 'contraction', label: 'Contração', desc: 'Flight to quality' },
            ].map(cycle => (
              <button
                key={cycle.id}
                type="button"
                onClick={() => {
                  setMarketCycle(cycle.id as MarketCyclePhase);
                  trackGranularEvent('engagement', 'button_click', `Ciclo: ${cycle.label}`);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  marketCycle === cycle.id
                    ? 'bg-amber-950/50 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold text-amber-300">{cycle.label}</div>
                <div className="text-[10px] text-zinc-400 truncate">{cycle.desc}</div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* INPUTS DE APORTE INCREMENTAL */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Capital Inicial de Curto Prazo (R$)
          </label>
          <input
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
            className="w-full bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-700 font-mono text-sm font-bold text-white"
          />
        </div>

        <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Aporte Mensal Base (R$)
          </label>
          <input
            type="number"
            value={initialMonthly}
            onChange={(e) => setInitialMonthly(Number(e.target.value))}
            className="w-full bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-700 font-mono text-sm font-bold text-white"
          />
        </div>

        <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Acréscimo Trimestral (+R$ 150 a R$ 2.000)
          </label>
          <input
            type="number"
            step="50"
            min="150"
            max="2000"
            value={quarterlyStep}
            onChange={(e) => setQuarterlyStep(Number(e.target.value))}
            className="w-full bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-700 font-mono text-sm font-bold text-emerald-400"
          />
        </div>
      </div>

      {/* GRÁFICO DE LINHA: PROJEÇÃO DE 15 ANOS */}
      <div className="relative z-10 mt-8 p-6 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Projeção de Evolução Patrimonial (15 Anos) • Cone de Incerteza Log-Normal
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Linha P50 (Mediana Projetada), P10 (Cenário Cético/Pessimista) e P90 (Cenário Formidável/Otimista).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span> P10 Cético
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> P50 Mediana
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span> P90 Formidável
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="year" stroke="#71717a" fontSize={11} />
              <YAxis 
                stroke="#71717a" 
                fontSize={11} 
                tickFormatter={(v) => displayCurrency === 'BRL' ? `R$ ${(v / 1000).toFixed(0)}k` : `$ ${(v / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', color: '#ffffff', border: '1px solid #27272a', fontSize: '12px' }}
                formatter={(val: any, name: any) => [
                  formatCurrency(Number(val)),
                  name === 'p50' ? 'Mediana (P50)' : name === 'p10' ? 'Cético (P10)' : name === 'p90' ? 'Formidável (P90)' : 'Total Aportado'
                ]}
              />
              <Line type="monotone" dataKey="p10" stroke="#60A5FA" strokeWidth={2} dot={false} strokeDasharray="3 3" name="p10" />
              <Line type="monotone" dataKey="p50" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} name="p50" />
              <Line type="monotone" dataKey="p90" stroke="#C084FC" strokeWidth={2} dot={false} strokeDasharray="3 3" name="p90" />
              <Line type="monotone" dataKey="contributed" stroke="#71717a" strokeWidth={1.5} dot={false} name="contributed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REGRAS DE DIVISÃO DE PROVENTOS (20% PESSOAL, 25% NICHOS, 40% AÇÕES, 15% LIQUIDEZ) */}
      <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-blue-900/40">
          <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5 mb-1">
            <Coffee className="w-4 h-4" /> 20% Gastos Pessoais
          </div>
          <div className="text-xs text-zinc-300">
            Recompensa e sustentabilidade psicológica. Evita fadiga mental e burnout financeiro (Kahneman).
          </div>
        </div>

        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-purple-900/40">
          <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5 mb-1">
            <Briefcase className="w-4 h-4" /> 25% Negócios Nichados
          </div>
          <div className="text-xs text-zinc-300">
            Equity assimétrico de alto crescimento. Convexidade da estratégia Barbell (Taleb).
          </div>
        </div>

        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-emerald-900/40">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-4 h-4" /> 40% Ações & Multimercados
          </div>
          <div className="text-xs text-zinc-300">
            Empresas com fosso econômico durável, ROIC alto e geradoras de dividendos (Buffett/Munger).
          </div>
        </div>

        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-amber-900/40">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4" /> 15% Liquidez & Hedge
          </div>
          <div className="text-xs text-zinc-300">
            Proteção cambial (TIPS/Dólar) e caixa tático para comprar pechinchas em quedas de mercado.
          </div>
        </div>
      </div>

      {/* MILESTONE SUMMARY CARDS */}
      <div className="relative z-10 mt-6 pt-6 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center sm:text-left">
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Curto Prazo (Ano 1)</div>
          <div className="text-xl font-black text-white mt-0.5">
            {formatCurrency(simulation.projections[1]?.portfolioTotalBRL || 1000)}
          </div>
          <div className="text-xs text-zinc-400">Inaugural: R$ 1.000 + aportes crescentes</div>
        </div>

        <div className="text-center sm:text-left">
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Médio Prazo (Ano 5)</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">
            {formatCurrency(simulation.projections[5]?.portfolioTotalBRL || 50000)}
          </div>
          <div className="text-xs text-emerald-300/80">Multiplicação de 5x a 8x confirmada</div>
        </div>

        <div className="text-center sm:text-left">
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Longo Prazo (Ano 15)</div>
          <div className="text-xl font-black text-blue-400 mt-0.5">
            US$ {Math.round(simulation.projections[15]?.estimatedWeeklyPassiveIncomeUSD || 2000).toLocaleString()}/semana
          </div>
          <div className="text-xs text-blue-300/80">Retirada segura perpétua (SWR 4%)</div>
        </div>
      </div>

    </div>
  );
};
