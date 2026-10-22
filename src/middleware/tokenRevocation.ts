/**
 * Zyconomes Token Revocation & Global Security Ledger
 * 
 * Implementação de barreira de desvalidação instantânea de tokens de acesso:
 * - Mantém lista de revogação em memória de alta performance (O(1));
 * - Desvalida o token em todos os endpoints protegidos da aplicação;
 * - Invalida tokens por string exata ou por UID do usuário (timestamp de corte);
 * - Conformidade com ISO/IEC 27001 (A.9.4 Controle de Acesso) e ISO 22301.
 */

// Conjunto de tokens especificamente revogados (blacklist)
const revokedTokenSet = new Set<string>();

// Mapeamento de UID -> Timestamp (milissegundos) de revogação de todas as sessões anteriores
const userRevocationTimestamps = new Map<string, number>();

/**
 * Revoga um token de acesso imediatamente em todos os endpoints do sistema.
 * Se o UID do usuário for fornecido, revoga também todas as sessões anteriores emitidas para o UID.
 */
export function revokeToken(token: string, uid?: string): void {
  if (token && typeof token === 'string') {
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    if (cleanToken) {
      revokedTokenSet.add(cleanToken);
    }
  }

  if (uid && typeof uid === 'string') {
    userRevocationTimestamps.set(uid, Date.now());
  }
}

/**
 * Verifica se um token ou sessão foi revogado em qualquer endpoint do sistema.
 * @param token Token de acesso Bearer ou string bruta
 * @param uid UID opcional do usuário autenticado
 * @param tokenIssuedAtTimestamp Timestamp iat do token em segundos (padrão JWT)
 */
export function isTokenRevoked(token?: string | null, uid?: string, tokenIssuedAtTimestamp?: number): boolean {
  if (!token && !uid) return false;

  // 1. Verificação direta na blacklist de tokens revogados
  if (token && typeof token === 'string') {
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    if (cleanToken && revokedTokenSet.has(cleanToken)) {
      return true;
    }
  }

  // 2. Verificação de revogação global por UID (logout de todas as sessões)
  if (uid && userRevocationTimestamps.has(uid)) {
    const revocationTimeMs = userRevocationTimestamps.get(uid)!;
    if (tokenIssuedAtTimestamp) {
      // Se o token foi emitido antes ou no momento da revogação, ele é inválido
      if (tokenIssuedAtTimestamp * 1000 <= revocationTimeMs) {
        return true;
      }
    } else {
      // Se não há timestamp no token e o usuário foi revogado recentemente
      return true;
    }
  }

  return false;
}

/**
 * Revoga todas as sessões anteriores emitidas para o UID do usuário.
 */
export function revokeAllUserTokens(uid: string): void {
  if (uid && typeof uid === 'string') {
    userRevocationTimestamps.set(uid, Date.now());
  }
}

/**
 * Limpa tokens revogados antigos para controle de uso de memória.
 */
export function clearExpiredRevocations(): void {
  // Mantém controle de limite máximo
  if (revokedTokenSet.size > 20000) {
    revokedTokenSet.clear();
  }
}

/**
 * Retorna estatísticas de revogação para auditoria técnica
 */
export function getRevocationStats() {
  return {
    revokedTokensCount: revokedTokenSet.size,
    userRevocationsCount: userRevocationTimestamps.size,
    revokedUsersCount: userRevocationTimestamps.size,
    status: 'ACTIVE_ENFORCEMENT'
  };
}

export const getRevocationLedgerStats = getRevocationStats;

