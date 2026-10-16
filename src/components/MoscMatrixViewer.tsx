import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Database, 
  Eye, 
  Play, 
  CheckCircle2, 
  Edit3, 
  MessageSquare, 
  FileCheck, 
  Lock, 
  AlertOctagon, 
  Search, 
  ArrowRight,
  Filter,
  Layers,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOSC_ZYC_MATRIX, MOSC_ZYC_PIPELINE_STAGES, MoscOperatorDefinition, MoscOperatorId } from '../types/mosc';

export const MoscMatrixViewer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<MoscOperatorDefinition | null>(null);

  const filteredOperators = MOSC_ZYC_MATRIX.filter(op => {
    if (selectedCategory !== 'ALL' && op.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        op.title.toLowerCase().includes(q) ||
        op.centralFunction.toLowerCase().includes(q) ||
        op.riskMitigationRule.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryBadge = (category: MoscOperatorDefinition['category']) => {
    switch (category) {
      case 'HUMANO_EXTERNO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Cliente / Externo</span>;
      case 'HUMANO_OPERACIONAL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Operacional</span>;
      case 'HUMANO_ESPECIALISTA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Especialista CFP</span>;
      case 'HUMANO_GOVERNANCA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Governança / SecOps</span>;
      case 'SISTEMA_AUTOMATIZADO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-200 dark:bg-zinc-700 dark:text-zinc-100">Motor Automatizado</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Principle Banner */}
      <div className="bg-gradient-to-br from-[#0c1033] to-[#1A1F71] text-white rounded-2xl p-6 sm:p-8 border border-blue-900/60 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-white/10 text-emerald-400 border border-white/10 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              MOSC-ZYC v1.0
            </span>
            <span className="text-xs text-blue-200 font-mono">
              Matriz Operacional Coordenativa da Zyconomes
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Governança em Profundidade: Quem Pode Fazer o Quê, Sob Qual Evidência.
          </h2>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Princípio Central de Governança
            </p>
            <p className="text-sm sm:text-base font-serif italic text-zinc-200">
              "Quanto maior o impacto potencial de uma ação, maior deve ser o nível de autorização, rastreabilidade e revisão humana."
            </p>
          </div>
        </div>

        {/* Decorative Grid */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 11-Stage Pipeline Progression */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1A1F71] dark:text-emerald-400" />
              Pipeline Operacional Canônico em 11 Estágios
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Fluxo obrigatório de passagem de dados e governança antes de qualquer decisão patrimonial.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
          {MOSC_ZYC_PIPELINE_STAGES.map((st) => (
            <div 
              key={st.step}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between group hover:border-[#1A1F71] dark:hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 mb-1">
                <span>0{st.step}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" />
              </div>
              <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{st.name}</div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar operador, função ou regra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#1A1F71] dark:focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-bold">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-[#1A1F71] text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            Todos (12)
          </button>
          <button
            onClick={() => setSelectedCategory('HUMANO_OPERACIONAL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'HUMANO_OPERACIONAL'
                ? 'bg-[#1A1F71] text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            Operação
          </button>
          <button
            onClick={() => setSelectedCategory('HUMANO_ESPECIALISTA')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'HUMANO_ESPECIALISTA'
                ? 'bg-[#1A1F71] text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            Especialistas
          </button>
          <button
            onClick={() => setSelectedCategory('HUMANO_GOVERNANCA')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'HUMANO_GOVERNANCA'
                ? 'bg-[#1A1F71] text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            Governança
          </button>
          <button
            onClick={() => setSelectedCategory('SISTEMA_AUTOMATIZADO')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'SISTEMA_AUTOMATIZADO'
                ? 'bg-[#1A1F71] text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            Motores
          </button>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-4 sm:px-6">Operador / Classe</th>
                <th className="py-4 px-4">Função Central</th>
                <th className="py-4 px-4">Pode Visualizar</th>
                <th className="py-4 px-4">Pode Executar</th>
                <th className="py-4 px-4">Pode Aprovar</th>
                <th className="py-4 px-4">Altera Dados Fin.</th>
                <th className="py-4 px-4">Interage Cliente</th>
                <th className="py-4 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredOperators.map((op) => (
                <tr 
                  key={op.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="py-4 px-4 sm:px-6">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {op.title}
                    </div>
                    <div className="mt-1">
                      {getCategoryBadge(op.category)}
                    </div>
                  </td>

                  <td className="py-4 px-4 text-zinc-600 dark:text-zinc-300 max-w-xs">
                    {op.centralFunction}
                  </td>

                  <td className="py-4 px-4 text-zinc-600 dark:text-zinc-400 text-xs">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3 text-blue-500 shrink-0" />
                      {op.canView}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-zinc-600 dark:text-zinc-400 text-xs">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Play className="w-3 h-3 text-emerald-500 shrink-0" />
                      {op.canExecute}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-zinc-600 dark:text-zinc-400 text-xs">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-purple-500 shrink-0" />
                      {op.canApprove}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-xs font-mono">
                    {op.canAlterFinancialData.toLowerCase().includes('não') || op.canAlterFinancialData.toLowerCase().includes('vedação') ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                        {op.canAlterFinancialData}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {op.canAlterFinancialData}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-xs font-mono font-bold text-center">
                    {op.canInteractWithClient === 'Sim' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Sim</span>
                    ) : op.canInteractWithClient === 'Não' ? (
                      <span className="text-zinc-400">Não</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">{op.canInteractWithClient}</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => setSelectedOperator(op)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operator Detail Modal */}
      <AnimatePresence>
        {selectedOperator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                      {selectedOperator.title}
                    </h3>
                    {getCategoryBadge(selectedOperator.category)}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
                    ID: {selectedOperator.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOperator(null)}
                  className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Função Central</label>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedOperator.centralFunction}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Requisito de Evidência</label>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">{selectedOperator.evidenceRequirement}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">Nível de Autorização Exigido</label>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">{selectedOperator.requiredAuthorizationLevel}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Alçadas e Permissões</label>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex gap-2"><strong className="text-zinc-600 dark:text-zinc-400 shrink-0">Visualização:</strong> <span>{selectedOperator.canView}</span></div>
                    <div className="flex gap-2"><strong className="text-zinc-600 dark:text-zinc-400 shrink-0">Execução:</strong> <span>{selectedOperator.canExecute}</span></div>
                    <div className="flex gap-2"><strong className="text-zinc-600 dark:text-zinc-400 shrink-0">Aprovação:</strong> <span>{selectedOperator.canApprove}</span></div>
                    <div className="flex gap-2"><strong className="text-zinc-600 dark:text-zinc-400 shrink-0">Alteração Financeira:</strong> <span>{selectedOperator.canAlterFinancialData}</span></div>
                    <div className="flex gap-2"><strong className="text-zinc-600 dark:text-zinc-400 shrink-0">Contato com Cliente:</strong> <span>{selectedOperator.canInteractWithClient}</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4" />
                    Regra Estrita de Mitigação de Risco & Não-Escalada Lateral
                  </label>
                  <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    {selectedOperator.riskMitigationRule}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedOperator(null)}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#1A1F71] text-white hover:bg-[#121652]"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
