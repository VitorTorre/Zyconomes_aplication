import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { trackConversionEvent, trackCheckoutStarted } from '../lib/analytics';

interface PremiumButtonProps {
  className?: string;
  label?: string;
  variant?: 'primary' | 'outline' | 'compact' | 'gold';
  showSecurityBadge?: boolean;
  onOpenCheckout?: () => void;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  className = '',
  label = 'Assinar Zyconomes Premium — R$ 19,90/mês',
  variant = 'primary',
  showSecurityBadge = true,
  onOpenCheckout,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpgrade = async () => {
    // Monitora conversão na jornada do usuário
    trackCheckoutStarted('Zyconomes Premium', 19.90, { trigger: 'premium_button' });
    trackConversionEvent('checkout_started', {
      planName: 'Zyconomes Premium',
      value: 19.90,
      currency: 'BRL',
    });

    if (onOpenCheckout) {
      onOpenCheckout();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('zyc_auth_token');
      if (!token) {
        window.location.hash = 'login';
        return;
      }

      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao iniciar checkout.');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout inválida retornada pelo servidor.');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setErrorMsg(error.message || 'Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStyle = () => {
    switch (variant) {
      case 'outline':
        return 'border-2 border-[#1A1F71] text-[#1A1F71] dark:text-zinc-200 dark:border-zinc-600 hover:bg-[#1A1F71]/10';
      case 'compact':
        return 'bg-[#1A1F71] hover:bg-[#121652] text-white text-xs py-2 px-3 shadow';
      case 'gold':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black shadow-lg shadow-amber-500/20';
      case 'primary':
      default:
        return 'bg-[#1A1F71] hover:bg-[#121652] text-white shadow-lg hover:shadow-indigo-950/30';
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <button
        id="btn-stripe-checkout"
        onClick={handleUpgrade}
        disabled={loading}
        className={`w-full group font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 relative overflow-hidden ${getStyle()} ${className}`}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="tracking-wide">Conectando ao Stripe Checkout...</span>
          </>
        ) : (
          <>
            <div className="p-1 rounded-lg bg-white/15 shrink-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <span className="tracking-tight text-base font-black">{label}</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all shrink-0" />
          </>
        )}
      </button>

      {showSecurityBadge && (
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Checkout Seguro via Stripe
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" />
            Criptografia 256-bit
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 w-full text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
