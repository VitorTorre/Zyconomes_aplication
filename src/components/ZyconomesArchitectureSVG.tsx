import React, { useState } from 'react';
import { Server, Database, Cpu, ShieldAlert, Activity, ArrowRight, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ZyconomesArchitectureSVG: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string | null>('redis');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const triggerSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(1);
    setTimeout(() => setSimulationStep(2), 800);
    setTimeout(() => setSimulationStep(3), 1600);
    setTimeout(() => {
      setSimulationStep(0);
      setIsSimulating(false);
    }, 2400);
  };

  const nodeDetails: Record<string, { title: string; subtitle: string; desc: string; metrics: string; tech: string }> = {
    redis: {
      title: "Redis Edge & Lua Script Engine",
      subtitle: "Rate Limiting & Anti-Double-Spending",
      desc: "Executa scripts Lua atômicos para bloquear requisições duplicadas e impor limites estritos de taxa (Rate Limiting) antes de atingir o banco de dados relacional.",
      metrics: "Latência < 0.8ms | 45k TPS",
      tech: "Redis 7.2 + Lua VM"
    },
    rabbitmq: {
      title: "RabbitMQ Message Broker & DLQ",
      subtitle: "Asynchronous Queue & Dead Letter Routing",
      desc: "Garante entrega garantida e reprocessamento automático de eventos financeiros com troca de mensagens assíncronas e filas de erro (DLQ).",
      metrics: "0% Message Loss | 12 Workers",
      tech: "AMQP 0-9-1 + Node.js Workers"
    },
    postgres: {
      title: "PostgreSQL 16 + PgBouncer",
      subtitle: "Relational Persistence & Connection Pooling",
      desc: "Gerencia conexões concorrentes com PgBouncer no modo transaction pooling, garantindo persistência transacional durável e integridade ACID.",
      metrics: "Max Conexões: 1000/s | ACID Safe",
      tech: "PostgreSQL 16 Enterprise Edition"
    }
  };

  return (
    <div className="bg-zinc-900 text-white rounded-2xl p-6 sm:p-10 border border-zinc-800 shadow-xl my-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Arquitetura de Alta Concorrência</span>
          <h3 className="text-2xl font-bold text-white mt-1">Ecossistema Zyconomes Engine</h3>
          <p className="text-sm text-zinc-400">Diagrama interativo em SVG demonstrando o fluxo transacional blindado.</p>
        </div>
        <button 
          onClick={triggerSimulation}
          disabled={isSimulating}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Simulando Fluxo...' : 'Disparar Teste de Carga'}</span>
        </button>
      </div>

      {/* SVG Diagram Container */}
      <div className="py-10 relative overflow-x-auto flex justify-center">
        <svg className="w-full max-w-4xl h-[320px] select-none" viewBox="0 0 900 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          
          {/* Connection Lines */}
          <path 
            d="M 180 150 L 330 150" 
            stroke={simulationStep >= 1 ? '#10B981' : '#3F3F46'} 
            strokeWidth="3" 
            strokeDasharray={simulationStep >= 1 ? 'none' : '6 6'}
            className={simulationStep >= 1 ? 'animate-pulse' : ''}
          />
          <path 
            d="M 450 150 L 600 150" 
            stroke={simulationStep >= 2 ? '#10B981' : '#3F3F46'} 
            strokeWidth="3" 
            strokeDasharray={simulationStep >= 2 ? 'none' : '6 6'}
            className={simulationStep >= 2 ? 'animate-pulse' : ''}
          />

          {/* Animated Packet */}
          {simulationStep === 1 && (
            <circle cx="255" cy="150" r="8" fill="#10B981" className="animate-ping" />
          )}
          {simulationStep === 2 && (
            <circle cx="525" cy="150" r="8" fill="#10B981" className="animate-ping" />
          )}

          {/* Node 1: Redis */}
          <g 
            onClick={() => setActiveNode('redis')}
            className="cursor-pointer group"
          >
            <rect 
              x="60" y="90" width="120" height="120" rx="16" 
              fill={activeNode === 'redis' ? '#18181B' : '#09090B'} 
              stroke={activeNode === 'redis' ? '#10B981' : '#27272A'} 
              strokeWidth="2"
              className="transition-all group-hover:stroke-emerald-500"
            />
            <circle cx="120" cy="130" r="22" fill="#27272A" />
            <text x="120" y="137" textAnchor="middle" fill="#10B981" fontSize="16" fontWeight="bold">⚡</text>
            <text x="120" y="175" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">Redis</text>
            <text x="120" y="193" textAnchor="middle" fill="#A1A1AA" fontSize="10">Edge & Lua</text>
          </g>

          {/* Node 2: RabbitMQ */}
          <g 
            onClick={() => setActiveNode('rabbitmq')}
            className="cursor-pointer group"
          >
            <rect 
              x="330" y="90" width="120" height="120" rx="16" 
              fill={activeNode === 'rabbitmq' ? '#18181B' : '#09090B'} 
              stroke={activeNode === 'rabbitmq' ? '#10B981' : '#27272A'} 
              strokeWidth="2"
              className="transition-all group-hover:stroke-emerald-500"
            />
            <circle cx="390" cy="130" r="22" fill="#27272A" />
            <text x="390" y="137" textAnchor="middle" fill="#10B981" fontSize="16" fontWeight="bold">📨</text>
            <text x="390" y="175" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">RabbitMQ</text>
            <text x="390" y="193" textAnchor="middle" fill="#A1A1AA" fontSize="10">Queue & DLQ</text>
          </g>

          {/* Node 3: PostgreSQL */}
          <g 
            onClick={() => setActiveNode('postgres')}
            className="cursor-pointer group"
          >
            <rect 
              x="600" y="90" width="120" height="120" rx="16" 
              fill={activeNode === 'postgres' ? '#18181B' : '#09090B'} 
              stroke={activeNode === 'postgres' ? '#10B981' : '#27272A'} 
              strokeWidth="2"
              className="transition-all group-hover:stroke-emerald-500"
            />
            <circle cx="660" cy="130" r="22" fill="#27272A" />
            <text x="660" y="137" textAnchor="middle" fill="#10B981" fontSize="16" fontWeight="bold">🗄️</text>
            <text x="660" y="175" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">PostgreSQL</text>
            <text x="660" y="193" textAnchor="middle" fill="#A1A1AA" fontSize="10">PgBouncer Pool</text>
          </g>

        </svg>
      </div>

      {/* Selected Node Details Panel */}
      {activeNode && nodeDetails[activeNode] && (
        <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{nodeDetails[activeNode].subtitle}</span>
              <h4 className="text-lg font-bold text-white mt-0.5">{nodeDetails[activeNode].title}</h4>
            </div>
            <div className="bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-mono text-emerald-300">
              {nodeDetails[activeNode].metrics}
            </div>
          </div>
          <p className="text-sm text-zinc-300 mt-4 leading-relaxed">
            {nodeDetails[activeNode].desc}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-semibold text-white">Stack Tecnológica:</span>
            <span className="bg-zinc-900 px-2.5 py-1 rounded-md text-zinc-300 border border-zinc-800 font-mono">{nodeDetails[activeNode].tech}</span>
          </div>
        </div>
      )}
    </div>
  );
};
