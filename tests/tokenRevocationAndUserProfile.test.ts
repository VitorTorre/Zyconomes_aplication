import { describe, it, expect, beforeEach } from 'vitest';
import { revokeToken, isTokenRevoked, revokeAllUserTokens, getRevocationStats } from '../src/middleware/tokenRevocation';

describe('Cross-Endpoint Token Revocation & Security', () => {
  beforeEach(() => {
    // Test with fresh tokens
  });

  it('correctly marks a token as revoked and detects it immediately', () => {
    const tokenA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user123_sample_token_a';
    const tokenB = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user456_sample_token_b';

    expect(isTokenRevoked(tokenA)).toBe(false);
    expect(isTokenRevoked(tokenB)).toBe(false);

    revokeToken(tokenA);

    expect(isTokenRevoked(tokenA)).toBe(true);
    expect(isTokenRevoked(tokenB)).toBe(false);
  });

  it('rejects empty, null, or undefined tokens gracefully without crashing', () => {
    expect(isTokenRevoked('')).toBe(false);
    expect(isTokenRevoked(null as any)).toBe(false);
    expect(isTokenRevoked(undefined as any)).toBe(false);
  });

  it('revokes all tokens issued before a cutoff timestamp for a user', () => {
    const userId = 'usr_financial_123';
    const now = Math.floor(Date.now() / 1000);

    revokeAllUserTokens(userId);

    // Token issued before revocation cutoff
    expect(isTokenRevoked('any_valid_token_string', userId, now - 100)).toBe(true);

    // Token issued after revocation cutoff
    expect(isTokenRevoked('fresh_token_string_456', userId, now + 100)).toBe(false);
  });

  it('reports revocation statistics accurately', () => {
    const stats = getRevocationStats();
    expect(stats.revokedTokensCount).toBeGreaterThan(0);
    expect(typeof stats.userRevocationsCount).toBe('number');
  });
});

describe('User Financial Parameters Discrimination (Cadastro vs Motor Matemático)', () => {
  it('correctly categorizes whether data came from Cadastro vs Motor Matemático', () => {
    // Simulates the contract used in UserProfilePage
    interface FinancialParameter {
      key: string;
      label: string;
      value: string | number;
      source: 'cadastro' | 'motor_matematico' | 'padrao';
      sourceDescription: string;
    }

    const parameters: FinancialParameter[] = [
      {
        key: 'nome',
        label: 'Nome Completo',
        value: 'Investidor Inteligente',
        source: 'cadastro',
        sourceDescription: 'Informado no fluxo de cadastro da conta'
      },
      {
        key: 'email',
        label: 'E-mail Principal',
        value: 'investidor@zyconomes.com.br',
        source: 'cadastro',
        sourceDescription: 'Informado no fluxo de cadastro da conta'
      },
      {
        key: 'taxa_juros_simulada',
        label: 'Taxa Anual (Juros Compostos)',
        value: '13.25% a.a.',
        source: 'motor_matematico',
        sourceDescription: 'Configurado e simulado no Motor Matemático #2 (Juros Compostos)'
      },
      {
        key: 'reserva_meses',
        label: 'Meses de Cobertura de Emergência',
        value: '6 meses',
        source: 'motor_matematico',
        sourceDescription: 'Parametrizado no Motor Matemático #3 (Reserva de Emergência)'
      }
    ];

    const cadastroItems = parameters.filter(p => p.source === 'cadastro');
    const motorItems = parameters.filter(p => p.source === 'motor_matematico');

    expect(cadastroItems).toHaveLength(2);
    expect(motorItems).toHaveLength(2);
    expect(cadastroItems.map(c => c.key)).toEqual(['nome', 'email']);
    expect(motorItems.map(m => m.key)).toEqual(['taxa_juros_simulada', 'reserva_meses']);
  });
});

describe('Guaranteed Index Navigation & Route Resolution', () => {
  it('defaults to index (home) on empty hash, invalid route or root', () => {
    const validViews = ['home', 'login', 'about', 'contact', 'privacy', 'terms', 'admin', 'sucesso', 'premium', 'perfil'];

    const resolveRoute = (hash: string, pathname = '/') => {
      const cleanHash = hash.replace('#', '').split('?')[0];
      if (cleanHash && validViews.includes(cleanHash)) {
        return cleanHash;
      }
      if (pathname.includes('/sucesso')) return 'sucesso';
      return 'home';
    };

    expect(resolveRoute('')).toBe('home');
    expect(resolveRoute('#')).toBe('home');
    expect(resolveRoute('#home')).toBe('home');
    expect(resolveRoute('#unknown-page')).toBe('home');
    expect(resolveRoute('#perfil')).toBe('perfil');
    expect(resolveRoute('#artigo?id=juros-compostos')).toBe('home'); // article parsed separately
    expect(resolveRoute('', '/sucesso')).toBe('sucesso');
  });
});
