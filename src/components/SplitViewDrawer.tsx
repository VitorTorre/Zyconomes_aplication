import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Layers, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft,
  RotateCcw,
  FileText,
  UserCheck
} from 'lucide-react';
import { safeNumber } from '../lib/financeMath';
import { trackGranularEvent } from '../lib/analytics';

export interface SavedSnapshot {
  id: string;
  toolId: string | number;
  name: string;
  data: Record<string, any>;
  savedAt: string;
  userEmail?: string;
}

interface SplitViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeToolName?: string;
  activeData?: Record<string, any>;
  userEmail?: string;
}

// Dicas e legendas explicativas que rotacionam a cada 20 segundos
const ANALYTICAL_TIPS = [
  {
    title: 'Multiplicador de Amortização (SAC vs PRICE)',
    text: 'Indica quantos reais de juros bancários futuros são cancelados para cada R$ 1,00 aportado na amortização do saldo devedor principal.',
    tag: 'Crédito Imobiliário'
  },
  {
    title: 'Taxa de Poupança Efetiva (Savings Rate)',
    text: 'A proporção da sua receita líquida retida para formação de capital. Superar 25% reduz drasticamente o tempo necessário para independência.',
    tag: 'Fluxo de Caixa'
  },
  {
    title: 'Cone de Incerteza Log-Normal (P10 vs P90)',
    text: 'A linha P10 reflete o teste de estresse conservador em mercados adversos, enquanto P90 captura ciclos de forte expansão de liquidez.',
    tag: 'Estocástica'
  },
  {
    title: 'Safe Withdrawal Rate (Regra dos 4% Trinity)',
    text: 'Percentual de retirada anual do patrimônio investido que preserva o poder de compra e o capital perpétuo por horizontes superiores a 30 anos.',
    tag: 'Renda Passiva'
  },
  {
    title: 'Fator de Desvio de Rebalanceamento (Trigger-based)',
    text: 'Ajuste patrimonial ativado apenas quando uma classe de ativos desvia mais de 5% da alocação meta, mitigando custos de fricção tributária.',
    tag: 'Alocação de Ativos'
  },
  {
    title: 'Arbitragem de Taxa (Quitar vs Investir)',
    text: 'Se o Custo Efetivo Total (CET) da dívida for superior ao rendimento líquido do CDI/IPCA+, a amortização entrega retorno livre de risco superior.',
    tag: 'Fiduciário'
  }
];

export const SplitViewDrawer: React.FC<SplitViewDrawerProps> = ({
  isOpen,
  onClose,
  activeToolName = 'Cenário Ativo Atual',
  activeData = {},
  userEmail = 'v.torresko2015@gmail.com'
}) => {
  const [snapshots, setSnapshots] = useState<SavedSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Carregar snapshots do usuário do localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem('zyc_saved_simulations');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSnapshots(parsed);
            if (parsed.length > 0 && !selectedSnapshotId) {
              setSelectedSnapshotId(parsed[0].id);
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar snapshots salvos:', e);
      }
    }
  }, [isOpen, selectedSnapshotId]);

  // Cronômetro da sessão e rotação automática de dicas a cada 20 segundos
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);

    const tipRotation = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % ANALYTICAL_TIPS.length);
    }, 20000); // 20 segundos

    return () => {
      clearInterval(timer);
      clearInterval(tipRotation);
    };
  }, [isOpen]);

  const selectedSnapshot = useMemo(() => {
    return snapshots.find(s => s.id === selectedSnapshotId) || snapshots[0] || null;
  }, [snapshots, selectedSnapshotId]);

  // Formatação de Moeda
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(safeNumber(val));

  // Extrair métricas normalizadas para comparação lado a lado
  const comparisonMetrics = useMemo(() => {
    // Normalização flexível das chaves mais usuais entre simuladores
    const getVal = (data: Record<string, any>, keys: string[]): number => {
      for (const k of keys) {
        if (typeof data[k] === 'number') return data[k];
      }
      return 0;
    };

    const activeWealth = getVal(activeData, ['targetWealth', 'currentWealth', 'savings', 'totalAmount']);
    const snapWealth = selectedSnapshot ? getVal(selectedSnapshot.data, ['targetWealth', 'currentWealth', 'savings', 'totalAmount']) : 0;

    const activeAporte = getVal(activeData, ['monthlyContribution', 'wealthContribution', 'extraMonthlyContribution']);
    const snapAporte = selectedSnapshot ? getVal(selectedSnapshot.data, ['monthlyContribution', 'wealthContribution', 'extraMonthlyContribution']) : 0;

    const activeDebt = getVal(activeData, ['loanAmount', 'principal', 'balance']);
    const snapDebt = selectedSnapshot ? getVal(selectedSnapshot.data, ['loanAmount', 'principal', 'balance']) : 0;

    const activeYears = getVal(activeData, ['yearsToTarget', 'years', 'loanYears']);
    const snapYears = selectedSnapshot ? getVal(selectedSnapshot.data, ['yearsToTarget', 'years', 'loanYears']) : 0;

    const activeInterest = getVal(activeData, ['totalInterest', 'originalTotalInterest']);
    const snapInterest = selectedSnapshot ? getVal(selectedSnapshot.data, ['totalInterest', 'originalTotalInterest']) : 0;

    return [
      {
        label: 'Patrimônio / Alvo Acumulado',
        active: activeWealth,
        saved: snapWealth,
        type: 'currency',
        higherIsBetter: true,
      },
      {
        label: 'Aporte Mensal / Capacidade Poupança',
        active: activeAporte,
        saved: snapAporte,
        type: 'currency',
        higherIsBetter: true,
      },
      {
        label: 'Saldo Devedor / Financiamento',
        active: activeDebt,
        saved: snapDebt,
        type: 'currency',
        higherIsBetter: false,
      },
      {
        label: 'Prazo Estimado (Anos)',
        active: activeYears,
        saved: snapYears,
        type: 'number',
        higherIsBetter: false,
      },
      {
        label: 'Custo de Juros Acumulados',
        active: activeInterest,
        saved: snapInterest,
        type: 'currency',
        higherIsBetter: false,
      },
    ];
  }, [activeData, selectedSnapshot]);

  const sessionMinutes = Math.floor(sessionSeconds / 60);
  const sessionRemSeconds = sessionSeconds % 60;
  const currentTip = ANALYTICAL_TIPS[currentTipIndex];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-10 overflow-hidden font-sans">
        
        {/* HEADER DO DRAWER */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1A1F71] text-white rounded-xl shadow-xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  Comparador Split-View de Cenários
                </h3>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {userEmail}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Compare em tempo real o cenário ativo contra simulações e snapshots salvos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO PRINCIPAL COM ROLAGEM */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SELETOR DE SNAPSHOT SALVO */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Selecione o Snapshot Salvo para Comparação (Lado Direito)
            </label>
            {snapshots.length === 0 ? (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center">
                Nenhum snapshot salvo encontrado. Clique em "Salvar Simulação" em qualquer calculadora para criar seu primeiro ponto de comparação!
              </div>
            ) : (
              <select
                value={selectedSnapshotId}
                onChange={(e) => {
                  setSelectedSnapshotId(e.target.value);
                  trackGranularEvent('engagement', 'button_click', 'Snapshot Selecionado no Split-View');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm font-semibold text-zinc-900 dark:text-white font-mono"
              >
                {snapshots.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({new Date(s.savedAt).toLocaleDateString('pt-BR')} {new Date(s.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* TABELA COMPARATIVA LADO A LADO */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800/80 p-3 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
              <div>Indicador / Métrica</div>
              <div className="text-center text-[#1A1F71] dark:text-blue-400 font-black">
                {activeToolName} (Ativo)
              </div>
              <div className="text-right text-zinc-700 dark:text-zinc-300 font-black truncate">
                {selectedSnapshot ? selectedSnapshot.name : 'Snapshot Salvo'}
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {comparisonMetrics.map((m, idx) => {
                const delta = m.active - m.saved;
                const hasComparison = m.saved > 0 || m.active > 0;
                const isBetter = m.higherIsBetter ? delta > 0 : delta < 0;
                const isNeutral = delta === 0;

                return (
                  <div key={idx} className="grid grid-cols-3 p-3.5 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-xs">
                    <div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {m.label}
                      </div>
                      {hasComparison && !isNeutral && (
                        <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-0.5 ${isBetter ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-600 dark:text-red-400'}`}>
                          {isBetter ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          $\Delta$ {m.type === 'currency' ? formatCurrency(Math.abs(delta)) : Math.abs(delta).toFixed(1)}
                        </div>
                      )}
                    </div>

                    <div className="text-center font-mono font-bold text-zinc-900 dark:text-white">
                      {m.type === 'currency' ? formatCurrency(m.active) : `${m.active.toFixed(1)} anos`}
                    </div>

                    <div className="text-right font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                      {m.saved > 0 
                        ? (m.type === 'currency' ? formatCurrency(m.saved) : `${m.saved.toFixed(1)} anos`)
                        : '—'
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SESSÃO ANALÍTICA E PROGRESSO TEMPORAL */}
          <div className="p-4 bg-zinc-900 text-white rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-xs font-bold text-zinc-300">Tempo de Sessão Analítica</div>
                <div className="text-sm font-mono font-black text-white">
                  {String(sessionMinutes).padStart(2, '0')}:{String(sessionRemSeconds).padStart(2, '0')} min <span className="text-xs text-zinc-400 font-normal">/ 30:00 recomendados</span>
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-zinc-400">
              Atualização contínua a cada 20s
            </div>
          </div>

        </div>

        {/* RODAPÉ DO DRAWER: NOTIFICAÇÃO ROTATIVA DA LEGENDA A CADA 20 SEGUNDOS */}
        <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-[#1A1F71] text-white rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Legenda Guiada ({currentTipIndex + 1}/{ANALYTICAL_TIPS.length})
                  </span>
                  <span className="text-[10px] text-zinc-400">·</span>
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                    {currentTip.tag}
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">
                  {currentTip.title}
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  {currentTip.text}
                </p>
              </div>
            </div>

            {/* Controles manuais de navegação da dica */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentTipIndex(prev => (prev - 1 + ANALYTICAL_TIPS.length) % ANALYTICAL_TIPS.length)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Dica anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentTipIndex(prev => (prev + 1) % ANALYTICAL_TIPS.length)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Próxima dica"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
