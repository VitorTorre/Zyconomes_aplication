# BASE DE ENTENDIMENTO DO PROJETO ZYCONOMES
**Documento Diretivo Conceitual: Diagnóstico de Choque, Princípios de Engenharia e Arquitetura 80/20**  
*Consolidação Documental Técnica — Nível Sênior (Base do Documento Original)*

---

## 1. O Diagnóstico de Choque (Estilo Fábio Akita)

O projeto Zyconomes apresentava inicialmente um sintoma clássico da indústria moderna: **vício de complexidade prematura**. A arquitetura pretendia ser uma malha de microsserviços distribuídos com comunicação interbancária complexa, mas não possuía resolvidas as fundações mínimas de computação:

1. **Credenciais expostas no código:** Chaves de banco e APIs fixadas no repositório.
2. **Conexões de banco desprotegidas:** A aplicação conectava o pool do Node diretamente ao PostgreSQL (porta 5432). Sob pico de tráfego, cada processo abriria conexões no banco até o Postgres estourar por falta de descritores de arquivo e RAM (OOM).
3. **Falsa idempotência via SELECT:** A verificação de duplicidade era feita via `SELECT ... WHERE email = ?` antes do `INSERT`. Sob concorrência de milissegundos idênticos, duas requisições passavam pelo `SELECT` ao mesmo tempo e criavam contas duplicadas ou travavam em deadlock.
4. **Acoplamento síncrono frágil:** O disparo de e-mail e geração de código de ativação ocorriam na mesma thread da requisição HTTP. Uma lentidão de 3 segundos no provedor de e-mail tornava a API inutilizável.
5. **Logs sem rastreabilidade:** Mensagens impressas com `console.log` livre sem identificador único de correlação.

**Classificação do Diagnóstico:** *Problema Sistêmico de Engenharia de Base.* Não se constrói um arranha-céu sem antes cavar alicerces sólidos.

---

## 2. As 5 Alavancas Críticas (Fundação Inegociável)

Para colocar a Zyconomes em condições reais de produção, foram estabelecidas 5 medidas mandatórias:

```
                      ┌─────────────────────────────────────────┐
                      │      AS 5 ALAVANCAS INEGOCIÁVEIS        │
                      └────────────────────┬────────────────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬───────────────────┐
         ▼                   ▼                     ▼                   ▼
   [1] ISOLAMENTO      [2] POOL PGBOUNCER    [3] IDEMPOTÊNCIA    [4] CORRELATION-ID
   Variáveis .env      Porta 6432 com        Redis SETNX na      UUID v4 ponta a
   validadas no boot   pool_mode:            borda HTTP          ponta em logs e
   (Zod fail-fast).    transaction.          (<2ms rejeição).    mensageria.
                                           │
                                           ▼
                                    [5] MIGRATIONS
                                    DDL versionado via
                                    pipeline automatizado.
```

1. **Isolamento de Credenciais (.env):** Boot com validação estrita. Se faltar `DATABASE_URL` ou `REDIS_URL`, a aplicação nem inicia.
2. **Pool Multiplexado com PgBouncer (6432):** Inserção do PgBouncer como proxy intermediário. O PgBouncer sustenta até 5.000 conexões de clientes abertas, mas entrega apenas 90 a 100 conexões reais ao PostgreSQL, blindando o banco.
3. **Idempotência Atômica na Borda (Redis SETNX):** Trava atômica `SET idemp:cad:{email} "PROCESSING" EX 300 NX`. Se o cliente der duplo clique ou a rede repetir a requisição, o Redis rejeita em menos de 2ms com `HTTP 409 Conflict`, sem onerar o Postgres.
4. **Rastreabilidade Universal (Correlation-ID):** Geração de `x-correlation-id` (UUID v4) na borda HTTP. O ID acompanha cabeçalhos, payloads de fila RabbitMQ e é estampado em todos os logs JSON no `stdout`.
5. **Versionamento Automatizado de Schema (Migrations):** Fim de scripts SQL manuais. Qualquer alteração no banco é codificada em arquivo de migração versionado executado na esteira de CI/CD.

---

## 3. O Corte de Overengineering (O Princípio 80/20)

Para manter a sanidade da equipe e a viabilidade do negócio, foram vetadas todas as soluções que adicionavam complexidade sem ganho de valor percebido:

* **Veto a Microsserviços Prematuros:** O domínio foi mantido como um **Monólito Modular** coeso em Node.js com TypeScript, onde as fronteiras de negócio são separadas em serviços de código, e não em instâncias de rede separadas.
* **Veto a Service Mesh (Istio/Linkerd):** Desnecessário para comunicação local de container em rede privada.
* **Veto a Tracing Distribuído Pesado (Jaeger/OpenTelemetry Complexo):** Substituído por logs estruturados JSON no `stdout` com `correlation_id`, processados de forma assíncrona por agregadores externos (Datadog/Loki).
* **Veto a Kafka:** O RabbitMQ foi adotado com folga para suportar dezenas de milhares de mensagens por segundo com topologia simples e suporte nativo a Dead Letter Exchange (DLX).

---

## 4. O Ciclo da Engenharia Espiral

O desenvolvimento foi estruturado segundo o modelo em espiral de Barry Boehm:

1. **Ciclo 1: Fundação, Variáveis & Ingestão Segura** — Foco em segredos, validação no boot e injeção de Correlation-ID.
2. **Ciclo 2: Idempotência Transacional & Pool PgBouncer** — Foco na blindagem do banco de dados e controle estrito de concorrência.
3. **Ciclo 3: Mensageria Assíncrona & Worker com DLQ** — Foco no desacoplamento da entrega de e-mails/OTP e contenção de falhas com Dead Letter Queue.
4. **Ciclo 4: Validação de Carga K6 & Observabilidade** — Prova de fogo: sustentação contínua de 5.000 RPS com P95 < 40ms.
