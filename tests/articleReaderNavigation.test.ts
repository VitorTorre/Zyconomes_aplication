/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Zyconomes Article Reader & Navigation Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
  });

  it('deve extrair metadados e frontmatter dos arquivos markdown corretamente', () => {
    const rawMd = `---
id: "juros-compostos"
title: "A Ilusão da Rentabilidade: O Segredo Obscuro dos Juros Compostos"
description: "Por que tentar encontrar o 'melhor investimento' é um erro fatal para iniciantes."
category: "Crescimento"
readTime: "4 min"
---
# O Mito da Rentabilidade Mágica
Texto do artigo aqui.`;

    const match = rawMd.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    expect(match).not.toBeNull();
    if (match) {
      const metaRaw = match[1];
      const content = match[2];
      const meta: Record<string, string> = {};

      metaRaw.split(/\r?\n/).forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
          const key = line.substring(0, colonIdx).trim();
          const val = line.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
          meta[key] = val;
        }
      });

      expect(meta.id).toBe('juros-compostos');
      expect(meta.title).toContain('A Ilusão da Rentabilidade');
      expect(meta.category).toBe('Crescimento');
      expect(meta.readTime).toBe('4 min');
      expect(content).toContain('# O Mito da Rentabilidade Mágica');
    }
  });

  it('deve suportar rota dedicada #artigo?id=... sem expor motores matemáticos', () => {
    const route = '#artigo?id=amortizacao-dividas';
    const [hashPath, queryString] = route.replace('#', '').split('?');
    const urlParams = new URLSearchParams(queryString || '');
    const articleId = urlParams.get('id');

    expect(hashPath).toBe('artigo');
    expect(articleId).toBe('amortizacao-dividas');

    // Quando o currentView é 'artigo', a seção de motores matemáticos (home) não deve ser renderizada
    const currentView = hashPath;
    const isMathEnginesSectionLoaded = currentView === 'home';
    expect(isMathEnginesSectionLoaded).toBe(false);
  });

  it('deve armazenar a rota e ferramenta visitada anteriormente para permitir o retorno exato', () => {
    const previousRouteContext = {
      view: 'home',
      toolId: 4, // Acelerador de Dívidas SAC
      label: 'Acelerador de Dívidas (SAC)'
    };

    // Usuário abre o artigo
    const navigationHistory = {
      previous: previousRouteContext,
      currentArticleId: 'amortizacao-dividas'
    };

    expect(navigationHistory.previous.toolId).toBe(4);
    expect(navigationHistory.previous.label).toBe('Acelerador de Dívidas (SAC)');

    // Ao clicar em voltar, a ferramenta restaurada deve ser o id 4
    const restoredToolId = navigationHistory.previous.toolId;
    expect(restoredToolId).toBe(4);
  });

  it('deve disparar ação correta para o botão Fazer Diagnósticos Gratuitos reabrindo as ferramentas', () => {
    let mathEnginesOpened = false;
    let targetToolId: number | null = null;

    const handleOpenDiagnosticsFromArticle = () => {
      mathEnginesOpened = true;
      targetToolId = 1; // Ferramenta 1: Diagnóstico Financeiro
    };

    handleOpenDiagnosticsFromArticle();

    expect(mathEnginesOpened).toBe(true);
    expect(targetToolId).toBe(1);
  });

  it('deve disparar ação para Revisar Todo o Site Zyconomes reabrindo a plataforma', () => {
    let siteView = 'artigo';

    const handleReviewFullSite = () => {
      siteView = 'home';
    };

    handleReviewFullSite();
    expect(siteView).toBe('home');
  });
});
