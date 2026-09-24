# Zyconomes | Motores Matemáticos Financeiros & Gestão Institucional

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green.svg)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-43%20Passed-emerald.svg)]()
[![Security](https://img.shields.io/badge/Security-Behavioral_Firewall_Active-emerald.svg)]()

> **Erradicando o achismo financeiro através de rigor matemático analítico, modelos de portfólio institucional (Modern Portfolio Theory & Risk Parity) e infraestrutura de alta resiliência com tolerância zero a falhas.**

O **Zyconomes** é uma plataforma full-stack de inteligência patrimonial, simulação matemática financeira e gestão de portfólios institucionais. Desenvolvido sob a premissa de *local-first com sincronização resiliente na nuvem*, o ecossistema disponibiliza diagnósticos exatos, projeções analíticas contínuas e alocações de ativos calibradas com as práticas dos maiores Family Offices, Fundos Soberanos e Endowments globais.

---

## 🧭 Índice Geral
1. [Visão Geral da Arquitetura](#-visão-geral-da-arquitetura)
2. [Os 20 Raciocínios Relacionais e Execucionais da Arquitetura](#-os-20-raciocínios-relacionais-e-execucionais-da-arquitetura)
3. [Auditoria Sistemática de Pastas e Subpastas](#-auditoria-sistemática-de-pastas-e-subpastas)
4. [O Setup Seletivo Institucional & Formas Investimentais](#-o-setup-seletivo-institucional--formas-investimentais)
5. [Os Motores Matemáticos Determinísticos](#-os-motores-matemáticos-determinísticos)
6. [Resolução de Incidentes e Resiliência Operacional](#-resolução-de-incidentes-e-resiliência-operacional)
7. [Camada de Segurança em Profundidade](#-camada-de-segurança-em-profundidade)
8. [Suíte de Testes Automatizados e Comandos Operacionais](#-suíte-de-testes-automatizados-e-comandos-operacionais)
9. [Governança e Diretrizes de Engenharia](#-governança-e-diretrizes-de-engenharia)

---

## 🏛 Visão Geral da Arquitetura

O Zyconomes opera sob uma arquitetura híbrida de alto desempenho:
1. **Frontend (SPA Reativo):** React 19 + TypeScript rodando com Vite. Gráficos em tempo real com Recharts, persistência JIT no `localStorage` com chaveamento de auditoria e geração instantânea de relatórios executivos em PDF.
2. **Backend (API & Middlewares de Segurança):** Servidor Node.js/Express (`server.ts`) com integração bidirecional ao Vite via `vite.middlewares` no ambiente de desenvolvimento, integrando gateway de sanitização, firewall comportamental e ledger criptográfico de segurança.
3. **Persistência de Dados & Auth:**
   - **Camada Local:** Operação offline transparente (local-first) com tolerância total a partições de rede.
   - **Camada Relacional:** PostgreSQL / Cloud SQL gerenciado via Drizzle ORM (`src/db/schema.ts`).
   - **Autenticação & RBAC:** Tokens JWT/Bearer validados pelo middleware de controle de acesso baseado em papéis (`USER`, `PREMIUM`, `ADMIN`, `SUPER_ADMIN`).
4. **Motor Institucional de Alocação (MPT & Risk Parity):** Sistema determinístico e resiliente a falhas (`src/lib/institutionalStrategies.ts`) integrado ao Gemini 2.5 como consultor qualitativo, munido de fallback automático com taxa zero de erro.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ZYCONOMES ECOSYSTEM                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│  FRONTEND (SPA VITE)  │                             │  BACKEND SERVER.TS    │
│  - React 19 + TS      │ ◄─── REST APIs / Auth ────► │  - Express 4.x        │
│  - Recharts Donut/Area│      Bearer JWT Tokens      │  - BehavioralFirewall │
│  - Local-First Cache  │                             │  - Security Gateway   │
│  - PDF Report Engine  │                             │  - RateLimiter Window │
└───────────┬───────────┘                             └───────────┬───────────┘
            │                                                     │
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│ LOCALSTORAGE (JIT)    │                             │ CLOUD SQL / POSTGRES  │
│ - zyc_ai_amount       │                             │ - Drizzle ORM Schema  │
│ - zyc_income/expenses │                             │ - users & simulations │
│ - Audit Local Ledgers │                             │ - events & feedbacks  │
└───────────────────────┘                             └───────────────────────┘
```

---

## 🧠 Os 20 Raciocínios Relacionais e Execucionais da Arquitetura

1. **Relação entre Monólito Híbrido e Baixa Latência:** A unificação do backend Express com `vite.middlewares` no mesmo processo Node.js elimina saltos de rede entre frontend e backend durante o desenvolvimento, viabilizando feedback instantâneo e tempo de resposta sub-milissegundo para cálculos analíticos locais.
2. **Relação entre Local-First e Continuidade Operacional:** Usuários de ferramentas financeiras sofrem perdas de contexto em conexões instáveis. Ao persistir cada parâmetro no `localStorage` sob o padrão JIT com chaveamento semântico (`zyc_*`), garantimos que a interface seja 100% utilizável mesmo em modo offline.
3. **Relação entre Fallback Determinístico e Resiliência de IA:** Depender exclusivamente de LLMs externas para retornos numéricos cria pontos únicos de falha (*SPOF*). Implementamos o motor de Modern Portfolio Theory (MPT) com cálculo analítico local: se o Gemini estiver sem cota ou inacessível, o usuário recebe a mesma estrutura patrimonial matemática de alta relevância com taxa zero de falha.
4. **Relação entre Sanitização de Entrada e Defesa em Profundidade:** A camada `securityGateway.ts` valida esquemas de payload antes que atinjam os controladores de rota, neutralizando injeções de SQL, manipulações de protótipo e valores negativos em parâmetros matemáticos que causariam loops ou estouro de pilha.
5. **Relação entre Firewall Comportamental e Detecção de Abuso:** O `behavioralFirewall.ts` rastreia a velocidade e o padrão das mutações. Clientes que tentam sobrecarregar o sistema com requisições anômalas ou tentativas de enumeração são automaticamente enquadrados em quarentena antes de consumir recursos do banco de dados.
6. **Relação entre Circuit Breaker e Preservação de Snapshot Imutável:** O `circuitBreaker.ts` monitora dependências externas (como Stripe e Cloud SQL). Ao registrar falhas consecutivas, ele desarma o tráfego externo e serve um snapshot estático validado (*Release A*), impedindo falhas em cascata no applet.
7. **Relação entre Ledger Criptográfico com HMAC SHA-256 e Imutabilidade de Auditoria:** O arquivo `securityAudit.ts` gera hashes encadeados onde cada registro de segurança referencia o hash do evento anterior (`prevHash` $\to$ `entryHash`). Qualquer adulteração manual em logs é detectada de imediato pelo validador de integridade do ledger.
8. **Relação entre Rate Limiting Duplo (Client + Server) e Experiência do Usuário:** O bloqueio prematuro no cliente (`clientRateLimiter.ts`) evita cliques compulsivos e notificações frustrantes, enquanto o rate limiter no servidor (`RateLimiter.ts`) atua como barreira estrita contra ataques distribuídos.
9. **Relação entre Separação de Esquema Drizzle e Flexibilidade de Banco:** Definir tabelas tipadas em `src/db/schema.ts` permite migrar transparentemente entre PostgreSQL em Cloud SQL corporativo e instâncias de desenvolvimento locais sem alterar uma única linha da lógica de controle.
10. **Relação entre Fórmulas Matemáticas Puras e Testabilidade Unitária:** Ao isolar as equações financeiras em `financeMath.ts` como funções puras (sem dependências de DOM ou estado externo), viabilizamos uma suíte com 43 testes de regressão com execução em milissegundos.
11. **Relação entre Paridade de Risco (*Risk Parity*) e Macroeconomia Global:** No arquivo `institutionalStrategies.ts`, a estratégia All Weather de Ray Dalio foi calibrada em 4 vetores de volatilidade (ações, títulos longos, títulos médios, ouro e commodities), garantindo que a carteira não fique refém de um único ciclo macroeconômico.
12. **Relação entre Realidade Macroeconômica Brasileira e Carrego Real:** A estratégia *Family Office Macro Brasil* atribui 55% de peso a títulos públicos IPCA+ e instrumentos isentos de IR (LCI/LCA 95%+ do CDI), capturando a assimetria histórica da taxa de juros real brasileira sem abdicar de 15% de hedge em dólar.
13. **Relação entre Fator Tempo Logarítmico e Planejamento de Aposentadoria:** Na ferramenta de independência financeira, o cálculo de prazo não utiliza iterações de força bruta aproximadas, mas sim a resolução analítica da equação de anuidade composta: $n = \frac{\ln((VF \cdot i + PMT) / (VP \cdot i + PMT))}{\ln(1 + i)}$, entregando precisão exata ao centavo.
14. **Relação entre Desmascaramento da Tabela Price e Redução do Endividamento:** O cálculo analítico da amortização Price separa o encargo de juros do principal decrescente, tornando explícito que nos primeiros anos mais de 70% da parcela paga a instituições bancárias não amortiza a dívida real.
15. **Relação entre SVG Responsivo e Donut Charts no Recharts:** A renderização de gráficos na Ferramenta 6 foi ajustada com `ResponsiveContainer` e `paddingAngle` calibrado, exibindo tooltips formatados com o padrão monetário brasileiro (`R$`) e legenda de alocação de classes em tempo real.
16. **Relação entre Geração de Relatórios PDF Institucionais e Venda Consultiva:** A integração de `GeneratePDFReport.tsx` com `getActiveReportData()` permite ao usuário extrair um dossiê em PDF pronto para reuniões com planejadores financeiros ou comitês familiares, com parâmetros, métricas de Sharpe e justificativa técnica das classes de ativos.
17. **Relação entre Controle de Acesso Baseado em Papéis (RBAC) e Monetização Segura:** O middleware `rbac.ts` desacopla papéis (`USER`, `PREMIUM`, `ADMIN`, `SUPER_ADMIN`) de permissões atômicas (`SIMULATION_EXECUTE`, `SIMULATION_SAVE`, `USER_MANAGE`), garantindo que recursos exclusivos para assinantes não possam ser burlados por alteração de parâmetros no front-end.
18. **Relação entre Rastreamento de Analytics via DataLayer e Otimização de Funil:** A implementação do `useToolAnalytics.ts` e `analytics.ts` registra eventos como `simulation_completed`, preenchimento de inputs e intenção de compra sem invadir a privacidade do investidor nem comprometer o tempo de renderização da página.
19. **Relação entre Design Tokenizado e Ergonomia Visual:** O uso de classes Tailwind utilitárias, tipografia balanceada e contrastes certificados WCAG em modo claro e escuro garante uma experiência limpa, livre de sobrecarga visual.
20. **Relação entre Auditoria Contínua de Build e Confiabilidade em Produção:** As rotinas automatizadas com `tsc --noEmit` e `vite build` garantem que nenhuma dependência quebrada ou conflito de tipos de TypeScript chegue ao ambiente de produção.

---

## 🗺 Auditoria Sistemática de Pastas e Subpastas

```text
├── server.ts                       # Ponto de entrada Full-Stack (Express, APIs, Middlewares, Vite SPA)
├── index.html                      # Ponto de entrada HTML com Meta SEO & Scripts de AdSense/Analytics
├── metadata.json                   # Metadados e capacidades da aplicação no AI Studio
├── package.json                    # Dependências, scripts de build, lint e execução
├── tsconfig.json                   # Configurações do compilador TypeScript
├── vite.config.ts                  # Configuração de bundler e plugins
├── src/
│   ├── main.tsx                    # Bootstrap do React 19
│   ├── App.tsx                     # Orquestrador de rotas, navegação e controle de visualização
│   ├── index.css                   # Tailwind CSS global e diretivas de design
│   ├── db/
│   │   ├── index.ts                # Conexão Drizzle ORM com pool Postgres
│   │   ├── schema.ts               # Schemas de tabelas (users, simulations, feedbacks, events)
│   │   ├── drizzle.config.ts       # Configuração de migrações Drizzle
│   │   └── users.ts                # Operações de persistência e lookup de usuários
│   ├── lib/
│   │   ├── institutionalStrategies.ts # 6 Modelos Institucionais (All Weather, Family Office, Yale, etc.)
│   │   ├── financeMath.ts          # Fórmulas analíticas (Price, Juros Compostos, Independência)
│   │   ├── financeMath.test.ts     # Bateria de testes unitários matemáticos
│   │   ├── securityAudit.ts        # Registro e validação de integridade do ledger de segurança
│   │   ├── circuitBreaker.ts       # Disjuntor de sobrecarga e snapshots imutáveis
│   │   ├── releaseManager.ts       # Controle de versões, integridade e migrações
│   │   ├── RateLimiter.ts          # Rate limiter de rota e IP para o backend Express
│   │   ├── clientRateLimiter.ts    # Rate limiter client-side contra abusos de clique/salvamento
│   │   ├── auditLogger.ts          # Gravador de eventos analíticos e persistência do usuário
│   │   ├── analytics.ts            # DataLayer nativo para tracking granular de conversão
│   │   ├── firebase.ts             # Inicialização do Firebase Client SDK
│   │   └── firebase-admin.ts       # SDK Administrativo Firebase para validação de tokens
│   ├── middleware/
│   │   ├── auth.ts                 # Middleware requireAuth para validação de Bearer Tokens
│   │   ├── rbac.ts                 # Controle de acesso baseado em papéis (requireRole, requirePermission)
│   │   ├── securityGateway.ts      # Sanitização de inputs e validação de schemas Zod-like
│   │   ├── behavioralFirewall.ts   # Firewall de detecção de anomalias comportamentais
│   │   └── logger.ts               # Registro estruturado de requisições HTTP
│   ├── services/
│   │   ├── zyconomesEngine.ts      # Motor unificado de regras de negócio financeiras
│   │   └── securityPlane.ts        # Serviço de telemetria e governança do painel SuperAdmin
│   ├── components/
│   │   ├── FinanceCalculators.tsx  # Central de ferramentas interativas (Diagnóstico, Price, MPT)
│   │   ├── GeneratePDFReport.tsx   # Modal e gerador de relatórios executivos para impressão/PDF
│   │   ├── ZyconomesDashboard.tsx  # Visão panorâmica de métricas patrimoniais
│   │   ├── SuperAdminSecurityPlane.tsx # Cockpit de governança e monitoramento de segurança
│   │   ├── AdminDashboard.tsx      # Dashboard administrativo para gestão de usuários e simulações
│   │   ├── ZyconomesBlog.tsx       # Módulo editorial com suporte a Markdown estático
│   │   ├── EmailCapture.tsx        # Captura não-intrusiva de leads com analytics
│   │   └── PremiumButton.tsx       # Integração com Checkout Stripe para planos Pro
│   ├── hooks/
│   │   ├── useToolAnalytics.ts     # Rastreamento de tempo de permanência e preenchimento de campos
│   │   ├── useKeyboardShortcuts.ts # Atalhos de teclado universais (Ctrl+S, navegação)
│   │   └── useBreakpoint.ts        # Detecção de responsividade e viewport
│   └── types/
│       └── zyconomes.ts            # Definições estritas de interfaces e tipos de domínio
├── docs/                           # Documentação técnica, especificações de engenharia e topologia
└── tests/                          # Suíte de testes automatizados (unitários, integração e stress k6)
```

---

## 💼 O Setup Seletivo Institucional & Formas Investimentais

O arquivo `/src/lib/institutionalStrategies.ts` implementa os 6 modelos de referência de investidores institucionais:

| Modelo | Autor / Referência | Perfil | Retorno Real Alvo | Volatilidade ($\sigma$) | Sharpe Estimado | Rebalanceamento |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **All Weather** | Ray Dalio (Bridgewater) | Moderado | IPCA + 5,8% a.a. | 6,5% a.a. | 0,85 | Anual ou banda $\pm 5\%$ |
| **Family Office Macro Brasil** | Gestores de Fortunas BR | Moderado | IPCA + 6,6% a.a. | 7,8% a.a. | 0,92 | Semestral ou banda $\pm 5\%$ |
| **Yale Endowment** | David Swensen (Yale) | Agressivo | IPCA + 8,2% a.a. | 13,5% a.a. | 0,78 | Semestral por fluxo |
| **Fronteira Eficiente** | Harry Markowitz (MPT) | Moderado | IPCA + 6,2% a.a. | 7,2% a.a. | 0,95 | Trimestral ($\pm 5\%$) |
| **Boglehead 3-Fund** | John Bogle (Vanguard) | Moderado | IPCA + 6,0% a.a. | 9,8% a.a. | 0,72 | Anual estrito |
| **Barbell Antifrágil** | Nassim Taleb | Agressivo | IPCA + 7,5% a.a. | 11,0% a.a. | 0,88 | Trimestral em lucros |

### Detalhamento das Classes de Ativos & Instrumentos Práticos no Brasil

1. **Renda Fixa Indexada à Inflação (IPCA+):**
   - *Instrumentos:* Tesouro IPCA+ 2035 / 2045, Debêntures Incentivadas AAA.
   - *Tributação:* Tabela Regressiva (Tesouro) ou **Isento de IR para PF** (Debêntures).
   - *Liquidez:* $D+1$ (Tesouro) / Mercado Secundário.
2. **Renda Fixa Pós-Fixada Soberana e Bancária:**
   - *Instrumentos:* Tesouro Selic (LFT), LCI/LCA 95%+ do CDI, CDBs de liquidez diária.
   - *Tributação:* **Isento de IR para PF** (LCI/LCA) ou Tabela Regressiva.
   - *Liquidez:* $D+0$ / $D+1$.
3. **Equities Brasil (Ações e Índices Locais):**
   - *Instrumentos:* ETF BOVA11, DIVO11, Carteira de Dividendos Perenes.
   - *Tributação:* 15% sobre ganho de capital (isenção de R$ 20k/mês em ações).
   - *Liquidez:* $D+2$.
4. **Ativos Globais em Moeda Forte (Hedge Cambial):**
   - *Instrumentos:* ETF IVVB11 (S&P 500), WRLD11 (MSCI World), BDRs.
   - *Tributação:* 15% sobre o ganho de capital.
   - *Liquidez:* $D+2$.
5. **Real Estate & Fundos Imobiliários (FIIs):**
   - *Instrumentos:* FIIs de Tijolo/Logística (HGLG11, BTLG11) e Shoppings (XPML11).
   - *Tributação:* **Rendimentos mensais isentos de IR para PF**.
   - *Liquidez:* $D+2$.
6. **Hedge Sistêmico & Reservas de Valor:**
   - *Instrumentos:* GOLD11 (Ouro), Ouro Spot BM&FBOVESPA, Criptoativos assimétricos.
   - *Tributação:* 15% sobre o ganho líquido de alienação.
   - *Liquidez:* $D+0$ a $D+2$.

---

## 🧮 Os Motores Matemáticos Determinísticos

### 1. Diagnóstico Financeiro & Taxa de Poupança
$$S_{rate} = \frac{\text{Renda Líquida} - \text{Despesas}}{\text{Renda Líquida}} \times 100$$
$$FCF = \text{Renda Líquida} - \text{Despesas}$$

### 2. Capitalização Composta Contínua com Aportes
$$VF = VP(1 + i)^n + PMT \left[ \frac{(1 + i)^n - 1}{i} \right]$$
Onde $i$ é a taxa mensal equivalente: $i = (1 + i_{anual})^{1/12} - 1$.

### 3. Reserva de Emergência
$$\text{Meses de Cobertura} = \frac{\text{Reserva Líquida}}{\text{Custo de Vida Mensal}}$$

### 4. Sistema de Amortização Price
$$PMT = PV \cdot \frac{i(1 + i)^n}{(1 + i)^n - 1}$$
A cada período $k$, a fração de amortização real cresce exponencialmente enquanto os juros decrescem sobre o saldo devedor remanescente.

### 5. Duração para Independência Financeira (Fator Tempo)
$$n = \frac{\ln\left(\frac{VF \cdot i + PMT}{VP \cdot i + PMT}\right)}{\ln(1 + i)}$$

---

## 🛡️ Resolução de Incidentes e Resiliência Operacional

### 1. Resolução do Erro de Externalização do Módulo `crypto`
* **Causa Raiz:** O módulo Node.js `crypto` foi importado em componentes client-side executados no browser (`crypto.randomBytes`), causando falhas durante a compilação e execução Vite.
* **Resolução Aplicada:**
  - Substituição sistemática por `window.crypto.getRandomValues(new Uint8Array(n))` no frontend com fallback em `Math.random` seguro.
  - O módulo `crypto` do Node foi estritamente restrito aos arquivos de infraestrutura backend (`server.ts`, `src/lib/securityAudit.ts`, middlewares).

### 2. Resolução do Erro 500 em `/api/ai/rebalance`
* **Causa Raiz:** Quando o applet era executado sem a chave `GEMINI_API_KEY` ou sofria limites de requisição (*rate limiting* da API de IA), a rota retornava HTTP 500 ("Falha ao conectar com o motor de IA").
* **Resolução Aplicada:**
  - Implementação de fallback com o **Motor Institucional MPT**: caso a API de IA falhe ou não possua chave ativa, a rota `/api/ai/rebalance` intercepta a falha e retorna o portfólio institucional com 100% de precisão analítica e status HTTP 200.
  - No frontend (`FinanceCalculators.tsx`), o cliente também conta com o motor em memória, eliminando a renderização de caixas vermelhas de erro.

---

## 🔒 Camada de Segurança em Profundidade

1. **Firewall Comportamental (`src/middleware/behavioralFirewall.ts`):** Rastreia tentativas de mutação repetitiva, bloqueando ataques de negação de serviço e injeção de parâmetros antes que alcancem o banco.
2. **Circuit Breaker (`src/lib/circuitBreaker.ts`):** Protege serviços integrados (Stripe, Cloud SQL). Em caso de instabilidade, chaveia automaticamente para o snapshot imutável *Release A*.
3. **Ledger Auditável com HMAC SHA-256 (`src/lib/securityAudit.ts`):** Mantém uma cadeia de hashes imutável de todos os eventos de segurança e acessos privilegiados.
4. **Rate Limiting em Camadas:**
   - **Backend:** `RateLimiter.ts` aplicando janela deslizante por IP e ação.
   - **Frontend:** `clientRateLimiter.ts` protegendo contra múltiplos envios acidentais de simulações.

---

## 🧪 Suíte de Testes Automatizados e Comandos Operacionais

A integridade do sistema é validada por **43 testes automatizados** via Vitest:

```text
✓ tests/securityArchitecture.test.ts (9 tests)
✓ tests/auth.test.ts (9 tests)
✓ tests/singleFlight.test.ts (2 tests)
✓ tests/auditLogger.test.ts (3 tests)
✓ src/lib/financeMath.test.ts (8 tests)
✓ tests/analytics.test.ts (3 tests)
✓ tests/boot.test.ts (5 tests)
✓ tests/shortcuts.test.ts (2 tests)
✓ tests/stripe.test.ts (2 tests)

Test Files: 9 passed (9)
Tests:      43 passed (43)
```

### Comandos de Execução

```bash
# 1. Instalação de dependências
npm install

# 2. Execução em ambiente de desenvolvimento (porta 3000)
npm run dev

# 3. Execução dos testes automatizados
npm test

# 4. Verificação estática de tipos (TypeScript)
npm run lint

# 5. Build de produção (Vite SPA + Bundle Node CJS)
npm run build

# 6. Inicialização de produção
npm start
```

---

## 📊 Governança e Diretrizes de Engenharia

- **Anti-AI Slop & Zero Mock:** Todos os cálculos refletem matemática financeira canônica. Não há números gerados aleatoriamente; cada percentual corresponde a instrumentos negociados no mercado real.
- **Relatório PDF Institucional:** O módulo `GeneratePDFReport.tsx` gera documentos executivos formatados para impressão e apresentação a investidores de alta renda.
- **Auditoria de Conversão:** O DataLayer registra o funil completo sem ferir a privacidade dos usuários (`useToolAnalytics`).

---

**Licença:** Proprietário / Zyconomes Architecture Systems  
**Engenheiro Responsável:** Vitor Torres (Zyconomes Lead Engineer)  
**Status Operacional:** Produção / Build Verificado
