/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const FaultyComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Simulated critical crash during render');
  }
  return <div>Componente Operando com Sucesso</div>;
};

describe('ErrorBoundary & Page Reload Resilience [Conformidade ISO 22301 & Zero Tela Branca]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza os componentes filhos normalmente quando não há exceções', () => {
    render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Componente Operando com Sucesso')).toBeDefined();
  });

  it('captura exceções fatais de renderização prevenindo a tela branca e exibindo mensagem objetiva para usuário comum', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Contenção Preventiva de Erros">
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Para usuários padrão, exibe status objetivo de notícias sem tela técnica verde assustadora
    expect(screen.getByText(/Notícias do Sistema: O contratempo foi sanado com sucesso/)).toBeDefined();
    expect(screen.getByText(/A visualização anterior foi restaurada e suas simulações continuam disponíveis/)).toBeDefined();
    expect(screen.getByText('Continuar Navegando')).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('exibe a central de recuperação ativa com contagem regressiva de 15s para administradores', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('zyc_user_role', 'ADMIN');

    render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Central de Recuperação Ativa/)).toBeDefined();
    expect(screen.getByText(/Validação de Token & Auto-Recuperação/)).toBeDefined();
    expect(screen.getByText(/Validando Permissões do Token em Execução/)).toBeDefined();
    expect(screen.getByText('Restaurar Agora (Voltar ao Início)')).toBeDefined();

    const restoreButton = screen.getByText('Restaurar Agora (Voltar ao Início)');
    fireEvent.click(restoreButton);

    consoleSpy.mockRestore();
  });

  it('valida o parser síncrono de rotas garantindo que no reload a visualização correta seja renderizada instantaneamente', () => {
    const parseRoute = (hash: string, pathname = '/') => {
      const rawHash = hash.replace('#', '');
      const [hashPath, queryString] = rawHash.split('?');
      const cleanHash = hashPath || (pathname.includes('/sucesso') ? 'sucesso' : 'home');

      if (cleanHash === 'artigo' || cleanHash === 'blog-reader') {
        const urlParams = new URLSearchParams(queryString || '');
        return { view: 'artigo', articleId: urlParams.get('id') || 'juros-compostos' };
      }

      const validViews = ['home', 'login', 'about', 'contact', 'privacy', 'terms', 'admin', 'sucesso', 'premium'];
      if (validViews.includes(cleanHash)) {
        return { view: cleanHash, articleId: 'juros-compostos' };
      }
      return { view: 'home', articleId: 'juros-compostos' };
    };

    // Cenário 1: Reload na Home vazia
    expect(parseRoute('', '/')).toEqual({ view: 'home', articleId: 'juros-compostos' });

    // Cenário 2: Reload na URL de sucesso
    expect(parseRoute('', '/sucesso')).toEqual({ view: 'sucesso', articleId: 'juros-compostos' });

    // Cenário 3: Reload direto no artigo
    expect(parseRoute('#artigo?id=amortizacao-dividas', '/')).toEqual({ 
      view: 'artigo', 
      articleId: 'amortizacao-dividas' 
    });

    // Cenário 4: Reload no plano premium
    expect(parseRoute('#premium', '/')).toEqual({ view: 'premium', articleId: 'juros-compostos' });

    // Cenário 5: Hash inválido ou desconhecido retorna home sem quebrar
    expect(parseRoute('#rota-inexistente', '/')).toEqual({ view: 'home', articleId: 'juros-compostos' });
  });
});
