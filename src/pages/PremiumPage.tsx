import React from 'react';
import { Sparkles, CheckCircle, ShieldCheck, Zap, ArrowLeft, Lock, Award } from 'lucide-react';
import { PremiumButton } from '../components/PremiumButton';

export const PremiumPage: React.FC = () => {
  return (
    <div className="min-h-[85vh] py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <a
          href="#home"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </a>
      </div>

      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#1A1F71] dark:text-emerald-400 bg-blue-50 dark:bg-zinc-800 px-4 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Zyconomes Pro
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
          Inteligência Financeira Sem Limites.
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
          Tenha acesso completo aos motores matemáticos avançados, simulações ilimitadas na nuvem e recomendações preditivas guiadas por Inteligência Artificial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* FREE PLAN */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Plano Gratuito</h3>
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-full font-medium">Básico</span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100">R$ 0</span>
              <span className="text-xs text-zinc-500 ml-1">/ para sempre</span>
            </div>
            <ul className="space-y-3.5 text-sm text-zinc-600 dark:text-zinc-400 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Acesso a todas as calculadoras básicas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Simulações locais ilimitadas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Artigos educativos e blog</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-400 dark:text-zinc-600 line-through">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Cockpit Agente IA (15 Anos Multi-Ciclos)</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-400 dark:text-zinc-600 line-through">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Salvar simulações na nuvem</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-400 dark:text-zinc-600 line-through">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Alocação preditiva via Gemini AI</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => { window.location.hash = 'home'; }}
            className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold py-3.5 px-4 rounded-xl transition-all text-sm text-center cursor-pointer"
          >
            Continuar no Gratuito
          </button>
        </div>

        {/* PREMIUM PLAN */}
        <div className="bg-gradient-to-b from-blue-50/50 to-white dark:from-zinc-900 dark:to-zinc-950 border-2 border-[#1A1F71] dark:border-emerald-500 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="bg-[#1A1F71] text-white dark:bg-emerald-500 dark:text-zinc-950 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow">
              <Award className="w-3.5 h-3.5" /> Mais Popular
            </span>
          </div>
          
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Zyconomes Premium</h3>
              <p className="text-xs text-zinc-500">Para quem leva patrimônio a sério</p>
            </div>
            
            <div className="mb-6 flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100">R$ 19,90</span>
              <span className="text-xs text-zinc-500">/ mês</span>
            </div>

            <ul className="space-y-3.5 text-sm text-zinc-700 dark:text-zinc-300 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-medium">Tudo do plano gratuito</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Cockpit Agente IA (15 Anos):</strong> Projeção multi-ciclos, divisão de proventos (20/25/40/15) e conformidade ISO 27001 / 25010</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Armazenamento em Nuvem:</strong> Salve e compare simulações a qualquer momento</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span><strong>IA Preditiva:</strong> Rebalanceamento inteligente e diagnóstico avançado com Gemini</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Exportação de relatórios institucionais em alta precisão</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Cancelamento a qualquer momento, sem fidelidade</span>
              </li>
            </ul>
          </div>

          <PremiumButton />
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Pagamento seguro e criptografado processado pelo Stripe. Cancele quando quiser.</span>
      </div>
    </div>
  );
};

export default PremiumPage;
