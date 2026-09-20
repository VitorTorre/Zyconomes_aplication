import { useEffect, useState, useCallback } from 'react';
import { auditLogger } from '../lib/auditLogger';

export interface ShortcutFeedback {
  id: string;
  combination: string;
  actionName: string;
  timestamp: number;
}

export interface UseKeyboardShortcutsOptions {
  onSearch?: () => void;
  onSaveState?: () => void;
  onGeneratePDF?: () => void;
  onToggleTheme?: () => void;
  onOpenAudit?: () => void;
  enableHUD?: boolean;
}

/**
 * Global keyboard shortcuts hook for senior engineers and power users.
 * Handles key combinations (Ctrl+K, Ctrl+S, Ctrl+P, Ctrl+D, Ctrl+Shift+T),
 * prevents undesired browser defaults (e.g. Save Page), and dispatches
 * corresponding system events and diagnostic audit logs.
 */
export function useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions) {
  const [activeShortcut, setActiveShortcut] = useState<ShortcutFeedback | null>(null);

  const notifyShortcut = useCallback((combination: string, actionName: string) => {
    const feedback: ShortcutFeedback = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      combination,
      actionName,
      timestamp: Date.now(),
    };
    setActiveShortcut(feedback);

    // Record sensitive action to diagnostic audit logger
    auditLogger.recordAuditEvent({
      category: 'DIAGNOSTIC',
      severity: 'INFO',
      action: 'KEYBOARD_SHORTCUT_TRIGGERED',
      details: { combination, action: actionName },
      source: 'hotkey',
    });

    // Auto-clear HUD feedback after 2.5s
    setTimeout(() => {
      setActiveShortcut(curr => (curr?.id === feedback.id ? null : curr));
    }, 2500);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ignore standard input typing unless it's a modifier key shortcut
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // --- Ctrl/Cmd + K: Open Search ---
      if (modKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        notifyShortcut('Ctrl+K', 'Busca Rápida de Módulos & Ferramentas');
        if (options?.onSearch) {
          options.onSearch();
        } else {
          window.dispatchEvent(new CustomEvent('zyc_open_search'));
        }
        return;
      }

      // --- Ctrl/Cmd + S: Save Financial Simulation State ---
      if (modKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault(); // Prevent browser "Save Page As"
        notifyShortcut('Ctrl+S', 'Persistência de Estado (Simulação Salva)');
        if (options?.onSaveState) {
          options.onSaveState();
        } else {
          window.dispatchEvent(new CustomEvent('zyc_save_state'));
        }
        return;
      }

      // --- Ctrl/Cmd + P: Generate Institutional PDF Report ---
      if (modKey && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        // If an input is not focused, intercept to open our institutional PDF generator
        if (!isInput) {
          e.preventDefault();
          notifyShortcut('Ctrl+P', 'Emissão de Relatório PDF Institucional');
          if (options?.onGeneratePDF) {
            options.onGeneratePDF();
          } else {
            window.dispatchEvent(new CustomEvent('zyc_open_pdf_report'));
          }
          return;
        }
      }

      // --- Ctrl/Cmd + Shift + A or Ctrl/Cmd + D: Open Architecture & Audit Dashboard ---
      if ((modKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) || (modKey && (e.key === 'd' || e.key === 'D') && !isInput)) {
        e.preventDefault();
        notifyShortcut(modKey && e.shiftKey ? 'Ctrl+Shift+A' : 'Ctrl+D', 'Telemetria & Painel de Auditoria');
        if (options?.onOpenAudit) {
          options.onOpenAudit();
        } else {
          window.location.hash = 'admin';
          window.dispatchEvent(new CustomEvent('zyc_open_audit'));
        }
        return;
      }

      // --- Ctrl/Cmd + Shift + T: Toggle Theme ---
      if (modKey && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        notifyShortcut('Ctrl+Shift+T', 'Alternar Tema Claro/Escuro');
        if (options?.onToggleTheme) {
          options.onToggleTheme();
        } else {
          window.dispatchEvent(new CustomEvent('zyc_toggle_theme'));
        }
        return;
      }

      // --- Escape: Dismiss Active Overlays ---
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('zyc_dismiss_overlays'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, notifyShortcut]);

  return { activeShortcut };
}
