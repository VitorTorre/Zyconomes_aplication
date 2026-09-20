import React, { useState } from 'react';
import { Target, Layers, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck, Zap, LineChart, FileText } from 'lucide-react';

export const ZyconomesExecutiveManifesto: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'strategy' | 'dilemma' | 'stages' | 'services'>('strategy');

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-12 my-10 shadow-lg">
      <div className="text-center max-w-4xl mx-auto mb-12 border-b border-zinc-100 pb-10">
        <span className="text-xs font-black tracking-widest text-[#1A1F71] uppercase bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
          Documento Diretivo Executivo
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 mt-6 tracking-tight leading-tight">
          Zyconomes: Plano de Negócios e Roteiro Execucional
        </h1>
        <p className="text-xl text-zinc-500 mt-4 font-light italic">
          "Conquiste em partes singulares para alcançar a riqueza — aquele patamar almejado há tempos, planejando cada estágio e preparando-se para alcançá-lo."
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <button 
          onClick={() => setActiveSection('strategy')}
          className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${activeSection === 'strategy' ? 'bg-[#1A1F71] text-white shadow-md' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
        >
          A Estratégia Fundadora
        </button>
        <button 
          onClick={() => setActiveSection('dilemma')}
          className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${activeSection === 'dilemma' ? 'bg-[#1A1F71] text-white shadow-md' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
        >
          O Dilema Empresarial
        </button>
        <button 
          onClick={() => setActiveSection('stages')}
          className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${activeSection === 'stages' ? 'bg-[#1A1F71] text-white shadow-md' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
        >
          Matriz de 10 Estágios
        </button>
        <button 
          onClick={() => setActiveSection('services')}
          className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${activeSection === 'services' ? 'bg-[#1A1F71] text-white shadow-md' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
        >
          Arquitetura e Portfólio
        </button>
      </div>

      {/* Content Areas */}
      <div className="max-w-5xl mx-auto">
        
        {/* SECTION 1: STRATEGY */}
        {activeSection === 'strategy' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-50 p-8 rounded-2xl border border-zinc-200">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-[#1A1F71]" />
                <h3 className="text-2xl font-bold text-zinc-900">O Insight Fundador</h3>
              </div>
              <p className="text-zinc-700 leading-relaxed text-lg">
                A Zyconomes não tentará conquistar o mercado uma parcela do mercado e sim integrar-se a ele. Conquistará uma unidade de valor por vez, validará essa conquista com evidências, transformará cada vitória em ativo acumulado e usará esse prestígio conquistado para financiar e se preparar o próximo.
              </p>
              
              <div className="mt-8 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Fórmula Operacional</h4>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-800">
                  <span className="bg-blue-50 text-[#1A1F71] px-3 py-1.5 rounded-lg border border-blue-100">Parte singular</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                  <span className="bg-zinc-100 px-3 py-1.5 rounded-lg">Validação</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                  <span className="bg-zinc-100 px-3 py-1.5 rounded-lg">Receita/Ativo</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                  <span className="bg-zinc-100 px-3 py-1.5 rounded-lg">Aprendizado</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">Próxima parte</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                  <span className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg">Escala</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-rose-200 bg-rose-50 p-6 rounded-2xl">
                <h4 className="text-rose-800 font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> O que NÃO somos</h4>
                <ul className="space-y-2 text-rose-900/80 text-sm">
                  <li>• Somente mais um app de controle financeiro banal;</li>
                  <li>• Outra coleção de calculadoras isoladas;</li>
                  <li>• Mais um site genérico de notícias;</li>
                  <li>• Muito meno um ERP empresarial inchado e complexo.</li>
                </ul>
              </div>
              <div className="border border-emerald-200 bg-emerald-50 p-6 rounded-2xl">
                <h4 className="text-emerald-800 font-bold mb-3 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> O que SOMOS</h4>
                <ul className="space-y-2 text-emerald-900/80 text-sm">
                  <li>• Plataforma de inteligência e cenários de decisão;</li>
                  <li>• Sistema 100% auditável então aqui você entenderá o ("como chegamos até aqui?");</li>
                  <li>• Motor que responde "O que acontece se eu fizer X nesta situação ou naquela ocasião?";</li>
                  <li>• Ferramenta de informação orientada à Ação.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: THE DILEMMA */}
        {activeSection === 'dilemma' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-zinc-900 text-white p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-emerald-400">O Dilema Central Resolvido</h3>
              <p className="text-zinc-300 leading-relaxed mb-8">
                "Devemos construir a plataforma gigante desde o início, ou conquistar uma parte, torná-la viável e usar de base?"
                <br/>A resolução: Transformar o caminho da realidade no combustível para a grande visão.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div className="border border-zinc-700 bg-zinc-800/50 p-6 rounded-xl">
                  <h4 className="font-bold text-center mb-4 text-zinc-100 uppercase tracking-widest">A Visão Grande (Destino)</h4>
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <span>17 Serviços Integrados</span>
                    <ArrowRight className="w-4 h-4 rotate-90 my-1 text-zinc-600" />
                    <span>Grande Plataforma de Inteligência</span>
                    <ArrowRight className="w-4 h-4 rotate-90 my-1 text-zinc-600" />
                    <span>90.000 Acessos / Grande Audiência</span>
                    <ArrowRight className="w-4 h-4 rotate-90 my-1 text-zinc-600" />
                    <span className="text-white font-bold">Arquitetura de Escala</span>
                  </div>
                </div>
                
                <div className="border border-emerald-500/30 bg-emerald-900/10 p-6 rounded-xl">
                  <h4 className="font-bold text-center mb-4 text-emerald-400 uppercase tracking-widest">A Realidade (O Caminho)</h4>
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <span>1 Problema, 1 Solução</span>
                    <ArrowRight className="w-4 h-4 rotate-90 my-1 text-zinc-600" />
                    <span>1 Grupo Específico de Usuários</span>
                    <ArrowRight className="w-4 h-4 rotate-90 my-1 text-zinc-600" />
                    <span>1 Métrica Comprovada</span>
                    <ArrowRight className="w-4 h-4 rotate-90 my-1 text-zinc-600" />
                    <span className="text-emerald-400 font-bold">1 Fonte de Receita Validada</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2"><Layers className="w-5 h-5"/> O Ciclo Econômico Virtuoso</h4>
              <p className="text-sm text-blue-800 font-mono">
                Aquisição → Utilidade → Confiança → Retenção → Monetização → Receita → Reinvestimento → Produto Melhor → Expansão.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: 10 STAGES */}
        {activeSection === 'stages' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200">
                    <th className="p-4 font-bold text-zinc-600 text-sm">Estágio</th>
                    <th className="p-4 font-bold text-zinc-600 text-sm">Conquista (Objetivo)</th>
                    <th className="p-4 font-bold text-zinc-600 text-sm">Evidência / Ativo Produzido</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { s: 1, c: "Problema validado", a: "Usuários reconhecem a necessidade (Conhecimento)" },
                    { s: 2, c: "Solução (Ferramenta funcional)", a: "MVP funcionando (Código e Metodologia)" },
                    { s: 3, c: "Utilidade", a: "Uso real (Dados de comportamento)" },
                    { s: 4, c: "Retenção", a: "Usuários retornam (Prova de valor)" },
                    { s: 5, c: "Primeira monetização", a: "Primeiros pagamentos (Evidência econômica)" },
                    { s: 6, c: "Repetição", a: "Processo previsível (Playbook operacional)" },
                    { s: 7, c: "Aquisição previsível", a: "Canal funcionando (Máquina de tração)" },
                    { s: 8, c: "Expansão do produto", a: "Novos serviços validados" },
                    { s: 9, c: "Escala", a: "Infraestrutura adequada (Crescimento sustentado)" },
                    { s: 10, c: "Ecossistema", a: "Múltiplas fontes de valor e riqueza alcançada" }
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="p-4 font-bold text-[#1A1F71]">0{row.s}</td>
                      <td className="p-4 text-zinc-800 font-medium">{row.c}</td>
                      <td className="p-4 text-zinc-500">{row.a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 bg-zinc-900 text-white p-4 rounded-xl text-center text-sm">
              <strong>Princípio Operacional:</strong> Não saltar um estágio simplesmente porque o estágio seguinte parece mais interessante.
            </div>
          </div>
        )}

        {/* SECTION 4: ARCHITECTURE & SERVICES */}
        {activeSection === 'services' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Camada Gratuita (Aquisição)</h4>
                <ul className="space-y-3 text-sm text-emerald-900">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 1. Diagnóstico financeiro pessoal</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 2. Simulador de juros compostos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 3. Simulador de reserva de emergência</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 4. Simulador de financiamento/dívida</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 5. Simulador de patrimônio</li>
                </ul>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-400"/> Camada Premium (Monetização)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-zinc-400">
                  <p>6. Planejador financeiro</p>
                  <p>7. Planejador de metas</p>
                  <p>8. Sim. Independência</p>
                  <p>9. Análise Endividamento</p>
                  <p>10. Concentração Patrimônio</p>
                  <p>11. Org. Investimentos</p>
                  <p>12. Dashboard Patrimonial</p>
                  <p>13. Sim. Aposentadoria</p>
                  <p>14. Fluxo de Caixa Pessoal</p>
                  <p>15. Diagnóstico Empresarial</p>
                  <p>16. Fluxo Empresarial</p>
                  <p>17. Cenário Stress PME</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-[#1A1F71]"/> Arquitetura Empresarial e Regras Base</h4>
              <p className="text-sm text-zinc-600 mb-4">
                <strong>O Cérebro (Sistema de Insights):</strong> Calculadora → Analisador → Comparador → Simulador → Gerador de Insights → Inteligência Financeira.
              </p>
              <div className="bg-white border border-rose-100 p-4 rounded-xl text-sm">
                <strong className="text-rose-700">Regra Fundamental de Engenharia:</strong> Não construir infraestrutura de escala antes de possuir uma necessidade de escala.
                <br/><br/>
                <span className="text-emerald-700">✓ Correto: Produto → Usuários → Carga Real → Gargalo → Infraestrutura.</span><br/>
                <span className="text-rose-500">✗ Incorreto: Infraestrutura → Produto → Esperança de Usuários.</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
