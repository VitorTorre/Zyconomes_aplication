import React, { useState } from 'react';
import { REQUIREMENTS_LIST } from '../services/zyconomesEngine';
import { 
  CheckCircle2, 
  FileCheck, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Filter
} from 'lucide-react';

export const RequirementsMatrix: React.FC = () => {
  const [filterType, setFilterType] = useState<'ALL' | 'RF' | 'RNF'>('ALL');

  const filteredRequirements = REQUIREMENTS_LIST.filter(item => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#222] p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest mb-1.5">
              <FileCheck className="w-3 h-3 text-emerald-500" />
              FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS MATRIX (SPIRAL TRACEABILITY)
            </div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
              Formal Engineering Specification & Validation Criteria
            </h2>
            <p className="text-[9px] text-zinc-500 mt-1 max-w-3xl uppercase tracking-widest">
              Every functional and non-functional requirement features measurable metrics with direct mapping to Spiral Model cycles.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#111] p-1 border border-[#333]">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-[9px] uppercase tracking-widest transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              ALL ({REQUIREMENTS_LIST.length})
            </button>
            <button
              onClick={() => setFilterType('RF')}
              className={`px-3 py-1.5 text-[9px] uppercase tracking-widest transition-colors cursor-pointer ${
                filterType === 'RF' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              FUNC (RF)
            </button>
            <button
              onClick={() => setFilterType('RNF')}
              className={`px-3 py-1.5 text-[9px] uppercase tracking-widest transition-colors cursor-pointer ${
                filterType === 'RNF' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              NON-FUNC (RNF)
            </button>
          </div>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="border border-[#222] bg-[#0A0A0A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[9px] uppercase tracking-widest">
            <thead className="bg-black text-zinc-500 border-b border-[#222]">
              <tr>
                <th className="p-4 font-bold">Code</th>
                <th className="p-4 font-bold">Requirement Title</th>
                <th className="p-4 font-bold">Behavior Description</th>
                <th className="p-4 font-bold">Target Metric</th>
                <th className="p-4 font-bold">Validation Method</th>
                <th className="p-4 font-bold">Spiral Cycle</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] bg-black">
              {filteredRequirements.map((req) => (
                <tr key={req.code} className="hover:bg-[#111] transition-colors">
                  <td className="p-4 font-bold">
                    <span className={`px-2 py-1 ${
                      req.type === 'RF' 
                        ? 'bg-[#111] text-blue-500 border border-blue-500/30' 
                        : 'bg-[#111] text-purple-500 border border-purple-500/30'
                    }`}>
                      {req.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-zinc-200">{req.title}</td>
                  <td className="p-4 text-zinc-400 max-w-xs">{req.description}</td>
                  <td className="p-4 text-amber-500 font-bold">{req.targetMetric}</td>
                  <td className="p-4 text-zinc-500">{req.verificationMethod}</td>
                  <td className="p-4 text-zinc-300">
                    <span className="bg-[#111] px-2 py-1 border border-[#333]">
                      {req.spiralIteration.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-[9px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
