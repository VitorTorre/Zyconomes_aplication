# Modo Noturno de Alto Contraste & Transição Cromática da Marca Zyconomes

Plano de engenharia visual para implementar a alternância completa do Modo Noturno (Dark Mode) no ecossistema Zyconomes, garantindo inversão tipográfica de alto contraste (fontes pretas tornando-se brancas puras e textos secundários em cinza claro legível), transição da marca Zyconomes e acentos principais de azul escuro institucional (`#1A1F71`) para azul celeste vibrante com gradiente fluorescente sutil (`#38BDF8` a `#60A5FA`), acionado pelo botão de Sol/Lua na barra de navegação superior com persistência em `localStorage`.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Confirmadas nas Perguntas de Alinhamento (Fase 1):**
> 1. **Comportamento da Cor Azul da Marca Zyconomes:** No modo escuro, a cor institucional transmuta do azul marinho escuro (`#1A1F71`) para **Azul Celeste Vibrante (`#38BDF8`)** conciliado com **degradê fluorescente suave (`#60A5FA` / `sky-400` a `blue-500`)**, conferindo destaque luminoso de altíssimo contraste contra fundos pretos/zinc-950 sem ofuscamento.
> 2. **Inversão Tipográfica Global:** Todas as fontes pretas e escuras de títulos, rótulos e métricas do portal invertem para **branco puro (`text-white` / `text-zinc-50`)**, e os textos descritivos secundários convertem-se para **cinza claro (`text-zinc-300` / `text-zinc-400`)**, erradicando textos apagados ou de baixo contraste em qualquer simulador ou página.
> 3. **Gatilho de Alternância do Modo Noturno:** O controle principal permanece no **Ícone de Sol e Lua na barra de navegação superior**, com resposta em $\le 100\text{ms}$, sincronização instantânea na tag `<html>` (`class="dark"`) e retenção imediata da preferência em `localStorage`.

---

## 1. Overview & Core Concept

- **O que faz:** Permite que investidores e planejadores financeiros alternem entre o modo claro e o modo noturno com legibilidade fiduciária impecável. No modo noturno, toda a hierarquia de fontes ganha nitidez óptica: títulos principais e números de simulações tornam-se brancos cristalinos, textos explicativos tornam-se cinza claro suave e a identidade visual Zyconomes brilha em azul celeste luminoso.
- **Público-Alvo:** Investidores e consultores que utilizam a plataforma em ambientes de baixa luminosidade ou realizam simulações prolongadas (2 a 4 horas), necessitando de conforto visual e conformidade com WCAG AA (contraste superior a 7:1 em títulos).
- **Valor Agregado:** Elimina esforço visual, garante conformidade com a Heurística #8 de Jakob Nielsen (Estética e Design Minimalista) e respeita as diretrizes de design do sistema sem alterar a lógica determinística dos motores de cálculo.

---

## 2. User Experience & Visual Design

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               PALETA CROMÁTICA: MODO CLARO VS. MODO ESCURO (ZYCONOMES)                 │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ ELEMENTO VISUAL               │ MODO CLARO (LIGHT)            │ MODO NOTURNO (DARK)    │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ Fundo Geral (Canvas 60%)      │ Branco Puro (#FFFFFF)         │ Preto Profundo (#09090B)│
│ Cartões e Superfícies (30%)   │ Zinco Claro (#F4F4F5 / #FAFAFA)│ Zinco Escuro (#18181B) │
│ Marca "Zyconomes"             │ Azul Escuro (#1A1F71)         │ Celeste Luminoso (#38BDF8)
│ Títulos e Fontes Primárias    │ Preto / Zinco 900 (#18181B)   │ Branco Cristal (#FFFFFF)│
│ Textos e Legendas Secundárias │ Zinco Neutro (#71717A)        │ Cinza Claro (#D4D4D8)  │
│ Botões Primários e CTAs (10%) │ Fundo #1A1F71, texto branco   │ Celeste/Azul gradiente │
│ Bordas Estruturais            │ Zinco 200 (#E4E4E7)           │ Zinco 800 (#27272A)    │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

- **Transição Suave de Contraste:**
  - A marca **Zyconomes** no logotipo do topo, nos títulos das seções (*"Motores Matemáticos."*, *"Planejamento Financeiro."*) e nos destaques de métricas adota a classe condicional `text-[#1A1F71] dark:text-sky-400 dark:drop-shadow-[0_0_12px_rgba(56,189,248,0.25)]`.
  - Todas as seções de simulação financeira (`FinanceCalculators.tsx`, `ZyconomesDashboard.tsx`, `FinanceTemplate.tsx`, `ZyconomesPages.tsx`) recebem classes Tailwind `dark:text-white` para cabeçalhos e `dark:text-zinc-300` para parágrafos.
  - As caixas de entrada de formulários (`inputs` numéricos e monetários) exibem fundo escuro com borda sutil e texto em branco mono (`dark:bg-zinc-900 dark:border-zinc-700 dark:text-white font-mono`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Azul Celeste Vibrante com Leve Gradiente Fluorescente no Dark Mode**
  - *Abordagem:* No modo escuro, o azul marinho clássico `#1A1F71` desaparece contra fundos pretos devido à baixa luminância relativa. Substituí-lo por azul celeste (`#38BDF8` / `sky-400` a `#60A5FA` / `blue-400`) garante taxa de contraste superior a 8.5:1 sobre o fundo `#09090b`.
  - *Por que:* Atende pontualmente à solicitação do investidor de manter a identidade azul da marca evidente, moderna e com legibilidade imediata.
- **Decisão 2: Inversão Abrangente em Todos os Módulos e Páginas**
  - *Abordagem:* Revisar não apenas a barra superior, mas o Hero, simuladores matemáticos, cards de diagnóstico, páginas institucionais (Sobre, Contato, Login, Perfil) e rodapé.
  - *Por que:* Evita inconsistências de "ilhas brancas" em telas escuras, proporcionando uma experiência imersiva e relaxante.
- **Decisão 3: Retenção Local Instantânea via LocalStorage**
  - *Abordagem:* O estado é mantido em `localStorage.setItem('zyc_theme', isDarkTheme ? 'dark' : 'light')` e inicializado antes da primeira pintura DOM para evitar flashes brancos ao recarregar.

---

## 4. Technical Architecture & Component Strategy

### Diagrama de Propagação do Tema Noturno

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THEME PROPAGATION SUBSYSTEM                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                        ┌───────────────────┴───────────────────┐
                        ▼                                       ▼
┌───────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│  Top Bar Toggle (Sun/Moon Button)             │ │  System Storage Hook                 │
│  - onClick: setIsDarkTheme(!prev)             │ │  - localStorage.getItem('zyc_theme') │
│  - Dispatches 'zyconomes:theme-toggled'       │ │  - Class 'dark' in <html> root node  │
└───────────────────────┬───────────────────────┘ └──────────────────┬───────────────────┘
                        │                                            │
                        └───────────────────┬────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  DOM STYLING ENGINE (TAILWIND 'dark:' VARIANTS)                                        │
│  - Brand Wordmark: text-[#1A1F71] dark:text-sky-400 dark:from-sky-400 dark:to-blue-500│
│  - Display Headlines: text-zinc-900 dark:text-white                                    │
│  - Secondary Prose: text-zinc-600 dark:text-zinc-300 / dark:text-zinc-400             │
│  - Form Inputs: bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white             │
│  - Calculator Cards: bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Arquivos e Módulos Envolvidos na Execução:

1. `src/components/FinanceTemplate.tsx`:
   - Atualização do Brand Wordmark ("Zyconomes") e ícone do logo para `text-[#1A1F71] dark:text-sky-400`.
   - Ajuste dos links de navegação, mega menus (Ferramentas e Blog) e menu mobile para suporte escuro com fontes brancas/cinza claro.
   - Reforço do botão de alternância Sol/Lua com indicador tátil e micro-interação.
2. `src/components/FinanceCalculators.tsx`:
   - Atualização dos títulos dos 9 motores matemáticos para `text-zinc-900 dark:text-white`.
   - Conversão das caixas de entrada de formulários (Renda, Despesas, Reserva, Aportes, Taxa, Prazos) para `dark:bg-zinc-900 dark:border-zinc-700 dark:text-white`.
   - Estilização dos cartões de métricas, textos descritivos e projeções em gráficos para alto contraste em fundo escuro.
3. `src/components/InteractiveCockpitBanner.tsx` & `src/components/ZyconomesWidgets.tsx`:
   - Adequação dos banners de chamada e botões de ação rápida para refletir azul celeste e fontes brancas no dark mode.
4. `src/index.css`:
   - Definição das variáveis de cor base e suavização de fontes (`antialiased`) com compensação óptica para texto claro sobre fundo escuro.
5. `tests/stabilityAndNielsenHeuristics.test.ts`:
   - Inclusão de testes automatizados validando a presença e inversão das classes dark mode e persistência em `localStorage`.
6. `README.md` (Pauta 24):
   - Registro detalhado da Pauta 24, padrões cromáticos e notas de engenharia de acessibilidade.
