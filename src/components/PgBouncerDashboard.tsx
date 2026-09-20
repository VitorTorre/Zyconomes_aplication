import React, { useMemo } from 'react';
import { SystemMetrics } from '../types/zyconomes';
import { Database, Activity, GitCommit, GitPullRequest, Hash } from 'lucide-react';

interface Props {
  metrics: SystemMetrics;
}

export const PgBouncerDashboard: React.FC<Props> = ({ metrics }) => {
  const currentTps = metrics.tps ?? metrics.current_rps ?? 0;

  // Simulate active connections and wait queue depth based on TPS
  const activeConnections = useMemo(() => {
    if (currentTps === 0) return 1;
    if (currentTps < 100) return Math.min(20, Math.max(2, Math.floor(currentTps / 5)));
    return 20; // Pool max
  }, [currentTps]);

  const waitQueueDepth = useMemo(() => {
    if (currentTps > 200) {
      return Math.floor((currentTps - 200) / 2);
    }
    return 0;
  }, [currentTps]);

  const poolHealth = activeConnections >= 20 ? 'CRITICAL' : activeConnections > 15 ? 'WARNING' : 'HEALTHY';
  const poolColor = poolHealth === 'CRITICAL' ? 'text-red-500' : poolHealth === 'WARNING' ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="border border-[#222] bg-[#0A0A0A] shadow-lg flex flex-col font-mono relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Database className="w-32 h-32 text-zinc-500" />
      </div>

      <div className="px-4 py-3 bg-black border-b border-[#222] flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">
            PgBouncer Telemetry (Transaction Pool)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">POOL SIZE: 20</span>
        </div>
      </div>

      <div className="p-4 flex-1 relative z-10 flex flex-col gap-4">
        
        <div className="grid grid-cols-3 gap-3">
          {/* Active Connections */}
          <div className="bg-[#111] border border-[#333] p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <GitCommit className="w-3 h-3" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Active Conns</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${poolColor}`}>{activeConnections}</span>
              <span className="text-[10px] text-zinc-600">/ 20</span>
            </div>
            <div className="w-full bg-[#222] h-1 mt-2">
              <div 
                className={`h-full ${poolHealth === 'CRITICAL' ? 'bg-red-500' : poolHealth === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                style={{ width: `${(activeConnections / 20) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Wait Queue */}
          <div className="bg-[#111] border border-[#333] p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <GitPullRequest className="w-3 h-3" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Wait Queue</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${waitQueueDepth > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {waitQueueDepth}
              </span>
              <span className="text-[10px] text-zinc-600">reqs</span>
            </div>
            <div className="text-[8px] text-zinc-500 mt-2 uppercase tracking-widest">
              {waitQueueDepth > 0 ? 'Queuing requests...' : 'Direct routing'}
            </div>
          </div>

          {/* TPS Load */}
          <div className="bg-[#111] border border-[#333] p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <Activity className="w-3 h-3" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Current Load</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{currentTps}</span>
              <span className="text-[10px] text-zinc-600">TPS</span>
            </div>
            <div className="text-[8px] text-zinc-500 mt-2 uppercase tracking-widest">
              Rate Limiter Active
            </div>
          </div>
        </div>

        {/* Protection Explainer */}
        <div className="bg-[#05111a] border border-[#0f3453] p-3 mt-auto">
          <div className="flex gap-2">
            <Hash className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                Multiplexing & Rate Limit Protection
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                PgBouncer limits active PostgreSQL connections to 20, multiplexing thousands of incoming requests. 
                Redis Rate Limiter blocks abusive IPs before they reach the pool.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
