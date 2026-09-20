import React, { useState } from 'react';
import { 
  SpiralIteration, 
  SpiralIterationId 
} from '../types/zyconomes';
import { 
  CheckCircle2, 
  RefreshCw, 
  FileCode2, 
  ShieldCheck, 
  Activity, 
  Play, 
  Cpu, 
  Layers, 
  FileText,
  AlertCircle,
  Clock
} from 'lucide-react';

interface Props {
  iterations: SpiralIteration[];
  onRunCycleValidation: (cycleId: SpiralIterationId) => void;
  isRunningTest: boolean;
}

export const SpiralPipelineView: React.FC<Props> = ({ 
  iterations, 
  onRunCycleValidation, 
  isRunningTest 
}) => {
  const [selectedCycleId, setSelectedCycleId] = useState<SpiralIterationId>('spiral-1');
  const selectedCycle = iterations.find(it => it.id === selectedCycleId) || iterations[0];

  return (
    <div className="space-y-4 font-mono">
      {/* Intro Header */}
      <div className="bg-[#0A0A0A] border border-[#222] p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest mb-1">
              <RefreshCw className="w-3 h-3 text-amber-500 animate-spin-slow" />
              INCREMENTAL SPIRAL DEVELOPMENT MODEL
            </div>
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">
              Interleaved Spec, Dev & Validation Cycles
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 max-w-3xl uppercase">
              Each spiral mitigates critical ecosystem risk before advancing. Zero theoretical builds: every cycle produces validated, executable artifacts and load tests.
            </p>
          </div>
          
          <button
            onClick={() => onRunCycleValidation(selectedCycleId)}
            disabled={isRunningTest}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-[#333] disabled:text-zinc-500 text-black px-4 py-2 text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-widest"
          >
            {isRunningTest ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Validating Cycle...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Execute Validation Run
              </>
            )}
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {iterations.map((cycle) => {
            const isSelected = cycle.id === selectedCycleId;
            return (
              <button
                key={cycle.id}
                onClick={() => setSelectedCycleId(cycle.id)}
                className={`text-left p-3 border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-amber-500 bg-[#111]' 
                    : 'border-[#333] bg-[#0A0A0A] hover:bg-[#111] hover:border-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 tracking-widest ${
                    isSelected ? 'bg-amber-500 text-black' : 'bg-[#222] text-zinc-500'
                  }`}>
                    CYCLE 0{cycle.loopNumber}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold tracking-widest uppercase">
                    <CheckCircle2 className="w-3 h-3" />
                    {cycle.phase}
                  </span>
                </div>
                <div className="font-bold text-[11px] text-zinc-200 line-clamp-1 uppercase">
                  {cycle.title.split(':')[1] || cycle.title}
                </div>
                <div className="text-[9px] text-zinc-500 line-clamp-1 mt-1 uppercase tracking-widest">
                  {cycle.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Interleaved Phases Detail (Specification, Development, Validation) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Specification Phase */}
        <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-4">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-widest border-b border-[#222] pb-2">
            <FileText className="w-3 h-3" />
            <span>1. SPECIFICATION & RISK ANALYSIS</span>
          </div>

          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-blue-500" /> Cycle Objectives:
            </div>
            <ul className="space-y-1.5 text-[10px] text-zinc-300">
              {selectedCycle.specification.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-[#222]">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-500" /> Critical Risk Identified:
            </div>
            <p className="text-[10px] text-zinc-400 bg-[#111] p-3 border border-[#333]">
              {selectedCycle.specification.riskAnalysis}
            </p>
          </div>

          <div className="pt-3 border-t border-[#222]">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Acceptance Criteria:
            </div>
            <ul className="space-y-1 text-[10px] text-zinc-400">
              {selectedCycle.specification.acceptedCriteria.map((crit, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{crit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Development Phase */}
        <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-4">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest border-b border-[#222] pb-2">
            <Cpu className="w-3 h-3" />
            <span>2. DEVELOPMENT & ARTIFACTS</span>
          </div>

          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <FileCode2 className="w-3 h-3 text-amber-500" /> Components & Modules:
            </div>
            <ul className="space-y-1 text-[10px] text-zinc-300">
              {selectedCycle.development.componentsBuilt.map((comp, i) => (
                <li key={i} className="flex items-start gap-1.5 bg-[#111] px-2 py-1.5 border border-[#333]">
                  <span className="text-amber-500 font-mono">▸</span>
                  <span className="font-mono text-zinc-200">{comp}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-[#222]">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Repository Artifacts:
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedCycle.development.artifacts.map((art, i) => (
                <span key={i} className="text-[9px] font-mono bg-[#111] text-amber-500 px-1.5 py-0.5 border border-[#333]">
                  {art}
                </span>
              ))}
            </div>
          </div>

          {selectedCycle.development.codeSnippets[0] && (
            <div className="pt-3 border-t border-[#222]">
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                <span>Snippet: {selectedCycle.development.codeSnippets[0].filename}</span>
              </div>
              <pre className="text-[9px] font-mono bg-[#111] p-3 text-zinc-300 overflow-x-auto border border-[#333] max-h-36">
                {selectedCycle.development.codeSnippets[0].code}
              </pre>
            </div>
          )}
        </div>

        {/* 3. Validation Phase */}
        <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-4">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest border-b border-[#222] pb-2">
            <ShieldCheck className="w-3 h-3" />
            <span>3. VALIDATION, TESTS & BENCHMARK</span>
          </div>

          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-500" /> Automated Test Suite:
            </div>
            <div className="space-y-1.5">
              {selectedCycle.validation.tests.map((test, i) => (
                <div key={i} className="bg-[#111] p-2 border border-[#333] flex items-center justify-between text-[10px]">
                  <div>
                    <div className="font-bold text-zinc-200 uppercase">{test.name}</div>
                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                      TYPE: {test.type} • METRIC: <span className="text-emerald-500 font-mono">{test.metric}</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-black text-emerald-500 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-widest">
                    PASSED
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#222]">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-blue-500" /> Benchmark Results:
            </div>
            <p className="text-[10px] text-zinc-300 bg-[#111] p-3 border border-[#333]">
              {selectedCycle.validation.benchmarkResult}
            </p>
          </div>

          <div className="p-3 bg-black border border-emerald-500/30 flex items-center justify-between">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Audit Status:</span>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {selectedCycle.validation.auditStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
