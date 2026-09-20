import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, BookOpen, Clock, ChevronRight, Activity, ArrowRight } from 'lucide-react';
import { trackGranularEvent } from '../lib/analytics';

// Simple frontmatter parser since we're using raw markdown imports
const parseMarkdownWithMeta = (rawMd: string) => {
  const match = rawMd.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: { title: 'Untited', id: 'unknown', category: 'General', readTime: '5 min', description: '' }, content: rawMd };
  
  const metaRaw = match[1];
  const content = match[2];
  const meta: any = {};
  
  metaRaw.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim().replace(/^"|"$/g, '');
      meta[key] = val;
    }
  });
  
  return { meta, content };
};

export const ZyconomesBlog: React.FC = () => {
  const [activeArticle, setActiveArticle] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    // Dynamic import of markdown files in Vite
    const loadArticles = async () => {
      const modules = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' });
      const loaded = [];
      
      for (const path in modules) {
        const rawContent = await modules[path]() as string;
        const { meta, content } = parseMarkdownWithMeta(rawContent);
        loaded.push({ ...meta, content });
      }
      
      setArticles(loaded);
    };
    
    loadArticles();
  }, []);

  useEffect(() => {
    const handleOpenBlog = (e: any) => {
      const blogId = e.detail?.id;
      if (blogId && articles.length > 0) {
        const article = articles.find(a => a.id === blogId);
        if (article) {
          setActiveArticle(article);
        }
      } else if (blogId && articles.length === 0) {
        // Retry logic if articles are still loading
        const interval = setInterval(() => {
           setArticles(currentArticles => {
              if (currentArticles.length > 0) {
                 const article = currentArticles.find(a => a.id === blogId);
                 if (article) setActiveArticle(article);
                 clearInterval(interval);
              }
              return currentArticles;
           });
        }, 100);
        setTimeout(() => clearInterval(interval), 2000);
      }
    };
    window.addEventListener('zyc_open_blog', handleOpenBlog);
    return () => window.removeEventListener('zyc_open_blog', handleOpenBlog);
  }, [articles]);

  useEffect(() => {
    if (activeArticle) {
      trackGranularEvent('engagement', 'blog_view', activeArticle.id);
      document.title = `${activeArticle.title} | Zyconomes Educação`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.title = 'Blog & Educação | Zyconomes';
    }
  }, [activeArticle]);

  if (activeArticle) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setActiveArticle(null)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-[#1A1F71] transition-colors mb-10 bg-white px-4 py-2 rounded-full shadow-sm border border-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Artigos
        </button>
        
        <div className="mb-12 border-b border-zinc-200 pb-12">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-emerald-600 mb-6">
            <span className="bg-emerald-100 px-3 py-1 rounded-full">{activeArticle.category}</span>
            <span className="flex items-center gap-1 text-zinc-400"><Clock className="w-3.5 h-3.5" /> {activeArticle.readTime}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1]">{activeArticle.title}</h1>
          <p className="text-xl text-zinc-500 mt-6 font-light leading-relaxed border-l-4 border-zinc-200 pl-4">{activeArticle.description}</p>
        </div>

        <div className="prose prose-zinc prose-lg max-w-none 
          prose-headings:font-black prose-headings:tracking-tight prose-headings:text-zinc-900 
          prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
          prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
          prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:mb-8
          prose-strong:text-zinc-900 prose-strong:font-bold
          prose-blockquote:border-l-4 prose-blockquote:border-[#1A1F71] prose-blockquote:bg-zinc-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:text-zinc-800 prose-blockquote:font-medium prose-blockquote:italic prose-blockquote:rounded-r-xl prose-blockquote:shadow-sm
          prose-ul:list-disc prose-ul:pl-6 prose-ul:text-zinc-600 prose-ul:mb-8
          prose-li:mb-2">
          <ReactMarkdown>{activeArticle.content}</ReactMarkdown>
        </div>

        {/* Cross-selling CTAs */}
        <div className="mt-20 p-10 bg-zinc-950 border border-zinc-800 rounded-3xl text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F71]/20 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <Activity className="w-10 h-10 text-emerald-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Pare de ler. Comece a calcular.</h3>
            <p className="text-zinc-400 mb-8 text-base max-w-lg mx-auto font-light">Nossas ferramentas matemáticas comprovam tudo o que foi escrito acima na sua própria realidade.</p>
            <button 
              onClick={() => {
                trackGranularEvent('conversion', 'button_click', `Blog CTA -> Ferramentas (${activeArticle.id})`);
                setActiveArticle(null);
                setTimeout(() => document.getElementById('ferramentas')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-10 py-4 rounded-full font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all inline-flex items-center gap-2"
            >
              Fazer Diagnóstico Gratuito <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-24">
      <div className="text-center mb-20">
        <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight mb-6">Educação <span className="text-[#1A1F71]">Algorítmica.</span></h2>
        <p className="text-xl text-zinc-600 font-light max-w-3xl mx-auto leading-relaxed">
          Sem jargões de faria lima. Sem promessas falsas. Apenas as provas matemáticas de como o dinheiro funciona, prontas para você usar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {articles.length === 0 ? (
          <div className="col-span-2 text-center py-20 text-zinc-400 font-medium">
            Carregando inteligência...
          </div>
        ) : articles.map((article) => (
          <div 
            key={article.id}
            onClick={() => setActiveArticle(article)}
            className="group cursor-pointer bg-white border border-zinc-200 hover:border-[#1A1F71]/30 hover:shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-black tracking-widest text-emerald-700 uppercase bg-emerald-100 px-4 py-1.5 rounded-full">
                {article.category}
              </span>
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {article.readTime}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-zinc-900 mb-4 group-hover:text-[#1A1F71] transition-colors leading-[1.2]">
              {article.title}
            </h3>
            
            <p className="text-base text-zinc-600 mb-8 flex-1 font-light leading-relaxed">
              {article.description}
            </p>
            
            <div className="flex items-center text-sm font-bold text-[#1A1F71] gap-2 group-hover:gap-4 transition-all">
              Ler Artigo <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
