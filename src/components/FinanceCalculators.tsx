import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, ShieldCheck, TrendingUp, DollarSign, PieChart as LucidePieChart, Users, Building, Lock, FileText, CheckCircle, ArrowRight, Activity, Layers, Info, Download, Database, Sparkles, Award, Compass, RefreshCw, BarChart3, Sliders, Check, HelpCircle, Link2, RotateCcw, Bot, ArrowLeftRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { trackGranularEvent, trackSimulationCompleted } from '../lib/analytics';
import { useToolAnalytics } from '../hooks/useToolAnalytics';
import { EmailCapture } from './EmailCapture';
import { ShareButtons } from './ZyconomesWidgets';
import { PersonalAgentCockpit } from './PersonalAgentCockpit';
import { saveRateLimiter } from '../lib/clientRateLimiter';
import { safeNumber, calculateSavingsRate, calculateEmergencyFundMonths, calculateIndependenceYears } from '../lib/financeMath';
import { PremiumButton } from './PremiumButton';
import { GeneratePDFReport, SimulationReportData } from './GeneratePDFReport';
import { DebtPayoffAccelerator } from './DebtPayoffAccelerator';
import { auditLogger } from '../lib/auditLogger';
import { useFinancialData } from '../context/FinancialDataContext';
import { 
  INSTITUTIONAL_STRATEGIES, 
  InstitutionalPortfolioStrategy, 
  calculatePortfolioAllocation, 
  getStrategyByRiskProfile, 
  AssetAllocationItem 
} from '../lib/institutionalStrategies';

export const FinanceCalculators: React.FC = () => {
  // --- STATE PERSISTENCE ---
  const saveState = (key: string, value: any, toolName: string) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const [savingResult, setSavingResult] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [openFinanceSynced, setOpenFinanceSynced] = useState(false);

  const handleLocalSave = (toolId: string, name: string, data: any) => {
    try {
      const existingStr = localStorage.getItem('zyc_saved_simulations');
      let existing: any[] = [];
      try {
        existing = existingStr ? JSON.parse(existingStr) : [];
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }
      const newEntry = {
        id: `sim-${Date.now()}`,
        toolId,
        name,
        data,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('zyc_saved_simulations', JSON.stringify([newEntry, ...existing].slice(0, 50)));
      setSaveSuccess(true);
      
      auditLogger.recordAuditEvent({
        category: 'STATE_PERSISTENCE',
        severity: 'INFO',
        action: 'SIMULATION_SAVED_LOCAL',
        details: { toolId, name },
        source: 'client',
      });

      trackSimulationCompleted(name, { toolId, origin: 'local_save' });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.warn('Error saving local simulation:', e);
    }
  };

  const saveSimulationToCloud = async (toolId: string, name: string, data: any) => {
    const token = localStorage.getItem('zyc_auth_token');
    if (!token || token === 'null' || token === 'undefined') {
      handleLocalSave(toolId, name, data);
      return;
    }
    
    if (!saveRateLimiter.isAllowed()) {
      setRateLimitError(true);
      auditLogger.recordAuditEvent({
        category: 'RATE_LIMIT',
        severity: 'WARN',
        action: 'SIMULATION_SAVE_RATE_LIMITED',
        details: { toolId, name },
        source: 'client',
      });
      setTimeout(() => setRateLimitError(false), 3000);
      return;
    }

    setSavingResult(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toolId, name, data })
      });
      setSaveSuccess(true);
      auditLogger.recordAuditEvent({
        category: 'STATE_PERSISTENCE',
        severity: 'INFO',
        action: 'SIMULATION_SAVED_CLOUD',
        details: { toolId, name },
        source: 'client',
      });
      trackSimulationCompleted(name, { toolId, origin: 'cloud_save' });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to sync with cloud:', err);
      // Graceful offline fallback
      handleLocalSave(toolId, name, data);
    } finally {
      setSavingResult(false);
    }
  };

  const SaveButton = ({ toolId, name, data, customReport }: { toolId: string; name: string; data: any; customReport?: SimulationReportData }) => {
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('zyc_auth_token') : null;
    const isLoggedIn = Boolean(rawToken && rawToken !== 'null' && rawToken !== 'undefined' && rawToken.trim() !== '');

    return (
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {isLoggedIn ? (
          <div className="flex-1 flex flex-col">
            <button 
              onClick={() => saveSimulationToCloud(toolId, name, data)}
              disabled={savingResult}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 h-full cursor-pointer"
            >
              {savingResult ? 'Salvando...' : saveSuccess ? 'Simulação Salva!' : 'Salvar na Nuvem'}
              {!savingResult && !saveSuccess && <CheckCircle className="w-4 h-4" />}
            </button>
            {rateLimitError && <div className="text-xs text-red-500 font-bold mt-2 text-center">Muitas requisições. Aguarde um momento.</div>}
          </div>
        ) : (
          <button 
            onClick={() => handleLocalSave(toolId, name, data)}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {saveSuccess ? 'Simulação Salva!' : 'Salvar Simulação (Ctrl+S)'}
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1">
          <GeneratePDFReport 
            reportData={customReport || getActiveReportData()} 
            buttonLabel="PDF Institucional" 
            buttonVariant="outline"
          />
        </div>
      </div>
    );
  };

  const exportPDF = async (title: string) => {
    window.print();
    trackGranularEvent('conversion', 'button_click', 'PDF Export');
  };

  const loadState = (key: string, defaultVal: any) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || saved === 'undefined' || saved === 'null') return defaultVal;
      return JSON.parse(saved);
    } catch {
      return defaultVal;
    }
  };

  const [activeCategory, setActiveCategory] = useState<'free' | 'premium' | 'enterprise'>('free');
  const [selectedService, setSelectedService] = useState<number>(1);

  // --- SHARED FINANCIAL STATE VIA REACT CONTEXT API ---
  const {
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
    freeCashFlow,
    savingsRate,
    emergencyReserveTarget,
    yearsToTarget,
    remainingMonths,
    compoundResult,
    loanPmt: pmt,
    loanTotalInterest: totalInterest,
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
    syncAllCalculators,
    applySurplusToInvestments,
    resetToDefaults,
  } = useFinancialData();

  // Configurações e Categorias (Mesmo que antes)
  const services = [
    { id: 1, name: 'Diagnóstico Financeiro', icon: Activity, category: 'free', locked: false, description: 'Descubra sua saúde financeira e taxa de poupança.' },
    { id: 2, name: 'Juros Compostos', icon: TrendingUp, category: 'free', locked: false, description: 'Simulação exata de multiplicação patrimonial.' },
    { id: 3, name: 'Reserva de Emergência', icon: ShieldCheck, category: 'free', locked: false, description: 'Cálculo de blindagem contra o acaso.' },
    { id: 4, name: 'Acelerador de Financiamento & Dívidas (SAC/PRICE)', icon: Calculator, category: 'free', locked: false, description: 'Aniquilação de juros em imóveis, casas e dívidas com amortizações extras e método Avalanche.' },
    { id: 5, name: 'Independência (O Fator Tempo)', icon: LucidePieChart, category: 'free', locked: false, description: 'Fórmula logarítmica para descobrir "quando".' },
    { id: 6, name: 'IA Preditiva: Alocação de Ativos', icon: Layers, category: 'free', locked: false, description: 'Modelos institucionais e rebalanceamento via IA.' },
    { id: 7, name: 'Agente de IA Pessoal (Agent-S 15 Anos)', icon: Bot, category: 'free', locked: false, description: 'Trajetória 15 anos: R$ 1.000 -> 5x-8x -> US$ 2.000/sem com cockpit multi-ciclos.' },
    { id: 8, name: 'Análise de Ações (Valuation)', icon: Building, category: 'premium', locked: true, description: 'Fórmulas de Graham, Bazin e DCF prontas para uso.' },
    { id: 9, name: 'Otimização Fiscal (IR)', icon: FileText, category: 'premium', locked: true, description: 'Estratégias lícitas para redução de carga tributária.' }
  ];

  // Configuração Analítica Isolada
  const activeTool = services.find(s => s.id === selectedService) || services[0];
  const { trackFieldFill, trackClick, trackCalculation } = useToolAnalytics(activeTool.name);

  // IA Alocação & Setup Seletivo Institucional State
  const [setupMode, setSetupMode] = useState<'strategies' | 'profiles'>('strategies');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiDiagnostic, setAiDiagnostic] = useState<any>(null);

  const currentStrategy = useMemo(() => {
    if (setupMode === 'profiles') {
      return getStrategyByRiskProfile(aiProfile);
    }
    return INSTITUTIONAL_STRATEGIES.find(s => s.id === selectedStrategyId) || INSTITUTIONAL_STRATEGIES[1];
  }, [setupMode, selectedStrategyId, aiProfile]);

  const allocatedAssets = useMemo(() => {
    return calculatePortfolioAllocation(currentStrategy, aiAmount);
  }, [currentStrategy, aiAmount]);

  const fetchAIPortfolio = async () => {
    setAiLoading(true);
    trackGranularEvent('conversion', 'button_click', 'Gerou Alocacao IA');

    const token = typeof window !== 'undefined' ? localStorage.getItem('zyc_auth_token') : null;
    let geminiSucceeded = false;

    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const res = await fetch('/api/ai/rebalance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ profile: currentStrategy.riskProfile, amount: aiAmount })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.assets && Array.isArray(data.assets) && data.assets.length > 0) {
            setAiResult(data);
            geminiSucceeded = true;
          }
        }
      } catch (err) {
        console.warn('Backend AI portfolio rebalance call failed, using institutional engine fallback:', err);
      }
    }

    if (!geminiSucceeded) {
      setAiResult({
        strategyTitle: currentStrategy.title,
        referenceAuthor: currentStrategy.referenceAuthor,
        expectedReturn: currentStrategy.expectedRealReturn,
        riskLevel: currentStrategy.riskProfile,
        sharpeRatio: currentStrategy.sharpeEstimate,
        volatility: currentStrategy.volatilityEstimate,
        rebalanceBand: currentStrategy.rebalanceBand,
        institutionalThesis: currentStrategy.thesis,
        engine: 'Modelo Institucional de Alocação de Ativos (Zyconomes Alpha)',
        assets: allocatedAssets.map(a => ({
          name: a.name,
          percentage: a.percentage,
          amount: a.amount,
          description: a.rationale,
          recommendedInstruments: a.recommendedInstruments,
          taxStatus: a.taxStatus,
          liquidity: a.liquidity,
          color: a.color
        }))
      });
    }

    setAiDiagnostic({
      thesis: currentStrategy.thesis,
      macroSensitivity: `Para o montante de ${safeNumber(aiAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, a diversificação em ${currentStrategy.assets.length} classes reduz a probabilidade de perda permanente de capital para níveis estatisticamente residuais em horizontes de 5+ anos.`,
      rebalanceAdvice: `Gatilho de Rebalanceamento: ${currentStrategy.rebalanceBand}. Recomendado usar novos aportes para recompor a classe que estiver abaixo da meta, evitando custos operacionais desnecessários e fricção tributária.`,
      taxEfficiencyNote: 'A alocação prioriza veículos com isenção fiscal (FIIs, debêntures incentivadas de infraestrutura e LCIs/LCAs), otimizando a taxa interna de retorno líquida.',
      source: geminiSucceeded ? 'Gemini 2.5 Pro Wealth Advisor' : 'Motor Institucional Zyconomes Alpha'
    });

    setAiLoading(false);
  };

  // Event Listener for external tool selection
  useEffect(() => {
    const handleOpenTool = (e: any) => {
      const toolId = e.detail?.id;
      if (toolId) {
        setSelectedService(toolId);
        setActiveCategory(toolId >= 8 ? 'premium' : 'free');
      }
    };
    window.addEventListener('zyc_open_tool', handleOpenTool);
    return () => window.removeEventListener('zyc_open_tool', handleOpenTool);
  }, []);

  const generateCompoundChartData = () => {
    const data = [];
    let currentTotal = safeNumber(savings);
    let currentInvested = safeNumber(savings);
    
    data.push({ year: 0, Total: Math.round(currentTotal), Investido: Math.round(currentInvested), Juros: 0 });
    
    const mRate = safeNumber(interestRate) / 100 / 12;
    const yTarget = safeNumber(years);
    for (let y = 1; y <= yTarget; y++) {
      for (let m = 1; m <= 12; m++) {
        currentTotal = currentTotal * (1 + mRate) + safeNumber(monthlyContribution);
        currentInvested += safeNumber(monthlyContribution);
      }
      data.push({ 
        year: y, 
        Total: Math.round(currentTotal), 
        Investido: Math.round(currentInvested), 
        Juros: Math.round(currentTotal - currentInvested) 
      });
    }
    return data;
  };
  const compoundChartData = generateCompoundChartData();

  const getActiveReportData = (): SimulationReportData => {
    switch (selectedService) {
      case 1:
        return {
          toolId: 1,
          toolName: 'Diagnóstico Financeiro & Taxa de Poupança',
          parameters: [
            { label: 'Renda Mensal Líquida', value: `R$ ${income.toLocaleString('pt-BR')}` },
            { label: 'Despesas Mensais', value: `R$ ${expenses.toLocaleString('pt-BR')}` },
            { label: 'Reserva Atual', value: `R$ ${savings.toLocaleString('pt-BR')}` },
          ],
          metrics: [
            { label: 'Taxa de Poupança', value: `${safeNumber(savingsRate).toFixed(1)}%`, highlight: true, badge: savingsRate >= 20 ? 'Excelente (>20%)' : 'Atenção' },
            { label: 'Fluxo Livre', value: `R$ ${safeNumber(freeCashFlow).toLocaleString('pt-BR')}`, highlight: true },
            { label: 'Cobertura Emergencial', value: `${calculateEmergencyFundMonths(savings, expenses).toFixed(1)} Meses` },
          ],
          formulaTitle: 'Taxa de Poupança & Fluxo de Caixa Livre',
          formulaMath: 'S_rate = ((Renda - Despesas) / Renda) * 100',
          formulaExplanation: 'Determina a fração da receita líquida que sobra para acumulação patrimonial e proteção contra cenários estressados de liquidez.',
          recommendations: [
            'Manter aporte mensal direcionado para cobertura mínima de 6 meses de despesas.',
            'Evitar elevação prematura de despesas fixas antes de blindar a reserva de segurança.',
          ],
        };
      case 2:
        return {
          toolId: 2,
          toolName: 'Juros Compostos & Crescimento Patrimonial',
          parameters: [
            { label: 'Valor Inicial', value: `R$ ${savings.toLocaleString('pt-BR')}` },
            { label: 'Aporte Mensal', value: `R$ ${monthlyContribution.toLocaleString('pt-BR')}` },
            { label: 'Taxa Anual', value: `${interestRate}% a.a.` },
            { label: 'Horizonte', value: `${years} Anos` },
          ],
          metrics: [
            { label: 'Montante Final', value: `R$ ${Math.round(safeNumber(compoundResult)).toLocaleString('pt-BR')}`, highlight: true },
            { label: 'Total Investido', value: `R$ ${(savings + monthlyContribution * years * 12).toLocaleString('pt-BR')}` },
            { label: 'Juros Acumulados', value: `R$ ${Math.round(compoundResult - (savings + monthlyContribution * years * 12)).toLocaleString('pt-BR')}`, badge: 'Rentabilidade Pura' },
          ],
          formulaTitle: 'Equação de Capitalização sob Aportes Periódicos',
          formulaMath: 'VF = VP*(1 + i)^n + PMT*[((1 + i)^n - 1) / i]',
          formulaExplanation: 'Cálculo analítico discreto com taxa equivalente mensal e reinvestimento contínuo dos juros gerados.',
          projections: compoundChartData.slice(0, 8).map(d => ({
            period: `Ano ${d.year}`,
            invested: `R$ ${d.Investido.toLocaleString('pt-BR')}`,
            interest: `R$ ${d.Juros.toLocaleString('pt-BR')}`,
            total: `R$ ${d.Total.toLocaleString('pt-BR')}`,
          })),
        };
      case 3:
        return {
          toolId: 3,
          toolName: 'Blindagem & Reserva de Emergência',
          parameters: [
            { label: 'Custo Essencial Mensal', value: `R$ ${expenses.toLocaleString('pt-BR')}` },
            { label: 'Reserva Atual', value: `R$ ${savings.toLocaleString('pt-BR')}` },
            { label: 'Alvo de Proteção', value: '6 Meses de Custo' },
          ],
          metrics: [
            { label: 'Meta de Reserva', value: `R$ ${(expenses * 6).toLocaleString('pt-BR')}`, highlight: true },
            { label: 'Cobertura Atual', value: `${(savings / (expenses || 1)).toFixed(1)} Meses` },
            { label: 'Déficit de Blindagem', value: `R$ ${Math.max(0, expenses * 6 - savings).toLocaleString('pt-BR')}`, badge: savings >= expenses * 6 ? 'Blindado' : 'Aporte Pendente' },
          ],
          formulaTitle: 'Algoritmo de Blindagem Orçamentária',
          formulaMath: 'Meta = CustoEssencial * 6',
          formulaExplanation: 'Alocação exclusiva em ativos pós-fixados com liquidez D+0 indexados a 100% do CDI/Selic.',
        };
      case 4:
        return {
          toolId: 4,
          toolName: 'Amortização de Dívidas (Sistema Price)',
          parameters: [
            { label: 'Valor Financiado', value: `R$ ${loanAmount.toLocaleString('pt-BR')}` },
            { label: 'Taxa CET Anual', value: `${loanRate}% a.a.` },
            { label: 'Prazo Contratual', value: `${loanYears} Anos (${loanYears * 12} Meses)` },
          ],
          metrics: [
            { label: 'Parcela Mensal', value: `R$ ${safeNumber(pmt).toLocaleString('pt-BR')}`, highlight: true },
            { label: 'Custo Total', value: `R$ ${(pmt * loanYears * 12).toLocaleString('pt-BR')}` },
            { label: 'Juros Totais', value: `R$ ${safeNumber(totalInterest).toLocaleString('pt-BR')}`, badge: 'Custo Efetivo' },
          ],
          formulaTitle: 'Modelo de Amortização Uniforme (Price)',
          formulaMath: 'PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]',
          formulaExplanation: 'Parcelas constantes com amortização crescente e saldo de juros decrescente período a período.',
        };
      case 5:
        return {
          toolId: 5,
          toolName: 'Planejamento de Independência Financeira',
          parameters: [
            { label: 'Patrimônio Atual', value: `R$ ${currentWealth.toLocaleString('pt-BR')}` },
            { label: 'Meta Patrimonial', value: `R$ ${targetWealth.toLocaleString('pt-BR')}` },
            { label: 'Aporte Mensal', value: `R$ ${wealthContribution.toLocaleString('pt-BR')}` },
            { label: 'Taxa Real Líquida', value: `${wealthRate}% a.a.` },
          ],
          metrics: [
            { label: 'Prazo Estimado', value: `${safeNumber(yearsToTarget).toFixed(1)} Anos`, highlight: true },
            { label: 'Meses Restantes', value: `${Math.round(remainingMonths)} Meses` },
            { label: 'Meta de Chegada', value: `R$ ${targetWealth.toLocaleString('pt-BR')}` },
          ],
          formulaTitle: 'Duração para Independência Financeira',
          formulaMath: 'n = ln((VF*i + PMT) / (VP*i + PMT)) / ln(1 + i)',
          formulaExplanation: 'Resolução analítica logarítmica da equação de anuidade composta para tempo de capitalização.',
        };
      case 6:
      default:
        return {
          toolId: 6,
          toolName: `Alocação Institucional: ${currentStrategy.title}`,
          parameters: [
            { label: 'Estratégia Selecionada', value: currentStrategy.title },
            { label: 'Referência Gestor / Teoria', value: currentStrategy.referenceAuthor },
            { label: 'Montante a Alocar', value: `R$ ${safeNumber(aiAmount).toLocaleString('pt-BR')}` },
            { label: 'Perfil de Risco', value: currentStrategy.riskProfile },
          ],
          metrics: [
            { label: 'Retorno Real Esperado', value: currentStrategy.expectedRealReturn, highlight: true, badge: 'Acima da Inflação' },
            { label: 'Volatilidade Anual', value: currentStrategy.volatilityEstimate },
            { label: 'Índice de Sharpe', value: currentStrategy.sharpeEstimate.toFixed(2), highlight: true, badge: 'Excelente' },
            { label: 'Rebalanceamento', value: currentStrategy.rebalanceBand },
          ],
          formulaTitle: 'Otimização de Portfólio Institucional (Fronteira Eficiente & Paridade de Risco)',
          formulaMath: 'max Sharpe = (E[R_p] - R_f) / sigma_p  onde sigma_p = sqrt(w^T * Sigma * w)',
          formulaExplanation: 'Alocação multissetorial calibrada para maximizar o retorno excedente por unidade de volatilidade suportada, aplicando restrições de liquidez e isenção fiscal.',
          projections: allocatedAssets.map(a => ({
            period: `${a.percentage}%`,
            invested: a.name,
            interest: `R$ ${safeNumber(a.amount).toLocaleString('pt-BR')}`,
            total: a.recommendedInstruments.slice(0, 2).join(' / '),
            detail: `${a.taxStatus} • ${a.liquidity}`
          })),
          recommendations: [
            `Tese Institucional: ${currentStrategy.thesis}`,
            `Gatilho de Rebalanceamento: ${currentStrategy.rebalanceBand}. Priorizar compras com novos proventos em classes desvalorizadas.`,
            'Aderência Fiscal: Manter foco em instrumentos isentos de Imposto de Renda e títulos soberanos de longo prazo.',
          ],
        };
      case 7:
        return {
          toolId: 7,
          toolName: 'Agente de IA Financeiro Pessoal (Agent-S Trajetória 15 Anos)',
          parameters: [
            { label: 'Capital Inaugural', value: 'R$ 1.000,00' },
            { label: 'Meta de Médio Prazo', value: 'Multiplicação de 5x a 8x' },
            { label: 'Meta de Longo Prazo', value: 'US$ 2.000,00 por semana' },
            { label: 'Aporte Trimestral Crescente', value: '+R$ 150 a R$ 2.000/trimestre' },
            { label: 'Alocação Proventos', value: '20% Pessoal / 25% Negócios / 40% Ações / 15% Hedge' },
          ],
          metrics: [
            { label: 'Alvo Patrimonial Global', value: 'US$ 2.600.000,00', highlight: true, badge: 'SWR 4% Trinity' },
            { label: 'Horizonte de Escala', value: '15 Anos (Curto, Médio e Longo Prazo)' },
            { label: 'Paradigma Arquitetural', value: 'Agent-S Hierarchical Planner', highlight: true, badge: 'MOSC-ZYC' },
          ],
          formulaTitle: 'Simulação Estocástica de Trajetória Patrimonial & Safe Withdrawal Rate',
          formulaMath: 'W_{t+1} = (W_t + PMT_t) * (1 + R_{real, t})  onde  PMT_{t+1} = PMT_t + Delta_{step}',
          formulaExplanation: 'Projeção estocástica com ajuste dinâmico de poder de compra pela Paridade de Poder de Compra (PPP), desvio padrão de volatilidade e cone de incerteza Monte Carlo P10-P90.',
          recommendations: [
            'Fase 1 (Ano 1): Foco absoluto no hábito de aporte e preservação do principal inicial de R$ 1.000.',
            'Fase 2 (Anos 2 a 5): Reinvestimento agressivo para capturar a multiplicação de 5x a 8x.',
            'Fase 3 (Anos 6 a 15): Dolarização progressiva da carteira até 85% para sustentar retiradas em moeda forte.',
          ],
        };
    }
  };

  // Global Keyboard Shortcuts (Save state)
  useEffect(() => {
    const handleGlobalSaveTrigger = () => {
      const toolMap: Record<number, { id: string; name: string; data: any }> = {
        1: { id: '1', name: 'Diagnóstico Financeiro', data: { income, expenses, freeCashFlow, savingsRate } },
        2: { id: '2', name: 'Juros Compostos', data: { savings, monthlyContribution, interestRate, years } },
        3: { id: '3', name: 'Reserva de Emergência', data: { income, expenses } },
        4: { id: '4', name: 'Amortização Price', data: { loanAmount, loanRate, loanYears } },
        5: { id: '5', name: 'Independência Financeira', data: { currentWealth, targetWealth, wealthContribution, wealthRate } },
        6: { id: '6', name: 'Alocação IA', data: { aiProfile, aiAmount } },
        7: { id: '7', name: 'Agente de IA Pessoal', data: { status: 'active_cockpit' } },
      };

      const current = toolMap[selectedService] || toolMap[1];
      const rawToken = localStorage.getItem('zyc_auth_token');
      const isLoggedIn = Boolean(rawToken && rawToken !== 'null' && rawToken !== 'undefined' && rawToken.trim() !== '');
      if (isLoggedIn) {
        saveSimulationToCloud(current.id, current.name, current.data);
      } else {
        handleLocalSave(current.id, current.name, current.data);
      }
    };

    window.addEventListener('zyc_save_state', handleGlobalSaveTrigger);
    return () => window.removeEventListener('zyc_save_state', handleGlobalSaveTrigger);
  }, [selectedService, income, expenses, freeCashFlow, savingsRate, savings, monthlyContribution, interestRate, years, loanAmount, loanRate, loanYears, currentWealth, targetWealth, wealthContribution, wealthRate, aiProfile, aiAmount]);

  return (
    <div className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tight">Motores <span className="text-[#1A1F71]">Matemáticos.</span></h2>
          <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto font-light">Seu planejamento financeiro executado no seu navegador. Nossos simuladores rodam localmente para garantir sua privacidade.</p>
          <div className="mt-4 text-xs font-bold tracking-widest text-[#1A1F71] uppercase bg-[#1A1F71]/5 inline-block px-4 py-1.5 rounded-full border border-[#1A1F71]/10">Dica: Use Ctrl+S para salvar rapidamente</div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-zinc-100 p-1 rounded-xl inline-flex text-sm font-semibold">
            <button 
              onClick={() => { setActiveCategory('free'); trackClick('Tab - Free Tools'); }}
              className={`px-6 py-2.5 rounded-lg transition-all ${activeCategory === 'free' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Ferramentas Gratuitas (MVP)
            </button>
            <button 
              onClick={() => { setActiveCategory('premium'); trackClick('Tab - Premium Tools (Paywall)'); }}
              className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 ${activeCategory === 'premium' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Premium <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CROSS-CALCULATOR SYNCHRONIZATION HUB (REACT CONTEXT API) */}
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-emerald-50/70 border border-indigo-100 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1A1F71] text-white rounded-xl shadow-xs">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                  Estado Compartilhado (React Context)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sincronizado
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Renda, despesas, aportes e patrimônio fluem entre Diagnóstico, Juros Compostos, Reserva, Dívidas e Alocação IA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {freeCashFlow > 0 && (
              <button
                type="button"
                onClick={applySurplusToInvestments}
                className="text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={`Aplica o fluxo livre mensal de ${safeNumber(freeCashFlow).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} nos aportes`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Aportar Sobra ({safeNumber(freeCashFlow).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})
              </button>
            )}

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('zyc_toggle_split_view'))}
              className="text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Comparar este cenário com snapshots salvos lado a lado"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              Comparar Cenários (Split-View)
            </button>

            <button
              type="button"
              onClick={syncAllCalculators}
              className="text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Sincroniza os dados inseridos em todas as calculadoras"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              Sincronizar Motores
            </button>

            <button
              type="button"
              onClick={resetToDefaults}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 bg-transparent hover:bg-zinc-100 px-2.5 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Restaurar valores padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            {services.filter(s => activeCategory === 'premium' ? true : s.category === 'free').map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service.id);
                  if (service.locked) {
                    trackClick(`Locked Tool - ${service.name}`);
                  }
                }}
                className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-4 
                  ${selectedService === service.id ? 'bg-[#1A1F71] border-[#1A1F71] text-white shadow-md transform scale-[1.02]' : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'}
                  ${service.locked && selectedService !== service.id ? 'opacity-70 bg-zinc-50' : ''}
                `}
              >
                <div className={`p-2 rounded-xl ${selectedService === service.id ? 'bg-white/20' : 'bg-zinc-100'}`}>
                  <service.icon className={`w-5 h-5 ${selectedService === service.id ? 'text-white' : 'text-[#1A1F71]'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    {service.name}
                    {service.locked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                  </h3>
                  <p className={`text-xs mt-1 ${selectedService === service.id ? 'text-blue-100' : 'text-zinc-500'}`}>
                    {service.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="w-full lg:w-2/3">
            <div id="print-area" className="bg-white border border-zinc-200 p-6 sm:p-10 rounded-3xl shadow-sm min-h-[500px]">
              
              {selectedService === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-lg"><Activity className="w-6 h-6 text-emerald-600" /></div>
                      <h2 className="text-2xl font-black text-zinc-900">Diagnóstico Financeiro</h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {openFinanceSynced && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          Sincronizado!
                        </span>
                      )}
                      <button 
                        onClick={() => {
                          setIncome(15000);
                          setExpenses(9500);
                          setOpenFinanceSynced(true);
                          setTimeout(() => setOpenFinanceSynced(false), 3500);
                        }}
                        className="text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Database className="w-3 h-3" /> Conectar Banco
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Renda Mensal (R$)</label>
                      <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} onBlur={() => trackFieldFill('Renda Mensal')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Despesas Mensais (R$)</label>
                      <input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} onBlur={() => trackFieldFill('Despesas Mensais')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Reserva Atual (R$)</label>
                      <input type="number" value={savings} onChange={(e) => setSavings(Number(e.target.value))} onBlur={() => trackFieldFill('Reserva Atual')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                  </div>

                  <div className="bg-zinc-950 text-white rounded-2xl p-6 sm:p-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Diagnóstico do Fluxo de Caixa</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <div className="text-2xl sm:text-3xl font-black">{freeCashFlow >= 0 ? '+' : ''}{safeNumber(freeCashFlow).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <div className="text-xs text-zinc-500 mt-2">Disponível para investir</div>
                      </div>
                      <div>
                        <div className={`text-2xl sm:text-3xl font-black ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {safeNumber(savingsRate).toFixed(1)}%
                        </div>
                        <div className="text-xs text-zinc-500 mt-2">Taxa de Poupança (Alvo: &gt; 20%)</div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-blue-400">
                          {calculateEmergencyFundMonths(savings, expenses).toFixed(1)} <span className="text-base font-normal text-zinc-400">meses</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-2">Cobertura de Reserva (Alvo: 6m)</div>
                      </div>
                    </div>
                  </div>
                  
                  <SaveButton toolId="1" name="Diagnóstico" data={{ income, expenses, freeCashFlow, savingsRate }} />
                  <EmailCapture toolName="Diagnóstico Financeiro" resultData={{ income, expenses, freeCashFlow, savingsRate }} />
                  <div className="mt-4"><ShareButtons url="https://zyconomes.com.br/#ferramentas" title="Zyconomes - Diagnóstico Financeiro" /></div>
                </div>
              )}

              {selectedService === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
                    <h2 className="text-2xl font-black text-zinc-900">Juros Compostos</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Valor Inicial (R$)</label>
                      <input type="number" value={savings} onChange={(e) => setSavings(Number(e.target.value))} onBlur={() => trackFieldFill('Valor Inicial')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Aporte Mensal (R$)</label>
                      <input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} onBlur={() => trackFieldFill('Aporte Mensal')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Taxa de Juros Anual (%)</label>
                      <input type="number" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} onBlur={() => trackFieldFill('Taxa de Juros')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Tempo (Anos)</label>
                      <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} onBlur={() => trackFieldFill('Tempo em Anos')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                  </div>

                  <div className="bg-[#1A1F71] text-white rounded-t-2xl p-6 sm:p-8">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-2">Montante Final Estimado</h3>
                     <div className="text-4xl font-black mb-6">{safeNumber(compoundResult).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                     <div className="text-xs text-blue-200 flex items-center gap-2">
                        <Info className="w-4 h-4" /> 
                        Sem considerar inflação ou impostos (IR).
                     </div>
                  </div>
                  <div className="bg-white border-l border-r border-b border-zinc-200 rounded-b-2xl p-6 mb-8 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Projeção de Crescimento (Anos)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={compoundChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1A1F71" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#1A1F71" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                          <YAxis tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} width={60} />
                          <Tooltip 
                            formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            labelFormatter={(label) => `Ano ${label}`}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="Total" stroke="#1A1F71" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                          <Area type="monotone" dataKey="Investido" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInvestido)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <SaveButton toolId="2" name="Juros Compostos" data={{ savings, monthlyContribution, interestRate, years }} />
                  <EmailCapture toolName="Juros Compostos" resultData={{ savings, monthlyContribution, interestRate, years, compoundResult }} />
                </div>
              )}
              
              {/* Other tools follow the exact same pattern, abbreviated for brevity but keeping functionality intact. */}
              {selectedService === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-amber-100 p-2 rounded-lg"><ShieldCheck className="w-6 h-6 text-amber-600" /></div>
                    <h2 className="text-2xl font-black text-zinc-900">Reserva de Emergência</h2>
                  </div>
                  {/* ... inputs for Tool 3 ... */}
                  <div className="grid grid-cols-1 gap-6 mb-8">
                     <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Custo Essencial Mensal (R$)</label>
                      <input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} onBlur={() => trackFieldFill('Custo Mensal (RE)')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                     <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Valor Já Guardado (R$)</label>
                      <input type="number" value={savings} onChange={(e) => setSavings(Number(e.target.value))} onBlur={() => trackFieldFill('Valor Guardado (RE)')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                  </div>
                  <div className="bg-zinc-950 text-white rounded-2xl p-6 sm:p-8">
                     <div className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Meta de Segurança (6 Meses)</div>
                     <div className="text-3xl font-black mb-4">{safeNumber(emergencyReserveTarget).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  </div>
                  <SaveButton toolId="3" name="Reserva" data={{ income, expenses }} />
                  <EmailCapture toolName="Reserva de Emergência" resultData={{ expenses, savings, emergencyReserveTarget }} />
                </div>
              )}

              {selectedService === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <DebtPayoffAccelerator 
                    initialLoanAmount={loanAmount}
                    initialLoanRate={loanRate}
                    initialLoanYears={loanYears}
                    onSyncContext={(amt, rate, yrs) => {
                      setLoanAmount(amt);
                      setLoanRate(rate);
                      setLoanYears(yrs);
                    }}
                  />
                  <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <SaveButton toolId="4" name="Acelerador de Financiamento & Dívidas" data={{ loanAmount, loanRate, loanYears, pmt, totalInterest }} />
                    <EmailCapture toolName="Acelerador de Quitação de Dívidas" resultData={{ loanAmount, loanRate, loanYears, pmt, totalInterest }} />
                  </div>
                </div>
              )}

              {selectedService === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg"><LucidePieChart className="w-6 h-6 text-purple-600" /></div>
                      <h2 className="text-2xl font-black text-zinc-900">Independência Financeira (Fator Tempo)</h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTargetWealth(Math.max(100000, expenses * 12 * 25))}
                      className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Define meta como 300 vezes suas despesas mensais (Regra dos 4%)"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Regra 4%: R$ {Math.round(Math.max(100000, expenses * 12 * 25)).toLocaleString('pt-BR')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Patrimônio Atual (R$)</label>
                      <input type="number" value={currentWealth} onChange={(e) => setCurrentWealth(Number(e.target.value))} onBlur={() => trackFieldFill('Patrimônio Atual')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Meta Patrimonial (R$)</label>
                      <input type="number" value={targetWealth} onChange={(e) => setTargetWealth(Number(e.target.value))} onBlur={() => trackFieldFill('Meta Patrimônio')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Aporte Mensal (R$)</label>
                      <input type="number" value={wealthContribution} onChange={(e) => setWealthContribution(Number(e.target.value))} onBlur={() => trackFieldFill('Aporte Independência')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Taxa Real Líquida Anual (%)</label>
                      <input type="number" value={wealthRate} onChange={(e) => setWealthRate(Number(e.target.value))} onBlur={() => trackFieldFill('Taxa Independência')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                  </div>

                  <div className="bg-purple-950 text-white rounded-2xl p-6 sm:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-purple-300 mb-2">Tempo Restante</div>
                        <div className="text-3xl font-black text-white">{safeNumber(yearsToTarget).toFixed(1)} Anos</div>
                        <div className="text-xs text-purple-300 mt-1">~{Math.round(remainingMonths)} meses de acumulação</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-purple-300 mb-2">Meta Patrimonial</div>
                        <div className="text-2xl sm:text-3xl font-black text-purple-200">{safeNumber(targetWealth).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</div>
                        <div className="text-xs text-purple-300 mt-1">Capital gerador de renda</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-purple-300 mb-2">Renda Passiva Mensal (4%)</div>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-400">{safeNumber((targetWealth * 0.04) / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</div>
                        <div className="text-xs text-purple-300 mt-1">Retirada segura perpétua</div>
                      </div>
                    </div>
                  </div>
                  <SaveButton toolId="5" name="Independência Financeira" data={{ currentWealth, targetWealth, wealthContribution, wealthRate, yearsToTarget, remainingMonths }} />
                  <EmailCapture toolName="Simulador de Patrimônio" resultData={{ currentWealth, targetWealth, wealthContribution, wealthRate, yearsToTarget, remainingMonths }} />
                </div>
              )}

              {selectedService === 6 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                  {/* Header */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-700">
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                              Alocação de Ativos & Setup Institucional
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Padrão High Net Worth
                            </span>
                          </div>
                          <p className="text-sm text-zinc-500 mt-0.5">
                            Metodologias consagradas por Family Offices, Fundos Soberanos e Endowments para preservação e multiplicação real de capital.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center gap-2 p-1.5 bg-zinc-100 rounded-2xl w-full sm:w-fit border border-zinc-200/80">
                    <button
                      type="button"
                      onClick={() => setSetupMode('strategies')}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        setupMode === 'strategies'
                          ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      Modelos de Referência Institucional
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupMode('profiles')}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        setupMode === 'profiles'
                          ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      Perfis por Tolerância a Risco
                    </button>
                  </div>

                  {/* Setup Seletivo: Institutional Models Grid */}
                  {setupMode === 'strategies' ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-indigo-600" />
                          Selecione o Setup Estratégico
                        </label>
                        <span className="text-xs text-zinc-400 font-medium">6 Modelos Selecionados</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {INSTITUTIONAL_STRATEGIES.map((strategy) => {
                          const isSelected = currentStrategy.id === strategy.id;
                          return (
                            <button
                              key={strategy.id}
                              type="button"
                              onClick={() => {
                                setSelectedStrategyId(strategy.id);
                                trackClick(`Estratégia: ${strategy.title}`);
                              }}
                              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20'
                                  : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/50'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200">
                                    {strategy.riskProfile}
                                  </span>
                                  {isSelected && (
                                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-xs">
                                      <Check className="w-3 h-3" /> Ativo
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-bold text-zinc-900 text-sm leading-snug">
                                  {strategy.title}
                                </h3>
                                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                                  {strategy.subtitle}
                                </p>
                              </div>
                              <div className="mt-3 pt-3 border-t border-zinc-200/70 flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-medium text-[11px]">
                                  {strategy.referenceAuthor.split('(')[0].trim()}
                                </span>
                                <span className="font-black text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px]">
                                  {strategy.expectedRealReturn}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                        Perfil por Tolerância a Risco (Metodologia CVM / Anbima)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(['Conservador', 'Moderado', 'Agressivo'] as const).map((profile) => {
                          const isSelected = aiProfile === profile;
                          return (
                            <button
                              key={profile}
                              type="button"
                              onClick={() => {
                                setAiProfile(profile);
                                trackClick(`Perfil: ${profile}`);
                              }}
                              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20'
                                  : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-zinc-900">{profile}</h4>
                                {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                              </div>
                              <p className="text-xs text-zinc-500">
                                {profile === 'Conservador' && 'Foco em soberania cambial, liquidez e proteção patrimonial.'}
                                {profile === 'Moderado' && 'Equilíbrio ótimo entre renda passiva isenta e crescimento em moeda forte.'}
                                {profile === 'Agressivo' && 'Máxima exposição à convexidade global e retornos reais de longo prazo.'}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Input de Montante a Alocar com Atalhos */}
                  <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                          Montante Total a Alocar (R$)
                        </label>
                        <span className="text-xs text-zinc-500">
                          Capital a ser distribuído rigorosamente entre as classes da estratégia.
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Volume Total</span>
                        <span className="text-xl font-black text-indigo-900 font-mono">
                          {safeNumber(aiAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <div className="relative w-full">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">R$</span>
                        <input
                          type="number"
                          value={aiAmount}
                          onChange={(e) => setAiAmount(Math.max(1000, Number(e.target.value) || 0))}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 bg-white font-mono text-lg font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="100000"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto shrink-0">
                        {[
                          { label: '+10k', val: 10000, add: true },
                          { label: '+50k', val: 50000, add: true },
                          { label: '+100k', val: 100000, add: true },
                          { label: '500k', val: 500000, add: false },
                          { label: '1 Milhão', val: 1000000, add: false },
                        ].map((btn, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (btn.add) {
                                setAiAmount(aiAmount + btn.val);
                              } else {
                                setAiAmount(btn.val);
                              }
                            }}
                            className="px-2.5 py-2 text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Key Institutional Metrics Banner */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Retorno Real Alvo
                      </div>
                      <div className="text-xl font-black text-indigo-700">
                        {currentStrategy.expectedRealReturn}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">Acima da Inflação Oficial</div>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Volatilidade Projetada
                      </div>
                      <div className="text-xl font-black text-zinc-900">
                        {currentStrategy.volatilityEstimate}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">Desvio padrão anualizado</div>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Índice de Sharpe
                      </div>
                      <div className="text-xl font-black text-emerald-600 flex items-center gap-1">
                        {currentStrategy.sharpeEstimate.toFixed(2)}
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          Alto
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">Retorno / Risco Suportado</div>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Rebalanceamento
                      </div>
                      <div className="text-sm font-bold text-zinc-800 line-clamp-1">
                        {currentStrategy.rebalanceBand}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">Gatilho disciplinado</div>
                    </div>
                  </div>

                  {/* Visual Distribution & Strategic Thesis */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left: Interactive Donut Chart */}
                    <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            Composição da Carteira
                          </h3>
                          <span className="text-xs text-zinc-500 font-bold">
                            {allocatedAssets.length} Classes
                          </span>
                        </div>

                        <div className="h-56 w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={allocatedAssets}
                                dataKey="percentage"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={85}
                                paddingAngle={3}
                              >
                                {allocatedAssets.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: any, name: any, item: any) => {
                                  const payload = item?.payload;
                                  const valBRL = payload ? safeNumber(payload.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
                                  return [`${value}% (${valBRL})`, name];
                                }}
                                contentStyle={{
                                  backgroundColor: '#18181b',
                                  borderColor: '#27272a',
                                  borderRadius: '0.75rem',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</span>
                            <span className="text-sm font-black text-zinc-800">100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Legend */}
                      <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-2 text-xs">
                        {allocatedAssets.map((asset, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                            <span className="text-zinc-600 font-medium truncate text-[11px]">{asset.name}</span>
                            <span className="text-zinc-900 font-bold text-[11px] ml-auto">{asset.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Institutional Thesis & Strategy Rationale */}
                    <div className="lg:col-span-7 bg-zinc-900 text-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-800 text-indigo-300 px-3 py-1 rounded-full border border-zinc-700">
                            Tese Estratégica do Modelo
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            {currentStrategy.referenceAuthor}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3">
                          {currentStrategy.title}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed mb-6 font-normal">
                          {currentStrategy.thesis}
                        </p>

                        <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700/60 mb-4">
                          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                            Perfil Ideal de Alocação
                          </div>
                          <p className="text-xs text-zinc-300">
                            {currentStrategy.bestFor}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Blindagem contra cauda e inflação crônica</span>
                        </div>
                        <button
                          type="button"
                          onClick={fetchAIPortfolio}
                          disabled={aiLoading}
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {aiLoading ? 'Processando Diagnóstico...' : 'Gerar Diagnóstico IA'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Qualitative Diagnostic Panel (when triggered) */}
                  {aiDiagnostic && (
                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-700" />
                          <h4 className="font-bold text-sm text-indigo-950 uppercase tracking-wider">
                            Diagnóstico Qualitativo de Alocação (IA Institucional)
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                          {aiDiagnostic.source}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                          <span className="font-bold text-zinc-900 block mb-1 text-[11px] uppercase tracking-wide">
                            Sensibilidade Macroeconômica
                          </span>
                          <p className="text-zinc-600 leading-relaxed">
                            {aiDiagnostic.macroSensitivity}
                          </p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                          <span className="font-bold text-zinc-900 block mb-1 text-[11px] uppercase tracking-wide">
                            Diretriz de Rebalanceamento
                          </span>
                          <p className="text-zinc-600 leading-relaxed">
                            {aiDiagnostic.rebalanceAdvice}
                          </p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                          <span className="font-bold text-zinc-900 block mb-1 text-[11px] uppercase tracking-wide">
                            Eficiência Fiscal & Tributária
                          </span>
                          <p className="text-zinc-600 leading-relaxed">
                            {aiDiagnostic.taxEfficiencyNote}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grid das Formas Investimentais e Classes de Ativos */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-black text-zinc-900">
                          Detalhamento das Formas Investimentais (Classes de Ativos)
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Instrumentos práticos recomendados pelo modelo para execução com máxima aderência e liquidez.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-zinc-400 hidden sm:inline">
                        Valores calculados sobre {safeNumber(aiAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allocatedAssets.map((asset, index) => (
                        <div
                          key={index}
                          className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top: Share, Name, Nominal Value */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-12 h-12 rounded-xl text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs"
                                  style={{ backgroundColor: asset.color }}
                                >
                                  {asset.percentage}%
                                </div>
                                <div>
                                  <h4 className="font-bold text-zinc-900 text-sm">{asset.name}</h4>
                                  <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                                    {asset.category}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Alocação Exata</span>
                                <span className="font-mono font-black text-base text-zinc-900">
                                  {safeNumber(asset.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            </div>

                            {/* Rationale */}
                            <p className="text-xs text-zinc-600 leading-relaxed mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                              {asset.rationale}
                            </p>
                          </div>

                          {/* Instrumentos Recomendados e Informações Operacionais */}
                          <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                                Instrumentos Práticos no Brasil & Exterior:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {asset.recommendedInstruments.map((inst, i) => (
                                  <span
                                    key={i}
                                    className="bg-indigo-50 text-indigo-900 font-semibold px-2 py-0.5 rounded-md text-[11px] border border-indigo-100"
                                  >
                                    {inst}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500">
                              <span><strong>Tributação:</strong> {asset.taxStatus}</span>
                              <span><strong>Liquidez:</strong> {asset.liquidity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions & PDF Export */}
                  <SaveButton
                    toolId="6"
                    name={`Alocação: ${currentStrategy.title}`}
                    data={{
                      strategyId: currentStrategy.id,
                      strategyTitle: currentStrategy.title,
                      amount: aiAmount,
                      profile: currentStrategy.riskProfile,
                      allocatedAssets,
                      aiDiagnostic
                    }}
                    customReport={getActiveReportData()}
                  />
                  <EmailCapture
                    toolName={`Alocação Institucional: ${currentStrategy.title}`}
                    resultData={{
                      strategyId: currentStrategy.id,
                      strategyTitle: currentStrategy.title,
                      amount: aiAmount,
                      expectedRealReturn: currentStrategy.expectedRealReturn,
                      sharpeRatio: currentStrategy.sharpeEstimate,
                      allocatedAssets
                    }}
                  />
                </div>
              )}

              {selectedService === 7 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <PersonalAgentCockpit />
                </div>
              )}

              {activeTool.locked && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 py-12 px-4 text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Lock className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 rounded-full">
                    Exclusivo Premium
                  </span>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-4 mb-2">
                    {activeTool.name}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-8">
                    {activeTool.description} Desbloqueie acesso imediato a motores de valuation institucionais, otimização fiscal e IA generativa com o Zyconomes Pro.
                  </p>
                  <PremiumButton label="Desbloquear Todas as Ferramentas — R$ 19,90/mês" />
                  <div className="mt-4 text-xs text-zinc-400">
                    Cancele a qualquer momento. Sem fidelidade.
                  </div>
                </div>
              )}

              {/* Botão Global de Disparo de Analytics de Cálculo (Engajamento Intencional) */}
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => {
                    trackCalculation();
                    trackSimulationCompleted(activeTool.name, { toolId: activeTool.id, origin: 'manual_register' });
                  }}
                  className="text-xs font-bold text-zinc-400 hover:text-[#1A1F71] transition-colors uppercase tracking-widest"
                >
                  Registrar Simulação Internamente
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
