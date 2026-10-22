import React, { useState, useEffect, useMemo } from 'react';
import { Menu, X, ArrowRight, Activity, Code2, UserCircle, ChevronDown, Calculator, ShieldCheck, TrendingUp, PieChart, BookOpen, Layers, Shield, Search, WifiOff, Sun, Moon, Bot, Sparkles, ArrowLeftRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FinanceCalculators } from './FinanceCalculators';
import { InteractiveCockpitBanner } from './InteractiveCockpitBanner';
import { SplitViewDrawer } from './SplitViewDrawer';
import { ZyconomesExecutiveManifesto } from './ZyconomesExecutiveManifesto';
import { ZyconomesSystemDesign } from './ZyconomesSystemDesign';
import { ZyconomesArchitectureSVG } from './ZyconomesArchitectureSVG';
import { ZyconomesBlog } from './ZyconomesBlog';
import { ZyconomesArticleReader } from './ZyconomesArticleReader';
import { ZyconomesDashboard } from './ZyconomesDashboard';
import { LoginPage, AboutPage, ContactPage, LegalPage } from './ZyconomesPages';
import { CookieBanner, FeedbackModal, SearchModal } from './ZyconomesWidgets';
import { AdminDashboard } from './AdminDashboard';
import { Sucesso } from '../pages/Sucesso';
import { PremiumPage } from '../pages/PremiumPage';
import { UserProfilePage } from './UserProfilePage';
import { SessionStabilityBadge } from './SessionStabilityBadge';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
      <WifiOff className="w-3 h-3" />
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      Modo Offline — Simuladores disponíveis localmente.
    </div>
  );
};

type ViewType = 'home' | 'login' | 'about' | 'contact' | 'privacy' | 'terms' | 'admin' | 'sucesso' | 'premium' | 'artigo' | 'perfil';

const parseCurrentRoute = (): { view: ViewType; articleId: string } => {
  if (typeof window === 'undefined') {
    return { view: 'home', articleId: 'juros-compostos' };
  }
  try {
    const rawHash = window.location.hash.replace('#', '');
    const [hashPath, queryString] = rawHash.split('?');
    const cleanHash = hashPath || (window.location.pathname.includes('/sucesso') ? 'sucesso' : 'home');

    if (cleanHash === 'artigo' || cleanHash === 'blog-reader') {
      const urlParams = new URLSearchParams(queryString || '');
      const articleId = urlParams.get('id') || 'juros-compostos';
      return { view: 'artigo', articleId };
    }

    const validViews: ViewType[] = ['home', 'login', 'about', 'contact', 'privacy', 'terms', 'admin', 'sucesso', 'premium', 'perfil'];
    if (validViews.includes(cleanHash as ViewType)) {
      return { view: cleanHash as ViewType, articleId: 'juros-compostos' };
    }
  } catch (err) {
    console.warn('[FinanceTemplate] Error parsing current route:', err);
  }
  return { view: 'home', articleId: 'juros-compostos' };
};

export const FinanceTemplate: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInvestorArea, setShowInvestorArea] = useState(false);
  
  // Inicialização síncrona imediata da rota para evitar tela branca ou skeleton piscando no reload
  const initialRoute = useMemo(() => parseCurrentRoute(), []);
  const [currentView, setCurrentView] = useState<ViewType>(initialRoute.view);
  const [currentArticleId, setCurrentArticleId] = useState<string>(initialRoute.articleId);
  const [currentActiveTool, setCurrentActiveTool] = useState<{ id: number; title: string }>({ id: 1, title: 'Diagnóstico Financeiro' });
  const [lastVisitedRoute, setLastVisitedRoute] = useState<{ view: string; toolId?: number; label: string }>({ view: 'home', toolId: 1, label: 'Diagnóstico Financeiro' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('zyc_theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [splitViewOpen, setSplitViewOpen] = useState(false);

  // Status de Assinatura Premium e Privilégio Administrativo
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const tier = localStorage.getItem('zyc_user_tier');
      const role = (localStorage.getItem('zyc_user_role') || '').toLowerCase();
      return tier === 'premium' || ['admin', 'super_admin', 'super_developer', 'security_admin'].includes(role);
    } catch {
      return false;
    }
  });

  const [isAdminUser, setIsAdminUser] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const role = (localStorage.getItem('zyc_user_role') || '').toLowerCase();
      return ['admin', 'super_admin', 'super_developer', 'security_admin', 'dev'].includes(role);
    } catch {
      return false;
    }
  });

  // Monitora a ferramenta matemática ativa atualmente no sistema
  useEffect(() => {
    const handleToolBroadcast = (e: any) => {
      if (e.detail?.id) {
        setCurrentActiveTool({ 
          id: e.detail.id, 
          title: e.detail.title || `Ferramenta #${e.detail.id}` 
        });
      }
    };
    window.addEventListener('zyc_active_tool_broadcast', handleToolBroadcast);
    return () => window.removeEventListener('zyc_active_tool_broadcast', handleToolBroadcast);
  }, []);

  useEffect(() => {
    const handleToggleSplitView = () => setSplitViewOpen(prev => !prev);
    window.addEventListener('zyc_toggle_split_view', handleToggleSplitView);
    return () => window.removeEventListener('zyc_toggle_split_view', handleToggleSplitView);
  }, []);

  useEffect(() => {
    try {
      if (isDarkTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('zyc_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('zyc_theme', 'light');
      }
    } catch (e) {
      console.warn('[FinanceTemplate] Could not persist theme:', e);
    }
  }, [isDarkTheme]);

  useEffect(() => {
    const syncAuthAndTier = () => {
      try {
        const savedToken = localStorage.getItem('zyc_auth_token');
        const hasToken = Boolean(savedToken && savedToken !== 'null' && savedToken !== 'undefined' && savedToken.trim() !== '');
        setIsLoggedIn(hasToken);

        const tier = localStorage.getItem('zyc_user_tier');
        const role = (localStorage.getItem('zyc_user_role') || '').toLowerCase();
        setIsPremium(tier === 'premium' || ['admin', 'super_admin', 'super_developer', 'security_admin'].includes(role));
        setIsAdminUser(['admin', 'super_admin', 'super_developer', 'security_admin', 'dev'].includes(role));
      } catch {
        setIsLoggedIn(false);
        setIsPremium(false);
        setIsAdminUser(false);
      }
    };

    syncAuthAndTier();

    const handleAuthChanged = (e: any) => {
      syncAuthAndTier();
    };

    const handleTierUpdated = () => {
      syncAuthAndTier();
    };

    window.addEventListener('zyconomes:auth-changed', handleAuthChanged);
    window.addEventListener('zyconomes:tier-updated', handleTierUpdated);
    window.addEventListener('storage', syncAuthAndTier);

    const handleHash = () => {
      const { view, articleId } = parseCurrentRoute();
      setCurrentArticleId(articleId);
      setCurrentView(view);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('zyconomes:auth-changed', handleAuthChanged);
      window.removeEventListener('zyconomes:tier-updated', handleTierUpdated);
      window.removeEventListener('storage', syncAuthAndTier);
    };
  }, []);

  // Dynamic SEO Hook
  useEffect(() => {
    const seoData: Record<string, { title: string; desc: string }> = {
      home: { title: "Zyconomes | Motores Matemáticos Financeiros", desc: "Erradicando o 'achismo financeiro' através da matemática pura e sistemas espectadores precisos." },
      login: { title: "Login | Acesso Zyconomes", desc: "Acesse sua conta para salvar suas simulações e proteger seu patrimônio." },
      about: { title: "Sobre Nós | Zyconomes", desc: "Conheça o nossa visão, missão de transparência financial e a arquitetura desenvolvida pelo Vitor." },
      contact: { title: "Fale Conosco | Zyconomes", desc: "Entre em contato para dúvidas técnicas, parcerias, suporte ou feedbacks." },
      privacy: { title: "Política de Privacidade LGPD | Zyconomes", desc: "Saiba como a Zyconomes protege seus dados através do modelo Client-Side." },
      terms: { title: "Termos de Uso | Zyconomes", desc: "Termos educacionais e matemáticos para uso das ferramentas e simuladores da Zyconomes." },
      sucesso: { title: "Assinatura Confirmada | Zyconomes Premium", desc: "Sua assinatura Zyconomes Premium foi confirmada com sucesso." },
      premium: { title: "Planos e Assinatura | Zyconomes Premium", desc: "Acesse inteligência financeira sem limites com o plano Zyconomes Premium." },
      artigo: { title: "Artigo Educativo | Zyconomes Educação", desc: "Inteligência fiduciária e provas matemáticas aplicadas às finanças pessoais sem achismos." },
      perfil: { title: "Meu Perfil & Informações | Zyconomes", desc: "Consulte e configure suas informações cadastradas e parâmetros financeiros integrados aos motores matemáticos." }
    };

    const data = seoData[currentView] || seoData.home;
    document.title = data.title;

    const updateMeta = (name: string, property: string, content: string) => {
      let tag = document.querySelector(`meta[${name ? `name="${name}"` : `property="${property}"`}]`);
      if (!tag) {
        tag = document.createElement('meta');
        if (name) tag.setAttribute('name', name);
        if (property) tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateMeta('description', '', data.desc);
    updateMeta('', 'og:title', data.title);
    updateMeta('', 'og:description', data.desc);
  }, [currentView]);

  const handleLogoClick = () => {
    window.location.hash = 'home';
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navigateTo = (view: string) => {
    window.location.hash = view;
    setMobileMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    if (currentView !== 'home') {
      window.location.hash = 'home';
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const openTool = (id: number) => {
    if (id === 7 && !isPremium) {
      navigateTo('premium');
      return;
    }
    scrollToSection('ferramentas');
    // Dispatch multiple times to ensure it catches after navigation/mounting
    [50, 200, 500, 800].forEach(delay => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('zyc_open_tool', { detail: { id } }));
      }, delay);
    });
  };

  const openArticle = (id: string, customPreviousLabel?: string) => {
    // Guarda o contexto anterior para retorno inteligente à última página ou ferramenta
    if (currentView !== 'artigo') {
      const toolLabel = currentView === 'home' ? currentActiveTool.title : (breadcrumbsMap[currentView] || 'Início');
      setLastVisitedRoute({
        view: currentView,
        toolId: currentActiveTool.id,
        label: customPreviousLabel || toolLabel
      });
    }
    setCurrentArticleId(id);
    setCurrentView('artigo');
    window.location.hash = `artigo?id=${id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const openBlog = (id: string) => {
    openArticle(id, 'Blog & Educação');
  };

  const handleBackFromArticle = () => {
    const target = lastVisitedRoute.view || 'home';
    if (target === 'home') {
      handleLogoClick();
      const targetToolId = lastVisitedRoute.toolId || currentActiveTool.id || 1;
      openTool(targetToolId);
      setTimeout(() => {
        document.getElementById('ferramentas')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      navigateTo(target);
    }
  };

  const handleOpenDiagnosticsFromArticle = () => {
    handleLogoClick();
    openTool(1); // Ferramenta 1: Diagnóstico Financeiro
    setTimeout(() => {
      document.getElementById('ferramentas')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleReviewFullSite = () => {
    handleLogoClick();
  };

  const breadcrumbsMap: Record<string, string> = {
    home: '',
    login: 'Acessar Conta',
    about: 'Quem Somos',
    contact: 'Fale Conosco',
    privacy: 'Privacidade (LGPD)',
    terms: 'Termos de Uso',
    sucesso: 'Assinatura Confirmada',
    premium: 'Plano Premium',
    artigo: 'Artigo Educativo',
    perfil: 'Meu Perfil & Informações'
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-[#1A1F71] selection:text-white pb-20 md:pb-0 transition-colors duration-200">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm relative transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <button onClick={handleLogoClick} className="flex items-center outline-none cursor-pointer group" title="Ir para Página Inicial (Index)">
              <span className="text-2xl font-black tracking-tighter text-[#1A1F71] group-hover:opacity-90 transition-opacity">ZYCONOMES</span>
              <span className="text-emerald-500 text-2xl font-black">.</span>
            </button>
            <SessionStabilityBadge forceAdmin={isAdminUser} />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 font-medium text-sm">
            
            {/* Mega Menu: Ferramentas */}
            <div className="relative group">
              <button onClick={() => scrollToSection('ferramentas')} className="text-zinc-600 hover:text-[#1A1F71] transition-colors flex items-center gap-1 py-2">
                Ferramentas <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-3 grid grid-cols-1 gap-1 z-50">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 px-3 pt-2">Gratuitas</div>
                <button onClick={() => openTool(1)} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full">
                  <Activity className="w-4 h-4 text-[#1A1F71]" /> <span className="text-zinc-700 font-semibold">Diagnóstico Financeiro</span>
                </button>
                <button onClick={() => openTool(2)} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> <span className="text-zinc-700 font-semibold">Juros Compostos</span>
                </button>
                <button onClick={() => openTool(3)} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> <span className="text-zinc-700 font-semibold">Reserva de Emergência</span>
                </button>
                <button onClick={() => openTool(4)} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full">
                  <Calculator className="w-4 h-4 text-red-600" /> <span className="text-zinc-700 font-semibold">Acelerador de Dívidas (SAC)</span>
                </button>
                <button onClick={() => openTool(5)} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full">
                  <PieChart className="w-4 h-4 text-purple-600" /> <span className="text-zinc-700 font-semibold">Independência (Tempo)</span>
                </button>
                
                <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2 px-3 pt-4 border-t border-zinc-100 mt-2 flex items-center justify-between">
                  <span>Plano Premium</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">ISO 27001</span>
                </div>
                <button onClick={() => openTool(7)} className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl text-left w-full border border-amber-200/60 transition-all cursor-pointer">
                  <div className="p-1 bg-amber-500 text-white rounded-lg"><Bot className="w-3.5 h-3.5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-950 font-bold text-xs">Cockpit Agente IA (15 Anos)</span>
                      {isPremium ? <Sparkles className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-amber-600" />}
                    </div>
                    <span className="text-[10px] text-amber-700 block">Agent-S & ISO 25010</span>
                  </div>
                </button>
                <button onClick={() => openTool(6)} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full">
                  <Layers className="w-4 h-4 text-zinc-400" /> <span className="text-zinc-500 font-semibold">Alocação de Ativos</span>
                </button>
              </div>
            </div>

            {/* Mega Menu: Blog */}
            <div className="relative group">
              <button onClick={() => scrollToSection('blog')} className="text-zinc-600 hover:text-[#1A1F71] transition-colors flex items-center gap-1 py-2">
                Blog <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-3 grid grid-cols-1 gap-1 z-50">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 px-3 pt-2">Artigos de Fundação</div>
                <button onClick={() => openBlog('juros-compostos')} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full group/btn">
                  <BookOpen className="w-4 h-4 text-[#1A1F71] group-hover/btn:scale-110 transition-transform" /> 
                  <span className="text-zinc-700 font-semibold truncate">Juros Compostos Reais</span>
                </button>
                <button onClick={() => openBlog('amortizacao-dividas')} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full group/btn">
                  <BookOpen className="w-4 h-4 text-[#1A1F71] group-hover/btn:scale-110 transition-transform" /> 
                  <span className="text-zinc-700 font-semibold truncate">O Verdadeiro Custo da Dívida</span>
                </button>
                <button onClick={() => openBlog('independencia-financeira')} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full group/btn">
                  <BookOpen className="w-4 h-4 text-[#1A1F71] group-hover/btn:scale-110 transition-transform" /> 
                  <span className="text-zinc-700 font-semibold truncate">A Matemática da Independência</span>
                </button>
                <button onClick={() => openBlog('reserva-de-emergencia')} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-xl text-left w-full group/btn">
                  <BookOpen className="w-4 h-4 text-[#1A1F71] group-hover/btn:scale-110 transition-transform" /> 
                  <span className="text-zinc-700 font-semibold truncate">Reserva de Emergência</span>
                </button>
              </div>
            </div>

            <button onClick={() => navigateTo('about')} className="text-zinc-600 hover:text-[#1A1F71] transition-colors py-2">
              Sobre
            </button>
            <button onClick={() => navigateTo('contact')} className="text-zinc-600 hover:text-[#1A1F71] transition-colors py-2">
              Contato
            </button>
            <button onClick={() => navigateTo('premium')} className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold py-2 flex items-center gap-1.5 transition-colors">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Premium
            </button>
            
            <div className="h-6 border-l border-zinc-200 mx-2"></div>
            
            <button 
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                window.dispatchEvent(event);
              }}
              className="group text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-2 px-3 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-full w-48 text-sm text-left"
              title="Pesquisar (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1">Buscar...</span>
              <span className="text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded text-zinc-400 group-hover:border-zinc-300 dark:group-hover:border-zinc-600">Ctrl+K</span>
            </button>

            <button
              onClick={() => setSplitViewOpen(true)}
              className="p-2 text-zinc-600 hover:text-[#1A1F71] dark:text-zinc-300 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full transition-colors flex items-center gap-1.5 px-3 text-xs font-bold cursor-pointer"
              title="Comparar Cenários Salvos (Split-View)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Split-View</span>
            </button>

            <button
              onClick={() => setIsDarkTheme(!isDarkTheme)}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full transition-colors flex items-center justify-center"
              title="Alternar Tema"
            >
              {isDarkTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <button onClick={() => navigateTo('admin')} className="text-zinc-600 hover:text-red-500 transition-colors flex items-center gap-1.5 font-bold py-2">
                  <Shield className="w-4 h-4" /> Admin
                </button>
                <button 
                  onClick={() => navigateTo('perfil')}
                  className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shadow-sm group"
                  title="Acessar Meu Perfil"
                >
                  <UserCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Conta Ativa</span>
                </button>
              </div>
            ) : (
              <button onClick={() => navigateTo('login')} className="text-zinc-600 hover:text-[#1A1F71] transition-colors flex items-center gap-1.5 font-bold py-2">
                <UserCircle className="w-4 h-4" /> Login
              </button>
            )}
            
            <button onClick={() => scrollToSection('ferramentas')} className="bg-[#1A1F71] hover:bg-[#121652] text-white px-5 py-2.5 rounded-full shadow-md font-semibold transition-all flex items-center gap-2">
              <Activity className="w-4 h-4" /> Diagnóstico
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2.5 rounded-md hover:bg-zinc-100 text-zinc-700">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200 px-4 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            <button onClick={() => scrollToSection('ferramentas')} className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-zinc-700 hover:bg-zinc-50">Ferramentas</button>
            <button onClick={() => scrollToSection('blog')} className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-zinc-700 hover:bg-zinc-50">Blog</button>
            <button onClick={() => navigateTo('about')} className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-zinc-700 hover:bg-zinc-50">Sobre</button>
            <button onClick={() => navigateTo('contact')} className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-zinc-700 hover:bg-zinc-50">Contato</button>
            <button onClick={() => navigateTo('premium')} className="w-full text-left flex items-center gap-2 px-3 py-3 rounded-md text-base font-bold text-amber-600 dark:text-amber-400 hover:bg-zinc-50">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Plano Premium</span>
            </button>
            
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              {!isLoggedIn ? (
                 <button onClick={() => navigateTo('login')} className="w-full flex items-center justify-center gap-2 border border-zinc-200 text-zinc-700 px-4 py-3 rounded-xl font-semibold shadow-sm">
                   <UserCircle className="w-4 h-4" /> Login
                 </button>
              ) : (
                <button 
                  onClick={() => navigateTo('perfil')} 
                  className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-4 py-3 rounded-xl font-bold cursor-pointer transition-colors"
                >
                   <UserCircle className="w-4 h-4 text-emerald-600" /> Meu Perfil (Conta Ativa)
                </button>
              )}
              <button onClick={() => scrollToSection('ferramentas')} className="w-full flex items-center justify-center gap-2 bg-[#1A1F71] text-white px-4 py-3 rounded-xl font-semibold shadow-sm">
                <Activity className="w-4 h-4" /> <span>Diagnóstico Gratuito</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {currentView !== 'home' && currentView !== 'login' && currentView !== 'artigo' && (
          <div className="bg-zinc-50 border-b border-zinc-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <nav className="flex items-center text-xs font-medium text-zinc-500">
                <button onClick={() => navigateTo('home')} className="hover:text-[#1A1F71] transition-colors">Home</button>
                <span className="mx-2">/</span>
                <span className="text-zinc-900">{breadcrumbsMap[currentView] || 'Painel'}</span>
              </nav>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
              {currentView === 'home' && (
                <>
                  {/* HERO SECTION */}
                  <section className="relative pt-20 pb-32 overflow-hidden bg-zinc-50 border-b border-zinc-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                      <span className="inline-block text-xs font-bold tracking-widest text-emerald-600 uppercase bg-emerald-100 px-4 py-1.5 rounded-full mb-6">
                        O Motor da sua Riqueza
                      </span>
                      <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
                        Inteligência Financeira <span className="text-[#1A1F71]">Auditável.</span>
                      </h1>
                      <p className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto font-light leading-relaxed">
                        Não prevemos o futuro. Nós o calculamos com você. Descubra sua saúde financeira e simule cenários sem "caixas-pretas" ou pegadinhas.
                      </p>
                      
                      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                          onClick={() => {
                            if (isPremium) {
                              scrollToSection('cockpit');
                            } else {
                              navigateTo('premium');
                            }
                          }} 
                          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-900 hover:from-emerald-500 hover:to-indigo-800 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
                        >
                          <span>Cockpit Agente IA (15 Anos)</span>
                          <span className="text-xs bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {isPremium ? 'Ativo' : 'Premium'}
                          </span>
                          <Sparkles className="w-5 h-5 text-amber-300" />
                        </button>
                        <button onClick={() => scrollToSection('ferramentas')} className="w-full sm:w-auto bg-[#1A1F71] hover:bg-[#121652] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                          Iniciar Diagnóstico <ArrowRight className="w-5 h-5" />
                        </button>
                        <button onClick={() => scrollToSection('ferramentas')} className="w-full sm:w-auto bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 px-8 py-4 rounded-full font-bold text-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center">
                          Ver Ferramentas
                        </button>
                      </div>
                      
                      <div className="mt-10 text-xs text-zinc-400 font-medium tracking-wide">
                        * Cálculos matemáticos executados com precisão. Segurança Cloud SQL e Firebase Auth.
                      </div>
                    </div>
                  </section>

                  {/* COCKPIT INTERATIVO MULTI-CICLOS (AGENTE IA 15 ANOS - EXCLUSIVO PREMIUM) */}
                  <section id="cockpit" className="py-12 bg-zinc-900 border-b border-zinc-800 scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      {isPremium ? (
                        <InteractiveCockpitBanner onOpenFullCockpit={() => openTool(7)} />
                      ) : (
                        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-indigo-950 border-2 border-amber-500/30 text-white relative overflow-hidden shadow-2xl">
                          <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Recurso Exclusivo do Plano Premium</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
                              Cockpit Agente IA (Trajetória de 15 Anos)
                            </h2>
                            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
                              Projeção algorítmica multi-ciclos (R$ 1.000 &rarr; 5x a 8x &rarr; US$ 2.000/sem) com alocação fiduciária (20% pessoal / 25% negócios / 40% ações / 15% liquidez) e auditoria estrita sob ISO 42001, 27001 e 25010.
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                              <button
                                type="button"
                                onClick={() => navigateTo('premium')}
                                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black px-6 py-3.5 rounded-2xl text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>Conhecer Benefícios & Assinar Plano Premium</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* FERRAMENTAS - MVP */}
                  <section id="ferramentas" className="scroll-mt-20">
                    <FinanceCalculators />
                  </section>

                  {/* BLOG SEO (SSG) */}
                  <section id="blog" className="bg-zinc-50 border-t border-zinc-200 scroll-mt-20">
                    <ZyconomesBlog onSelectArticle={(id) => openArticle(id, 'Blog & Artigos')} />
                  </section>

                  {/* INVESTOR & ARCHITECTURE AREA (HIDDEN BEHIND TOGGLE) */}
                  <section className="py-12 bg-zinc-950 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                      <button onClick={() => setShowInvestorArea(!showInvestorArea)} className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                        <Code2 className="w-4 h-4" /> 
                        {showInvestorArea ? 'Ocultar Documentação Técnica' : 'Acessar Documentação Técnica & Arquitetura'}
                      </button>

                      {showInvestorArea && (
                        <div className="mt-12 text-left animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="mb-10 text-center border-b border-zinc-800 pb-10">
                            <h3 className="text-2xl font-bold text-white mb-2">Repositório de Transparência (Investidores & Devs)</h3>
                            <p className="text-zinc-500 text-sm">Todo o manifesto e o design estrutural do sistema em runtime.</p>
                          </div>
                          
                          <ZyconomesExecutiveManifesto />
                          <ZyconomesSystemDesign />
                          <ZyconomesArchitectureSVG />
                          <ZyconomesDashboard />
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* VISUALIZAÇÃO ISOLADA DEDICADA DE ARTIGO (READER VIEW) */}
              {/* Descarrega e fecha toda a seção de Motores Matemáticos, exibindo apenas Cabeçalho + Artigo Específico + Rodapé */}
              {currentView === 'artigo' && (
                <ZyconomesArticleReader
                  articleId={currentArticleId}
                  onBack={handleBackFromArticle}
                  onOpenDiagnostics={handleOpenDiagnosticsFromArticle}
                  onNavigateArticle={(newId) => openArticle(newId, 'Artigo Anterior')}
                  onReviewFullSite={handleReviewFullSite}
                  previousContextName={lastVisitedRoute.label}
                />
              )}

              {currentView === 'login' && <LoginPage onLogin={() => { setIsLoggedIn(true); navigateTo('home'); }} />}
              {currentView === 'perfil' && (
                <UserProfilePage 
                  onBackToHome={handleLogoClick}
                  onNavigateToTool={openTool}
                  onLogoutSuccess={() => {
                    setIsLoggedIn(false);
                    handleLogoClick();
                  }}
                />
              )}
              {currentView === 'about' && <AboutPage />}
              {currentView === 'contact' && <ContactPage />}
              {currentView === 'privacy' && <LegalPage type="privacy" />}
              {currentView === 'terms' && <LegalPage type="terms" />}
              {currentView === 'admin' && <AdminDashboard />}
              {currentView === 'sucesso' && <Sucesso />}
              {currentView === 'premium' && <PremiumPage />}
            </motion.div>
        </AnimatePresence>
      </main>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="bg-zinc-950 text-zinc-400 py-16 border-t border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <button 
                onClick={handleLogoClick} 
                className="text-xl font-black tracking-tighter text-white mb-4 block text-left outline-none cursor-pointer group"
                title="Ir para Página Inicial (Index)"
              >
                <span className="group-hover:opacity-90 transition-opacity">ZYCONOMES</span><span className="text-emerald-500">.</span>
              </button>
              <p className="text-sm text-zinc-500 mb-4 max-w-sm">A primeira plataforma de inteligência e diagnóstico financeiro 100% matemática, focada em erradicar o achismo e elevar o seu patrimônio.</p>
              <div className="text-xs text-zinc-600 font-mono space-y-1">
                <p>CNPJ: 00.000.000/0001-00</p>
                <p>Av. Paulista, 1000 - São Paulo, SP</p>
                <p>contato@zyconomes.com.br</p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Plataforma</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => scrollToSection('ferramentas')} className="hover:text-emerald-400 transition-colors">Ferramentas Livres</button></li>
                <li><button onClick={() => navigateTo('login')} className="hover:text-emerald-400 transition-colors">Acessar Conta</button></li>
                <li><button onClick={() => scrollToSection('blog')} className="hover:text-emerald-400 transition-colors">Educação e Blog</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Institucional</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => navigateTo('about')} className="hover:text-emerald-400 transition-colors">Quem Somos</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-emerald-400 transition-colors">Fale Conosco</button></li>
                <li><button onClick={() => navigateTo('privacy')} className="hover:text-emerald-400 transition-colors">Privacidade (LGPD)</button></li>
                <li><button onClick={() => navigateTo('terms')} className="hover:text-emerald-400 transition-colors">Termos de Uso</button></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-600">
            <p>© 2026 Zyconomes. Desenvolvido e engenheirizado por Vitor. (MVP Fase B)</p>
            <p className="mt-2 md:mt-0 flex items-center gap-2">Feito no Brasil 🇧🇷</p>
          </div>
        </div>
      </footer>

      {/* GLOBAL WIDGETS */}
      <SearchModal />
      <CookieBanner />
      <FeedbackModal />
      <SplitViewDrawer 
        isOpen={splitViewOpen} 
        onClose={() => setSplitViewOpen(false)} 
        userEmail="v.torresko2015@gmail.com" 
      />
    </div>
  );
};

