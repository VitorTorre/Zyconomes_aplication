import { describe, it, expect, beforeEach } from 'vitest';
import { encryptField, decryptField, simulateEncryptionDemo } from '../src/lib/encryption';
import { checkAdminTimeWindow, isAuthorizedAdminIdentity } from '../src/middleware/timeAccessControl';
import { logSecurityEvent, verifyLedgerIntegrity, getSecurityLogs, clearSecurityLogsForTesting } from '../src/lib/securityAudit';

describe('Aparato de Segurança Institucional & Blindagem Cibernética', () => {

  describe('Pilar 1: Criptografia Autenticada AES-256-GCM', () => {
    it('encripta e decripta valores patrimoniais e PII com integridade perfeita', () => {
      const plaintext = 'R$ 850.000,00 - Carteira Alocada IPCA+ e Ações';
      const encrypted = encryptField(plaintext);

      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(encrypted.ciphertext).not.toBe(plaintext);

      const decrypted = decryptField(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('gera IVs criptográficos pseudoaleatórios distintos para textos idênticos', () => {
      const text = 'Dado Sensível Repetido';
      const enc1 = encryptField(text);
      const enc2 = encryptField(text);

      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
      expect(decryptField(enc1)).toBe(text);
      expect(decryptField(enc2)).toBe(text);
    });

    it('rejeita imediatamente decriptação se a tag de autenticação for adulterada (Tamper Attack)', () => {
      const plaintext = 'Saldo de Investimentos Protegido';
      const encrypted = encryptField(plaintext);

      // Adulterar authTag
      const tamperedTag = encrypted.authTag.slice(0, -2) + (encrypted.authTag.endsWith('00') ? '11' : '00');
      const tamperedPayload = { ...encrypted, authTag: tamperedTag };

      expect(() => decryptField(tamperedPayload)).toThrow();
    });

    it('simula demonstração visual completa para o SuperAdmin com verificação de integridade', () => {
      const demo = simulateEncryptionDemo('CPF 000.000.000-00 - Investidor Pro');
      expect(demo.verifiedIntegrity).toBe(true);
      expect(demo.original).toBe('CPF 000.000.000-00 - Investidor Pro');
      expect(demo.keyFingerprint).toBeDefined();
    });
  });

  describe('Pilar 2: Controle de Acesso Temporal (TBAC) & Whitelist de Contas', () => {
    it('autoriza apenas o e-mail do fundador e desenvolvedores na whitelist administrativa', () => {
      expect(isAuthorizedAdminIdentity('v.torresko2015@gmail.com')).toBe(true);
      expect(isAuthorizedAdminIdentity('V.TORRESKO2015@GMAIL.COM')).toBe(true);
      expect(isAuthorizedAdminIdentity('dev@zyconomes.com')).toBe(true);
      expect(isAuthorizedAdminIdentity('admin@zyconomes.com')).toBe(true);

      // Bloqueia tentativas de terceiros
      expect(isAuthorizedAdminIdentity('invasor@evil.com')).toBe(false);
      expect(isAuthorizedAdminIdentity('outro_usuario@gmail.com')).toBe(false);
      expect(isAuthorizedAdminIdentity(undefined)).toBe(false);
    });

    it('reconhece a janela operacional das 11:00 às 13:45 Horário de Brasília (UTC-3)', () => {
      // 12:30 BRT -> 15:30 UTC
      const withinWindow = new Date('2026-10-15T15:30:00Z');
      const statusWithin = checkAdminTimeWindow(withinWindow);
      expect(statusWithin.isAllowed).toBe(true);
      expect(statusWithin.windowStart).toBe('11:00');
      expect(statusWithin.windowEnd).toBe('13:45');

      // 18:00 BRT -> 21:00 UTC (fora da janela)
      const outsideWindow = new Date('2026-10-15T21:00:00Z');
      const statusOutside = checkAdminTimeWindow(outsideWindow);
      expect(statusOutside.isAllowed).toBe(false);
    });
  });

  describe('Pilar 3: Malha de Auditoria Encadeada (Ledger Imutável estilo Blockchain)', () => {
    beforeEach(() => {
      clearSecurityLogsForTesting();
    });

    it('encadeia hashes sequencialmente referenciando o bloco anterior', () => {
      const event1 = logSecurityEvent({
        category: 'AUTHORIZED_MUTATION',
        severity: 'LOW',
        action: 'TEST_EVENT_1',
        actor: 'v.torresko2015@gmail.com',
      });

      const event2 = logSecurityEvent({
        category: 'IDOR_ATTEMPT',
        severity: 'HIGH',
        action: 'TEST_IDOR_PROBE',
        actor: 'ip:192.168.1.100',
      });

      expect(event1.prevHash).toBe('0'.repeat(64));
      expect(event2.prevHash).toBe(event1.entryHash);
      expect(event1.serverHmac).toBeDefined();
      expect(event2.serverHmac).toBeDefined();

      const verification = verifyLedgerIntegrity();
      expect(verification.valid).toBe(true);
      expect(verification.totalEntries).toBe(2);
    });

    it('detecta imediatamente adulteração fraudulenta de histórico no meio da malha', () => {
      logSecurityEvent({ category: 'AUTHORIZED_MUTATION', severity: 'LOW', action: 'BLOCK_0' });
      logSecurityEvent({ category: 'PRIVILEGED_ACTION', severity: 'HIGH', action: 'BLOCK_1' });
      logSecurityEvent({ category: 'AUTHORIZED_MUTATION', severity: 'LOW', action: 'BLOCK_2' });

      const logs = getSecurityLogs(10);
      expect(verifyLedgerIntegrity().valid).toBe(true);

      // Simular ataque adulterando o bloco do meio (BLOCK_1)
      const middleEntry = logs.find(l => l.action === 'BLOCK_1');
      if (middleEntry) {
        middleEntry.details = { corruptedByAttacker: true };
      }

      const postTamper = verifyLedgerIntegrity();
      expect(postTamper.valid).toBe(false);
      expect(postTamper.reason).toContain('Entry hash corrupted');
    });
  });
});
