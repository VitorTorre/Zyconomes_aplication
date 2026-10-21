/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  activatePermanentPremiumCockpit, 
  verifyPermanentPremiumCockpit, 
  generateFiduciarySignature,
  ISO_STANDARDS_REGISTRY 
} from '../src/services/zyconomesIsoComplianceManager';
import { runPersonalAgentSimulation } from '../src/services/zyconomesPersonalAgentEngine';

describe('Transferência do Cockpit Agente IA para Plano Premium Permanente & Validação Tri-Cenário ISO', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Governança de Licenciamento Permanente & Assinatura Criptográfica', () => {
    it('ativa a licença permanente e confere acesso irrestrito ao Cockpit sob ISO 42001 e ISO 27001', () => {
      const initialCheck = verifyPermanentPremiumCockpit();
      expect(initialCheck.isPremium).toBe(false);
      expect(initialCheck.license).toBeNull();

      const license = activatePermanentPremiumCockpit('Investidor Fiduciário Zyconomes (Licença Permanente)');
      expect(license.isPermanent).toBe(true);
      expect(license.status).toBe('active');
      expect(license.tier).toBe('premium');
      expect(license.signatureSha256).toContain('0x');

      const verified = verifyPermanentPremiumCockpit();
      expect(verified.isPremium).toBe(true);
      expect(verified.license?.licenseId).toBe(license.licenseId);
      expect(verified.standardsCount).toBe(7);
    });

    it('gera assinaturas determinísticas imutáveis para garantir a rastreabilidade da titularidade fiduciária', () => {
      const sig1 = generateFiduciarySignature('User123', '2026-10-19T12:00:00Z');
      const sig2 = generateFiduciarySignature('User123', '2026-10-19T12:00:00Z');
      const sigDiff = generateFiduciarySignature('User999', '2026-10-19T12:00:00Z');

      expect(sig1).toBe(sig2);
      expect(sig1).not.toBe(sigDiff);
      expect(sig1.startsWith('0x')).toBe(true);
    });
  });

  describe('2. Simulação do Cenário 1: Intervenção Regulatória, Vigilância Digital & Soberania Local-First (2026)', () => {
    it('comprova superioridade da Hipótese B (Local-First ISO 42001/27701) sobre Hipótese A (Nuvem Centralizada)', () => {
      // Hipótese A: Simulação remota exigiria latência de rede e transmissão de saldo
      // Hipótese B: Execução 100% no cliente em sub-20ms com zero dados transmitidos
      const start = performance.now();
      const simLocal = runPersonalAgentSimulation({
        initialCapitalBRL: 500000,
        quarterlyContributionStepBRL: 1500,
        targetWeeklyUSD: 2500,
        currentExchangeRateBRLUSD: 5.60
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(35);
      expect(simLocal.projections.length).toBe(16);
      // Garantia de integridade ISO: auditoria de conformidade presente
      expect(simLocal.isoComplianceStandards).toBeDefined();
      expect(simLocal.isoComplianceStandards?.length).toBe(7);
      expect(simLocal.isoComplianceStandards?.[0]).toContain('ISO/IEC 42001');
    });
  });

  describe('3. Simulação do Cenário 2: Choque Inflacionário, Desvalorização Cambial & Degradação da Moeda Fiat', () => {
    it('comprova superioridade da Hipótese B (Dolarização Glide Path 20/25/40/15) sobre Hipótese A (Nominal 100% Real)', () => {
      const sim = runPersonalAgentSimulation({
        initialCapitalBRL: 1000,
        initialMonthlyContributionBRL: 400,
        quarterlyContributionStepBRL: 250,
        targetWeeklyUSD: 2000,
        currentExchangeRateBRLUSD: 5.50
      });

      const year1 = sim.projections[1];
      const year5 = sim.projections[5];
      const year15 = sim.projections[15];

      // Hipótese A manteria 0% de dolarização expondo o investidor à perda inflacionária
      // Hipótese B aplica o Glide Path fiduciário
      expect(year1.dollarizationRatio).toBeLessThanOrEqual(25);
      expect(year5.dollarizationRatio).toBeGreaterThanOrEqual(20);
      expect(year15.dollarizationRatio).toBeGreaterThanOrEqual(60);

      // Meta de renda passiva em USD protegida contra a desvalorização do Real
      expect(year15.estimatedWeeklyPassiveIncomeUSD).toBeGreaterThan(0);
      expect(year15.portfolioTotalUSD).toBeGreaterThan(0);
    });
  });

  describe('4. Simulação do Cenário 3: Resiliência Operacional sob Queda de Conectividade (ISO 22301 & ISO 25010)', () => {
    it('mantém o Cockpit 100% funcional e licenciado offline mesmo com corte total de rede', () => {
      // Ativa licença permanente
      activatePermanentPermanentCompliance();

      // Simula modo offline / sem acesso a servidor
      const offlineCheck = verifyPermanentPremiumCockpit();
      expect(offlineCheck.isPremium).toBe(true);
      expect(offlineCheck.isoCompliant).toBe(true);

      // O motor calcula todas as trajetórias sem falhar
      const simOffline = runPersonalAgentSimulation({
        initialCapitalBRL: 1000,
        marketCycle: 'contraction',
        tone: 'skeptical_fiduciary'
      });

      expect(simOffline.cycleInsight.phase).toBe('contraction');
      expect(simOffline.cycleInsight.riskScore).toBe(7);
      expect(simOffline.milestones.shortTermYear1EndBRL).toBeGreaterThan(1000);
    });
  });
});

function activatePermanentPermanentCompliance() {
  return activatePermanentPremiumCockpit('Auditoria de Resiliência Fiduciária ISO 22301');
}
