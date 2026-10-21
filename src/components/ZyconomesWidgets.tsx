import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Share2, Facebook, Twitter, Linkedin, CheckCircle, Search, ArrowRight } from 'lucide-react';
import { trackGranularEvent } from '../lib/analytics';

export const SearchModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState<'guest' | 'registered' | 'conquistado'>('guest');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Determine Role
    const token = localStorage.getItem('zyc_auth_token');
    if (token) {
      const userRole = localStorage.getItem('zyc_user_role');
      if (userRole === 'premium' || userRole === 'conquistado') {
        setRole('conquistado');
      } else {
        setRole('registered');
      }
    } else {
      setRole('guest');
    }
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleGo = (path: string, hash?: string) => {
    setOpen(false);
    setQuery('');
    window.location.hash = path;
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  };

  const getResults = () => {
    let baseResults = [
      { title: 'Diagnóstico Financeiro', path: '#home', anchor: 'ferramentas', role: 'all' },
      { title: 'Juros Compostos (Crescimento)', path: '#home', anchor: 'ferramentas', role: 'all' },
      { title: 'Sobre o Projeto & Arquitetura', path: '#about', role: 'all' },
      { title: 'Acesso / Conta', path: '#login', role: 'guest' },
      { title: 'Meu Perfil', path: '#admin', role: 'registered' },
      { title: 'Painel Administrativo', path: '#admin', role: 'registered' },
      { title: 'Relatórios Premium em PDF', path: '#home', anchor: 'ferramentas', role: 'conquistado' },
      { title: 'Alocação Inteligente de Ativos (IA)', path: '#home', anchor: 'ferramentas', role: 'conquistado' },
      { title: 'Artigo: A Ilusão da Rentabilidade (Juros Compostos)', path: '#artigo?id=juros-compostos', role: 'all' },
      { title: 'Artigo: O Verdadeiro Custo da Dívida (Amortização)', path: '#artigo?id=amortizacao-dividas', role: 'all' },
      { title: 'Artigo: A Matemática da Independência Financeira', path: '#artigo?id=independencia-financeira', role: 'all' },
      { title: 'Artigo: Reserva de Emergência e Blindagem', path: '#artigo?id=reserva-de-emergencia', role: 'all' }
    ];

    return baseResults
      .filter(i => i.role === 'all' || i.role === role || (role === 'conquistado' && i.role === 'registered'))
      .filter(i => i.title.toLowerCase().includes(query.toLowerCase()));
  };

  const results = getResults();

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none px-4 py-5 outline-none text-zinc-900 dark:text-zinc-100 text-lg placeholder-zinc-400 dark:placeholder-zinc-600"
            placeholder="Pesquisar ferramentas, páginas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setOpen(false)} className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded font-mono border border-zinc-200 dark:border-zinc-700">ESC</button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length > 0 ? results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleGo(r.path, r.anchor)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left"
            >
              <span className="font-bold text-zinc-700 dark:text-zinc-200">{r.title}</span>
              <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
            </button>
          )) : (
            <div className="text-center py-10 text-zinc-400 text-sm">Nenhum resultado encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('zyc_cookies_accepted')) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('zyc_cookies_accepted', 'true');
    trackGranularEvent('system', 'button_click', 'Aceite Cookies LGPD');
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-full">
      <div className="max-w-5xl mx-auto bg-zinc-900 text-white p-5 sm:p-6 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-zinc-300">
          <strong className="text-white">Transparência (LGPD):</strong> Utilizamos cookies locais e Analytics anonimizado para aprimorar sua experiência e garantir o funcionamento dos simuladores. Seus dados financeiros não saem do seu navegador a menos que você solicite.
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={accept} className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-6 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            Concordar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export const FeedbackModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Sanitization & Validation
    const sanitizedText = text.trim();
    if (sanitizedText.length < 10) {
      setError('Por favor, escreva pelo menos 10 caracteres para que possamos entender melhor.');
      return;
    }
    if (sanitizedText.length > 500) {
      setError('O feedback não pode ultrapassar 500 caracteres.');
      return;
    }

    setLoading(true);
    trackGranularEvent('engagement', 'button_click', 'Feedback Widget Submit', undefined, { text_length: sanitizedText.length });
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sanitizedText })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar feedback.');
      
      setSent(true);
      setTimeout(() => { 
        setOpen(false); 
        setSent(false); 
        setText(''); 
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na rede.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        aria-label="Enviar Feedback"
        className="fixed bottom-6 right-6 z-40 bg-[#1A1F71] text-white p-4 rounded-full shadow-2xl hover:bg-[#121652] hover:scale-110 transition-all group"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
      
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 origin-bottom-right">
          <div className="bg-zinc-950 p-4 flex justify-between items-center text-white">
            <h4 className="font-bold">Enviar Feedback</h4>
            <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-zinc-400 hover:text-white" /></button>
          </div>
          <div className="p-5">
            {sent ? (
              <div className="text-center flex flex-col items-center py-4 animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-emerald-700 font-bold">Obrigado pelo seu feedback!</div>
                <div className="text-xs text-zinc-500 mt-1">Sua mensagem nos ajuda a melhorar.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea 
                  value={text} onChange={e => setText(e.target.value)}
                  placeholder="Encontrou um erro? Tem uma sugestão? Conta pra gente..."
                  className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:border-[#1A1F71] outline-none resize-none mb-3 bg-zinc-50 disabled:opacity-50"
                  rows={4} required disabled={loading}
                ></textarea>
                
                {error && <div className="text-xs text-red-500 font-medium mb-3">{error}</div>}
                
                <button type="submit" disabled={loading} className="w-full bg-[#1A1F71] text-white font-bold py-2.5 rounded-xl hover:bg-[#121652] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : 'Enviar'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const ShareButtons: React.FC<{ url?: string; title?: string }> = ({ url = "https://zyconomes.com.br", title = "Zyconomes - Motores Matemáticos Financeiros" }) => {
  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mr-2">Compartilhar:</span>
      <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer" aria-label="Compartilhar no WhatsApp" className="p-2 bg-zinc-100 hover:bg-emerald-100 hover:text-emerald-600 rounded-full text-zinc-500 transition-colors"><MessageSquare className="w-4 h-4" /></a>
      <a href={shareLinks.linkedin} target="_blank" rel="noreferrer" aria-label="Compartilhar no LinkedIn" className="p-2 bg-zinc-100 hover:bg-blue-100 hover:text-blue-600 rounded-full text-zinc-500 transition-colors"><Linkedin className="w-4 h-4" /></a>
      <a href={shareLinks.twitter} target="_blank" rel="noreferrer" aria-label="Compartilhar no X/Twitter" className="p-2 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 rounded-full text-zinc-500 transition-colors"><Twitter className="w-4 h-4" /></a>
    </div>
  );
};
