import React from 'react';
import { SystemMetrics } from '../types/zyconomes';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldX } from 'lucide-react';

interface Props {
  metrics: SystemMetrics;
}

export const CircuitBreakerPanel: React.FC<Props> = ({ metrics }) => {
  const getStatusColor = (state: 'CLOSED' | 'OPEN' | 'HALF-OPEN') => {
    switch (state) {
      case 'CLOSED': return 'text-emerald-500 border-emerald-500/30';
      case 'OPEN': return 'text-red-500 border-red-500/30';
      case 'HALF-OPEN': return 'text-amber-500 border-amber-500/30';
      default: return 'text-zinc-500 border-zinc-500/30';
    }
  };

  const getStatusIcon = (state: 'CLOSED' | 'OPEN' | 'HALF-OPEN') => {
    switch (state) {
      case 'CLOSED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'OPEN': return <ShieldX className="w-5 h-5 text-red-500" />;
      case 'HALF-OPEN': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="border border-[#222] bg-[#0A0A0A] p-4">
      <div className="flex items-center gap-2 mb-4 border-b border-[#222] pb-3">
        <ShieldAlert className="w-4 h-4 text-purple-500" />
        <h3 className="font-bold text-[11px] text-zinc-200 uppercase tracking-widest">
          Circuit Breaker Telemetry (Resilience)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Worker Circuit Breaker */}
        <div className={`p-4 border bg-black flex flex-col gap-3 ${getStatusColor(metrics.worker_circuit_state)}`}>
          <div className="flex justify-between items-center">
            <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest">Async Worker (OTP/Email)</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${getStatusColor(metrics.worker_circuit_state)}`}>
              {metrics.worker_circuit_state}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusIcon(metrics.worker_circuit_state)}
            <div className="flex-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Failure Count</div>
              <div className="text-lg font-mono font-bold text-zinc-200">{metrics.worker_circuit_failures} / 5</div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Cooldown</div>
              <div className="text-lg font-mono font-bold text-zinc-200">{metrics.worker_circuit_cooldown}s</div>
            </div>
          </div>
        </div>

        {/* DB Circuit Breaker */}
        <div className={`p-4 border bg-black flex flex-col gap-3 ${getStatusColor(metrics.db_circuit_state)}`}>
          <div className="flex justify-between items-center">
            <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest">PostgreSQL Pool (PgBouncer)</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${getStatusColor(metrics.db_circuit_state)}`}>
              {metrics.db_circuit_state}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusIcon(metrics.db_circuit_state)}
            <div className="flex-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Failure Count</div>
              <div className="text-lg font-mono font-bold text-zinc-200">{metrics.db_circuit_failures} / 5</div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Cooldown</div>
              <div className="text-lg font-mono font-bold text-zinc-200">{metrics.db_circuit_cooldown}s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
