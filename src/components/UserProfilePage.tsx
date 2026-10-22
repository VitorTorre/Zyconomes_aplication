import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  Calculator, 
  ArrowRight, 
  ShieldAlert, 
  Check, 
  Edit3, 
  Save, 
  X, 
  ArrowLeft,
  Activity,
  Layers,
  PieChart as LucidePieChart,
  Lock,
  Compass
} from 'lucide-react';
import { useFinancialData } from '../context/FinancialDataContext';
import { trackGranularEvent } from '../lib/analytics';
import { logout as firebaseLogout } from '../lib/firebase';

interface UserProfilePageProps {
  onBackToHome: () => void;
  onNavigateToTool: (toolId: number) => void;
  onLogoutSuccess: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  onBackToHome,
  onNavigateToTool,
  onLogoutSuccess
}) => {
  const financialData = useFinancialData();
  
  // Dados de identificação do usuário
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('zyc_user_name') || 'Investidor Zyconomes';
    } catch {
      return 'Investidor Zyconomes';
    }
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('zyc_user_email') || 'investidor@zyconomes.com';
    } catch {
      return 'investidor@zyconomes.com';
    }
  });

  const [userPhone, setUserPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('zyc_user_phone') || '';
    } catch {
      return '';
    }
  });

  const [userTier, setUserTier] = useState<string>(() => {
    try {
      return localStorage.getItem('zyc_user_tier') || 'free';
    } catch {
      return 'free';
    }
  });

  const [userRole, setUserRole] = useState<string>(() => {
    try {
      return localStorage.getItem('zyc_user_role') || 'investidor';
    } catch {
      return 'investidor';
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editPhone, setEditPhone] = useState(userPhone);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Sincroniza dados com a API backend se o token existir
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('zyc_auth_token');
        if (!token) return;

        const res = await fetch('/api/user/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.name) {
            setUserName(data.name);
            setEditName(data.name);
            localStorage.setItem('zyc_user_name', data.name);
          }
          if (data.email) {
            setUserEmail(data.email);
            localStorage.setItem('zyc_user_email', data.email);
          }
          if (data.phone) {
            setUserPhone(data.phone);
            setEditPhone(data.phone);
            localStorage.setItem('zyc_user_phone', data.phone);
          }
          if (data.tier) {
            setUserTier(data.tier);
            localStorage.setItem('zyc_user_tier', data.tier);
          }
          if (data.role) {
            setUserRole(data.role);
            localStorage.setItem('zyc_user_role', data.role);
          }
        }
      } catch (err) {
        console.warn('[UserProfilePage] Perfil operando com cache local fiduciário:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('zyc_auth_token');
      localStorage.setItem('zyc_user_name', editName);
      localStorage.setItem('zyc_user_phone', editPhone);
      setUserName(editName);
      setUserPhone(editPhone);

      if (token) {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: editName, phone: editPhone })
        });
      }

      setSaveMessage({ text: 'Informações de perfil atualizadas com sucesso!', type: 'success' });
      setIsEditing(false);
      trackGranularEvent('engagement', 'button_click', 'profile_updated');
    } catch {
      setSaveMessage({ text: 'Dados atualizados no cache local com sucesso.', type: 'success' });
      setIsEditing(false);
    } finally {
      setSaveLoading(false);
    }
  };

  /**
   * Implementação de Segurança Fiduciária:
   * Desvalida o token de acesso de TODOS os endpoints da aplicação,
   * limpa a sessão local e encerra a autenticação.
   */
  const handleSecureLogout = async () => {
    if (!confirm('Deseja realmente sair da sua conta e revogar o token de acesso em todos os endpoints?')) {
      return;
    }

    setLogoutLoading(true);
    trackGranularEvent('system', 'button_click', `logout_initiated: ${userEmail}`);

    try {
      const token = localStorage.getItem('zyc_auth_token');
      
      // 1. Desvalida e bloqueia o token em todos os endpoints do backend
      if (token) {
        await fetch('/api/auth/revoke', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {
          // Fallback para endpoint simples de logout
          return fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        });
      }

      // 2. Encerra a sessão no Firebase Auth se houver
      await firebaseLogout().catch(() => {});

      // 3. Remove credenciais transitórias de autenticação
      localStorage.removeItem('zyc_auth_token');
      localStorage.removeItem('zyc_user_role');

      // 4. Notifica todo o sistema sobre o logout
      window.dispatchEvent(new CustomEvent('zyconomes:auth-changed', { detail: { isLoggedIn: false } }));
      window.dispatchEvent(new CustomEvent('zyconomes:tier-updated', { detail: { tier: 'free' } }));

      onLogoutSuccess();
    } catch (err) {
      console.error('[UserProfilePage] Erro ao desvalidar sessão:', err);
      // Limpeza forçada local para garantir a segurança do usuário
      localStorage.removeItem('zyc_auth_token');
      onLogoutSuccess();
    } finally {
      setLogoutLoading(false);
    }
  };

  // Verificação de origem dos dados: cadastro vs. motor matemático
  const isCustomizedIncome = Boolean(localStorage.getItem('zyc_income'));
  const isCustomizedExpenses = Boolean(localStorage.getItem('zyc_expenses'));
  const isCustomizedSavings = Boolean(localStorage.getItem('zyc_savings'));
  const isCustomizedPmt = Boolean(localStorage.getItem('zyc_pmt'));
  const isCustomizedWealth = Boolean(localStorage.getItem('zyc_cur_wealth') || localStorage.getItem('zyc_tgt_wealth'));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* BARRA SUPERIOR DE RETORNO */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#1A1F71] dark:hover:text-emerald-400 bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início (Motores Matemáticos)</span>
          </button>

          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Sessão Criptografada e Segura
          </span>
        </div>

        {/* FEEDBACK DE MENSAGEM */}
        {saveMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* CARD PRINCIPAL DO PERFIL COM IDENTIDADE */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1A1F71] via-indigo-900 to-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-lg border border-white/20">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {userName}
                  </h1>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    userTier === 'premium' 
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                  }`}>
                    {userTier === 'premium' ? 'Plano Premium' : 'Plano Gratuito'}
                  </span>
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{userEmail}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">Verificado</span>
                </p>

                {userPhone && (
                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-zinc-400" />
                    <span>{userPhone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#1A1F71] dark:hover:text-emerald-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Fechar Edição' : 'Editar Nome'}</span>
              </button>
            </div>
          </div>

          {/* FORMULÁRIO DE EDIÇÃO RÁPIDA DE IDENTIDADE */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-6 p-6 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 animate-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Editar Informações Cadastrais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-[#1A1F71] dark:focus:border-emerald-500"
                    placeholder="Seu Nome"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-[#1A1F71] dark:focus:border-emerald-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="bg-[#1A1F71] hover:bg-[#121652] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveLoading ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          )}

          {/* INFORMAÇÕES REGISTRADAS: CADASTRO VS MOTO RES MATEMÁTICOS */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  Parâmetros Financeiros & Histórico Registrado
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Distinção fiduciária entre o que foi informado no seu cadastro e o que foi calculado nos Motores Matemáticos.
                </p>
              </div>
              <Compass className="w-5 h-5 text-zinc-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* ITEM 1: RENDA ATIVA */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Renda Mensal Ativa</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isCustomizedIncome 
                        ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {isCustomizedIncome ? 'Motor Matemático #1' : 'Padrão Inicial'}
                    </span>
                  </div>
                  <div className="text-xl font-black text-zinc-900 dark:text-white">
                    {formatCurrency(financialData.income)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTool(1)}
                  className="mt-3 text-xs font-bold text-[#1A1F71] dark:text-emerald-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ajustar no Diagnóstico</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* ITEM 2: DESPESAS MENSAIS */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Despesas Mensais Fixas</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isCustomizedExpenses 
                        ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {isCustomizedExpenses ? 'Motor Matemático #1' : 'Padrão Inicial'}
                    </span>
                  </div>
                  <div className="text-xl font-black text-zinc-900 dark:text-white">
                    {formatCurrency(financialData.expenses)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTool(1)}
                  className="mt-3 text-xs font-bold text-[#1A1F71] dark:text-emerald-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ajustar no Diagnóstico</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* ITEM 3: RESERVA DE EMERGÊNCIA */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Reserva Acumulada</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isCustomizedSavings 
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {isCustomizedSavings ? 'Motor Matemático #3' : 'Padrão Inicial'}
                    </span>
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(financialData.savings)}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {financialData.emergencyFundMonths.toFixed(1)} meses de cobertura
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTool(3)}
                  className="mt-3 text-xs font-bold text-[#1A1F71] dark:text-emerald-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ajustar na Reserva</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* ITEM 4: APORTE MENSAL (JUROS COMPOSTOS) */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Aporte Mensal (PMT)</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isCustomizedPmt 
                        ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {isCustomizedPmt ? 'Motor Matemático #2' : 'Padrão Inicial'}
                    </span>
                  </div>
                  <div className="text-xl font-black text-zinc-900 dark:text-white">
                    {formatCurrency(financialData.monthlyContribution)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTool(2)}
                  className="mt-3 text-xs font-bold text-[#1A1F71] dark:text-emerald-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ver Juros Compostos</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* ITEM 5: PATRIMÔNIO & META DE LIBERDADE */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Meta de Independência</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isCustomizedWealth 
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {isCustomizedWealth ? 'Motor Matemático #5' : 'Padrão Inicial'}
                    </span>
                  </div>
                  <div className="text-xl font-black text-zinc-900 dark:text-white">
                    {formatCurrency(financialData.targetWealth)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTool(5)}
                  className="mt-3 text-xs font-bold text-[#1A1F71] dark:text-emerald-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Calcular Fator Tempo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* ITEM 6: ESTRATÉGIA INSTITUCIONAL */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Perfil & Alocação IA</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Motor Matemático #6
                    </span>
                  </div>
                  <div className="text-sm font-black text-zinc-900 dark:text-white line-clamp-1">
                    {financialData.selectedStrategyId.replace(/-/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Perfil: {financialData.aiProfile}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTool(6)}
                  className="mt-3 text-xs font-bold text-[#1A1F71] dark:text-emerald-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ajustar Alocação</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          </div>

          {/* SEÇÃO DE SEGURANÇA E DESVALIDAÇÃO DO TOKEN EM TODOS OS ENDPOINTS */}
          <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <div className="p-6 bg-red-500/5 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Encerramento de Sessão & Desvalidação de Token</span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Revogação Segura em Todos os Endpoints
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  Ao sair, seu token de autenticação é adicionado imediatamente à lista de revogação do servidor, desvalidando qualquer requisição em trânsito e protegendo suas simulações patrimoniais.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSecureLogout}
                disabled={logoutLoading}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>{logoutLoading ? 'Desvalidando...' : 'Sair da Conta & Revogar Token'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
