import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle, ShieldCheck, Download, Lock } from 'lucide-react';
import { saveLead } from '../lib/supabase';
import { trackGranularEvent } from '../lib/analytics';

interface EmailCaptureProps {
  toolName: string;
  resultData: Record<string, any>;
}

export const EmailCapture: React.FC<EmailCaptureProps> = ({ toolName, resultData }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('zyc_auth_token');
    const savedEmail = localStorage.getItem('zyc_user_email');
    if (token && savedEmail) {
      setIsLoggedIn(true);
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      window.location.hash = 'login';
      return;
    }
    
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    
    trackGranularEvent('engagement', 'button_click', `${toolName} - Save Result Attempt`);

    const { success } = await saveLead(email, toolName, resultData);
    
    if (success) {
      setStatus('success');
      trackGranularEvent('conversion', 'lead_capture', toolName, undefined, { has_data: !!resultData });
    } else {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="mt-8 p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-4 animate-in fade-in zoom-in duration-300">
        <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-base font-bold text-emerald-900">Seus dados foram blindados.</h4>
          <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
            Acabamos de disparar o relatório completo do seu <strong>{toolName}</strong> para o seu e-mail. Guarde-o como prova matemática do seu ponto de partida.
          </p>
        </div>
      </div>
    );
  }

  const previewKeys = Object.keys(resultData).slice(0, 3);

  return (
    <div className="mt-8 p-6 sm:p-8 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-sm relative overflow-hidden">
      {!isLoggedIn && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center border border-zinc-200 rounded-2xl">
          <div className="bg-[#1A1F71] p-3 rounded-full text-white shadow-lg mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-zinc-900 mb-1">Acesso Restrito</h4>
          <p className="text-sm text-zinc-600 mb-4 max-w-sm">Para proteger seu sigilo financeiro e salvar simulações, faça login na plataforma.</p>
          <button 
            onClick={() => window.location.hash = 'login'}
            className="bg-[#1A1F71] hover:bg-[#121652] text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-colors"
          >
            Fazer Login para Salvar
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6 border-b border-zinc-200 pb-6">
        <div className="bg-[#1A1F71] p-3 rounded-xl text-white shadow-md">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-lg font-black text-zinc-900 tracking-tight">Não perca este diagnóstico.</h4>
          <p className="text-sm text-zinc-500 mt-1 font-medium">
            Salve o snapshot matemático da sua simulação para acompanhamento futuro.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Digite o seu melhor e-mail"
            value={email}
            onChange={(e) => {
               setEmail(e.target.value);
               if (e.target.value.length === 5) trackGranularEvent('engagement', 'field_filled', `${toolName} - Email Lead Input`);
            }}
            disabled={status === 'loading' || !isLoggedIn}
            required
            className="flex-1 px-5 py-3.5 rounded-xl border border-zinc-300 focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71] focus:outline-none text-base disabled:opacity-50 transition-colors bg-white"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email.includes('@') || !isLoggedIn}
            className="bg-[#1A1F71] hover:bg-[#121652] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {status === 'loading' ? 'Criptografando...' : 'Salvar Resultado'}
            {status !== 'loading' && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-zinc-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dados auditados e protegidos (LGPD). Sem spam.</span>
          </div>
          
          <div className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase text-right">
            Snapshot: {previewKeys.map(k => k.substring(0,4)).join(', ')}...
          </div>
        </div>
      </form>
    </div>
  );
};
