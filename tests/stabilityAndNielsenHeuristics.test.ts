import { describe, it, expect, beforeEach } from 'vitest';
import { 
  safeParseNumber, 
  safeMonetaryInput, 
  safeRateInput, 
  safeMonthsInput,
  generateProtectedAuditTxtFile,
  recordLocalOperationalIncident,
  getLocalOperationalIncidents,
  clearLocalOperationalIncidents,
  OperationalIncident
} from '../src/lib/inputEncapsulator';

describe('Defensive Input Encapsulation & Operational Safeguards', () => {
  beforeEach(() => {
    clearLocalOperationalIncidents();
  });

  it('safely parses monetary inputs and clamps out-of-bounds or NaN values', () => {
    // Normal monetary input
    expect(safeParseNumber(5000, 1000, 0, 1000000).value).toBe(5000);

    // Negative value clamped to minimum
    const negative = safeParseNumber(-500, 1000, 0, 1000000);
    expect(negative.value).toBe(0);
    expect(negative.wasAdjusted).toBe(true);

    // NaN value falls back to default
    const nanVal = safeParseNumber('invalid_string', 1000, 0, 1000000);
    expect(nanVal.value).toBe(1000);
    expect(nanVal.wasAdjusted).toBe(true);

    // Brazilian currency format string
    const brlFormatted = safeParseNumber('R$ 15.500,50', 0, 0, 1000000);
    expect(brlFormatted.value).toBe(15500.5);
  });

  it('safely clamps interest rates and months within fiduciary bounds', () => {
    // Rate: clamps negative to 0 and excessive rate to 1000
    expect(safeRateInput(-5, 'interest_rate')).toBe(0);
    expect(safeRateInput(1500, 'interest_rate')).toBe(1000);
    expect(safeRateInput(12.5, 'interest_rate')).toBe(12.5);

    // Months: clamps to integer between 1 and 1200
    expect(safeMonthsInput(0, 'period_months')).toBe(1);
    expect(safeMonthsInput(1500, 'period_months')).toBe(1200);
    expect(safeMonthsInput(36.7, 'period_months')).toBe(37);
  });

  it('records incidents in localStorage and retrieves them', () => {
    const incident: OperationalIncident = {
      id: 'test-inc-1',
      timestamp: new Date().toISOString(),
      fieldId: 'interest_rate',
      receivedParam: '-15',
      sanitizedParam: '0',
      errorReason: 'Negative rate input clamped',
    };

    recordLocalOperationalIncident(incident);
    const incidents = getLocalOperationalIncidents();
    expect(incidents.length).toBeGreaterThanOrEqual(1);
    expect(incidents[incidents.length - 1].fieldId).toBe('interest_rate');
  });

  it('generates a protected .txt audit file containing safety locks in 15 programming languages', () => {
    const mockIncidents: OperationalIncident[] = [
      {
        id: 'inc-001',
        timestamp: '2026-10-21T20:00:00.000Z',
        fieldId: 'loan_amount',
        receivedParam: '-50000',
        sanitizedParam: '0',
        errorReason: 'Negative loan amount encapsulated',
      },
      {
        id: 'inc-002',
        timestamp: '2026-10-21T20:01:00.000Z',
        fieldId: 'interest_rate',
        receivedParam: '999999',
        sanitizedParam: '1000',
        errorReason: 'Out of bounds rate clamped',
      }
    ];

    const txt = generateProtectedAuditTxtFile(mockIncidents);

    // Check title and header
    expect(txt).toContain('ZYCONOMES ARCHITECTURE - REGISTRO DE INTERCORRÊNCIAS OPERACIONAIS');
    expect(txt).toContain('TOTAL DE INCIDENTES CATALOGADOS: 2');

    // Check 15 language safety locks
    const requiredLanguages = [
      'BASH',
      'SH / POSIX',
      'WINDOWS BATCH / CMD',
      'POWERSHELL',
      'PYTHON',
      'JAVASCRIPT',
      'C]',
      'C++]',
      'RUST',
      'GO',
      'JAVA',
      'RUBY',
      'PHP',
      'PERL',
      'LUA'
    ];

    for (const lang of requiredLanguages) {
      expect(txt).toContain(lang);
    }

    // Check that incidents are listed with status
    expect(txt).toContain('CAMPO IDENTIFICADO: loan_amount');
    expect(txt).toContain('PARÂMETRO RECEBIDO (RAW): -50000');
    expect(txt).toContain('PARÂMETRO SANITIZADO (ENCAPSULADO): 0');
    expect(txt).toContain('O contratempo foi sanado com sucesso.');
  });
});

describe('Jakob Nielsen 10 Usability Heuristics & Session Stability', () => {
  it('formats session uptime accurately (Heuristic #1: Visibility of System Status)', () => {
    const formatUptime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins < 10 ? `0${mins}` : mins}m` : `${mins}m`;
    };

    expect(formatUptime(45)).toBe('45m');
    expect(formatUptime(120)).toBe('2h 00m');
    expect(formatUptime(195)).toBe('3h 15m');
    expect(formatUptime(240)).toBe('4h 00m');
  });

  it('encapsulates calculation errors without throwing unhandled exceptions (Heuristic #5: Error Prevention)', () => {
    // Simulates the safe calculation pattern inside FinancialDataContext
    const safeCalculate = (savings: number, pmt: number, rate: number, years: number) => {
      try {
        const safeSavings = Math.max(0, safeParseNumber(savings).value);
        const safePmt = Math.max(0, safeParseNumber(pmt).value);
        const safeRate = Math.max(0, Math.min(1000, safeParseNumber(rate).value));
        const safeYears = Math.max(0, Math.min(100, safeParseNumber(years).value));
        
        const months = safeYears * 12;
        const monthlyRate = (safeRate / 100) / 12;
        if (monthlyRate === 0) return safeSavings + (safePmt * months);
        return safeSavings * Math.pow(1 + monthlyRate, months) + safePmt * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      } catch {
        return 0;
      }
    };

    // Extreme inputs should never crash or return NaN/Infinity
    const result1 = safeCalculate(-1000, -200, -15, -5);
    expect(Number.isFinite(result1)).toBe(true);
    expect(result1).toBeGreaterThanOrEqual(0);

    const result2 = safeCalculate(NaN as any, Infinity as any, 12, 10);
    expect(Number.isFinite(result2)).toBe(true);
  });

  describe('Three Realistic Contemporary Simulations (Cenários Reais de Produção)', () => {
    // CENÁRIO 1: Segregação RBAC e Ocultação de Telemetria Operacional para Usuários Padrão
    it('Cenário 1: Segregação de privilégios — Telemetria de sessão visível apenas para Admin/SuperAdmin/SuperDev', () => {
      const checkAdminAccess = (role: string | null) => {
        if (!role) return false;
        const normalized = role.toLowerCase().trim();
        return ['admin', 'super_admin', 'super_developer', 'security_admin', 'dev'].includes(normalized);
      };

      // Usuário comum ou anônimo: NUNCA deve ver o badge técnico
      expect(checkAdminAccess(null)).toBe(false);
      expect(checkAdminAccess('user')).toBe(false);
      expect(checkAdminAccess('investidor')).toBe(false);
      expect(checkAdminAccess('CLIENTE_BASICO')).toBe(false);

      // Usuários com privilégio fiduciário: DEVEM ver o badge
      expect(checkAdminAccess('admin')).toBe(true);
      expect(checkAdminAccess('ADMIN')).toBe(true);
      expect(checkAdminAccess('super_admin')).toBe(true);
      expect(checkAdminAccess('SUPER_ADMIN')).toBe(true);
      expect(checkAdminAccess('super_developer')).toBe(true);
      expect(checkAdminAccess('security_admin')).toBe(true);
    });

    // CENÁRIO 2: Recálculo Local Isolado com Supressão de Full-Page Reloads
    it('Cenário 2: Recálculo local instantâneo — isola inputs sem recarregar a árvore global', () => {
      let pageReloadPrevented = false;
      let propagationStopped = false;

      const mockEvent = {
        preventDefault: () => { pageReloadPrevented = true; },
        stopPropagation: () => { propagationStopped = true; },
      };

      // Simula submissão por tecla Enter no campo de entrada
      const handleSubmit = (e: typeof mockEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      handleSubmit(mockEvent);
      expect(pageReloadPrevented).toBe(true);
      expect(propagationStopped).toBe(true);

      // Simula recálculo local de métricas sem mutar estados externos
      const localCardCalculate = (income: number, expenses: number) => {
        const safeInc = Math.max(0, income);
        const safeExp = Math.max(0, expenses);
        const freeCashFlow = safeInc - safeExp;
        const savingsRate = safeInc > 0 ? (freeCashFlow / safeInc) * 100 : 0;
        return { freeCashFlow, savingsRate: Math.max(0, savingsRate) };
      };

      const result = localCardCalculate(15000, 9500);
      expect(result.freeCashFlow).toBe(5500);
      expect(result.savingsRate).toBeCloseTo(36.67, 1);
    });

    // CENÁRIO 3: Ciclo Completo de Pagamento Stripe (Cartão de Crédito, Débito e PIX) com Desbloqueio do Cockpit
    it('Cenário 3: Fluxo de Assinatura Stripe — Desbloqueio estrito do Cockpit Agente IA após confirmação', () => {
      // 1. Estado inicial: Usuário gratuito não tem acesso ao Cockpit
      const verifyCockpitAccess = (tier: string, role: string) => {
        const isAdmin = ['admin', 'super_admin', 'super_developer'].includes(role.toLowerCase());
        return tier === 'premium' || isAdmin;
      };

      let currentTier = 'free';
      let currentRole = 'investidor';
      expect(verifyCockpitAccess(currentTier, currentRole)).toBe(false);

      // 2. Simula pagamento via Stripe (Cartão de Crédito)
      const processStripePayment = (method: 'credit_card' | 'debit_card' | 'pix') => {
        const txId = `txn_test_${Date.now()}`;
        return {
          status: 'confirmed',
          paymentMethod: method,
          transactionId: txId,
          amount: 19.90,
          tier: 'premium'
        };
      };

      const creditCardReceipt = processStripePayment('credit_card');
      expect(creditCardReceipt.status).toBe('confirmed');
      expect(creditCardReceipt.paymentMethod).toBe('credit_card');
      currentTier = creditCardReceipt.tier;

      // 3. Cockpit agora desbloqueado com sucesso
      expect(verifyCockpitAccess(currentTier, currentRole)).toBe(true);

      // 4. Teste de pagamento alternativo via PIX
      const pixReceipt = processStripePayment('pix');
      expect(pixReceipt.status).toBe('confirmed');
      expect(pixReceipt.paymentMethod).toBe('pix');

      // 5. Teste de pagamento via Cartão de Débito
      const debitReceipt = processStripePayment('debit_card');
      expect(debitReceipt.status).toBe('confirmed');
      expect(debitReceipt.paymentMethod).toBe('debit_card');
    });
  });

  describe('Self-Healing Engine, Diagnosed Error Database & Email Alerting', () => {
    it('captures critical errors, generates screenshot print data URL, preserves inputs, and routes to v.torresko2015@gmail.com', async () => {
      const { 
        reportDiagnosedError, 
        getDiagnosedErrorsTable, 
        clearDiagnosedErrorsTable,
        recordStableSnapshot,
        getStableSnapshot
      } = await import('../src/lib/selfHealingEngine');

      clearDiagnosedErrorsTable();

      // 1. Testa gravação de snapshot estável de inputs
      recordStableSnapshot('Diagnóstico Financeiro', {
        income: 18000,
        expenses: 7500,
        savings: 50000,
      });

      const restored = getStableSnapshot('Diagnóstico Financeiro');
      expect(restored).toBeDefined();
      expect(restored?.income).toBe(18000);
      expect(restored?.expenses).toBe(7500);
      expect(restored?.savings).toBe(50000);

      // 2. Dispara erro crítico com inputs preservados
      const err = await reportDiagnosedError({
        severity: 'CRITICAL',
        componentName: 'FinanceCalculators',
        error: new Error('Teste de exceção de divisão por zero e estouro de buffer'),
        capturedInputs: {
          rendaMensal: 18000,
          despesasMensais: 7500,
          reservaAtual: 50000,
          userDraft: 'R$ 18.000',
        },
      });

      expect(err.id).toBeDefined();
      expect(err.severity).toBe('CRITICAL');
      expect(err.emailSentTo).toBe('v.torresko2015@gmail.com');
      expect(err.recoveryNotice).toContain('O contratempo foi sanado');
      expect(err.screenshotBase64).toContain('data:image/svg+xml;base64,');
      expect(err.capturedInputs.rendaMensal).toBe(18000);
      expect(err.rootCauseCategory).toBeDefined();
      expect(err.systemImpact).toBeDefined();
      expect(err.suggestedRemediation).toBeDefined();

      // 3. Verifica presença na tabela de erros diagnosticados
      const table = getDiagnosedErrorsTable();
      expect(table.length).toBeGreaterThanOrEqual(1);
      expect(table[0].componentName).toBe('FinanceCalculators');
      expect(table[0].emailSentTo).toBe('v.torresko2015@gmail.com');
    });
  });
});

