import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  PieChart, 
  ExternalLink,
  ChevronDown,
  Globe
} from 'lucide-react';
import { trackEvent, trackGranularEvent } from '../lib/analytics';

export const Sucesso: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string>('investidor@zyconomes.com');
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    // 1. Atualizar nível de assinatura localmente para acesso imediato
    localStorage.setItem('zyc_user_tier', 'premium');
    
    // Tenta obter o email do usuário armazenado
    const cachedEmail = localStorage.getItem('zyc_user_email');
    if (cachedEmail) {
      setUserEmail(cachedEmail);
    }

    // 2. Disparo de telemetria de conversão oficial no Google Analytics e dataLayer
    trackEvent('conversion', {
      event_name: 'premium_subscription_confirmed',
      plan: 'Zyconomes Premium',
      value: 19.90,
      currency: 'BRL',
      status: 'success'
    });

    trackGranularEvent('conversion', 'button_click', 'Stripe Checkout Completed', 19.90, {
      plan: 'Zyconomes Premium',
      tier: 'premium'
    });
  }, []);

  const handleReturnToTools = () => {
    window.location.hash = 'home';
    setTimeout(() => {
      document.getElementById('ferramentas')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const copyReceiptId = () => {
    const receiptCode = 'ZYC-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    navigator.clipboard.writeText(receiptCode).catch(() => {});
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 bg-zinc-50/50 dark:bg-zinc-950/40">
      {/* Modal / Card estilo Login do Google */}
      <div className="w-full max-w-[450px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-[28px] p-8 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all">
        
        {/* Cabeçalho estilo Google: Logotipo e Identidade Minimalista */}
        <div className="flex flex-col items-center text-center">
          {/* Emblema Google/Zyconomes Clean Icon */}
          <div className="relative mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-sm">
              <span className="text-2xl font-black text-[#1a73e8] tracking-tighter">Z</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900">
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            </div>
          </div>

          <h1 className="text-2xl font-normal text-zinc-900 dark:text-zinc-100 tracking-normal mb-1.5 font-sans">
            Bem-vindo ao Premium
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-normal">
            Assinatura confirmada com sucesso
          </p>
        </div>

        {/* Chip de Identificação da Conta estilo Google Account Picker */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/80 dark:bg-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300 shadow-xs">
            <div className="w-5 h-5 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[10px] font-bold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium max-w-[200px] truncate">{userEmail}</span>
            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
              ATIVO
            </span>
          </div>
        </div>

        {/* Linha Divisória Sutil */}
        <div className="my-6 border-t border-zinc-100 dark:border-zinc-800/80" />

        {/* Benefícios Ativados no estilo Google One / Google Workspace */}
        <div className="space-y-3.5 text-xs text-zinc-700 dark:text-zinc-300">
          <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#1a73e8] shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold block text-zinc-900 dark:text-zinc-100">Motores Matemáticos Ilimitados</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-tight block mt-0.5">
                Calculadoras financeiras com alta precisão e sem limites diários.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold block text-zinc-900 dark:text-zinc-100">IA Preditiva com Gemini</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-tight block mt-0.5">
                Rebalanceamento automatizado de portfólio baseado em perfil de risco.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold block text-zinc-900 dark:text-zinc-100">Dossiês em PDF Institucional</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-tight block mt-0.5">
                Exportação auditável A4 com fórmulas matemáticas e hash criptográfico.
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação estilo Google */}
        <div className="mt-8 space-y-2.5">
          {/* Botão Primário Azul Google */}
          <button
            id="btn-return-to-tools"
            onClick={handleReturnToTools}
            className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-sm py-3 px-6 rounded-full shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>Retornar às Ferramentas</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Botão Secundário Transparente */}
          <button
            onClick={copyReceiptId}
            className="w-full bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[#1a73e8] dark:text-blue-400 font-medium text-xs py-2.5 px-4 rounded-full transition-colors cursor-pointer text-center"
          >
            {copiedReceipt ? '✓ Código do Recibo Copiado!' : 'Copiar Comprovante da Assinatura'}
          </button>
        </div>

        {/* Badge de Segurança */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Faturamento gerenciado de forma segura via Stripe</span>
        </div>
      </div>

      {/* Rodapé Estilo Google (Idioma e Links Legais) */}
      <div className="w-full max-w-[450px] mt-6 px-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
          <Globe className="w-3.5 h-3.5" />
          <span>Português (Brasil)</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </div>
        <div className="flex items-center gap-4">
          <a href="#contact" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Ajuda</a>
          <a href="#privacy" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Privacidade</a>
          <a href="#terms" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Termos</a>
        </div>
      </div>
    </div>
  );
};

export default Sucesso;
