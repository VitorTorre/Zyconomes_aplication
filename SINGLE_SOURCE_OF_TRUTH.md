# SINGLE SOURCE OF TRUTH — ZYCONOMES
**Baseline Documental e Arquitetural Definitivo**  
*Versão: 1.0.0 — Data de Consolidação: Setembro/2026*  
*Classificação: Documento Técnico Diretivo / Engenharia de Produção*

---

## 1. Mapeamento dos Aspectos Computacionais

| Aspecto Computacional | Onde foi Especificado / Implementado | Fase de Origem | Status Atual | Detalhes Técnicos & Impacto Operacional |
| :--- | :--- | :--- | :--- | :--- |
| **Isolamento de Credenciais** | `/.env.example`, `environment.ts`, Ciclo 1 da Espiral | Fase 1 (Diagnóstico Akita) / Fase 3 | 🟡 Parcial (Definido no protótipo/docs, pendente no backend legado) | Schema fail-fast com Zod/dotenv. Elimina credenciais hardcoded no repositório. Bloqueia boot caso falte `DATABASE_URL` ou segredos. |
| **Pool de Conexões (PgBouncer)** | `pgbouncer.ini`, `docker-compose.yml`, `pool.service.ts` | Fase 2 (Ação Crítica 2) / Fase 3 | ✅ Protótipo Simulado / ❌ Pendente no Cluster Real | Transaction pooling (`max_connections=150` no pool, limite estrito de `100` no PostgreSQL). Impede saturação de sockets e OOM a 5.000 RPS. |
| **Rastreabilidade (Correlation-ID)** | `correlation.middleware.ts`, headers HTTP, payloads AMQP | Fase 2 (Ação Crítica 3) / Fase 3 | 🟡 Parcial (Simulado no protótipo, pendente nos workers legados) | `x-correlation-id` gerado via UUID v4 na borda HTTP, repassado em cabeçalhos, payloads de fila e emitido em JSON estruturado no `stdout`. |
| **Idempotência Transacional** | `idempotency.service.ts`, Redis `SETNX` | Fase 2 (Ação Crítica 4) / Fase 3 | ✅ Protótipo Operacional / ❌ Pendente no Backend Real | `SET idemp:cad:{email} "PROCESSING" EX 300 NX`. Bloqueio de duplo clique/retentativa de rede em <2ms com HTTP 409 sem onerar o PostgreSQL. |
| **Versionamento de Banco (Migrations)** | `migrations/001_initial.sql`, scripts CLI de deploy | Fase 2 (Ação Crítica 5) / Fase 3 | 🟡 Parcial (Matriz DDL mapeada, pipeline de migração pendente) | Fim de scripts SQL soltos. DDL gerenciado por versionador formal (Node-PG-Migrate/Drizzle) acionado no step pré-deploy do container. |
| **Mensageria & Resiliência (DLQ)** | `rabbitTopology.ts`, `zyconomes_emails_dlq` | Fase 3 (Alavancagem 80/20) | ✅ Protótipo Operacional / ❌ Pendente no Broker Real | Separação síncrona/assíncrona: API responde em <35ms; envio de OTP/e-mail isolado com retry (max=3) e encaminhamento automático para Dead Letter Exchange. |
| **Observabilidade & Métricas** | `metricsCollector.ts`, painel K6 stress, logs JSON | Fase 3 (Riscos) / Fase 4 (Auditoria) | ✅ Total no Protótipo / ❌ Pendente em Produção | Stdout JSON sem parsers síncronos pesados. Monitoramento de P95 (<40ms), contagem de DLQ e conexões em `pg_stat_activity`. |
| **Frontend & Portal Financeiro** | `FinancePlatformView.tsx`, Portal Banking & Wealth | Fase 4 (Refinamento de Entrega) | ✅ Totalmente Operacional no Applet | Interface profissional com saldo, extrato D+0, PIX instantâneo, catálogo de ativos (CDB, LCI) e fluxo de onboarding com idempotência. |

---

## 2. Linha do Tempo e Evolução dos Artefatos

1. **Fase 1 — Diagnóstico de Choque (Fábio Akita):** Identificação de vício de complexidade prematura (microsserviços teóricos) com fundação nula. Classificação: Problema Sistêmico.
2. **Fase 2 — As 5 Alavancas Críticas:** Definição obrigatória de: `.env`, PgBouncer, Correlation-ID, Redis `SETNX` e Migrations.
3. **Fase 3 — Arquitetura de Contenção (8 Vetores QE/QI):** Balanceamento entre alívio cognitivo da equipe e eliminação de gargalos físicos. Decisão de manter monólito modular em vez de múltiplos bancos.
4. **Fase 4 — Auto-Auditoria & Engenharia Espiral:** Corte de Service Mesh e Jaeger; criação do fluxo procedural, dicionário de dados (8 atributos) e classes de infraestrutura.
5. **Fase 5 — Consolidação da Experiência e SSOT:** Implementação do Portal de Finanças e unificação de todas as métricas em ambiente vivo.

---

## 3. GAPs de Produção (Protótipo vs. Backend Real)

* **GAP 1: Camada PgBouncer Inexistente no Infra Real.** O código legado conecta o pool de conexões do Node diretamente ao Postgres. Em pico de 5k conexões, o banco sofrerá exaustão de memória.
* **GAP 2: Falta de Atomicidade de Idempotência no Core Legado.** O backend original valida duplicidade com `SELECT` antes de `INSERT`, gerando race conditions graves em milissegundos idênticos.
* **GAP 3: Ausência de Topology Bindings e DLQ no RabbitMQ.** Mensagens com erro de SMTP travam na fila principal ou são descartadas sem rastreabilidade.
* **GAP 4: Rastreabilidade Fraturada.** O backend legado emite logs via `console.log` com strings desformatadas, impossibilitando agregação por Correlation-ID.

---

## 4. Parecer Técnico Sênior & Estratégia de Adoção

Conforme as diretrizes de Martin Kleppmann (*Designing Data-Intensive Applications*) e Michael Nygard (*Release It!*):
1. **Não reescreva a aplicação.** Mantenha a base atual em Node.js.
2. **Suba o PgBouncer como proxy intermediário** na porta 6432 imediatamente via contêiner.
3. **Injete o middleware de Redis `SETNX`** na primeira linha da rota de cadastro antes de executar transações.
4. **Configure a DLX no RabbitMQ.** Sem isso, retentativas cegas derrubarão a fila em cascata.
