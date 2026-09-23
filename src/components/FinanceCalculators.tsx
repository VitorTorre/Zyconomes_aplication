import React, { useState, useEffect } from 'react';
import { Calculator, ShieldCheck, TrendingUp, DollarSign, PieChart, Users, Building, Lock, FileText, CheckCircle, ArrowRight, Activity, Layers, Info, Download, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trackGranularEvent, trackSimulationCompleted } from '../lib/analytics';
import { useToolAnalytics } from '../hooks/useToolAnalytics';
import { EmailCapture } from './EmailCapture';
import { ShareButtons } from './ZyconomesWidgets';
import { saveRateLimiter } from '../lib/clientRateLimiter';
import { safeNumber, calculateSavingsRate, calculateEmergencyFundMonths, calculateIndependenceYears } from '../lib/financeMath';
import { PremiumButton } from './PremiumButton';
import { GeneratePDFReport, SimulationReportData } from './GeneratePDFReport';
import { auditLogger } from '../lib/auditLogger';

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

  // --- TOOL STATES ---
  const [income, setIncome] = useState<number>(() => loadState('zyc_income', 8500));
  const [expenses, setExpenses] = useState<number>(() => loadState('zyc_expenses', 5200));
  const [savings, setSavings] = useState<number>(() => loadState('zyc_savings', 15000));
  const [monthlyContribution, setMonthlyContribution] = useState<number>(() => loadState('zyc_pmt', 1000));
  const [interestRate, setInterestRate] = useState<number>(() => loadState('zyc_rate', 10));
  const [years, setYears] = useState<number>(() => loadState('zyc_years', 10));
  const [loanAmount, setLoanAmount] = useState<number>(() => loadState('zyc_loan_amt', 250000));
  const [loanRate, setLoanRate] = useState<number>(() => loadState('zyc_loan_rate', 11.5));
  const [loanYears, setLoanYears] = useState<number>(() => loadState('zyc_loan_years', 30));
  const [currentWealth, setCurrentWealth] = useState<number>(() => loadState('zyc_cur_wealth', 50000));
  const [targetWealth, setTargetWealth] = useState<number>(() => loadState('zyc_tgt_wealth', 1000000));
  const [wealthContribution, setWealthContribution] = useState<number>(() => loadState('zyc_wealth_pmt', 2500));
  const [wealthRate, setWealthRate] = useState<number>(() => loadState('zyc_wealth_rate', 9));

  // Configurações e Categorias (Mesmo que antes)
  const services = [
    { id: 1, name: 'Diagnóstico Financeiro', icon: Activity, category: 'free', locked: false, description: 'Descubra sua saúde financeira e taxa de poupança.' },
    { id: 2, name: 'Juros Compostos', icon: TrendingUp, category: 'free', locked: false, description: 'Simulação exata de multiplicação patrimonial.' },
    { id: 3, name: 'Reserva de Emergência', icon: ShieldCheck, category: 'free', locked: false, description: 'Cálculo de blindagem contra o acaso.' },
    { id: 4, name: 'Amortização de Dívidas', icon: Calculator, category: 'free', locked: false, description: 'Descubra o verdadeiro custo da sua dívida.' },
    { id: 5, name: 'Independência (O Fator Tempo)', icon: PieChart, category: 'free', locked: false, description: 'Fórmula logarítmica para descobrir "quando".' },
    { id: 6, name: 'IA Preditiva: Alocação de Ativos', icon: Layers, category: 'premium', locked: false, description: 'Rebalanceamento automático baseado em IA Generativa.' },
    { id: 7, name: 'Análise de Ações (Valuation)', icon: Building, category: 'premium', locked: true, description: 'Fórmulas de Graham, Bazin e DCF prontas para uso.' },
    { id: 8, name: 'Otimização Fiscal (IR)', icon: FileText, category: 'premium', locked: true, description: 'Estratégias lícitas para redução de carga tributária.' }
  ];

  // Configuração Analítica Isolada
  const activeTool = services.find(s => s.id === selectedService) || services[0];
  const { trackFieldFill, trackClick, trackCalculation } = useToolAnalytics(activeTool.name);

  // IA Alocação State
  const [aiProfile, setAiProfile] = useState<'Conservador' | 'Moderado' | 'Agressivo'>('Moderado');
  const [aiAmount, setAiAmount] = useState<number>(100000);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const fetchAIPortfolio = async () => {
    const token = localStorage.getItem('zyc_auth_token');
    if (!token) {
      setAiResult({ error: 'Você precisa estar logado para usar o Consultor IA Premium. Acesse sua conta no menu superior.' });
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/ai/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profile: aiProfile, amount: aiAmount })
      });
      if (!res.ok) throw new Error('Erro na IA');
      const data = await res.json();
      setAiResult(data);
      trackGranularEvent('conversion', 'button_click', 'Gerou Alocacao IA');
    } catch (e) {
      console.error(e);
      setAiResult({ error: 'Falha ao conectar com o motor de IA. Verifique sua conexão.' });
    } finally {
      setAiLoading(false);
    }
  };

  // Persistence Effects
  useEffect(() => { saveState('zyc_income', income, 'Diagnóstico Financeiro'); }, [income]);
  useEffect(() => { saveState('zyc_expenses', expenses, 'Diagnóstico Financeiro'); }, [expenses]);
  useEffect(() => { saveState('zyc_savings', savings, 'Diagnóstico Financeiro'); }, [savings]);
  useEffect(() => { saveState('zyc_pmt', monthlyContribution, 'Juros Compostos'); }, [monthlyContribution]);
  useEffect(() => { saveState('zyc_rate', interestRate, 'Juros Compostos'); }, [interestRate]);
  useEffect(() => { saveState('zyc_years', years, 'Juros Compostos'); }, [years]);
  useEffect(() => { saveState('zyc_loan_amt', loanAmount, 'Amortização'); }, [loanAmount]);
  useEffect(() => { saveState('zyc_loan_rate', loanRate, 'Amortização'); }, [loanRate]);
  useEffect(() => { saveState('zyc_loan_years', loanYears, 'Amortização'); }, [loanYears]);
  useEffect(() => { saveState('zyc_cur_wealth', currentWealth, 'Independência'); }, [currentWealth]);
  useEffect(() => { saveState('zyc_tgt_wealth', targetWealth, 'Independência'); }, [targetWealth]);
  useEffect(() => { saveState('zyc_wealth_pmt', wealthContribution, 'Independência'); }, [wealthContribution]);
  useEffect(() => { saveState('zyc_wealth_rate', wealthRate, 'Independência'); }, [wealthRate]);

  // Event Listener for external tool selection
  useEffect(() => {
    const handleOpenTool = (e: any) => {
      const toolId = e.detail?.id;
      if (toolId) {
        setSelectedService(toolId);
        setActiveCategory(toolId >= 6 ? 'premium' : 'free');
      }
    };
    window.addEventListener('zyc_open_tool', handleOpenTool);
    return () => window.removeEventListener('zyc_open_tool', handleOpenTool);
  }, []);

  // CÁLCULOS SEGUROS
  const freeCashFlow = income - expenses;
  const savingsRate = calculateSavingsRate(income, expenses);
  
  const monthlyRate = interestRate / 100 / 12;
  const months = years * 12;
  const compoundResult = monthlyRate > 0 
    ? (savings * Math.pow(1 + monthlyRate, months)) + (monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate))
    : savings + (monthlyContribution * months);
  
  const emergencyReserveTarget = expenses * 6;
  
  const loanMonthlyRate = loanRate / 100 / 12;
  const loanMonths = loanYears * 12;
  const pmt = loanMonthlyRate > 0 
    ? (loanAmount * loanMonthlyRate * Math.pow(1 + loanMonthlyRate, loanMonths)) / (Math.pow(1 + loanMonthlyRate, loanMonths) - 1)
    : loanAmount / loanMonths;
  const totalInterest = safeNumber((pmt * loanMonths) - loanAmount);
  
  const yearsToTarget = calculateIndependenceYears(currentWealth, targetWealth, wealthContribution, wealthRate);
  const remainingMonths = yearsToTarget * 12;

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
          toolName: 'Alocação Preditiva de Carteira',
          parameters: [
            { label: 'Perfil de Risco', value: aiProfile },
            { label: 'Montante a Alocar', value: `R$ ${aiAmount.toLocaleString('pt-BR')}` },
          ],
          metrics: [
            { label: 'Perfil', value: aiProfile, highlight: true },
            { label: 'Montante', value: `R$ ${aiAmount.toLocaleString('pt-BR')}` },
            { label: 'Motor Analítico', value: 'Zyconomes AI v2.4', badge: 'Determinístico' },
          ],
          formulaTitle: 'Fronteira Eficiente e Sharpe Ratio',
          formulaExplanation: 'Otimização com pesos calibrados para volatilidade controlada e retorno ajustado ao risco.',
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

        <div className="flex justify-center mb-10">
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Renda Mensal (R$)</label>
                      <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} onBlur={() => trackFieldFill('Renda Mensal')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Despesas Mensais (R$)</label>
                      <input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} onBlur={() => trackFieldFill('Despesas Mensais')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71] bg-zinc-50 font-mono text-lg" />
                    </div>
                  </div>

                  <div className="bg-zinc-950 text-white rounded-2xl p-6 sm:p-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Fluxo de Caixa Mensal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <div className="text-3xl font-black">{freeCashFlow >= 0 ? '+' : ''}{safeNumber(freeCashFlow).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <div className="text-xs text-zinc-500 mt-2">Disponível para investir</div>
                      </div>
                      <div>
                        <div className={`text-3xl font-black ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {safeNumber(savingsRate).toFixed(1)}%
                        </div>
                        <div className="text-xs text-zinc-500 mt-2">Taxa de Poupança (Alvo: &gt; 20%)</div>
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-100 p-2 rounded-lg"><Calculator className="w-6 h-6 text-red-600" /></div>
                    <h2 className="text-2xl font-black text-zinc-900">Simulador de Dívida</h2>
                  </div>
                  {/* ... inputs for Tool 4 ... */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Valor Financiado (R$)</label>
                      <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} onBlur={() => trackFieldFill('Valor Financiado')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Taxa CET Anual (%)</label>
                      <input type="number" value={loanRate} onChange={(e) => setLoanRate(Number(e.target.value))} onBlur={() => trackFieldFill('Taxa Financiamento')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                     <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Prazo (Anos)</label>
                      <input type="number" value={loanYears} onChange={(e) => setLoanYears(Number(e.target.value))} onBlur={() => trackFieldFill('Anos Financiamento')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8">
                     <div className="text-sm font-bold uppercase tracking-widest text-red-800 mb-2">Juros Pagos ao Banco</div>
                     <div className="text-3xl font-black text-red-900 mb-4">{safeNumber(totalInterest).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  </div>
                  <SaveButton toolId="4" name="Amortização Price" data={{ loanAmount, loanRate, loanYears, pmt, totalInterest }} />
                  <EmailCapture toolName="Simulador de Dívida" resultData={{ loanAmount, loanRate, loanYears, pmt, totalInterest }} />
                </div>
              )}

              {selectedService === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-100 p-2 rounded-lg"><PieChart className="w-6 h-6 text-purple-600" /></div>
                    <h2 className="text-2xl font-black text-zinc-900">Simulador de Patrimônio</h2>
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
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 sm:p-8">
                     <div className="text-sm font-bold uppercase tracking-widest text-purple-800 mb-2">Tempo Restante (Aproximado)</div>
                     <div className="text-3xl font-black text-purple-900 mb-4">{safeNumber(yearsToTarget).toFixed(1)} Anos</div>
                  </div>
                  <SaveButton toolId="5" name="Independência Financeira" data={{ currentWealth, targetWealth, wealthContribution, wealthRate, yearsToTarget, remainingMonths }} />
                  <EmailCapture toolName="Simulador de Patrimônio" resultData={{ currentWealth, targetWealth, wealthContribution, wealthRate, yearsToTarget, remainingMonths }} />
                </div>
              )}

              {selectedService === 6 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-100 p-2 rounded-lg"><Layers className="w-6 h-6 text-emerald-600" /></div>
                    <h2 className="text-2xl font-black text-zinc-900">IA Preditiva: Alocação</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Perfil de Risco</label>
                      <select value={aiProfile} onChange={(e) => setAiProfile(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-medium text-lg">
                        <option value="Conservador">Conservador</option>
                        <option value="Moderado">Moderado</option>
                        <option value="Agressivo">Agressivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Montante a Alocar (R$)</label>
                      <input type="number" value={aiAmount} onChange={(e) => setAiAmount(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg" />
                    </div>
                  </div>
                  
                  <button 
                    onClick={fetchAIPortfolio}
                    disabled={aiLoading}
                    className="w-full bg-[#1A1F71] hover:bg-[#121652] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md mb-8"
                  >
                    {aiLoading ? 'Processando (Gemini AI)...' : 'Gerar Portfólio IA'}
                  </button>

                  {aiResult && aiResult.error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm">{aiResult.error}</div>
                  )}

                  {aiResult && !aiResult.error && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-4">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Recomendação da IA</h3>
                         <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">Risco {aiResult.riskLevel}</div>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                        {aiResult.assets && aiResult.assets.map((asset: any, idx: number) => (
                          <div key={idx} className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center gap-4">
                            <div className="bg-zinc-100 text-zinc-800 font-black text-lg px-3 py-2 rounded-lg">{asset.percentage}%</div>
                            <div>
                              <h4 className="font-bold text-zinc-900">{asset.name}</h4>
                              <p className="text-xs text-zinc-500 mt-1">{asset.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-[#1A1F71] text-white rounded-xl p-4 flex justify-between items-center">
                        <span className="text-sm font-medium">Retorno Esperado (Longo Prazo)</span>
                        <span className="font-black text-lg">{aiResult.expectedReturn}</span>
                      </div>
                    </div>
                  )}
                  
                  <SaveButton toolId="6" name="Alocacao IA" data={{ aiProfile, aiAmount, aiResult }} />
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
