# GAPs Conhecidos e Dívidas Técnicas (Zyconomes Architecture)

Este documento atua como o registro oficial de transparência, governança e auditoria de engenharia da plataforma Zyconomes. Ele mapeia as distâncias entre a nossa visão teórica de arquitetura e a implementação prática atual, servindo como guia mandatório de evolução técnica.

---

## [GAP-001] Cache LRU em memória é incompatível com múltiplas instâncias horizontais
- **Situação Atual**: O middleware `src/middleware/auth.ts` e o motor de IA utilizam instâncias locais de `lru-cache` / `Map` em memória do processo Node.js (`userCache`, `aiPortfolioCache`).
- **Risco Arquitetural**: Funciona com alta performance em 1 instância. Quando a infraestrutura escalar para 3+ réplicas no Cloud Run ou Kubernetes (acima de ~5k usuários ativos), o cache fica inconsistente entre nós:
  - *Exemplo*: Instância A sincroniza o usuário para o tier `premium`. Instância B ainda possui o usuário como `free` em seu cache local. Um refresh de página roteado para a instância B retrocede a visualização do usuário.
- **Resolução Planejada**: Migrar a camada de cache para um cluster gerenciado de **Redis (Memorystore ou Upstash)** assim que houver mais de 1 réplica ativa do backend, utilizando `SETNX` e pub/sub de invalidação de sessão.

---

## [GAP-002] Dossiê PDF via browser print (`window.print`) vs Pipeline Headless Server-Side
- **Situação Atual**: O componente `GeneratePDFReport.tsx` formata os relatórios financeiros através de `@media print` no CSS e aciona a caixa nativa de impressão do navegador (`window.print()`).
- **Risco Arquitetural**: Embora seja leve e não sobrecarregue a memória do navegador com bibliotecas rasterizadoras (como `html2canvas`), não produz diretamente um arquivo binário `.pdf` no servidor, não embute metadados criptográficos oficiais de auditoria (autor, hash sha256 canônico, carimbo de tempo ICP-Brasil) e depende da escolha manual do usuário ("Salvar como PDF").
- **Resolução Planejada**: Para conformidade institucional com padrões CVM/Anbima, implementar um worker backend headless (ex: Puppeteer / Chromium containerizado) que compila o HTML em PDF binário com assinatura digital embutida e link assinado no Cloud Storage.

---

## [GAP-003] Audit Logger no cliente (LocalStorage) vs Immutable Append-Only Ledger Server-Side
- **Situação Atual**: O serviço `src/lib/auditLogger.ts` persiste eventos em `localStorage` (`zyc_audit_trail`) para alimentar o HUD de atalhos e a visualização rápida do painel do arquiteto.
- **Risco Arquitetural**: Dados armazenados em `localStorage` estão sob controle do usuário no navegador e podem ser limpos ou alterados via DevTools. Portanto, **não constituem trilha de auditoria juridicamente auditável ou com conformidade LGPD/SOX**.
- **Mitigação & Resolução**: Os eventos do cliente foram agora ligados ao endpoint `POST /api/audit/log` no backend, onde recebem HMAC gerado pelo servidor (`AUDIT_HMAC_SECRET`). Na próxima fase, a tabela `events` do PostgreSQL passará a operar em modo *append-only* (sem privilégios de `UPDATE` ou `DELETE` para a role da aplicação) com encadeamento de hash canônico estilo ledger.

---

## [GAP-004] Demo Tokens e Isolamento Estrito de Ambientes de Staging/Prod
- **Situação Atual**: O middleware `src/middleware/auth.ts` agora exige estritamente `process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_LOGIN === 'true'` para permitir o bypass de tokens sintéticos (`demo-email-token-123`, `demo-*`). Em produção, qualquer tentativa de enviar token demo é sumariamente rejeitada com `401 Unauthorized`.
- **Risco Arquitetural**: A existência de código de bypass dentro do mesmo repositório do core exige disciplina absoluta nas variáveis de ambiente do deploy de produção para garantir que `ENABLE_DEMO_LOGIN` nunca seja `'true'` em produção.
- **Resolução Planejada**: Remover completamente o código de bypass do arquivo principal antes do lançamento público e isolá-lo em um mock server exclusivo de testes locais/CI.

---

## [GAP-005] Pooler de Conexões PostgreSQL (PgBouncer)
- **Situação Atual**: A aplicação conecta diretamente no banco de dados com limite de pool `max: 10`.
- **Risco Arquitetural**: Em picos repentinos de tráfego (acima de 20k acessos/dia com alta concorrência concorrente), o pool direto pode atingir o limite `max_connections` do PostgreSQL.
- **Resolução Planejada**: Inserir uma camada intermediária de PgBouncer em modo de transação (`pool_mode = transaction`) entre os containers da aplicação e o Cloud SQL.

---
**Data da Auditoria**: Setembro de 2026  
**Responsável**: Engenharia de Plataforma & Arquitetura de Sistemas Zyconomes
