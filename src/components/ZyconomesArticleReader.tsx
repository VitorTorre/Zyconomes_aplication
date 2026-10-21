import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  Calendar, 
  Share2, 
  ChevronRight, 
  Check, 
  Compass, 
  Layers
} from 'lucide-react';
import { trackGranularEvent } from '../lib/analytics';

// Parser de Frontmatter para arquivos markdown locais
const parseMarkdownWithMeta = (rawMd: string) => {
  const match = rawMd.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: { title: 'Artigo Sem Título', id: 'unknown', category: 'Educação', readTime: '5 min', description: '' }, content: rawMd };
  
  const metaRaw = match[1];
  const content = match[2];
  const meta: any = {};
  
  metaRaw.split(/\r?\n/).forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      meta[key] = val;
    }
  });
  
  return { meta, content };
};

export interface ArticleData {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  content: string;
  publishedDate?: string;
  author?: string;
}

interface ZyconomesArticleReaderProps {
  articleId: string;
  onBack: () => void;
  onOpenDiagnostics: () => void;
  onNavigateArticle: (id: string) => void;
  onReviewFullSite: () => void;
  previousContextName?: string;
}

export const ZyconomesArticleReader: React.FC<ZyconomesArticleReaderProps> = ({
  articleId,
  onBack,
  onOpenDiagnostics,
  onNavigateArticle,
  onReviewFullSite,
  previousContextName = 'Página Inicial'
}) => {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [activeArticle, setActiveArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Carregamento dinâmico dos artigos do diretório blog
  useEffect(() => {
    const loadAllArticles = async () => {
      setLoading(true);
      const modules = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' });
      const loaded: ArticleData[] = [];
      
      for (const path in modules) {
        const rawContent = await modules[path]() as string;
        const { meta, content } = parseMarkdownWithMeta(rawContent);
        loaded.push({
          ...meta,
          content,
          publishedDate: 'Outubro de 2026',
          author: 'Vitor Torres (Zyconomes Lead)'
        });
      }
      
      setArticles(loaded);
      const current = loaded.find(a => a.id === articleId) || loaded[0] || null;
      setActiveArticle(current);
      setLoading(false);
    };
    
    loadAllArticles();
  }, [articleId]);

  // Barra de progresso de leitura no scroll
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeArticle?.id]);

  // Analytics de visualização do artigo
  useEffect(() => {
    if (activeArticle) {
      trackGranularEvent('engagement', 'blog_view', activeArticle.id);
      document.title = `${activeArticle.title} | Zyconomes Educação`;
    }
  }, [activeArticle]);

  const handleShare = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).catch(() => {});
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const relatedArticles = articles.filter(a => a.id !== activeArticle?.id).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-24 text-zinc-400">
        <Activity className="w-8 h-8 text-[#1A1F71] animate-spin mb-4" />
        <p className="text-sm font-medium">Carregando inteligência algorítmica do artigo...</p>
      </div>
    );
  }

  if (!activeArticle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-24 px-4 text-center">
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Artigo não encontrado</h2>
        <p className="text-zinc-500 mb-6 text-sm">O conteúdo solicitado pode ter sido movido ou renomeado.</p>
        <button
          onClick={onBack}
          className="bg-[#1A1F71] text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all hover:bg-[#121652]"
        >
          Voltar para {previousContextName}
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-zinc-950 font-sans">
      
      {/* BARRA DE PROGRESSO DE LEITURA FIXA NO TOPO */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-zinc-100 dark:bg-zinc-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-[#1A1F71] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* SUB-BARRA DE NAVEGAÇÃO SUPERIOR COM RETORNO INTELIGENTE */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 py-3 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#1A1F71] dark:hover:text-emerald-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs border border-zinc-200 dark:border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para {previousContextName}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReviewFullSite}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-[#1A1F71] dark:hover:text-emerald-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              title="Reabrir todo o sistema web Zyconomes com os Motores Matemáticos"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-500" />
              <span>Revisar Todo o Site</span>
            </button>

            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500">
              {Math.round(scrollProgress)}% lido
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CORPO DO ARTIGO */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 animate-in fade-in slide-in-from-bottom-3 duration-300">
        
        {/* CABEÇALHO DO ARTIGO */}
        <header className="mb-10 sm:mb-14 border-b border-zinc-200 dark:border-zinc-800 pb-8 sm:pb-12">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-4 sm:mb-6">
            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300/40">
              {activeArticle.category}
            </span>
            <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-normal">
              <Clock className="w-3.5 h-3.5" /> {activeArticle.readTime} de leitura
            </span>
            <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 font-normal">
              <Calendar className="w-3.5 h-3.5" /> {activeArticle.publishedDate}
            </span>
            <span className="ml-auto hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Auditado Zyconomes
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.15]">
            {activeArticle.title}
          </h1>

          <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 mt-5 font-light leading-relaxed border-l-4 border-emerald-500 pl-4 bg-zinc-50 dark:bg-zinc-900/40 py-2 rounded-r-xl">
            {activeArticle.description}
          </p>
        </header>

        {/* CONTEÚDO MARKDOWN RENDERIZADO */}
        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none
          prose-headings:font-black prose-headings:tracking-tight prose-headings:text-zinc-900 dark:prose-headings:text-white
          prose-h1:hidden
          prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
          prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-6
          prose-strong:text-zinc-900 dark:prose-strong:text-white prose-strong:font-bold
          prose-blockquote:border-l-4 prose-blockquote:border-[#1A1F71] dark:prose-blockquote:border-emerald-500 prose-blockquote:bg-zinc-50 dark:prose-blockquote:bg-zinc-900/60 prose-blockquote:py-4 prose-blockquote:px-6 sm:prose-blockquote:px-8 prose-blockquote:text-zinc-800 dark:prose-blockquote:text-zinc-200 prose-blockquote:font-medium prose-blockquote:italic prose-blockquote:rounded-r-xl prose-blockquote:shadow-xs
          prose-ul:list-disc prose-ul:pl-6 prose-ul:text-zinc-700 dark:prose-ul:text-zinc-300 prose-ul:mb-6
          prose-li:mb-2
          prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800 prose-hr:my-10"
        >
          <ReactMarkdown>{activeArticle.content}</ReactMarkdown>
        </div>

        {/* CARD INSTITUCIONAL DE TRANSIÇÃO PARA CALCULADORAS COM O BOTÃO COM A SETINHA */}
        <div className="mt-16 p-8 sm:p-10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 text-white rounded-3xl text-center shadow-2xl relative overflow-hidden border border-zinc-800">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-4">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              Pare de ler. Comece a calcular.
            </h3>
            <p className="text-zinc-400 mb-8 text-sm sm:text-base max-w-lg mx-auto font-light leading-relaxed">
              Nossas ferramentas matemáticas comprovam tudo o que foi escrito acima na sua própria realidade financeira, sem achismos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* BOTÃO ESPECÍFICO COM A SETINHA REQUISITADO PELO USUÁRIO */}
              <button 
                type="button"
                onClick={onOpenDiagnostics}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black px-8 py-4 rounded-full text-base shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all inline-flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Fazer Diagnósticos Gratuitos</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* BOTÃO PARA REVISAR O SITE COMPLETO (REABRIR OS MOTORES MATEMÁTICOS ZYCONOMES) */}
              <button 
                type="button"
                onClick={onReviewFullSite}
                className="w-full sm:w-auto bg-zinc-800/90 hover:bg-zinc-700 text-white font-bold px-7 py-4 rounded-full text-sm border border-zinc-700 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Revisar Todo o Site Zyconomes</span>
              </button>
            </div>
          </div>
        </div>

        {/* ARTIGOS RELACIONADOS RECOMENDADOS AO FINAL */}
        {relatedArticles.length > 0 && (
          <div className="mt-20 pt-12 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Continue Sua Formação Matemática
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Artigos fundamentais para aprofundar seu discernimento fiduciário.
                </p>
              </div>
              <BookOpen className="w-6 h-6 text-zinc-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <div 
                  key={rel.id}
                  onClick={() => onNavigateArticle(rel.id)}
                  className="group bg-zinc-50 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-850 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2">
                      <span>{rel.category}</span>
                      <span className="text-zinc-400 font-normal flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rel.readTime}
                      </span>
                    </div>
                    <h5 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-[#1A1F71] dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {rel.title}
                    </h5>
                  </div>
                  
                  <div className="mt-4 flex items-center text-xs font-bold text-[#1A1F71] dark:text-emerald-400 gap-1 group-hover:gap-2 transition-all">
                    <span>Ler Artigo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </article>
    </div>
  );
};
