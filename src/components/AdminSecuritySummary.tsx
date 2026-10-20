import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Calendar, 
  Activity, 
  ArrowRight,
  Server,
  Zap,
  Radio
} from 'lucide-react';
import { trackGranularEvent } from '../lib/analytics';

export type RiskSeverityCriteria = 'NORMAL' | 'INSTAVEL' | 'ANORMAL' | 'ALTO' | 'ALTISSIMO' | 'CRITICO';

interface RiskCriterionItem {
  level: RiskSeverityCriteria;
  label: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  status: 'ATIVO' | 'MONITORADO' | 'NOMINAL';
  description: string;
  lastIncident?: string;
}

interface AdminSecuritySummaryProps {
  onElevateToSuperAdmin: () => void;
  isSuperAdminAvailable?: boolean;
}

export const AdminSecuritySummary: React.FC<AdminSecuritySummaryProps> = ({
  onElevateToSuperAdmin,
  isSuperAdminAvailable = true,
}) => {
  const [dailyChecklist, setDailyChecklist] = useState<Record<string, boolean>>({
    check_rate_limit: true,
    check_failed_logins: true,
    check_database_latency: true,
  });

  const [weeklyChecklist, setWeeklyChecklist] = useState<Record<string, boolean>>({
    audit_chain_integrity: true,
    review_quarantine_ips: false,
    verify_immutable_snapshot: true,
  });

  const criteriaList: RiskCriterionItem[] = [
    {
      level: 'NORMAL',
      label: 'Normal (Nominal)',
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      colorText: 'text-emerald-700 dark:text-emerald-400',
      colorBorder: 'border-emerald-200 dark:border-emerald-800',
      status: 'NOMINAL',
      description: 'Latência sub-20ms, pool de conexões estável e 100% das assinaturas de integridade válidas.',
      lastIncident: 'Sem incidentes recentes',
    },
    {
      level: 'INSTAVEL',
      label: 'Instável',
      colorBg: 'bg-blue-50 dark:bg-blue-950/30',
      colorText: 'text-blue-700 dark:text-blue-400',
      colorBorder: 'border-blue-200 dark:border-blue-800',
      status: 'MONITORADO',
      description: 'Pequena flutuação de rede ou tempos de resposta entre 100ms e 300ms nos gateways de pagamento.',
      lastIncident: 'Resolvido automaticamente',
    },
    {
      level: 'ANORMAL',
      label: 'Anormal',
      colorBg: 'bg-amber-50 dark:bg-amber-950/30',
      colorText: 'text-amber-700 dark:text-amber-400',
      colorBorder: 'border-amber-200 dark:border-amber-800',
      status: 'MONITORADO',
      description: 'Pico de tráfego de requisições disparando sliding window do rate limiter (5 req / 10s).',
      lastIncident: 'Bloqueio preventivo ativado',
    },
    {
      level: 'ALTO',
      label: 'Alto',
      colorBg: 'bg-orange-50 dark:bg-orange-950/30',
      colorText: 'text-orange-700 dark:text-orange-400',
      colorBorder: 'border-orange-200 dark:border-orange-800',
      status: 'ATIVO',
      description: 'Tentativas repetidas de autenticação falha em curto intervalo (> 5 falhas/min por IP).',
      lastIncident: 'IP sob observação sentinela',
    },
    {
      level: 'ALTISSIMO',
      label: 'Altíssimo',
      colorBg: 'bg-rose-50 dark:bg-rose-950/30',
      colorText: 'text-rose-700 dark:text-rose-400',
      colorBorder: 'border-rose-200 dark:border-rose-800',
      status: 'MONITORADO',
      description: 'Score de anomalia comportamental > 80 pontos. Entidade direcionada para quarentena hermética.',
      lastIncident: '0 entidades em quarentena ativa',
    },
    {
      level: 'CRITICO',
      label: 'Crítico',
      colorBg: 'bg-red-50 dark:bg-red-950/30',
      colorText: 'text-red-700 dark:text-red-400',
      colorBorder: 'border-red-200 dark:border-red-800',
      status: 'NOMINAL',
      description: 'Rompimento de circuit breaker ou adulteração de hash encadeado SHA-256. Demanda ação imediata.',
      lastIncident: 'Nenhum rompimento registrado',
    },
  ];

  const toggleDaily = (key: string) => {
    setDailyChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    trackGranularEvent('engagement', 'button_click', `Checklist Diário: ${key}`);
  };

  const toggleWeekly = (key: string) => {
    setWeeklyChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    trackGranularEvent('engagement', 'button_click', `Checklist Semanal: ${key}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* HEADER EXECUTIVO PARA ADMINS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-md">
              Visão Operacional de Segurança (Perfil: Admin)
            </span>
            <span className="text-xs text-zinc-400">·</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Defesas Ativas
            </span>
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Monitor de Riscos & Mecanismos de Proteção
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Sumário executivo sem exposição de protocolos criptográficos sensíveis. Classificação por graus de critério fiduciário e rotinas de auditoria obrigatórias para analistas.
          </p>
        </div>

        {isSuperAdminAvailable && (
          <button
            type="button"
            onClick={onElevateToSuperAdmin}
            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Elevação Super Admin / Dev</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* MATRIZ DE CRITÉRIOS DE RISCO (6 GRAUS) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Classificação por Graus de Critério Fiduciário
          </h3>
          <span className="text-xs text-zinc-400">Tempo real</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criteriaList.map((c) => (
            <div
              key={c.level}
              className={`p-4 rounded-2xl border ${c.colorBg} ${c.colorBorder} transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black tracking-wide ${c.colorText}`}>
                    {c.label}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Último Status:</span>
                <strong className="text-zinc-700 dark:text-zinc-300">{c.lastIncident}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROTINAS DE AUDITORIA OBRIGATÓRIAS (FINAL DO DIA & FINAL DA SEMANA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ROTINA 1: VERIFICAÇÃO AO FINAL DO DIA */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-base">
                Checklist de Fechamento Diário
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Auditoria obrigatória ao término de cada expediente ou quando houver alerta de tráfego.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: 'check_rate_limit', label: 'Monitorar picos de requisições e bloqueios pelo Rate Limiter' },
              { id: 'check_failed_logins', label: 'Inspecionar tentativas anômalas de login e brute force' },
              { id: 'check_database_latency', label: 'Conferir latência média das queries no Cloud SQL Pool (< 20ms)' },
            ].map(item => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={dailyChecklist[item.id] || false}
                  onChange={() => toggleDaily(item.id)}
                  className="rounded text-[#1A1F71] focus:ring-[#1A1F71] w-4 h-4 cursor-pointer"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Status da Rotina Diária:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Verificado
            </span>
          </div>
        </div>

        {/* ROTINA 2: AUDITORIA AO FINAL DA SEMANA */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-base">
                Auditoria de Fechamento Semanal
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Revisão de integridade estrutural executada por todos os analistas às sextas-feiras.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: 'audit_chain_integrity', label: 'Validar encadeamento do Ledger de Auditoria NIST SP 800-92' },
              { id: 'review_quarantine_ips', label: 'Revisar entidades comportamentais mantidas em quarentena' },
              { id: 'verify_immutable_snapshot', label: 'Conferir hash SHA-256 do Immutable Release Snapshot' },
            ].map(item => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={weeklyChecklist[item.id] || false}
                  onChange={() => toggleWeekly(item.id)}
                  className="rounded text-purple-600 focus:ring-purple-600 w-4 h-4 cursor-pointer"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Status da Rotina Semanal:</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Pronto para Fechamento
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
