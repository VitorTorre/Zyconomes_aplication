import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, ShieldAlert, Zap } from 'lucide-react';

const mockData = [
  { time: '0s', directAccess: 12, pgbouncer: 12, clients: 100 },
  { time: '1s', directAccess: 45, pgbouncer: 15, clients: 500 },
  { time: '2s', directAccess: 120, pgbouncer: 18, clients: 1200 },
  { time: '3s', directAccess: 350, pgbouncer: 22, clients: 2500 },
  { time: '4s', directAccess: 800, pgbouncer: 24, clients: 4000 },
  { time: '5s', directAccess: 1500, pgbouncer: 28, clients: 5000 },
  { time: '6s', directAccess: null, pgbouncer: 25, clients: 4800 }, // Direct crashes
  { time: '7s', directAccess: null, pgbouncer: 22, clients: 3000 },
];

export const ConcurrencyImpactChart: React.FC = () => {
  return (
    <div className="bg-zinc-900/90 border border-blue-900/50 rounded-xl p-5 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
            <Activity className="w-5 h-5" />
            <h2>Simulação de Impacto: Acesso Direto vs PgBouncer</h2>
          </div>
          <p className="text-xs text-zinc-400">Latência P95 durante um pico de 5.000 conexões simultâneas.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono">
            ADMIN VIEW
          </span>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }}
              itemStyle={{ color: '#e4e4e7' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            
            <Line 
              type="monotone" 
              name="Sem PgBouncer (OOM/Timeout)" 
              dataKey="directAccess" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ r: 3, fill: '#ef4444' }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              name="Com PgBouncer (Pool/Multiplex)" 
              dataKey="pgbouncer" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 3, fill: '#10b981' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs mb-1">
            <ShieldAlert className="w-4 h-4" />
            Falha Estrutural
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Sem pooling, cada conexão gasta ~10MB de RAM. 5.000 clientes exigem 50GB só para gerenciar sockets. O banco rejeita conexões e a latência vai ao infinito (Timeouts).
          </p>
        </div>
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
            <Zap className="w-4 h-4" />
            Multiplexação Ativa
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            O PgBouncer enfileira milhares de conexões virtuais rápidas e distribui entre 100 conexões físicas persistentes. Latência P95 garantida abaixo de 40ms.
          </p>
        </div>
      </div>
    </div>
  );
};
