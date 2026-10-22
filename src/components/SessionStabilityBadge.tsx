import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, X } from 'lucide-react';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export const SessionStabilityBadge: React.FC<{ forceAdmin?: boolean }> = ({ forceAdmin }) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(() => {
    if (typeof forceAdmin === 'boolean') return forceAdmin;
    if (typeof window === 'undefined') return false;
    try {
      const role = (localStorage.getItem('zyc_user_role') || '').toLowerCase();
      return ['admin', 'super_admin', 'super_developer', 'security_admin', 'dev'].includes(role);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleAuthSync = () => {
      if (typeof forceAdmin === 'boolean') {
        setIsAdminUser(forceAdmin);
        return;
      }
      try {
        const role = (localStorage.getItem('zyc_user_role') || '').toLowerCase();
        setIsAdminUser(['admin', 'super_admin', 'super_developer', 'security_admin', 'dev'].includes(role));
      } catch {
        setIsAdminUser(false);
      }
    };

    window.addEventListener('zyconomes:auth-changed', handleAuthSync);
    window.addEventListener('storage', handleAuthSync);

    // 1. Inicializa ou recupera o timestamp de início da sessão contínua
    let startTime = Date.now();
    try {
      const stored = sessionStorage.getItem('zyc_session_start_time');
      if (stored) {
        startTime = parseInt(stored, 10);
      } else {
        sessionStorage.setItem('zyc_session_start_time', String(startTime));
      }
    } catch {
      // Ignore
    }

    const updateDuration = () => {
      const diffMs = Date.now() - startTime;
      const mins = Math.floor(diffMs / (1000 * 60));
      setElapsedMinutes(mins);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // atualiza a cada minuto

    // 2. Escuta notificações noticiosas do sistema (Heurística #1 e #9 de Jakob Nielsen)
    const handleNewsToast = (event: any) => {
      const detail = event?.detail;
      if (detail && detail.message) {
        const newToast: ToastMessage = {
          id: `toast-${Date.now()}`,
          title: detail.title || 'Notícias do Sistema',
          message: detail.message,
          type: detail.type || 'info',
        };
        setToasts(prev => [...prev.slice(-2), newToast]);

        // Auto-remove após 8 segundos
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 8000);
      }
    };

    window.addEventListener('zyconomes:system-news-toast', handleNewsToast);

    return () => {
      clearInterval(interval);
      window.removeEventListener('zyconomes:system-news-toast', handleNewsToast);
      window.removeEventListener('zyconomes:auth-changed', handleAuthSync);
      window.removeEventListener('storage', handleAuthSync);
    };
  }, [forceAdmin]);

  const hours = Math.floor(elapsedMinutes / 60);
  const mins = elapsedMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${mins < 10 ? `0${mins}` : mins}m` : `${mins}m`;

  return (
    <>
      {/* Toast Noticioso Flutuante de Auto-Recuperação e Estabilidade (Disponível para todos com Heurísticas Nielsen) */}
      {toasts.length > 0 && (
        <aside aria-label="Notificações do Sistema" className="fixed top-24 right-4 z-50 max-w-sm w-full space-y-2 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl flex items-start gap-3 relative"
            >
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mb-0.5">
                  <span>{toast.title}</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                aria-label="Fechar notificação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </aside>
      )}

      {/* Badge Discreto de Estabilidade de Sessão EXCLUSIVO para Admins, SuperAdmins e SuperDevs */}
      {isAdminUser && (
        <div 
          data-testid="session-stability-badge"
          className="hidden lg:inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-medium border border-zinc-200/80 dark:border-zinc-800 select-none animate-in fade-in duration-300"
          title="Telemetria de estabilidade ininterrupta (Visível apenas para Admin, SuperAdmin e SuperDevs - ISO 22301)"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-mono text-[11px] tabular-nums">Sessão Estável: {timeFormatted}</span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span className="text-[11px] font-normal text-zinc-500">Operação Nominal</span>
        </div>
      )}
    </>
  );
};
