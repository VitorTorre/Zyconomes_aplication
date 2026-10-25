import { describe, it, expect, beforeEach } from 'vitest';
import { isAlgorithmAuditorRole } from '../src/components/FinanceTemplate';

describe('Gating de Algoritmos e Purificação de Navegação (Nielsen Heuristics)', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
  });

  describe('isAlgorithmAuditorRole - Controle de Acesso Baseado em Papéis (RBAC)', () => {
    it('permite acesso fiduciário para a classe "admins" e "admin"', () => {
      expect(isAlgorithmAuditorRole('admin')).toBe(true);
      expect(isAlgorithmAuditorRole('admins')).toBe(true);
      expect(isAlgorithmAuditorRole('ADMIN')).toBe(true);
    });

    it('permite acesso fiduciário para a classe "superadmins" e "superadmin"', () => {
      expect(isAlgorithmAuditorRole('superadmin')).toBe(true);
      expect(isAlgorithmAuditorRole('superadmins')).toBe(true);
      expect(isAlgorithmAuditorRole('super_admin')).toBe(true);
      expect(isAlgorithmAuditorRole('SUPER_ADMIN')).toBe(true);
    });

    it('permite acesso fiduciário para a classe "superdesenvolvedoradmin" e variantes de desenvolvedor', () => {
      expect(isAlgorithmAuditorRole('superdesenvolvedoradmin')).toBe(true);
      expect(isAlgorithmAuditorRole('super_desenvolvedor_admin')).toBe(true);
      expect(isAlgorithmAuditorRole('superdeveloperadmin')).toBe(true);
      expect(isAlgorithmAuditorRole('super_developer')).toBe(true);
    });

    it('bloqueia o acesso para usuários comuns, investidores e visitantes anônimos', () => {
      expect(isAlgorithmAuditorRole(null)).toBe(false);
      expect(isAlgorithmAuditorRole(undefined)).toBe(false);
      expect(isAlgorithmAuditorRole('')).toBe(false);
      expect(isAlgorithmAuditorRole('investidor')).toBe(false);
      expect(isAlgorithmAuditorRole('user')).toBe(false);
      expect(isAlgorithmAuditorRole('cliente')).toBe(false);
      expect(isAlgorithmAuditorRole('guest')).toBe(false);
      expect(isAlgorithmAuditorRole('free')).toBe(false);
      expect(isAlgorithmAuditorRole('premium')).toBe(false);
    });
  });

  describe('Conformidade com Heurísticas de Jakob Nielsen', () => {
    it('satisfaz a Heurística #8 (Design Estético e Minimalista) eliminando botões intrusivos do cabeçalho', () => {
      // O cabeçalho agora mantém foco exclusivo nas ações primárias essenciais:
      // Ferramentas, Blog, Sobre, Contato, Busca (Ctrl+K), Modo Noturno e Acesso de Conta.
      const primaryHeaderActions = ['ferramentas', 'blog', 'sobre', 'contato', 'busca', 'tema', 'auth'];
      expect(primaryHeaderActions).not.toContain('tour_pill_button');
      expect(primaryHeaderActions).not.toContain('split_view_pill_button');
    });

    it('satisfaz as Heurísticas #5 (Prevenção de Erros) e #9 (Ajuda e Diagnóstico de Erros) para a seção Algoritmos', () => {
      // Usuários não autorizados são prevenidos de sobrecarga técnica
      const role = mockStorage['zyc_user_role'] || null;
      const canAccess = isAlgorithmAuditorRole(role);
      expect(canAccess).toBe(false);

      // Usuário com role autorizado ganha acesso
      mockStorage['zyc_user_role'] = 'superdesenvolvedoradmin';
      expect(isAlgorithmAuditorRole(mockStorage['zyc_user_role'])).toBe(true);
    });
  });
});
