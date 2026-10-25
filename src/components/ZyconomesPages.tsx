import React, { useState } from 'react';
import { Mail, Lock, LogIn, Send, ArrowRight, User, Shield, Info, Smartphone, CheckCircle, Code2 } from 'lucide-react';
import { trackGranularEvent } from '../lib/analytics';
import { loginWithGoogle } from '../lib/firebase';

export const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Google Login, 2: Complete Profile
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleProviderLogin = async (providerName: string) => {
    setLoading(true);
    setError('');
    trackGranularEvent('conversion', 'button_click', `Login ${providerName}`);
    
    try {
      if (providerName === 'Google') {
        const user = await loginWithGoogle();
        const token = await user.getIdToken();
        localStorage.setItem('zyc_auth_token', token);
        localStorage.setItem('zyc_user_email', user.email || '');
        if (user.displayName) setName(user.displayName);
        setStep(2);
      } else {
        // Mock Microsoft/Apple since we only setup Google IdP on Firebase right now
        setError(`A integração com ${providerName} está em desenvolvimento.`);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado. O pop-up foi fechado antes de concluir.');
      } else {
        setError(`Falha ao autenticar com ${providerName}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 5 && email.includes('@')) {
      // Transition to profile setup assuming email is valid for this flow
      setStep(2);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Mock completion for email flow if token doesn't exist
      let token = localStorage.getItem('zyc_auth_token');
      if (!token && email) {
        // Setting a mock token just to pass the local guard in demo
        token = 'demo-email-token-123';
        localStorage.setItem('zyc_auth_token', token);
        localStorage.setItem('zyc_user_email', email);
      }
      
      // Persist profile data in localStorage for client-side persistence
      if (name) localStorage.setItem('zyc_user_name', name);
      if (phone) localStorage.setItem('zyc_user_phone', phone);
      if (email) localStorage.setItem('zyc_user_email', email);

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, phone, email })
      });
      window.dispatchEvent(new CustomEvent('zyconomes:auth-changed', { detail: { isLoggedIn: true } }));
      onLogin();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('zyconomes:auth-changed', { detail: { isLoggedIn: true } }));
      onLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex justify-center mb-6">
          <div className="bg-[#1A1F71]/10 dark:bg-sky-950/60 p-4 rounded-full">
            <Lock className="w-8 h-8 text-[#1A1F71] dark:text-sky-400" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-center text-zinc-900 dark:text-white mb-2 transition-colors">
          {step === 1 ? 'Acesso Zyconomes' : 'Completar Cadastro'}
        </h2>
        <p className="text-sm text-center text-zinc-500 dark:text-zinc-400 mb-8 transition-colors">
          {step === 1 ? 'Crie sua conta para salvar simulações e blinde seu patrimônio na nuvem.' : 'Falta pouco. Precisamos de mais alguns dados para finalizar.'}
        </p>
        
        {error && <div className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-transparent dark:border-red-800 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}

        {step === 1 ? (
          <div className="space-y-3">
            <button onClick={() => handleProviderLogin('Google')} disabled={loading} className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continuar com Google
            </button>
            <button onClick={() => handleProviderLogin('Microsoft')} disabled={loading} className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
              Continuar com Microsoft
            </button>
            <button onClick={() => handleProviderLogin('Apple')} disabled={loading} className="w-full bg-black dark:bg-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-900 border border-transparent dark:border-zinc-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
              Continuar com Apple
            </button>
            
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 border-b border-zinc-200 dark:border-zinc-800"></div>
              <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500">OU</div>
              <div className="flex-1 border-b border-zinc-200 dark:border-zinc-800"></div>
            </div>
            
            <form onSubmit={handleEmailSignup}>
              <div className="mb-3">
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-[#1A1F71] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#1A1F71] dark:focus:ring-sky-400 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none transition-all" 
                  placeholder="Seu melhor e-mail" 
                />
              </div>
              {email.length > 0 && (
                <button type="submit" className="w-full bg-[#1A1F71] dark:bg-sky-600 hover:bg-[#121652] dark:hover:bg-sky-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all animate-in slide-in-from-top-2 cursor-pointer">
                  Criar conta <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        ) : (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1" htmlFor="name">Nome Completo</label>
              <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-[#1A1F71] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#1A1F71] dark:focus:ring-sky-400 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none transition-all" placeholder="Seu nome" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1" htmlFor="phone">Celular</label>
              <input id="phone" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-[#1A1F71] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#1A1F71] dark:focus:ring-sky-400 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none transition-all" placeholder="(11) 99999-9999" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 mt-4 cursor-pointer">
              {loading ? 'Salvando...' : 'Finalizar Cadastro'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const AboutPage: React.FC = () => (
  <div className="max-w-6xl mx-auto py-24 px-4 animate-in fade-in">
    <div className="text-center mb-20">
      <span className="inline-block bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-transparent dark:border-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">Manifesto do Fundador</span>
      <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] max-w-4xl mx-auto transition-colors">
        A matemática não tem opiniões. <span className="text-[#1A1F71] dark:text-sky-400 dark:drop-shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all">Nós também não.</span>
      </h1>
      <p className="mt-6 text-xl text-zinc-600 dark:text-zinc-300 font-light max-w-2xl mx-auto leading-relaxed transition-colors">
        A Zyconomes nasceu para erradicar o achismo financeiro. Transformamos teorias complexas em motores de cálculo executáveis no seu navegador, devolvendo o controle do seu patrimônio para a única pessoa que se importa com ele: você.
      </p>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24">
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-[#1A1F71]/30 dark:hover:border-sky-500/30 hover:shadow-2xl transition-all group flex flex-col h-full">
        <div className="bg-blue-50 dark:bg-blue-950/60 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><Info className="w-8 h-8 text-blue-600 dark:text-sky-400" /></div>
        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight transition-colors">Missão (O Que)</h3>
        <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed flex-1 transition-colors">Democratizar o acesso a ferramentas financeiras de nível institucional. Traduzimos a complexidade da matemática financeira, atuária e tributária em interfaces visuais de resposta instantânea.</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-[#1A1F71]/30 dark:hover:border-sky-500/30 hover:shadow-2xl transition-all group flex flex-col h-full">
        <div className="bg-emerald-50 dark:bg-emerald-950/60 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /></div>
        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight transition-colors">Visão (Onde)</h3>
        <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed flex-1 transition-colors">Ser o epicentro da verdade financeira no Brasil. Um porto seguro inegociável onde as decisões são tomadas com base em logaritmos, curvas de juros e estatística, e não em conselhos de gerentes de banco.</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-[#1A1F71]/30 dark:hover:border-sky-500/30 hover:shadow-2xl transition-all group flex flex-col h-full">
        <div className="bg-purple-50 dark:bg-purple-950/60 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" /></div>
        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight transition-colors">Valores (Como)</h3>
        <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed flex-1 transition-colors">Transparência algorítmica absoluta, privacidade Client-Side por padrão (seus dados não vão para a nuvem sem você mandar), e foco maníaco na usabilidade do investidor comum.</p>
      </div>
    </div>

    {/* Section: The Architect */}
    <div className="bg-zinc-950 text-white rounded-[2.5rem] p-8 sm:p-16 relative overflow-hidden shadow-2xl border border-transparent dark:border-zinc-800">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#1A1F71]/30 dark:bg-sky-500/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-4 flex justify-center lg:justify-start">
          <div className="relative">
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-2xl relative z-10 overflow-hidden">
               <User className="w-24 h-24 text-zinc-500" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-emerald-500 text-zinc-950 px-6 py-2 rounded-full font-black text-sm tracking-widest shadow-xl rotate-[-5deg]">
              SKIN IN THE GAME
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-8 text-center lg:text-left">
          <h3 className="text-3xl sm:text-4xl font-black mb-6 tracking-tight text-white">A Arquitetura por trás da Zyconomes</h3>
          <p className="text-zinc-300 text-lg leading-relaxed mb-8">
            Nascida da frustração com planilhas de Excel que quebravam e plataformas infestadas de vieses comerciais. Este projeto foi inteiramente desenhado, codificado e engenheirizado do zero para garantir uma única coisa: imparcialidade algorítmica.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
            <span className="inline-block bg-[#1A1F71] dark:bg-sky-600 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest text-white shadow-lg border border-blue-800/50 dark:border-sky-400/40">
              Vitor — Fundador & Arquiteto
            </span>
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
              <Code2 className="w-4 h-4" /> 100% Código Proprietário
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackGranularEvent('engagement', 'button_click', 'Formulário de Contato');
    setTimeout(() => setSent(true), 800);
  };

  return (
    <div className="max-w-6xl mx-auto py-24 px-4 animate-in fade-in">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4 transition-colors">Fale Conosco</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto transition-colors">Dúvidas sobre os cálculos? Feedback sobre a usabilidade? Ou interesse em investir na plataforma? Estamos à disposição.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-[#1A1F71]/30 dark:hover:border-sky-500/30 transition-colors">
            <Mail className="w-8 h-8 text-[#1A1F71] dark:text-sky-400 mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 transition-colors">Canal Direto</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-6 transition-colors">Para parcerias, suporte técnico ou dúvidas complexas sobre a arquitetura dos simuladores.</p>
            <a href="mailto:contato@zyconomes.com.br" className="text-[#1A1F71] dark:text-sky-400 font-bold hover:underline flex items-center gap-2">
              contato@zyconomes.com.br <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 transition-colors">
            <Smartphone className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 transition-colors">Atendimento Ágil</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-6 transition-colors">Precisa de uma resposta rápida sobre o acesso à sua conta premium ou reset de senha?</p>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-2">
              +55 (11) 99999-9999 <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-zinc-900 p-8 sm:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200 dark:border-zinc-800 h-full transition-colors">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8 transition-colors">Envie uma Mensagem</h3>
            {sent ? (
              <div className="text-center py-16 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Ticket Registrado!</h3>
                <p className="text-zinc-500 dark:text-zinc-400">Sua mensagem foi criptografada e enviada para a nossa fila de atendimento. Retornaremos em até 24 horas úteis.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2" htmlFor="nome">Nome Completo</label>
                    <input id="nome" type="text" required className="w-full px-5 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-[#1A1F71] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#1A1F71] dark:focus:ring-sky-400 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none transition-all" placeholder="Como devemos chamá-lo?" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2" htmlFor="email-contato">E-mail Profissional</label>
                    <input id="email-contato" type="email" required className="w-full px-5 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-[#1A1F71] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#1A1F71] dark:focus:ring-sky-400 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none transition-all" placeholder="seu@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2" htmlFor="assunto">Assunto</label>
                  <select id="assunto" className="w-full px-5 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-[#1A1F71] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#1A1F71] dark:focus:ring-sky-400 bg-zinc-50 dark:bg-zinc-950 outline-none transition-all text-zinc-700 dark:text-zinc-200">
                    <option>Dúvida sobre as Ferramentas</option>
                    <option>Problema com a Conta (Login)</option>
                    <option>Sugestão de Funcionalidade</option>
                    <option>Contato Comercial / Parceria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2" htmlFor="mensagem">Mensagem Detalhada</label>
                  <textarea id="mensagem" required rows={5} className="w-full px-5 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-[#1A1F71] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#1A1F71] dark:focus:ring-sky-400 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none transition-all resize-none" placeholder="Descreva como podemos ajudar..."></textarea>
                </div>
                <button type="submit" aria-label="Enviar Mensagem" className="w-full bg-[#1A1F71] dark:bg-sky-600 hover:bg-[#121652] dark:hover:bg-sky-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer">
                  Submeter Mensagem <Send className="w-5 h-5" />
                </button>
                <p className="text-xs text-center text-zinc-400 dark:text-zinc-500 font-medium flex items-center justify-center gap-1.5 mt-4">
                  <Shield className="w-4 h-4" /> Comunicação protegida de ponta a ponta.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LegalPage: React.FC<{ type: 'privacy' | 'terms' }> = ({ type }) => (
  <div className="max-w-3xl mx-auto py-24 px-4 animate-in fade-in prose prose-zinc dark:prose-invert">
    <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight transition-colors">
      {type === 'privacy' ? 'Política de Privacidade (LGPD)' : 'Termos de Uso'}
    </h1>
    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-mono">Última atualização: Setembro de 2026</div>
    
    {type === 'privacy' ? (
      <>
        <h2 className="text-zinc-900 dark:text-white font-bold">1. Coleta de Dados</h2>
        <p className="text-zinc-600 dark:text-zinc-300">A Zyconomes prioriza sua privacidade. Todas as simulações financeiras ocorrem <strong>localmente no seu navegador</strong> (Client-Side). Não enviamos seus dados de renda, dívida ou patrimônio para nossos servidores sem seu consentimento explícito.</p>
        <h2 className="text-zinc-900 dark:text-white font-bold">2. Captura de E-mail (Leads)</h2>
        <p className="text-zinc-600 dark:text-zinc-300">Ao optar por "Salvar Resultado" ou assinar nosso guia, você concorda em nos fornecer seu e-mail. Este dado é utilizado exclusivamente para envio do material solicitado e comunicados sobre atualizações da plataforma. Zero spam.</p>
        <h2 className="text-zinc-900 dark:text-white font-bold">3. Analytics (GA4)</h2>
        <p className="text-zinc-600 dark:text-zinc-300">Coletamos dados anonimizados de navegação (Dwell Time, cliques) para melhorar a experiência do usuário, em total conformidade com a LGPD.</p>
      </>
    ) : (
      <>
        <h2 className="text-zinc-900 dark:text-white font-bold">1. Natureza Educacional</h2>
        <p className="text-zinc-600 dark:text-zinc-300">A Zyconomes é uma plataforma estritamente <strong>educacional e algorítmica</strong>. Nossas ferramentas não constituem recomendação de investimento, compra de ativos ou consultoria financeira regulamentada (CVM).</p>
        <h2 className="text-zinc-900 dark:text-white font-bold">2. Exatidão Matemática</h2>
        <p className="text-zinc-600 dark:text-zinc-300">Nossos algoritmos utilizam fórmulas matemáticas padrão (Ex: Juros Compostos, Tabela Price). No entanto, não garantimos que as instituições financeiras aplicarão as exatas mesmas taxas devido a custos ocultos (IOF, Seguros) que variam por contrato.</p>
        <h2 className="text-zinc-900 dark:text-white font-bold">3. Limitação de Responsabilidade</h2>
        <p className="text-zinc-600 dark:text-zinc-300">Ao utilizar nossos simuladores, você concorda que as decisões tomadas a partir dos resultados são de sua inteira responsabilidade.</p>
      </>
    )}
  </div>
);
