export type EventCategory = 'engagement' | 'conversion' | 'system';
export type EventAction = 
  | 'tool_view' 
  | 'tool_calculate' 
  | 'lead_capture' 
  | 'blog_view' 
  | 'field_filled' 
  | 'button_click' 
  | 'dwell_time'
  | 'simulation_completed'
  | 'checkout_started';

export interface GranularEvent {
  id: string;
  category: EventCategory;
  action: EventAction;
  label: string;
  value?: number;
  metadata?: any;
  timestamp: string;
  session_id: string;
}

// Session management with SSR / Node test environment defensive checks
const getSessionId = () => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      let sessionId = sessionStorage.getItem('zyc_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('zyc_session_id', sessionId);
      }
      return sessionId;
    }
  } catch (e) {
    // ignore
  }
  return 'sess_' + Math.random().toString(36).substring(2, 15);
};

export const trackGranularEvent = (
  category: EventCategory, 
  action: EventAction, 
  label: string, 
  value?: number, 
  metadata?: any
) => {
  const event: GranularEvent = {
    id: 'evt_' + Math.random().toString(36).substring(2, 11),
    category,
    action,
    label,
    value,
    metadata,
    timestamp: new Date().toISOString(),
    session_id: getSessionId()
  };

  // Disparo para Console (Desenvolvimento/Auditoria)
  const color = category === 'conversion' ? '#3B82F6' : category === 'engagement' ? '#10B981' : '#F59E0B';
  console.log(`%c[DataLayer] %c${action} %c| ${label}`, `color: ${color}; font-weight: bold;`, 'color: white; font-weight: bold;', 'color: #9CA3AF;', value ? `Value: ${value}` : '', metadata || '');

  // Persistência Local (Mock para o Dashboard B2B)
  try {
    const history = JSON.parse(localStorage.getItem('zyc_granular_events') || '[]');
    history.push(event);
    if (history.length > 1000) history.shift();
    localStorage.setItem('zyc_granular_events', JSON.stringify(history));
    
    // Send to backend if authenticated
    const token = localStorage.getItem('zyc_auth_token');
    if (token) {
      fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventName: action,
          metadata: { category, label, value, ...metadata, session_id: event.session_id }
        })
      }).catch(err => console.error('Failed to sync event:', err));
    }
  } catch (e) {
    console.error('Falha ao persistir evento', e);
  }

  // Integração GA4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...metadata
    });
  }
};

export interface ConversionEventDetails {
  toolName?: string;
  planName?: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Função principal 'trackEvent' recomendada para monitoramento de jornada do usuário.
 * Integra com a camada de dados (window.dataLayer) do Google Analytics / GTM,
 * chama window.gtag se disponível e armazena na telemetria local e no backend.
 */
export const trackEvent = (
  eventName: 'simulation_completed' | 'checkout_started' | string,
  params?: Record<string, any>
) => {
  const eventDetails = params || {};
  const category = (eventName === 'simulation_completed' || eventName === 'checkout_started')
    ? 'conversion'
    : 'engagement';
  const label = eventDetails.toolName || eventDetails.planName || eventDetails.label || eventName;
  const value = eventDetails.value;

  // 1. Google Analytics DataLayer Push (GTM / GA4)
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: eventName,
      event_category: category,
      event_label: label,
      value: value,
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
      ...eventDetails,
    });

    // 2. Direct Google Analytics gtag dispatch if present
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', eventName, {
        event_category: category,
        event_label: label,
        value: value,
        session_id: getSessionId(),
        ...eventDetails,
      });
    }
  }

  // 3. Persistência de auditoria local e telemetria granular
  trackGranularEvent(category, eventName as any, label, value, eventDetails);
};

/**
 * Função de rastreamento de eventos para monitorar conversões de usuários e validar a jornada.
 * Concentra-se nos estágios-chave:
 * - 'simulation_completed': Usuário concluiu um cálculo / diagnóstico com sucesso
 * - 'checkout_started': Usuário clicou para iniciar a contratação do plano Premium
 */
export const trackConversionEvent = (
  eventType: 'simulation_completed' | 'checkout_started' | string,
  details?: ConversionEventDetails | string
) => {
  const metadata = typeof details === 'string' ? { label: details } : (details || {});
  trackEvent(eventType, metadata);
};

export const trackSimulationCompleted = (
  toolName: string, 
  resultSummary?: Record<string, any>
) => {
  trackConversionEvent('simulation_completed', {
    toolName,
    ...resultSummary,
  });
};

export const trackCheckoutStarted = (
  planName = 'Zyconomes Premium', 
  value = 19.90, 
  metadata?: Record<string, any>
) => {
  trackConversionEvent('checkout_started', {
    planName,
    value,
    currency: 'BRL',
    ...metadata,
  });
};

/**
 * Returns recent granular events from client storage buffer for telemetry dashboards.
 */
export const getLocalAnalyticsHistory = (): GranularEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('zyc_granular_events') || '[]');
  } catch {
    return [];
  }
};

