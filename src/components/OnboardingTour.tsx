import React, { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS, EVENTS, type Step, type EventData } from 'react-joyride';

export const OnboardingTour: React.FC = () => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);

  // Sincroniza tema escuro / claro para estilização do Joyride
  useEffect(() => {
    const checkDark = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
        (typeof window !== 'undefined' && localStorage.getItem('zyc_theme') === 'dark');
      setIsDark(isDarkMode);
    };

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Verifica se é a primeira visita do usuário ou se foi solicitado manualmente
  useEffect(() => {
    try {
      const hasVisited = localStorage.getItem('zyconomes_onboarding_done');
      if (!hasVisited) {
        // Pequeno delay para garantir que todos os elementos da árvore DOM foram montados
        const timer = setTimeout(() => {
          setRunTour(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignora falhas de acesso ao localStorage em modo restrito
    }
  }, []);

  // Listener para reiniciar o tour manualmente via evento customizado
  useEffect(() => {
    const handleStartTour = () => {
      setStepIndex(0);
      setRunTour(true);
    };

    window.addEventListener('zyc_start_onboarding_tour', handleStartTour);
    return () => window.removeEventListener('zyc_start_onboarding_tour', handleStartTour);
  }, []);

  // Definição dos passos estratégicos do tour guiado da Zyconomes
  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h4 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
            <span>Bem-vindo à Zyconomes!</span>
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Vamos fazer um tour rápido de 1 minuto para você dominar nossos motores matemáticos e transformar seu planejamento financeiro sem caixas-pretas.
          </p>
        </div>
      ),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '#menu-ferramentas',
      content: (
        <div className="space-y-2">
          <h4 className="font-bold text-base text-zinc-900 dark:text-white">
            Motores Matemáticos Independentes
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Aqui ficam todos os nossos simuladores determinísticos: desde juros compostos e aceleração de dívidas até alocação institucional e independência financeira.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#input-renda',
      content: (
        <div className="space-y-2">
          <h4 className="font-bold text-base text-zinc-900 dark:text-white">
            Entrada de Parâmetros Segura
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Insira sua renda mensal aqui. O sistema possui verificação exata contra caracteres inválidos e recalcula tudo instantaneamente no seu navegador.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '#botao-calcular',
      content: (
        <div className="space-y-2">
          <h4 className="font-bold text-base text-zinc-900 dark:text-white">
            Conexão & Recálculo Instantâneo
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Clique aqui para sincronizar com simulação bancária imediata ou apenas preencha os dados e veja a matemática pesada ser executada em tempo real.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '#painel-resultado',
      content: (
        <div className="space-y-2">
          <h4 className="font-bold text-base text-zinc-900 dark:text-white">
            Diagnóstico Patrimonial Auditável
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Aqui surge o seu resultado com taxas de poupança, meses de cobertura de emergência e fluxo livre para investimentos, com precisão fiduciária.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '#botao-premium',
      content: (
        <div className="space-y-2">
          <h4 className="font-bold text-base text-zinc-900 dark:text-white">
            Plano Premium & Cockpit IA 15 Anos
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Para projeções patrimoniais de longo prazo (Agent-S multi-ciclos), valuation de ações e relatórios executivos em PDF com assinatura criptográfica, conheça o plano Premium!
          </p>
        </div>
      ),
      placement: 'bottom',
    }
  ];

  // Callback de controle de eventos e estados do Joyride
  const handleJoyrideEvent = useCallback((data: EventData) => {
    const { status, index, type, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status) || type === EVENTS.TOUR_END) {
      setRunTour(false);
      try {
        localStorage.setItem('zyconomes_onboarding_done', 'true');
      } catch {
        // Safe fallback
      }
    } else if (type === EVENTS.STEP_AFTER) {
      if (action === 'prev') {
        setStepIndex(Math.max(0, index - 1));
      } else {
        setStepIndex(index + 1);
      }
    }
  }, []);

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      options={{
        buttons: ['skip', 'back', 'primary'],
        showProgress: true,
        primaryColor: isDark ? '#38bdf8' : '#1A1F71',
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        arrowColor: isDark ? '#18181b' : '#ffffff',
        overlayColor: 'rgba(0, 0, 0, 0.75)',
      }}
      onEvent={handleJoyrideEvent}
      styles={{
        tooltip: {
          borderRadius: '1.25rem',
          padding: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
          fontSize: '0.875rem',
        },
        buttonPrimary: {
          backgroundColor: isDark ? '#38bdf8' : '#1A1F71',
          color: isDark ? '#09090b' : '#ffffff',
          borderRadius: '0.75rem',
          fontWeight: 700,
          fontSize: '0.8125rem',
          padding: '0.625rem 1rem',
          outline: 'none',
          boxShadow: isDark ? '0 4px 12px rgba(56, 189, 248, 0.25)' : '0 4px 12px rgba(26, 31, 113, 0.25)',
        },
        buttonBack: {
          color: isDark ? '#a1a1aa' : '#71717a',
          marginRight: '0.75rem',
          fontWeight: 600,
          fontSize: '0.8125rem',
        },
        buttonSkip: {
          color: isDark ? '#71717a' : '#a1a1aa',
          fontSize: '0.8125rem',
          fontWeight: 500,
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
    />
  );
};
