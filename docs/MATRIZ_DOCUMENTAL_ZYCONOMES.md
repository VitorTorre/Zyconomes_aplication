# MATRIZ DOCUMENTAL DA ZYCONOMES
**Mapeamento Canônico de Endpoints, Filas, Dados e Requisitos do Sistema**  
*Consolidação Documental Técnica — Nível Sênior (Base do Documento Original)*

---

## 1. Matriz de Endpoints da API Core

| Método | Rota HTTP | Função / Domínio | Headers Obrigatórios | Payload de Entrada | Respostas HTTP & Latência Alvo | Dependências de Infra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/usuarios` | Onboarding e Abertura de Conta | `x-correlation-id` (UUID v4)<br>`Content-Type: application/json` | `{ "email": string, "nome_completo": string, "cpf": string, "senha_plana": string }` | **201 Created** (< 35ms)<br>**400 Bad Request**<br>**409 Conflict** (< 2ms)<br>**500 Server Error** | • Redis (`SETNX`)<br>• PgBouncer (6432)<br>• RabbitMQ (Exchange) |
| `POST` | `/api/v1/auth/otp` | Validação de Código OTP e Ativação | `x-correlation-id`<br>`Authorization: Bearer <temp>` | `{ "email": string, "otp_code": string }` | **200 OK** (Ativado)<br>**400 OTP Inválido**<br>**410 Expirado** | • Redis (`GET otp:{email}`)<br>• PgBouncer (UPDATE status) |
| `GET` | `/health` | Liveness & Readiness Probes | Nenhum | Nenhum | **200 OK** (`{ db, redis, rabbit }`)<br>**503 Service Unavailable** | • Postgres ping<br>• Redis ping<br>• RabbitMQ socket |
| `GET` | `/metrics` | Telemetria e Saturação Interna | `Authorization: Bearer <internal>` | Nenhum | **200 OK** (P50, P95, Pool Conns, DLQ depth) | • Métricas em memória / Event Loop |

---

## 2. Matriz de Filas e Mensageria (Topologia AMQP)

| Elemento | Nome no Broker | Tipo / Configuração | Routing Key / Binding | Dead Letter Policy | Função Operacional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Exchange Principal** | `zyconomes_exchange` | `direct`, durable | N/A | N/A | Recebe eventos síncronos da Core API. |
| **Fila Principal** | `fila_emails_cadastro` | `quorum` / `durable=true` | `usuario.cadastrado` | `x-dead-letter-exchange: zyconomes_dlx`<br>`x-dead-letter-routing-key: emails_dlq_key` | Buffer assíncrono consumido pelo worker com `prefetch=50`. |
| **Exchange DLX** | `zyconomes_dlx` | `direct`, durable | N/A | N/A | Encaminha mensagens venenosas ou esgotadas. |
| **Fila Morta (DLQ)** | `zyconomes_emails_dlq` | `durable=true` | `emails_dlq_key` | Armazenamento persistente para auditoria manual | Retém mensagens com falhas após 3 retries (ex: SMTP indisponível). |

---

## 3. Dicionário de Dados Transacionais (8 Atributos Canônicos)

| # | Atributo | Tipo Físico | Regra de Validação & Normalização | Classificação de Segurança | Destino / Persistência |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `email` | `VARCHAR(255)` | Regex RFC 5322; minúsculo; trim. | PII Sensível | `users.email` (Postgres) + Chave Redis (`idemp:cad:{email}`) + RabbitMQ |
| **2** | `nome_completo` | `VARCHAR(150)` | Min 3, Max 150 caracteres; sanitizado contra XSS. | PII Básico | `users.nome_completo` + RabbitMQ (Template de boas-vindas) |
| **3** | `cpf` | `CHAR(11)` | Validação matemática Módulo 11 (Receita Federal). | PII Crítico (Mascarado nos logs: `***.456.789-**`) | `users.cpf_hash` (SHA-256 único com salt) |
| **4** | `senha_plana` ➔ `senha_hash` | `VARCHAR(255)` | Min 8 caracteres, complexidade forte; convertida via PBKDF2. | Segredo Crítico (NUNCA gravado plano, NUNCA trafega em filas) | `users.senha_hash` (Postgres apenas) |
| **5** | `x-correlation-id` | `UUID v4` | RFC 4122 (36 caracteres hexadecimais). | Metadado Operacional | Headers HTTP + Payload AMQP + Logs JSON (`stdout`) |
| **6** | `idempotency_key` | `VARCHAR(64)` | Chave atômica com prefixo `idemp:cad:{email}` e TTL 300s. | Concorrência | Redis (Memória volátil) |
| **7** | `otp_code` | `CHAR(6)` | 6 dígitos gerados por `crypto.randomInt(100000, 999999)`. | Segredo Temporário (TTL 600s) | Redis (`otp:{user_id}`) + Corpo do e-mail |
| **8** | `status` | `ENUM` | Valores válidos: `PENDENTE_OTP`, `ATIVO`, `BLOQUEADO`. | Estado de Negócio | `users.status` (Postgres) |

---

## 4. Matriz de Requisitos Funcionais e Não Funcionais

### Requisitos Funcionais (RF)
* **RF-01: Cadastro Unificado** — Recebimento e persistência de investidores com dados validados e hash seguro em < 8ms.
* **RF-02: Prevenção de Duplicidade (Idempotência)** — Bloqueio de cliques múltiplos ou requisições concorrentes com Redis `SETNX` em < 2ms (retorno 409).
* **RF-03: Persistência Confinada** — Inserção na tabela `users` via pool multiplexado sem abrir conexões avulsas no PostgreSQL.
* **RF-04: Disparo de Evento UsuarioCadastrado** — Publicação assíncrona da mensagem com metadados de correlação em < 4ms.
* **RF-05: Geração e Envio de OTP** — Worker consome mensagem, calcula código de 6 dígitos e despacha via SMTP sem travar a API HTTP.
* **RF-06: Tratamento de Falhas com DLQ** — Isolamento de falhas persistentes na fila `zyconomes_emails_dlq` após 3 tentativas.

### Requisitos Não Funcionais (RNF)
* **RNF-01: Vazão Alvo (5.000 RPS)** — Sustentação de tráfego de 5.000 requisições simultâneas sem esgotamento de conexões ou crash por OOM.
* **RNF-02: Latência P95 < 40ms** — Percentil 95 da rota de cadastro deve responder abaixo de 40ms para o chamador.
* **RNF-03: Multiplexação PgBouncer** — Suportar até 5.000 clientes HTTP limitando as conexões ativas no PostgreSQL a no máximo 100.
* **RNF-04: Rastreabilidade Contínua** — 100% dos eventos registrados em JSON estruturado com `x-correlation-id`.
* **RNF-05: Isolamento de Credenciais** — 0 segredos ou credenciais no código-fonte; tudo injetado via `.env` validado no boot.
