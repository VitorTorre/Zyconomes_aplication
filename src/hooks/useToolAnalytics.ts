import { useEffect, useRef, useCallback } from 'react';
import { trackGranularEvent } from '../lib/analytics';

export const useToolAnalytics = (toolName: string) => {
  const startTime = useRef<number>(Date.now());
  const trackedFields = useRef<Set<string>>(new Set());

  // Rastreia Dwell Time (Tempo de permanência) ao desmontar o componente
  useEffect(() => {
    startTime.current = Date.now();
    trackGranularEvent('engagement', 'tool_view', toolName);

    return () => {
      const dwellTimeSeconds = Math.round((Date.now() - startTime.current) / 1000);
      trackGranularEvent('engagement', 'dwell_time', toolName, dwellTimeSeconds);
    };
  }, [toolName]);

  // Rastreia preenchimento de campos (apenas 1x por campo para evitar ruído)
  const trackFieldFill = useCallback((fieldName: string) => {
    if (!trackedFields.current.has(fieldName)) {
      trackedFields.current.add(fieldName);
      trackGranularEvent('engagement', 'field_filled', `${toolName} - ${fieldName}`);
    }
  }, [toolName]);

  // Rastreia cliques estratégicos
  const trackClick = useCallback((buttonLabel: string) => {
    trackGranularEvent('engagement', 'button_click', `${toolName} - ${buttonLabel}`);
  }, [toolName]);

  // Rastreia conclusão matemática
  const trackCalculation = useCallback((metadata?: any) => {
    trackGranularEvent('conversion', 'tool_calculate', toolName, undefined, metadata);
  }, [toolName]);

  return { trackFieldFill, trackClick, trackCalculation };
};
