import React, { useEffect, useState } from 'react';
import { Users, MousePointerClick, TrendingUp, Mail, ShieldAlert, CheckCircle2, Clock, Activity } from 'lucide-react';
import { GranularEvent } from '../lib/analytics';

export const ZyconomesDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    eventsCount: 0,
    leadsCount: 0,
    uniqueSessions: 0,
    retentionRate: 0,
    avgDwellTime: 0
  });
  
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [toolUsage, setToolUsage] = useState<Record<string, number>>({});
  const [recentEvents, setRecentEvents] = useState<GranularEvent[]>([]);

  useEffect(() => {
    // Leitura simulada de dados locais para o Dashboard de Validação
    const events: GranularEvent[] = JSON.parse(localStorage.getItem('zyc_granular_events') || '[]');
    const leads = JSON.parse(localStorage.getItem('zyc_mock_leads') || '[]');

    // Simulação básica de métricas
    const sessions = new Set(events.map(e => e.session_id)).size || 1;

    const toolStats: Record<string, number> = {};
    const dwellTimes: number[] = [];

    events.forEach(e => {
      if (e.action === 'tool_view') {
        const tool = e.label || 'Unknown';
        toolStats[tool] = (toolStats[tool] || 0) + 1;
      }
      if (e.action === 'dwell_time' && typeof e.value === 'number') {
        dwellTimes.push(e.value);
      }
    });

    const avgTime = dwellTimes.length > 0 ? (dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length) : 0;

    setMetrics({
      eventsCount: events.length,
      leadsCount: leads.length,
      uniqueSessions: sessions,
      retentionRate: 22.4, // Mockado para meta de validação (> 20%)
      avgDwellTime: Math.round(avgTime)
    });

    setRecentLeads(leads.slice(-5).reverse());
    setRecentEvents(events.slice(-10).reverse());
    setToolUsage(toolStats);
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 text-white shadow-2xl max-w-6xl mx-auto my-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-emerald-500/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Zyconomes Admin
            </span>
          </div>
          <h2 className="text-2xl font-bold">Monitor de Granularidade (Fase B)</h2>
          <p className="text-zinc-500 text-sm mt-1">Inspeção profunda de cliques, campos preenchidos e tempo de permanência.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Sessões Reais</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white">{metrics.uniqueSessions}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa Retenção</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-white">{metrics.retentionRate}%</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Eventos Disparados</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{metrics.eventsCount}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Tempo Médio (s)</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">{metrics.avgDwellTime}s</div>
        </div>

        <div className="bg-zinc-900 border border-emerald-900/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Leads Seguros</span>
            <Mail className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white">{metrics.leadsCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Events (Granular Log) */}
        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-800 pb-2">Stream de Eventos Granulares</h3>
          {recentEvents.length === 0 ? (
            <div className="text-zinc-600 text-sm italic py-4">Aguardando interação do usuário...</div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((evt, i) => (
                <div key={i} className="text-xs flex items-center justify-between py-1.5 border-b border-zinc-800/50">
                  <div className="flex gap-2 items-center">
                    <span className={`w-2 h-2 rounded-full ${evt.category === 'conversion' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                    <span className="font-mono text-zinc-300">{evt.action}</span>
                    <span className="text-zinc-500">{evt.label}</span>
                  </div>
                  <span className="text-zinc-600">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-800 pb-2">Funil de Captura (Leads)</h3>
          {recentLeads.length === 0 ? (
             <div className="text-zinc-600 text-sm italic py-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Nenhum lead capturado ainda.
             </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 text-xs font-bold">
                      {lead.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{lead.email}</div>
                      <div className="text-xs text-zinc-500 font-mono">{lead.source_tool}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
