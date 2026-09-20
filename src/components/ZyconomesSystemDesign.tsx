import React, { useState } from 'react';
import { Cpu, Workflow, Code2, Database, Layout, Lock, ArrowDown, ArrowRight, Zap, Terminal } from 'lucide-react';

export const ZyconomesSystemDesign: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'flowchart' | 'pseudocode'>('architecture');

  return (
    <div className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-3xl p-6 sm:p-12 my-10 shadow-2xl">
      <div className="text-center max-w-4xl mx-auto mb-10 border-b border-zinc-800 pb-8">
        <span className="text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-900/30 px-4 py-1.5 rounded-full border border-emerald-800">
          Design de Software & Arquitetura
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white mt-6 tracking-tight leading-tight">
          Engenharia Reversa Executável (JIT)
        </h2>
        <p className="text-sm text-zinc-400 mt-4 font-light">
          Modelagem arquitetural, fluxo transacional e pseudocódigo do motor matemático Zyconomes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <button 
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'architecture' ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-zinc-800'}`}
        >
          <Cpu className="w-4 h-4" /> Arquitetura de Sistema
        </button>
        <button 
          onClick={() => setActiveTab('flowchart')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'flowchart' ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-zinc-800'}`}
        >
          <Workflow className="w-4 h-4" /> Fluxograma Operacional
        </button>
        <button 
          onClick={() => setActiveTab('pseudocode')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'pseudocode' ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-zinc-800'}`}
        >
          <Code2 className="w-4 h-4" /> Pseudocódigo dos Motores
        </button>
      </div>

      {/* Tab Contents */}
      <div className="max-w-5xl mx-auto">
        
        {/* ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center">
                <Layout className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="text-white font-bold mb-2">1. Camada de Apresentação</h4>
                <p className="text-xs text-zinc-500">React (Vite) + Tailwind CSS. Interface Institucional "Zero Fricção".</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center relative">
                <Zap className="w-8 h-8 text-emerald-400 mb-3" />
                <h4 className="text-white font-bold mb-2">2. Motor Reativo (Engine)</h4>
                <p className="text-xs text-zinc-500">Hooks (useState/useEffect) validando inputs em tempo real (Runtime).</p>
                <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-700" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center relative">
                <Database className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="text-white font-bold mb-2">3. Persistência (JIT)</h4>
                <p className="text-xs text-zinc-500">Browser LocalStorage. Retém estado financeiro sem custo de servidor.</p>
                <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-700" />
              </div>
              <div className="bg-zinc-900 border border-amber-900/30 p-6 rounded-2xl flex flex-col items-center text-center">
                <Lock className="w-8 h-8 text-amber-500 mb-3" />
                <h4 className="text-white font-bold mb-2">4. Paywall Lógico</h4>
                <p className="text-xs text-zinc-500">Isolamento de Componentes (Serviços 6 a 17) via Roteamento Condicional.</p>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-sm">
              <strong className="text-emerald-400">Padrão Arquitetural Escolhido:</strong> Monólito Modular Client-Side. <br/>
              <span className="text-zinc-400">Justificativa: Atende ao Princípio de Desenvolvimento ZYCONOMES ("Não construir infraestrutura de escala antes de possuir uma necessidade de escala"). Evita latência de rede, maximiza a retenção instantânea e zera custos de cloud na fase de validação orgânica.</span>
            </div>
          </div>
        )}

        {/* FLOWCHART */}
        {activeTab === 'flowchart' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center py-4">
            
            <div className="bg-zinc-900 border border-zinc-700 px-8 py-4 rounded-xl font-bold text-white shadow-lg w-full max-w-md text-center">
              Usuário Acessa Zyconomes (Tráfego Orgânico)
            </div>
            <ArrowDown className="w-6 h-6 text-zinc-600 my-2" />
            
            <div className="bg-zinc-900 border border-zinc-700 px-8 py-4 rounded-xl font-bold text-white shadow-lg w-full max-w-md text-center">
              Seleciona Serviço Gratuito (1 a 5)
            </div>
            <ArrowDown className="w-6 h-6 text-zinc-600 my-2" />

            <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl items-center justify-center">
              <div className="bg-zinc-800 border border-zinc-600 px-6 py-4 rounded-xl text-center w-full">
                <span className="text-xs text-zinc-400 block mb-1">Passo 3.A</span>
                <span className="text-white font-semibold">Input de Dados (Renda, Taxa)</span>
              </div>
              <ArrowRight className="hidden md:block w-6 h-6 text-zinc-600" />
              <ArrowDown className="md:hidden w-6 h-6 text-zinc-600 my-1" />
              <div className="bg-emerald-900/40 border border-emerald-700 px-6 py-4 rounded-xl text-center w-full">
                <span className="text-xs text-emerald-400 block mb-1">Passo 3.B (Engine)</span>
                <span className="text-white font-semibold">Cálculo & Salva LocalStorage</span>
              </div>
            </div>
            <ArrowDown className="w-6 h-6 text-zinc-600 my-2" />

            <div className="bg-zinc-900 border border-zinc-700 px-8 py-4 rounded-xl font-bold text-white shadow-lg w-full max-w-md text-center">
              Exibe Resultado + Bloco de Auditabilidade
            </div>
            <ArrowDown className="w-6 h-6 text-zinc-600 my-2" />

            <div className="border-2 border-dashed border-zinc-600 rounded-2xl p-6 w-full max-w-2xl text-center bg-zinc-900/30">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-4">Gatilho de Expansão (Serviços 6 a 17)</span>
              <div className="bg-amber-900/20 border border-amber-700/50 px-8 py-4 rounded-xl font-bold text-amber-500 shadow-lg inline-block">
                Paywall Inteligente (R$ 19,90) / B2B Login
              </div>
            </div>

          </div>
        )}

        {/* PSEUDOCODE */}
        {activeTab === 'pseudocode' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tool 1 */}
            <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-mono text-zinc-400">1_diagnostico.ts</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
{`function calculaDiagnostico(renda, despesa) {
  // Blindagem de Runtime
  if (renda < 0 || despesa < 0) return ERROR;
  
  const fluxoLivre = renda - despesa;
  
  // Tratamento divisão por zero
  const taxaPoupanca = renda > 0 
    ? (fluxoLivre / renda) * 100 
    : 0;

  return { fluxoLivre, taxaPoupanca };
}`}
              </pre>
            </div>

            {/* Tool 2 */}
            <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-mono text-zinc-400">2_juros_compostos.ts</span>
              </div>
              <pre className="p-4 text-xs font-mono text-blue-300 overflow-x-auto">
{`function projetaPatrimonio(pv, pmt, i_anual, anos) {
  // Conversão de Taxa Equivalente
  const i = max(0, i_anual) / 12 / 100;
  const n = max(0, anos) * 12;

  // Juros Compostos c/ Aportes
  if (i === 0) return pv + (pmt * n);

  const montante = pv * pow(1 + i, n) + 
      pmt * ((pow(1 + i, n) - 1) / i);
      
  return round(montante);
}`}
              </pre>
            </div>

            {/* Tool 4 */}
            <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-mono text-zinc-400">4_amortizacao_price.ts</span>
              </div>
              <pre className="p-4 text-xs font-mono text-rose-300 overflow-x-auto">
{`function simulaDivida(valor, taxa_aa, anos) {
  const i = max(0.01, taxa_aa) / 12 / 100;
  const n = max(1, anos) * 12;

  // Fórmula Tabela Price (PMT)
  const pmt = valor * (i * pow(1 + i, n)) / 
              (pow(1 + i, n) - 1);
              
  const custoTotal = pmt * n;
  const jurosPagos = custoTotal - valor;

  return { pmt, jurosPagos, custoTotal };
}`}
              </pre>
            </div>

            {/* Tool 5 */}
            <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-mono text-zinc-400">5_tempo_patrimonio.ts</span>
              </div>
              <pre className="p-4 text-xs font-mono text-purple-300 overflow-x-auto">
{`function calculaTempo(atual, alvo, pmt, taxa_aa) {
  if (atual >= alvo) return "Alvo Atingido";
  
  const i = max(0.01, taxa_aa) / 12 / 100;
  
  // Isolando 'n' via Logaritmo Natural
  const num = (i * alvo + pmt);
  const den = (i * atual + pmt);
  
  const meses = log(num / den) / log(1 + i);
  
  return {
    anos: floor(meses / 12),
    meses_restantes: ceil(meses % 12)
  };
}`}
              </pre>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
