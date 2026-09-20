import React, { useState } from 'react';
import { Search, User, ChevronDown, ArrowRight, ShieldCheck, CreditCard, Globe, Users, Menu, X, Building2, Sparkles, Lock } from 'lucide-react';

export const FinanceTemplate: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="#" className="flex items-center">
              <span className="text-3xl font-black italic tracking-tighter text-[#1A1F71]">VISA</span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 font-medium text-sm">
              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === 'pessoas' ? null : 'pessoas')}
                  className="px-3 py-2 rounded-md hover:bg-zinc-100 flex items-center gap-1 text-zinc-700 hover:text-[#1A1F71] transition-colors"
                >
                  Pessoas <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === 'empresas' ? null : 'empresas')}
                  className="px-3 py-2 rounded-md hover:bg-zinc-100 flex items-center gap-1 text-zinc-700 hover:text-[#1A1F71] transition-colors"
                >
                  Empresas <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === 'inovadores' ? null : 'inovadores')}
                  className="px-3 py-2 rounded-md hover:bg-zinc-100 flex items-center gap-1 text-zinc-700 hover:text-[#1A1F71] transition-colors"
                >
                  Inovadores <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === 'comunidade' ? null : 'comunidade')}
                  className="px-3 py-2 rounded-md hover:bg-zinc-100 flex items-center gap-1 text-zinc-700 hover:text-[#1A1F71] transition-colors"
                >
                  Comunidade <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>

              <a href="#destaques" className="px-3 py-2 rounded-md hover:bg-zinc-100 text-zinc-700 hover:text-[#1A1F71] transition-colors font-semibold">
                Vai de Visa
              </a>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-full hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
              title="Pesquisar"
            >
              <Search className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setIsLoginOpen(true)}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-[#1A1F71] px-4 py-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Entre ou Cadastre-se</span>
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-md hover:bg-zinc-100 text-zinc-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200 px-4 pt-2 pb-6 space-y-2">
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-700 hover:bg-zinc-100">Pessoas</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-700 hover:bg-zinc-100">Empresas</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-700 hover:bg-zinc-100">Inovadores</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-700 hover:bg-zinc-100">Comunidade</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-semibold text-[#1A1F71] hover:bg-zinc-100">Vai de Visa</a>
            <div className="pt-4 border-t border-zinc-200">
              <button 
                onClick={() => { setIsLoginOpen(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-[#1A1F71] text-white px-4 py-3 rounded-xl font-semibold shadow-sm"
              >
                <User className="w-4 h-4" />
                <span>Entre ou Cadastre-se</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Editorial Grid Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div id="destaques" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Vai de Visa */}
          <div className="group relative h-[480px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-8 cursor-pointer bg-zinc-950">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=1000')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            <div className="relative z-10">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 mb-2 block">Benefícios</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                Vai de Visa <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </h2>
              <p className="text-zinc-300 text-sm mt-2 line-clamp-2">Descubra ofertas exclusivas, cashback em viagens, restaurantes e experiências inesquecíveis.</p>
            </div>
          </div>

          {/* Card 2: Visa Destinations */}
          <div className="group relative h-[480px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-8 cursor-pointer bg-zinc-950">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=1000')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            <div className="relative z-10">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 mb-2 block">Viagens</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                Visa Destinations <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </h2>
              <p className="text-zinc-300 text-sm mt-2 line-clamp-2">Planeje suas férias pelo mundo com seguros de viagem globais e assistências 24 horas.</p>
            </div>
          </div>

          {/* Card 3: Conheça os Cartões de Crédito Visa */}
          <div className="group relative h-[480px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-8 cursor-pointer bg-zinc-900 border border-zinc-800">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0a67d553c2a5?auto=format&fit=crop&q=80&w=1000')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent"></div>
            
            <div className="relative z-10">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 mb-2 block">Cartões + Benefícios</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                Conheça os Cartões Visa <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </h2>
              <p className="text-zinc-300 text-sm mt-2 line-clamp-2">De Classic a Infinite. Encontre o cartão ideal para o seu estilo de vida e conquiste autonomia financeira.</p>
            </div>
          </div>

        </div>

        {/* Secondary Editorial Row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Subcard 1 */}
          <div className="group relative h-[320px] rounded-2xl overflow-hidden shadow-md flex flex-col justify-end p-8 cursor-pointer bg-zinc-900">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-70" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1000')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 mb-2 block">Neve & Montanha</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                Benefícios de Inverno <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </h3>
            </div>
          </div>

          {/* Subcard 2 */}
          <div className="group relative h-[320px] rounded-2xl overflow-hidden shadow-md flex flex-col justify-end p-8 cursor-pointer bg-zinc-900">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-70" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 mb-2 block">PMEs & Negócios</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                Comunidade Empreendedora <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </h3>
            </div>
          </div>

        </div>

        {/* Institutional Stats & Trust Banner */}
        <div className="mt-16 bg-zinc-50 border border-zinc-200 rounded-2xl p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-10 h-10 text-[#1A1F71] mb-3" />
              <h4 className="text-2xl font-bold text-zinc-900">Segurança Global</h4>
              <p className="text-sm text-zinc-600 mt-1">Proteção contra fraudes com inteligência artificial em tempo real.</p>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="w-10 h-10 text-[#1A1F71] mb-3" />
              <h4 className="text-2xl font-bold text-zinc-900">+200 Países</h4>
              <p className="text-sm text-zinc-600 mt-1">Aceito em milhões de estabelecimentos em todo o planeta.</p>
            </div>
            <div className="flex flex-col items-center">
              <Sparkles className="w-10 h-10 text-[#1A1F71] mb-3" />
              <h4 className="text-2xl font-bold text-zinc-900">Benefícios Exclusivos</h4>
              <p className="text-sm text-zinc-600 mt-1">Assistência de viagem, seguros e salas VIP em aeroportos.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 mt-20 py-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h5 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">Sobre a Visa</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Nossa Empresa</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Relação com Investidores</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sustentabilidade</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">Cartões</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Visa Classic</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Visa Gold</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Visa Platinum</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Visa Infinite</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">Segurança</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Central de Segurança</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Relatar Fraude</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidade de Dados</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">Contato</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Central de Atendimento</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Perguntas Frequentes</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ouvidoria</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs">
          <p>© 2026 Visa Inc. Todos os direitos reservados.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </footer>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-3 w-full">
                <Search className="w-5 h-5 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="O que você está procurando? (ex: Cartão Infinite, Seguros, Vai de Visa)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-lg focus:outline-none text-zinc-900 placeholder:text-zinc-400"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-6">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Buscas Populares</div>
              <div className="flex flex-wrap gap-2">
                {['Benefícios Viagem', 'Visa Infinite', 'Vai de Visa Restaurantes', 'Seguro Cartão', 'Salas VIP Airport'].map((term, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSearchQuery(term)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-xs font-medium transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login / Auth Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 animate-in fade-in zoom-in duration-200 relative">
            <button 
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 text-zinc-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <span className="text-3xl font-black italic tracking-tighter text-[#1A1F71] block mb-2">VISA</span>
              <h3 className="text-xl font-bold text-zinc-900">Acesse sua Conta</h3>
              <p className="text-xs text-zinc-500 mt-1">Gerencie seus benefícios e ofertas exclusivas</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); alert('Login efetuado com sucesso!'); setIsLoginOpen(false); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">E-mail ou CPF</label>
                <input 
                  type="text" 
                  required 
                  placeholder="seu.email@exemplo.com"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">Senha</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71] focus:outline-none text-sm"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1A1F71] hover:bg-[#121652] text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Entrar no Portal</span>
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-500">
              Não tem uma conta? <a href="#" className="text-[#1A1F71] font-semibold hover:underline">Cadastre-se gratuitamente</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
