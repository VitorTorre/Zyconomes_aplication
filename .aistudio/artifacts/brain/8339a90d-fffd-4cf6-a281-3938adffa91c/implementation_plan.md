# Plano de Implementação: Visualização Isolada de Artigos (Reader View) & Reconfiguração da Navegação

Plano detalhado para atender a solicitação do usuário: ao clicar em **"Ler artigo"** (ou selecionar qualquer artigo pelo título ou menu), o sistema descarrega/fecha temporariamente a seção **"Motores Matemáticos"** (Hero, Cockpit Agente IA e Calculadoras), apresentando **apenas o Cabeçalho (Header)** no topo, o **Artigo Específico correspondente** no corpo principal e o **Rodapé (Footer)** logo abaixo, com histórico de navegação para retornar exatamente à última página ou ferramenta utilizada.

---

## 1. Visão Geral da Arquitetura & Diagnóstico do Estado Atual

### Estado Atual
- No momento, o componente `<ZyconomesBlog />` é renderizado como uma seção dentro da página inicial (`#blog`).
- Ao clicar em "Ler Artigo", o componente apenas troca o estado interno (`activeArticle`), mas a página inteira continua com a seção Hero, o Cockpit Agente IA e todas as Calculadoras empilhadas acima do artigo, forçando um scroll ou poluindo a experiência de leitura.
- Os botões no dropdown do Header (`openBlog(...)`) apenas rolam a página até `#blog` e disparam um evento customizado.

### Novo Comportamento Projetado
1. **Reader View Dedicado e Isolado (`currentView === 'artigo'`):**
   - Quando o usuário clica em "Ler Artigo" (ou num card de artigo, ou pelo menu de artigos no Header), a rota/visão muda para a visualização dedicada do artigo (`#artigo?id={article-id}`).
   - As seções de **"Motores Matemáticos"** (Hero, Cockpit Agente IA, Calculadoras/Ferramentas e Repositório de Transparência) são descarregadas e fechadas, deixando o artigo limpo e legível.
   - Apenas o **Cabeçalho Oficial** permanece fixo no topo e o **Rodapé Institucional** é carregado logo abaixo do artigo.
2. **Histórico e Retorno Inteligente:**
   - O sistema armazena a última rota/ferramenta visitada antes de entrar no artigo (ex.: se o usuário estava na ferramenta *Acelerador de Financiamento SAC/PRICE*, ou no *Diagnóstico*, ou no *Sobre Nós*).
   - O botão **"Voltar"** no topo do artigo restaura a última página/ferramenta com precisão fiduciária.
3. **Botão de Ação "Fazer Diagnóstico Gratuito ->":**
   - Ao final do artigo e nos CTAs correlatos, o clique em *"Fazer Diagnóstico Gratuito ->"* fecha a visão do artigo, reabre a seção de *Motores Matemáticos* na Home, reativa as calculadoras e faz scroll suave direto para a ferramenta de diagnóstico.
4. **Elementos Visuais Enriquecidos (Opções 1 e 2 solicitadas):**
   - **Barra de progresso de leitura** dinâmica no topo da tela acompanhando o scroll;
   - **Metadados fiduciários:** tempo de leitura, categoria, data de auditoria e autor;
   - **Tipografia Markdown profissional:** títulos, tabelas, citações em bloco com borda institucional e fórmulas;
   - **Artigos relacionados:** cards recomendados ao final para continuidade do estudo;
   - **Botão Voltar com indicação de destino:** exibe para onde o usuário retornará.

---

## 2. Componentes e Arquivos Impactados

1. **`src/components/FinanceTemplate.tsx`**:
   - Ampliar o tipo `currentView` para incluir `'artigo'`.
   - Adicionar estado `activeArticleId` e `previousRouteContext` (`{ view: string, toolId?: number }`).
   - Parser de hash atualizado para reconhecer `#artigo?id={id}` e `#blog?id={id}` com suporte nativo ao botão Voltar/Avançar do navegador (`hashchange`).
   - Sincronização de SEO dinâmico (`document.title` e `meta description`) com o título do artigo ativo.
   - Renderização condicional: quando `currentView === 'artigo'`, renderizar `<ZyconomesArticleReader />` entre o Header e o Footer.
   - Atualizar `openBlog(id)` no Header para abrir diretamente no leitor dedicado.
2. **`src/components/ZyconomesArticleReader.tsx`** (Novo componente modular):
   - Leitor completo de artigos Markdown com:
     - Barra de progresso de leitura horizontal no topo da janela;
     - Botão de voltar com memória de rota prévia;
     - Renderização completa via `react-markdown` com estilização refinada;
     - Card de CTA institucional com botão *"Fazer Diagnóstico Gratuito ->"* com ícone de seta que reabre as ferramentas;
     - Seção de *Artigos Relacionados* com navegação direta entre artigos.
3. **`src/components/ZyconomesBlog.tsx`**:
   - Atualizar os cards da listagem: o clique no card ou no botão *"Ler Artigo <ChevronRight />"* dispara a navegação para a visualização dedicada do artigo (`navigateToArticle(article.id)`).
4. **`tests/articleReaderNavigation.test.ts`** (Nova suíte de testes automatizados):
   - Testar o isolamento do leitor de artigo (ausência das seções de calculadoras na visão do artigo);
   - Testar a retenção de histórico prévio para o botão voltar;
   - Testar a ação do botão *"Fazer Diagnóstico Gratuito"* reabrindo a seção de ferramentas.

---

## 3. Plano Passo a Passo de Execução

- **Passo 1:** Criar o componente `src/components/ZyconomesArticleReader.tsx` com carregamento dinâmico dos arquivos Markdown de `src/content/blog/`, cálculo de barra de progresso no scroll, botões de ação e lista de artigos relacionados.
- **Passo 2:** Atualizar `src/components/ZyconomesBlog.tsx` para direcionar o clique de "Ler Artigo" para o roteador do leitor.
- **Passo 3:** Integrar `ZyconomesArticleReader` no roteamento principal de `src/components/FinanceTemplate.tsx`, gerenciando a abertura do artigo, fechamento das calculadoras/motores matemáticos, atualização de título SEO e restauração da última ferramenta visitada ao clicar em voltar ou no CTA de diagnóstico.
- **Passo 4:** Criar testes automatizados em `tests/articleReaderNavigation.test.ts` cobrindo roteamento, histórico e renderização de cabeçalho + artigo + rodapé.
- **Passo 5:** Executar `compile_applet`, `lint_applet` e `npm run validate` para garantir zero regressões e conformidade de build.
- **Passo 6:** Documentar as alterações em Pauta e Micro-Observações no `README.md`.

---

## 4. Critérios de Aceite e Verificação

- [ ] Clicar em "Ler Artigo" em qualquer post abre a página com **apenas o Cabeçalho, o Artigo específico e o Rodapé**.
- [ ] A seção "Motores Matemáticos" (Hero, Cockpit e Calculadoras) fica descarregada/fechada durante a leitura do artigo.
- [ ] O botão "Voltar" dentro do artigo retorna à página ou ferramenta exata previamente visitada pelo usuário.
- [ ] O botão "Fazer Diagnóstico Gratuito ->" reabre a seção de ferramentas e rola suavemente para o diagnóstico.
- [ ] Barra de progresso de leitura funcional acompanhando a rolagem do usuário.
- [ ] Todos os testes automatizados passando 100% verde no Vitest e compilação sem erros no TypeScript.
