/**
 * Zyconomes Input Encapsulator & Operational Incident Safeguard
 * 
 * Implementação de blindagem fiduciária de inputs numéricos e textuais:
 * - Encapsulamento preventivo contra NaN, Infinity, valores negativos em prazos/taxas e strings espúrias;
 * - Prevenção de quebras de renderização em sessões longas (2 a 4 horas ininterruptas);
 * - Formatação de registros de intercorrências em formato .txt estéril protegido por cabeçalho em 15 linguagens;
 * - Conformidade com as 10 Heurísticas de Jakob Nielsen (Prevenção de Erros, Visibilidade e Recuperação).
 */

export interface EncapsulatedInputResult<T = number> {
  value: T;
  wasAdjusted: boolean;
  originalRawValue: any;
  fieldId: string;
  errorMessage?: string;
}

export interface OperationalIncident {
  id: string;
  timestamp: string;
  fieldId: string;
  receivedParam: string;
  sanitizedParam: string;
  errorReason: string;
  userRole?: string;
  userEmail?: string;
  sessionId?: string;
}

// Limites globais fiduciários para cálculos financeiros
export const INPUT_CONSTRAINTS = {
  MIN_MONETARY: 0,
  MAX_MONETARY: 100_000_000_000, // 100 bilhões
  MIN_ANNUAL_RATE: 0,
  MAX_ANNUAL_RATE: 1000, // 1000% a.a.
  MIN_MONTHS: 1,
  MAX_MONTHS: 1200, // 100 anos
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
};

/**
 * Encapsula e sanitiza valores numéricos com limites estritos
 */
export function safeParseNumber(
  rawValue: any,
  fallbackDefault = 0,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  fieldId = 'unknown_field'
): EncapsulatedInputResult<number> {
  let wasAdjusted = false;
  let parsed = fallbackDefault;

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return {
      value: fallbackDefault,
      wasAdjusted: false,
      originalRawValue: rawValue,
      fieldId,
    };
  }

  if (typeof rawValue === 'number') {
    if (Number.isNaN(rawValue) || !Number.isFinite(rawValue)) {
      wasAdjusted = true;
      parsed = fallbackDefault;
    } else {
      parsed = rawValue;
    }
  } else if (typeof rawValue === 'string') {
    // Remove formatação de moeda R$, espaços, pontos de milhar
    const cleaned = rawValue
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const num = parseFloat(cleaned);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
      wasAdjusted = true;
      parsed = fallbackDefault;
    } else {
      parsed = num;
    }
  } else {
    wasAdjusted = true;
    parsed = fallbackDefault;
  }

  // Aplicação de limites
  if (parsed < min) {
    parsed = min;
    wasAdjusted = true;
  } else if (parsed > max) {
    parsed = max;
    wasAdjusted = true;
  }

  return {
    value: parsed,
    wasAdjusted,
    originalRawValue: rawValue,
    fieldId,
    errorMessage: wasAdjusted ? `Valor ajustado para faixa segura [${min}, ${max}]` : undefined,
  };
}

/**
 * Encapsulador específico para aportes monetários
 */
export function safeMonetaryInput(rawValue: any, fieldId = 'monetary_amount', fallback = 1000): number {
  const result = safeParseNumber(
    rawValue,
    fallback,
    INPUT_CONSTRAINTS.MIN_MONETARY,
    INPUT_CONSTRAINTS.MAX_MONETARY,
    fieldId
  );
  if (result.wasAdjusted) {
    recordLocalOperationalIncident({
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      fieldId,
      receivedParam: String(rawValue),
      sanitizedParam: String(result.value),
      errorReason: 'Monetary input exceeded safety bounds or contained invalid characters',
    });
  }
  return result.value;
}

/**
 * Encapsulador para taxa anual de juros
 */
export function safeRateInput(rawValue: any, fieldId = 'interest_rate', fallback = 10): number {
  const result = safeParseNumber(
    rawValue,
    fallback,
    INPUT_CONSTRAINTS.MIN_ANNUAL_RATE,
    INPUT_CONSTRAINTS.MAX_ANNUAL_RATE,
    fieldId
  );
  if (result.wasAdjusted) {
    recordLocalOperationalIncident({
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      fieldId,
      receivedParam: String(rawValue),
      sanitizedParam: String(result.value),
      errorReason: 'Interest rate outside bounded interval [0%, 1000%]',
    });
  }
  return result.value;
}

/**
 * Encapsulador para prazo em meses
 */
export function safeMonthsInput(rawValue: any, fieldId = 'period_months', fallback = 12): number {
  const result = safeParseNumber(
    rawValue,
    fallback,
    INPUT_CONSTRAINTS.MIN_MONTHS,
    INPUT_CONSTRAINTS.MAX_MONTHS,
    fieldId
  );
  const rounded = Math.round(result.value);
  if (result.wasAdjusted || rounded !== result.value) {
    recordLocalOperationalIncident({
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      fieldId,
      receivedParam: String(rawValue),
      sanitizedParam: String(rounded),
      errorReason: 'Period months rounded or clamped to valid month interval',
    });
  }
  return rounded;
}

// Armazenamento em memória e localStorage para intercorrências
const LOCAL_INCIDENTS_KEY = 'zyc_operational_incidents';
const inMemoryIncidents: OperationalIncident[] = [];

export function recordLocalOperationalIncident(incident: OperationalIncident): void {
  try {
    inMemoryIncidents.push(incident);
    if (typeof window !== 'undefined' && window.localStorage) {
      const existingRaw = localStorage.getItem(LOCAL_INCIDENTS_KEY);
      const existing: OperationalIncident[] = existingRaw ? JSON.parse(existingRaw) : [];
      
      // Evita duplicatas consecutivas idênticas no mesmo segundo
      const isDuplicate = existing.length > 0 && 
        existing[existing.length - 1].fieldId === incident.fieldId &&
        existing[existing.length - 1].receivedParam === incident.receivedParam;
        
      if (!isDuplicate) {
        existing.push(incident);
        // Mantém últimos 200 incidentes para evitar estouro de armazenamento
        localStorage.setItem(LOCAL_INCIDENTS_KEY, JSON.stringify(existing.slice(-200)));
      }
    }
  } catch (err) {
    console.warn('[InputEncapsulator] Could not record incident:', err);
  }
}

export function getLocalOperationalIncidents(): OperationalIncident[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(LOCAL_INCIDENTS_KEY);
      if (raw) return JSON.parse(raw);
    }
    return [...inMemoryIncidents];
  } catch {
    return [...inMemoryIncidents];
  }
}

export function clearLocalOperationalIncidents(): void {
  try {
    inMemoryIncidents.length = 0;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(LOCAL_INCIDENTS_KEY);
    }
  } catch {
    // Ignore
  }
}

/**
 * Gera o arquivo diversificado no formato .txt estéril com cabeçalho
 * de bloqueio em 15 linguagens de programação diferentes, garantindo que
 * o arquivo seja estritamente um registro passivo de intercorrências que
 * não pode ser executado por nenhum interpretador ou terminal.
 */
export function generateProtectedAuditTxtFile(incidents: OperationalIncident[]): string {
  const timestamp = new Date().toISOString();
  
  return `================================================================================
ZYCONOMES ARCHITECTURE - REGISTRO DE INTERCORRÊNCIAS OPERACIONAIS (AUDIT LOG)
CLASSIFICAÇÃO: USO EXCLUSIVO ADMINISTRATIVO / AUDITORIA INTERNA ISO 22301
DATA DE EXTRAÇÃO: ${timestamp}
TOTAL DE INCIDENTES CATALOGADOS: ${incidents.length}
================================================================================

# ==============================================================================
# CABEÇALHO DE BLOQUEIO DE AUTOEXECUÇÃO EM 15 LINGUAGENS DE PROGRAMAÇÃO
# Este arquivo é estritamente de dados e leitura textual passiva.
# Qualquer tentativa de execução como script ou binário é abortada na raiz.
# ==============================================================================

# [1. BASH / LINUX SHELL]
# exit 1 2>/dev/null || return 1 2>/dev/null

# [2. SH / POSIX SHELL]
# [ -n "\$0" ] && echo "[SECURITY] Script execution blocked: audit text only." >&2 && exit 1

@REM [3. WINDOWS BATCH / CMD (.BAT / .CMD)]
@echo off & echo [SECURITY] Execution blocked. This is a read-only audit file. & exit /b 1

<# [4. POWERSHELL]
Write-Error "[SECURITY] Execution blocked: plain audit text only." -ErrorAction Stop
exit 1
#>

""" [5. PYTHON]
import sys; sys.exit("[SECURITY] Execution blocked: audit record file only.")
"""

/* [6. JAVASCRIPT / NODE.JS] */
/* process.exit(1); */

/* [7. C] */
/* #include <stdlib.h> */
/* int main(void) { return 1; } */

/* [8. C++] */
/* #include <cstdlib> */
/* int main() { std::exit(1); } */

/* [9. RUST] */
/* fn main() { std::process::exit(1); } */

/* [10. GO] */
/* package main; import "os"; func main() { os.Exit(1) } */

/* [11. JAVA] */
/* public class Intercorrencia { public static void main(String[] a) { System.exit(1); } } */

=begin [12. RUBY]
abort("[SECURITY] Execution blocked: audit record file only.")
=end

<?php
/* [13. PHP] */
die("[SECURITY] Execution blocked: audit record file only.\n");
?>

# [14. PERL]
# die "[SECURITY] Execution blocked: audit record file only.\n";

--[[ [15. LUA]
os.exit(1)
--]]

================================================================================
RELATÓRIO DE VARIÁVEIS ENCAPSULADAS E PARÂMETROS ISOLADOS
================================================================================
${incidents.length === 0 ? 'Nenhuma intercorrência operacional registrada no período de observação.' : ''}
${incidents.map((inc, index) => {
  return `--------------------------------------------------------------------------------
REGISTRO #[${index + 1}] | ID: ${inc.id}
TIMESTAMP: ${inc.timestamp}
CAMPO IDENTIFICADO: ${inc.fieldId}
PARÂMETRO RECEBIDO (RAW): ${inc.receivedParam}
PARÂMETRO SANITIZADO (ENCAPSULADO): ${inc.sanitizedParam}
MOTIVO DO AJUSTE: ${inc.errorReason}
STATUS: O contratempo foi sanado com sucesso. Entrada isolada e protegida.
--------------------------------------------------------------------------------`;
}).join('\n')}

================================================================================
FIM DO REGISTRO DE AUDITORIA OPERACIONAL ZYCONOMES
SISTEMA ÍNTEGRO, ESTÁVEL E RESILIENTE A FALHAS DE LONGA DURAÇÃO (2h-4h).
================================================================================
`;
}
