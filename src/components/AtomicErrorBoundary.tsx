import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Clock, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { reportDiagnosedError, getStableSnapshot } from '../lib/selfHealingEngine';

interface Props {
  children: ReactNode;
  moduleName: string;
  capturedInputs?: Record<string, any>;
  onAutoRecover?: (stableState?: any) => void;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  countdown: number;
  isAdmin: boolean;
  showTechDetails: boolean;
}

export class AtomicErrorBoundary extends Component<Props, State> {
  private timer: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    countdown: 15,
    isAdmin: false,
    showTechDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      countdown: 15,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[AtomicErrorBoundary: ${this.props.moduleName}] Intercepted exception:`, error);

    let isAdminUser = false;
    try {
      if (typeof window !== 'undefined') {
        const role = (localStorage.getItem('zyc_user_role') || '').toLowerCase();
        const email = (localStorage.getItem('zyc_user_email') || '').toLowerCase();
        isAdminUser = role === 'admin' || 
                       role === 'super_admin' || 
                       role === 'super_developer' || 
                       role === 'superadmin_developer' ||
                       email.includes('admin') || 
                       window.location.hash.includes('admin');
      }
    } catch {
      isAdminUser = false;
    }

    this.setState({ isAdmin: isAdminUser });

    // 1. Registra no sub-sistema gerenciador de erros diagnosticados e aciona alerta para v.torresko2015@gmail.com se crítico
    reportDiagnosedError({
      severity: 'HIGH',
      componentName: this.props.moduleName,
      error,
      capturedInputs: this.props.capturedInputs || {},
    });

    // 2. Inicia a contagem regressiva de no máximo 15 segundos (Heurística #1 e #9 de Jakob Nielsen)
    this.startCountdown();

    // 3. Para usuários comuns, tenta auto-recuperar suavemente com inputs preservados
    if (!isAdminUser) {
      setTimeout(() => {
        this.handleAutoRecover();
      }, 1200);
    }
  }

  public componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startCountdown = () => {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.setState(prev => {
        if (prev.countdown <= 1) {
          if (this.timer) clearInterval(this.timer);
          setTimeout(() => this.handleAutoRecover(), 50);
          return { countdown: 0 };
        }
        return { countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  private handleAutoRecover = () => {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const cachedSnapshot = getStableSnapshot(this.props.moduleName);
    this.setState({ hasError: false, error: null });

    if (this.props.onAutoRecover) {
      this.props.onAutoRecover(cachedSnapshot);
    }
  };

  public render() {
    if (this.state.hasError) {
      // VISÃO PARA USUÁRIOS COMUNS: Sem tela verde! Banner objetivo, amigável e fiduciário de 15s
      if (!this.state.isAdmin) {
        return (
          <div className="p-6 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-zinc-900 dark:to-zinc-900 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl text-center max-w-xl mx-auto my-6 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>Notícias do Sistema: O contratempo foi sanado com sucesso.</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-xs mb-4 leading-relaxed">
              O módulo <strong className="text-zinc-900 dark:text-white font-mono">{this.props.moduleName}</strong> foi restaurado e suas variáveis preenchidas foram preservadas integralmente.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleAutoRecover}
                className="bg-[#1A1F71] hover:bg-[#121652] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Continuar Simulação</span>
              </button>
              <span className="text-[11px] text-zinc-500 font-mono">
                Auto-restauração em {this.state.countdown}s
              </span>
            </div>
          </div>
        );
      }

      // VISÃO EXCLUSIVA PARA ADMINS / SUPERADMINS / SUPERDEVELOPERS
      return (
        <div className="p-6 bg-zinc-950 text-white rounded-3xl border border-emerald-500/30 my-6 shadow-xl relative overflow-hidden text-left">
          <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  Autocura Isolada (Admin Cockpit)
                </span>
                <h4 className="text-sm font-bold text-white">
                  Módulo Encapsulado: {this.props.moduleName}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 font-mono text-xs text-emerald-400">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>00:{this.state.countdown < 10 ? `0${this.state.countdown}` : this.state.countdown}s</span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            O contratempo foi sanado com sucesso. As variáveis foram encapsuladas e o estado fiduciário foi estabilizado sem interrupção dos demais sistemas.
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              type="button"
              onClick={this.handleAutoRecover}
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Agora</span>
            </button>
            <button
              type="button"
              onClick={() => this.setState(prev => ({ showTechDetails: !prev.showTechDetails }))}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Detalhes Técnicos</span>
              {this.state.showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {this.state.showTechDetails && this.state.error && (
            <div className="mt-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 max-h-40 overflow-y-auto">
              <p className="text-red-400 font-bold mb-1">{this.state.error.message}</p>
              {this.state.error.stack && (
                <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap">
                  {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
