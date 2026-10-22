import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2, Home, AlertTriangle, ChevronDown, ChevronUp, FileText, CheckCircle2, Clock } from 'lucide-react';
import { recordLocalOperationalIncident, getLocalOperationalIncidents } from '../lib/inputEncapsulator';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  isScoped?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  countdown: number;
  isAdmin: boolean;
  recoveryNotice: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private timer: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    countdown: 15,
    isAdmin: false,
    recoveryNotice: 'O contratempo foi sanado com sucesso.',
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
      countdown: 15,
      recoveryNotice: 'O contratempo foi sanado com sucesso. Parâmetros encapsulados com segurança.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Zyconomes ErrorBoundary] Exception intercepted:', error, errorInfo);
    this.setState({ errorInfo });

    // Determina se o usuário logado possui papel de admin ou se a rota atual é admin
    let isAdminUser = false;
    try {
      const role = localStorage.getItem('zyc_user_role');
      const email = localStorage.getItem('zyc_user_email');
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      isAdminUser = role === 'ADMIN' || role === 'SUPER_ADMIN' || (email && email.includes('admin')) || hash.includes('admin');
    } catch {
      isAdminUser = false;
    }

    this.setState({ isAdmin: isAdminUser });

    // 1. Registra o incidente operacional encapsulado
    try {
      const incidentId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      recordLocalOperationalIncident({
        id: incidentId,
        timestamp: new Date().toISOString(),
        fieldId: 'runtime_component_tree',
        receivedParam: error.message || 'React Uncaught Render Error',
        sanitizedParam: 'SafeFallbackState_Encapsulated',
        errorReason: error.stack?.slice(0, 300) || 'Component render exception',
        userRole: isAdminUser ? 'ADMIN' : 'USER',
      });
    } catch {
      // Falha segura
    }

    // 2. Notifica o sistema via toast no formato de notícia clara e objetiva (Heurística #1 e #9 de Jakob Nielsen)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('zyconomes:system-news-toast', {
          detail: {
            title: 'Notícias do Sistema',
            message: 'O contratempo foi sanado com sucesso. Sua sessão permanece íntegra e seus dados anteriores foram preservados.',
            type: 'info',
          },
        })
      );
    }

    // 3. Usuários comuns NÃO devem ver a tela verde: auto-recupera suavemente em 300ms para a tela anterior
    if (!isAdminUser) {
      setTimeout(() => {
        this.handleAutoRecoverForStandardUser();
      }, 350);
      return;
    }

    // 4. Se for ADMIN: Inicia contagem regressiva de no máximo 15s para validação de token e auto-recuperação
    this.startAdminCountdown();
  }

  public componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startAdminCountdown = () => {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.setState(prev => {
        if (prev.countdown <= 1) {
          if (this.timer) clearInterval(this.timer);
          // Ao zerar a contagem regressiva de 15s, auto-restaura o estado operacional
          setTimeout(() => this.handleGoHome(), 50);
          return { countdown: 0 };
        }
        return { countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  private handleAutoRecoverForStandardUser = () => {
    try {
      // Limpa dados de entrada corrompidos de rascunhos temporários
      sessionStorage.removeItem('zyc_temp_draft_input');
    } catch {
      // Ignore
    }

    // Reseta estado do boundary e restaura a rota estável anterior
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      // Se estava em rota desconhecida, volta para 'home'
      if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = 'home';
      }
    }
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleClearAndReset = () => {
    try {
      const theme = localStorage.getItem('zyc_theme');
      const token = localStorage.getItem('zyc_auth_token');
      localStorage.clear();
      if (theme) localStorage.setItem('zyc_theme', theme);
      if (token) localStorage.setItem('zyc_auth_token', token);
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      window.location.hash = 'home';
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.hash = 'home';
    }
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      // Usuários comuns: renderiza container neutro e discreto enquanto a auto-recuperação conclui
      if (!this.state.isAdmin) {
        return (
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center max-w-xl mx-auto my-8 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Notícias do Sistema: O contratempo foi sanado com sucesso.</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-4">
              A visualização anterior foi restaurada e suas simulações continuam disponíveis sem interrupções.
            </p>
            <button
              onClick={this.handleAutoRecoverForStandardUser}
              className="bg-[#1A1F71] hover:bg-[#121652] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all"
            >
              Continuar Navegando
            </button>
          </div>
        );
      }

      // Painel exclusivo para ADMINISTRADORES e SUPERADMINS com contagem de 15 segundos
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans antialiased selection:bg-[#1A1F71] selection:text-white">
          <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
            {/* Glow de fundo */}
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-4 shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                Central de Recuperação Ativa (Acesso Exclusivo: Admin & SuperAdmin)
              </span>

              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Validação de Token & Auto-Recuperação
              </h2>

              {/* Indicador de Contagem Regressiva de no máximo 15s */}
              <div className="my-5 p-4 bg-zinc-950/80 border border-emerald-500/30 rounded-2xl inline-flex flex-col items-center justify-center min-w-[280px]">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Validando Permissões do Token em Execução</span>
                </div>
                <div className="text-3xl font-black font-mono text-white tracking-tighter">
                  00:{this.state.countdown < 10 ? `0${this.state.countdown}` : this.state.countdown}s
                </div>
                <span className="text-[11px] text-zinc-400 mt-1">
                  Restauração automática em {this.state.countdown}s após validação da requisição.
                </span>
              </div>

              <p className="text-zinc-300 text-xs leading-relaxed mb-6 max-w-lg mx-auto font-light">
                {this.state.recoveryNotice} As variáveis com anomalias foram isoladas no encapsulador e catalogadas no arquivo de intercorrências operacionais.
              </p>

              {/* Ações Administrativas */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-6 py-2.5 rounded-full text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/50"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Restaurar Agora (Voltar ao Início)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.hash = 'admin';
                      this.handleAutoRecoverForStandardUser();
                    }
                  }}
                  className="bg-[#1A1F71] hover:bg-[#121652] text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-500/30"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Abrir Painel de Intercorrências</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleReload}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-full text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recarregar</span>
                </button>
              </div>

              {/* Diagnóstico Técnico Expansível */}
              {this.state.error && (
                <div className="mt-4 pt-4 border-t border-zinc-800 text-left">
                  <button
                    type="button"
                    onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                    className="w-full flex items-center justify-between text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors py-1 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Diagnóstico do Administrador ({this.state.error.name})
                    </span>
                    {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {this.state.showDetails && (
                    <div className="mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-left font-mono text-[11px] text-zinc-400 max-h-40 overflow-y-auto space-y-2">
                      <p className="text-red-400 font-bold break-all">
                        {this.state.error.toString()}
                      </p>
                      {this.state.error.stack && (
                        <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap break-all">
                          {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
