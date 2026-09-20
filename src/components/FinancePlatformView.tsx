import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Shield, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Bell, 
  Send, 
  CreditCard, 
  QrCode, 
  Clock, 
  ChevronRight, 
  BarChart3, 
  PieChart as PieIcon, 
  DollarSign, 
  ArrowRightLeft, 
  Eye, 
  EyeOff, 
  Zap, 
  Layers, 
  Server, 
  KeyRound,
  FileText,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { z } from 'zod';
import { UserRegistrationPayload, StoredUser, QueueMessage, DeadLetterMessage, SystemMetrics, LogEntry } from '../types/zyconomes';

const registrationSchema = z.object({
  email: z.string().email("Formato de e-mail inválido."),
  nome: z.string().min(5, "O nome deve ter no mínimo 5 caracteres."),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/, "O CPF deve estar no formato XXX.XXX.XXX-XX"),
  senha: z.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter ao menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter ao menos um caractere especial")
});

interface Props {
  metrics: SystemMetrics;
  users: StoredUser[];
  onRegisterUser: (payload: UserRegistrationPayload) => { success: boolean; message: string; correlationId?: string; isDuplicate?: boolean };
  onRunStressBurst: (concurrency: number) => void;
  onToggleSmtpFailure: (enabled: boolean) => void;
  isSmtpFailureInjected: boolean;
  onReprocessDlq: () => void;
  logs: LogEntry[];
}

export const FinancePlatformView: React.FC<Props> = ({
  metrics,
  users,
  onRegisterUser,
  onRunStressBurst,
  onToggleSmtpFailure,
  isSmtpFailureInjected,
  onReprocessDlq,
  logs
}) => {
  const [activeFinanceTab, setActiveFinanceTab] = useState<'dashboard' | 'investments' | 'transfers' | 'onboarding' | 'cards'>('dashboard');
  const [hideBalance, setHideBalance] = useState(false);
  
  // Onboarding / Registration Form State
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'conflict' | 'error'; text: string; correlationId?: string } | null>(null);
  const [zodErrors, setZodErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Máquina de Estados do OTP (Anti-Fraude / KYC)
  const [onboardingState, setOnboardingState] = useState<'PENDING_REGISTRATION' | 'AWAITING_OTP' | 'ACTIVE'>('PENDING_REGISTRATION');
  const [otpCode, setOtpCode] = useState('');

  // Transfer simulation state
  const [transferAmount, setTransferAmount] = useState('2500.00');
  const [pixKey, setPixKey] = useState('pix.investidor@zyconomes.com.br');
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setZodErrors({});
    setIsSubmitting(true);

    // Borda de Validação Zod (Fast-Feedback Client-Side)
    const validationResult = registrationSchema.safeParse({ email, nome, cpf, senha });
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach(issue => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setZodErrors(fieldErrors);
      setFeedback({
        type: 'error',
        text: 'KYC Blocked: Validação de borda (Zod) falhou. Corrija os campos e tente novamente.'
      });
      setIsSubmitting(false);
      return;
    }

    const result = onRegisterUser({
      email,
      nome_completo: nome,
      cpf,
      senha_plana: senha
    });

    if (result.success) {
      setFeedback({
        type: 'success',
        text: 'Pré-cadastro realizado (24ms PgBouncer)! Verifique seu e-mail para continuar.',
        correlationId: result.correlationId
      });
      // Avança a máquina de estados para validação real (OTP)
      setOnboardingState('AWAITING_OTP');
    } else if (result.isDuplicate) {
      setFeedback({
        type: 'conflict',
        text: 'KYC Bloqueado: E-mail ou CPF já possui solicitação ativa (Redis SETNX).',
        correlationId: result.correlationId
      });
    } else {
      setFeedback({
        type: 'error',
        text: `Falha no backend: ${result.message}`,
        correlationId: result.correlationId
      });
    }
    setIsSubmitting(false);
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      setFeedback({
        type: 'success',
        text: 'OTP validado com sucesso! Conta 100% ativada e segura.'
      });
      setOnboardingState('ACTIVE');
      setEmail('');
      setNome('');
      setCpf('');
      setSenha('');
      setOtpCode('');
    } else {
      setFeedback({
        type: 'error',
        text: 'Código OTP inválido ou expirado.'
      });
    }
  };

  const handlePixTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferSuccess(`PIX de R$ ${transferAmount} liquidado instantaneamente via SPI/Bacen. PgBouncer pool ativo.`);
    setTimeout(() => setTransferSuccess(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Status da Infraestrutura Financeira em Tempo Real */}
      <div className="bg-[#0A0A0A] border border-[#222] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#111] border border-[#333] flex items-center justify-center text-zinc-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-zinc-200 uppercase tracking-widest">Zyconomes Institutional Banking & Wealth</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#111] text-emerald-500 border border-emerald-500/30">
                PROD ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase mt-0.5">
              Bacen Regulated • PgBouncer Multiplex Pool • Redis Idempotency Lock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="text-right hidden md:block">
            <div className="text-zinc-600">MOTOR CAPACITY</div>
            <div className="text-emerald-500 font-bold tracking-tight">{metrics.current_rps.toLocaleString()} RPS | P95 {metrics.p95_latency_ms}ms</div>
          </div>
          <button
            onClick={() => onRunStressBurst(2000)}
            className="px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] text-zinc-300 border border-[#333] text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-widest"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            Market Volume Sim
          </button>
        </div>
      </div>

      {/* Internal Navigation for Financial Portal */}
      <div className="flex items-center gap-1 border-b border-[#222] pb-2 overflow-x-auto font-mono">
        <button
          onClick={() => setActiveFinanceTab('dashboard')}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            activeFinanceTab === 'dashboard'
              ? 'bg-zinc-200 text-black border-zinc-200'
              : 'bg-[#111] text-zinc-500 hover:text-white border-[#333]'
          }`}
        >
          <BarChart3 className="w-3 h-3" />
          Dashboard
        </button>

        <button
          onClick={() => setActiveFinanceTab('investments')}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            activeFinanceTab === 'investments'
              ? 'bg-zinc-200 text-black border-zinc-200'
              : 'bg-[#111] text-zinc-500 hover:text-white border-[#333]'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          Wealth & Trade
        </button>

        <button
          onClick={() => setActiveFinanceTab('transfers')}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            activeFinanceTab === 'transfers'
              ? 'bg-zinc-200 text-black border-zinc-200'
              : 'bg-[#111] text-zinc-500 hover:text-white border-[#333]'
          }`}
        >
          <ArrowRightLeft className="w-3 h-3" />
          Transfer HFT
        </button>

        <button
          onClick={() => setActiveFinanceTab('onboarding')}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            activeFinanceTab === 'onboarding'
              ? 'bg-zinc-200 text-black border-zinc-200'
              : 'bg-[#111] text-zinc-500 hover:text-white border-[#333]'
          }`}
        >
          <KeyRound className="w-3 h-3" />
          KYC / Auth
        </button>
      </div>

      {/* VIEW: DASHBOARD PRINCIPAL */}
      {activeFinanceTab === 'dashboard' && (
        <div className="space-y-4 font-mono">
          {/* Top Balance & Wealth Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Patrimônio Total */}
            <div className="bg-[#0A0A0A] border border-[#222] p-4 relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-500 text-[10px] mb-2">
                <span className="font-bold uppercase tracking-widest">Net Worth Consolidado</span>
                <button 
                  onClick={() => setHideBalance(!hideBalance)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {hideBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                {hideBalance ? '••••••••' : '1,482,930.45 BRL'}
              </div>

              <div className="flex items-center gap-2 mt-4 text-[10px]">
                <span className="text-emerald-500 flex items-center font-bold bg-[#111] border border-[#222] px-1.5 py-0.5">
                  <TrendingUp className="w-3 h-3 mr-1" /> +14.82% YTD
                </span>
                <span className="text-zinc-500 uppercase">vs Benchmark CDI (112%)</span>
              </div>
            </div>

            {/* Card 2: Saldo em Conta Corrente */}
            <div className="bg-[#0A0A0A] border border-[#222] p-4">
              <div className="flex items-center justify-between text-zinc-500 text-[10px] mb-2">
                <span className="font-bold uppercase tracking-widest">Liquidez Imediata (D+0)</span>
                <Wallet className="w-3 h-3 text-emerald-500" />
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-emerald-500 tabular-nums tracking-tight">
                {hideBalance ? '••••••••' : '142,500.00 BRL'}
              </div>

              <div className="flex items-center gap-3 mt-4 text-[10px] text-zinc-500 uppercase">
                <span className="text-zinc-400 border-b border-[#333] border-dashed">50k BRL Pending Clearing</span>
              </div>
            </div>

            {/* Card 3: Limite de Crédito & Cartão Black */}
            <div className="bg-[#0A0A0A] border border-[#222] p-4">
              <div className="flex items-center justify-between text-zinc-500 text-[10px] mb-2">
                <span className="font-bold uppercase tracking-widest">Credit Exposure Limit</span>
                <CreditCard className="w-3 h-3 text-zinc-400" />
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-zinc-300 tabular-nums tracking-tight">
                {hideBalance ? '••••••••' : '280,000.00 BRL'}
              </div>

              <div className="flex items-center justify-between mt-4 text-[10px] uppercase">
                <span className="text-zinc-500">Utilization: <strong className="text-red-400">18,420.10 BRL</strong></span>
                <span className="text-zinc-400 font-bold bg-[#111] border border-[#222] px-1.5 py-0.5">TIER 1</span>
              </div>
            </div>
          </div>

          {/* Middle Section: Quick Actions & Market Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Quick Financial Operations (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Quick Action Buttons */}
              <div className="bg-[#0A0A0A] border border-[#222] p-4">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-white" />
                  Ações de Tesouraria
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button 
                    onClick={() => setActiveFinanceTab('transfers')}
                    className="p-3 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-left transition-all group cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-zinc-800 text-zinc-400 flex items-center justify-center mb-2 group-hover:text-white">
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                    <div className="font-bold text-[11px] text-zinc-200 uppercase">Wire Transfer</div>
                    <div className="text-[9px] text-zinc-600 mt-0.5 uppercase">Fast Settlement</div>
                  </button>

                  <button 
                    onClick={() => setActiveFinanceTab('investments')}
                    className="p-3 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-left transition-all group cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-zinc-800 text-zinc-400 flex items-center justify-center mb-2 group-hover:text-white">
                      <TrendingUp className="w-3 h-3" />
                    </div>
                    <div className="font-bold text-[11px] text-zinc-200 uppercase">Brokerage</div>
                    <div className="text-[9px] text-zinc-600 mt-0.5 uppercase">Equities / Fixed</div>
                  </button>

                  <button 
                    onClick={() => setActiveFinanceTab('transfers')}
                    className="p-3 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-left transition-all group cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-zinc-800 text-zinc-400 flex items-center justify-center mb-2 group-hover:text-white">
                      <QrCode className="w-3 h-3" />
                    </div>
                    <div className="font-bold text-[11px] text-zinc-200 uppercase">Invoice QR</div>
                    <div className="text-[9px] text-zinc-600 mt-0.5 uppercase">Generate Dynamic</div>
                  </button>

                  <button 
                    onClick={() => setActiveFinanceTab('onboarding')}
                    className="p-3 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-left transition-all group cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-zinc-800 text-zinc-400 flex items-center justify-center mb-2 group-hover:text-white">
                      <KeyRound className="w-3 h-3" />
                    </div>
                    <div className="font-bold text-[11px] text-zinc-200 uppercase">KYC Auth</div>
                    <div className="text-[9px] text-zinc-600 mt-0.5 uppercase">Entity Verify</div>
                  </button>
                </div>
              </div>

                {/* Extrato / Transações Recentes */}
                <div className="bg-[#0A0A0A] border border-[#222]">
                  <div className="p-3 bg-[#111] border-b border-[#222] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        Ledger Geral de Operações
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-black px-1.5 py-0.5 border border-[#222]">
                      RECORDS: {users.length + 8}
                    </span>
                  </div>

                  <div className="divide-y divide-[#222]">
                    <div className="p-3 flex items-center justify-between hover:bg-[#111] transition-colors text-[10px]">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                          <ArrowDownLeft className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-200 uppercase">INB • XPML11 DIVIDENDS</div>
                          <div className="text-[9px] text-zinc-600">ID: TR-8942-B | 14:18:22 EST</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-emerald-500 tabular-nums">+ 4,280.50 BRL</div>
                        <div className="text-[9px] text-zinc-600">SETTLED</div>
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between hover:bg-[#111] transition-colors text-[10px]">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                          <ArrowUpRight className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-200 uppercase">OUT • HEDGE FUND ALLOC</div>
                          <div className="text-[9px] text-zinc-600">ID: TR-1102-X | 11:05:01 EST</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-zinc-300 tabular-nums">- 25,000.00 BRL</div>
                        <div className="text-[9px] text-zinc-600">AUTH: BIOMETRIC</div>
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between hover:bg-[#111] transition-colors text-[10px]">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                          <TrendingUp className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-200 uppercase">SYS • SWEEP ACCOUNT REINV</div>
                          <div className="text-[9px] text-zinc-600">ID: TR-0091-A | 00:00:01 EST</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-emerald-500 tabular-nums">+ 890.32 BRL</div>
                        <div className="text-[9px] text-zinc-600">AUTO-SWEEP</div>
                      </div>
                    </div>

                    {users.slice(0, 2).map(u => (
                      <div key={u.id} className="p-3 flex items-center justify-between hover:bg-[#111] transition-colors text-[10px]">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-zinc-800 text-zinc-400 flex items-center justify-center border border-[#333]">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200 uppercase">KYC • ACCOUNT ACTIVATED: {u.nome_completo}</div>
                            <div className="text-[9px] text-zinc-600 uppercase">{u.email} • PgBouncer Pool</div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase tracking-widest">
                            {u.status}
                          </span>
                          <div className="text-[9px] text-zinc-600 mt-0.5">{u.cpf_anonimizado}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>

            {/* Right: Allocation Chart & Security Telemetry (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Asset Allocation Card */}
              <div className="bg-[#0A0A0A] border border-[#222] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <PieIcon className="w-3 h-3 text-white" />
                    Asset Allocation
                  </div>
                  <span className="text-[9px] font-mono text-emerald-500 uppercase">Aggressive Profile</span>
                </div>

                <div className="space-y-3 font-mono text-[10px]">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-400">Fixed Income (CDI)</span>
                      <span className="font-bold text-zinc-200">45%</span>
                    </div>
                    <div className="w-full bg-[#111] h-1.5 border border-[#222]">
                      <div className="bg-emerald-500 h-1.5" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-400">Real Estate Funds (REITs)</span>
                      <span className="font-bold text-zinc-200">30%</span>
                    </div>
                    <div className="w-full bg-[#111] h-1.5 border border-[#222]">
                      <div className="bg-blue-500 h-1.5" style={{ width: '30%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-400">Equities & Global</span>
                      <span className="font-bold text-zinc-200">18%</span>
                    </div>
                    <div className="w-full bg-[#111] h-1.5 border border-[#222]">
                      <div className="bg-purple-500 h-1.5" style={{ width: '18%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-400">Crypto & Gold</span>
                      <span className="font-bold text-zinc-200">7%</span>
                    </div>
                    <div className="w-full bg-[#111] h-1.5 border border-[#222]">
                      <div className="bg-amber-500 h-1.5" style={{ width: '7%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#222] flex items-center justify-between text-[10px] text-zinc-500 uppercase">
                  <span>Est Yield/Mo:</span>
                  <strong className="font-mono text-emerald-500">12,840.00 BRL</strong>
                </div>
              </div>

              {/* Security & Core Status Card */}
              <div className="bg-[#0A0A0A] border border-[#222] p-4 space-y-3">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Lock className="w-3 h-3 text-white" />
                  Transaction Security
                </div>

                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex items-center justify-between p-2 bg-[#111] border border-[#222]">
                    <span className="text-zinc-500">SETNX Idempotency:</span>
                    <span className="text-emerald-500 font-bold uppercase">100% Locked</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-[#111] border border-[#222]">
                    <span className="text-zinc-500">Settlement Queue:</span>
                    <span className="text-blue-500 font-bold uppercase">{metrics.rabbitmq_queue_depth} Pend</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-[#111] border border-[#222]">
                    <span className="text-zinc-500">Physical DB Conns:</span>
                    <span className="text-amber-500 font-bold uppercase">{metrics.active_pg_connections}/100 MAX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: INVESTIMENTOS */}
      {activeFinanceTab === 'investments' && (
        <div className="space-y-4 font-mono">
          <div className="bg-[#0A0A0A] border border-[#222] p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#222] pb-3">
              <div>
                <h3 className="text-[12px] font-bold text-zinc-200 uppercase tracking-widest">Catálogo de Ativos &amp; Yields</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5 uppercase">
                  D+0 Settlement • CVM Regulated
                </p>
              </div>
              <div className="text-[10px] font-mono text-emerald-500 bg-[#111] px-2 py-1 border border-[#333]">
                BENCHMARK CDI: 10.75% | IPCA: 3.92%
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="p-4 bg-[#111] border border-[#333] hover:border-emerald-500/50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#000] text-emerald-500 border border-emerald-500/30 uppercase tracking-widest">
                    FIXED INCOME
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase">FGC Insured</span>
                </div>
                <div className="font-bold text-[11px] text-zinc-200 uppercase">CDB Zyconomes Liquidity</div>
                <div className="text-xl font-bold font-mono text-emerald-500 mt-2">115% CDI</div>
                <div className="text-[9px] text-zinc-500 mt-1 uppercase">Min Alloc: 100 BRL • T+0</div>
                <button 
                  onClick={() => alert('Execution submitted: 5,000 BRL')}
                  className="w-full mt-4 py-1.5 bg-zinc-200 hover:bg-white text-black text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-widest"
                >
                  Execute Trade
                </button>
              </div>

              <div className="p-4 bg-[#111] border border-[#333] hover:border-blue-500/50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#000] text-blue-500 border border-blue-500/30 uppercase tracking-widest">
                    TAX FREE (BR)
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase">LCI Premium</span>
                </div>
                <div className="font-bold text-[11px] text-zinc-200 uppercase">Real Estate Bond (90D)</div>
                <div className="text-xl font-bold font-mono text-blue-500 mt-2">IPCA + 6.85%</div>
                <div className="text-[9px] text-zinc-500 mt-1 uppercase">Min Alloc: 1,000 BRL • Tax Exempt</div>
                <button 
                  onClick={() => alert('Execution submitted: 10,000 BRL')}
                  className="w-full mt-4 py-1.5 bg-zinc-200 hover:bg-white text-black text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-widest"
                >
                  Execute Trade
                </button>
              </div>

              <div className="p-4 bg-[#111] border border-[#333] hover:border-purple-500/50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#000] text-purple-500 border border-purple-500/30 uppercase tracking-widest">
                    HEDGE FUND
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase">Multi-Strat</span>
                </div>
                <div className="font-bold text-[11px] text-zinc-200 uppercase">Zyconomes Macro Global</div>
                <div className="text-xl font-bold font-mono text-purple-500 mt-2">+24.8% (12M)</div>
                <div className="text-[9px] text-zinc-500 mt-1 uppercase">Active FX/Rates • T+30</div>
                <button 
                  onClick={() => alert('Execution submitted: 25,000 BRL')}
                  className="w-full mt-4 py-1.5 bg-zinc-200 hover:bg-white text-black text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-widest"
                >
                  Execute Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TRANSFERÊNCIAS & PIX */}
      {activeFinanceTab === 'transfers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
          <div className="lg:col-span-6 bg-[#0A0A0A] border border-[#222] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                <ArrowRightLeft className="w-3 h-3" />
                <span>Wire Transfer / HFT Settlement</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">SPI / Bacen Link Active</span>
            </div>

            <form onSubmit={handlePixTransfer} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Beneficiary KEY (Email/Tax ID/Random)</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] px-3 py-2 text-[11px] font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Execution Amount (BRL)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[10px] font-mono text-zinc-600">BRL</span>
                  <input
                    type="number"
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] pl-9 pr-3 py-2 text-sm font-mono font-bold text-emerald-500 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-[#111] border border-[#333] text-[9px] text-zinc-500 space-y-1 uppercase tracking-widest">
                <div className="flex justify-between">
                  <span>Available Liq:</span>
                  <strong className="text-zinc-300 font-mono">142,500.00 BRL</strong>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Fee:</span>
                  <strong className="text-emerald-500 font-mono">WAIVED (0.00)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Idempotency Lock:</span>
                  <strong className="text-purple-500 font-mono">SHA-256 SECURED</strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-zinc-200 hover:bg-white text-black text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-widest"
              >
                Execute Settlement
              </button>

              {transferSuccess && (
                <div className="p-2 bg-[#111] border border-emerald-500/50 text-[10px] text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{transferSuccess}</span>
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-6 bg-[#0A0A0A] border border-[#222] p-4 space-y-4">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-b border-[#222] pb-3">
              <QrCode className="w-3 h-3 text-purple-500" />
              Dynamic Invoicing QR
            </div>

            <div className="bg-[#111] p-6 border border-[#333] flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 bg-white p-2 flex items-center justify-center">
                {/* Visual Representation of QR */}
                <div className="w-full h-full border-4 border-black flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 bg-black"></div>
                    <div className="w-5 h-5 bg-black"></div>
                  </div>
                  <div className="font-mono text-[8px] font-bold text-black tracking-widest">ZYCONOMES</div>
                  <div className="flex justify-between">
                    <div className="w-5 h-5 bg-black"></div>
                    <div className="w-3 h-3 bg-black"></div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono font-bold text-zinc-300">pix.investidor@zyconomes.com.br</div>
                <div className="text-[9px] text-zinc-600 mt-1 uppercase tracking-widest">Zyconomes Bank S.A. (CODE 482)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ONBOARDING / ABERTURA DE CONTA */}
      {activeFinanceTab === 'onboarding' && (
        <div className="max-w-2xl mx-auto bg-[#0A0A0A] border border-[#222] p-6 space-y-5 font-mono">
          <div className="border-b border-[#222] pb-4 text-center">
            <div className="w-10 h-10 bg-black border border-[#333] text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-[12px] font-bold text-zinc-200 uppercase tracking-widest">Zyconomes Institutional Onboarding</h3>
            <p className="text-[9px] text-zinc-500 mt-1 max-w-md mx-auto uppercase tracking-widest">
              SYNC PROCESSING &lt;35ms • IDEMPOTENCY LOCK • PBKDF2 HASHING
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {onboardingState === 'PENDING_REGISTRATION' && (
              <>
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Professional Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="NAME@INSTITUTION.COM"
                    className={`w-full bg-[#111] border ${zodErrors.email ? 'border-red-500 focus:border-red-500' : 'border-[#333] focus:border-emerald-500'} px-3 py-2 text-[11px] font-mono text-zinc-200 focus:outline-none`}
                    required
                  />
                  {zodErrors.email && <div className="text-[9px] text-red-500 mt-1 uppercase tracking-widest">{zodErrors.email}</div>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Legal Name</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="FULL NAME"
                      className={`w-full bg-[#111] border ${zodErrors.nome ? 'border-red-500 focus:border-red-500' : 'border-[#333] focus:border-emerald-500'} px-3 py-2 text-[11px] font-mono text-zinc-200 focus:outline-none`}
                      required
                    />
                    {zodErrors.nome && <div className="text-[9px] text-red-500 mt-1 uppercase tracking-widest">{zodErrors.nome}</div>}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Tax ID (CPF)</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className={`w-full bg-[#111] border ${zodErrors.cpf ? 'border-red-500 focus:border-red-500' : 'border-[#333] focus:border-emerald-500'} px-3 py-2 text-[11px] font-mono text-zinc-200 focus:outline-none`}
                      required
                    />
                    {zodErrors.cpf && <div className="text-[9px] text-red-500 mt-1 uppercase tracking-widest">{zodErrors.cpf}</div>}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Authentication Passphrase</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="MIN 8 CHARACTERS WITH SYMBOLS"
                    className={`w-full bg-[#111] border ${zodErrors.senha ? 'border-red-500 focus:border-red-500' : 'border-[#333] focus:border-emerald-500'} px-3 py-2 text-[11px] font-mono text-zinc-200 focus:outline-none`}
                    required
                  />
                  {zodErrors.senha && <div className="text-[9px] text-red-500 mt-1 uppercase tracking-widest">{zodErrors.senha}</div>}
                </div>

                <div className="p-3 bg-[#111] border border-[#333] text-[9px] text-zinc-500 space-y-1 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Security Guarantees:
                  </div>
                  <div>• PBKDF2 Hash (100k iterations/async pool)</div>
                  <div>• Redis SETNX Atomic Idempotency Lock</div>
                  <div>• Multiplexed PgBouncer persistence</div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-zinc-200 hover:bg-white text-black text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      EXECUTING KYC ENGINE...
                    </>
                  ) : (
                    <>
                      <Shield className="w-3 h-3" />
                      INITIALIZE KYC WORKFLOW
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {onboardingState === 'AWAITING_OTP' && (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="bg-[#111] border border-emerald-500/30 p-4 text-center">
                <div className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mb-1">2FA Security Challenge</div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">A 6-digit code has been dispatched to <strong className="text-zinc-300">{email}</strong> via RMQ.</div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1 text-center">Enter OTP Token</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full max-w-[200px] mx-auto block bg-[#111] border border-[#333] px-3 py-3 text-xl tracking-[0.5em] text-center font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-3 h-3" />
                VERIFY OTP TOKEN
              </button>
            </form>
          )}

          {onboardingState === 'ACTIVE' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
              <div className="w-12 h-12 bg-black border border-emerald-500 text-emerald-500 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-zinc-200 uppercase tracking-widest">KYC CLEARED</h3>
                <p className="text-[9px] text-zinc-500 mt-1 max-w-sm mx-auto uppercase tracking-widest">
                  Identity verified. Institutional limits lifted.
                </p>
              </div>
              <button
                onClick={() => setOnboardingState('PENDING_REGISTRATION')}
                className="px-6 py-2 border border-[#333] text-zinc-400 hover:bg-[#111] text-[9px] font-bold transition-colors cursor-pointer mt-4 uppercase tracking-widest"
              >
                SIMULATE NEW INSTANCE
              </button>
            </div>
          )}

          {feedback && onboardingState !== 'ACTIVE' && (
            <div className={`p-3 border text-[9px] uppercase tracking-widest leading-relaxed ${
              feedback.type === 'success'
                ? 'bg-[#111] border-emerald-500/50 text-emerald-500'
                : feedback.type === 'conflict'
                ? 'bg-[#111] border-purple-500/50 text-purple-500'
                : 'bg-[#111] border-red-500/50 text-red-500'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {feedback.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {feedback.type === 'success' ? 'SYSTEM: SUCCESS' : feedback.type === 'conflict' ? 'SYSTEM: IDEMPOTENCY CONFLICT' : 'SYSTEM: KYC REJECTED'}
              </div>
              <div>{feedback.text}</div>
              {feedback.correlationId && (
                <div className="text-[9px] font-mono text-zinc-600 mt-1">
                  x-correlation-id: <span className="text-zinc-400">{feedback.correlationId}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
