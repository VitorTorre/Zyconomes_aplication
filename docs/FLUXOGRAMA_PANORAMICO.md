# FLUXOGRAMA PANORÂMICO DO SISTEMA ZYCONOMES
**Mapeamento Procedural Ponta a Ponta: Ciclo de Vida Transacional do Onboarding**  
*Consolidação Documental Técnica — Nível Sênior (Base do Documento Original)*

---

## 1. Visão Panorâmica do Fluxo (Diagrama de Sequência)

```
[ INVESTIDOR ]          [ API GATEWAY ]         [ REDIS (SETNX) ]       [ PGBOUNCER (6432) ]     [ RABBITMQ ]         [ WORKER EMAIL ]
      │                       │                        │                         │                    │                      │
   (1) POST /usuarios         │                        │                         │                    │                      │
      ├──────────────────────►│                        │                         │                    │                      │
      │                       │ (2) Injeta UUID v4     │                         │                    │                      │
      │                       │     (x-correlation-id) │                         │                    │                      │
      │                       │                        │                         │                    │                      │
      │                       │ (3) SETNX idemp:cad:{email} EX 300 NX            │                    │                      │
      │                       ├───────────────────────►│                         │                    │                      │
      │                       │◄───────────────────────┤                         │                    │                      │
      │                       │  [Se já existir: 409 Conflict em <2ms]           │                    │                      │
      │                       │                                                  │                    │                      │
      │                       │ (4) PBKDF2 Hash Assíncrono (libuv thread pool)   │                    │                      │
      │                       │                                                  │                    │                      │
      │                       │ (5) INSERT users (PENDENTE_OTP)                  │                    │                      │
      │                       ├─────────────────────────────────────────────────►│                    │                      │
      │                       │                                                  │ (6) Conexão Pool   │                      │
      │                       │                                                  │     ao Postgres    │                      │
      │                       │◄─────────────────────────────────────────────────┤                    │                      │
      │                       │                                                  │                    │                      │
      │                       │ (7) Publish Evento UsuarioCadastrado (com Correlation-ID)             │                      │
      │                       ├──────────────────────────────────────────────────────────────────────►│                      │
      │                       │◄──────────────────────────────────────────────────────────────────────┤ (ACK Broker)         │
      │                       │                                                  │                    │                      │
   (8) HTTP 201 Created       │                                                  │                    │                      │
      │ (< 35ms resposta)     │                                                  │                    │                      │
      │◄──────────────────────┤                                                  │                    │                      │
      │                       │                                                  │                    │                      │
      │                       │                                                  │                    │ (9) Consumo          │
      │                       │                                                  │                    │     (prefetch=50)    │
      │                       │                                                  │                    ├─────────────────────►│
      │                       │                                                  │                    │                      │
      │                       │                                                  │                    │                      │ (10) Gera OTP (6 dig)
      │                       │                                                  │                    │                      │      Dispara SMTP
      │                       │                                                  │                    │                      │
      │                       │                                                  │                    │                      │ [Caminho Normal]
      │                       │                                                  │                    │ (11) ACK Mensagem    │
      │                       │                                                  │                    │◄─────────────────────┤
      │                       │                                                  │                    │                      │
      │                       │                                                  │                    │ [Caminho de Falha]   │
      │                       │                                                  │                    │ 1º Retry (exp)       │
      │                       │                                                  │                    │ 2º Retry (exp)       │
      │                       │                                                  │                    │ 3º Retry (falha)     │
      │                       │                                                  │                    │                      │
      │                       │                                                  │                    │ (12) NACK sem requeue│
      │                       │                                                  │                    │◄─────────────────────┤
      │                       │                                                  │                    ▼                      │
      │                       │                                                  │           [ DEAD LETTER QUEUE ]           │
      │                       │                                                  │           zyconomes_emails_dlq            │
```

---

## 2. Passo a Passo Procedural Detalhado

### Etapa 1: Ingestão HTTP & Rastreabilidade de Borda
1. O cliente HTTP envia payload JSON para `POST /api/v1/usuarios`.
2. O middleware verifica se o cabeçalho `x-correlation-id` veio informado. Se ausente, gera imediatamente um **UUID v4**.
3. O timer de alta precisão (`process.hrtime()`) é iniciado para monitoramento de latência P95.

### Etapa 2: Idempotência Atômica no Redis
1. O sistema calcula a chave de idempotência: `idemp:cad:{email_normalizado}`.
2. Executa a primitiva atômica do Redis:
   ```text
   SET idemp:cad:investidor@zyconomes.com.br "PROCESSING" EX 300 NX
   ```
3. **Se retornar nulo (chave já existente):** A requisição é abortada em < 2ms e devolve `HTTP 409 Conflict`. O PostgreSQL não é consultado.
4. **Se retornar 'OK':** O fluxo prossegue com exclusividade garantida.

### Etapa 3: Hashing Criptográfico Não-Bloqueante
1. A senha plana é convertida em hash irreversível usando **PBKDF2 com HMAC-SHA512** (100.000 iterações e salt criptográfico de 16 bytes).
2. A operação é executada assincronamente fora do Event Loop principal do Node.js, delegada para o pool de threads da `libuv`.

### Etapa 4: Multiplexação e Persistência no PostgreSQL
1. A conexão é solicitada ao pool local conectado ao **PgBouncer na porta 6432**.
2. O PgBouncer aloca uma das 90 conexões ativas com o PostgreSQL em modo `pool_mode: transaction`.
3. É executado o comando `INSERT INTO users` gravando o usuário em estado `PENDENTE_OTP`.
4. A conexão física com o banco é devolvida imediatamente ao pool assim que o `INSERT` conclui (tempo médio: 4.8ms).

### Etapa 5: Desacoplamento Assíncrono via RabbitMQ
1. A API monta a mensagem de evento com `user_id`, `email`, `nome` e o `correlation_id` nos headers AMQP.
2. Publica no RabbitMQ na exchange `zyconomes_exchange` com roteamento `usuario.cadastrado`.
3. O broker responde confirmação de entrega (*confirm channel*).

### Etapa 6: Resposta Síncrona Imediata (< 35ms)
1. A API responde `HTTP 201 Created` para o investidor com seus dados básicos e status `PENDENTE_OTP`.
2. O investidor tem resposta instantânea na tela, sem esperar o provedor de e-mail responder.

### Etapa 7: Processamento no Worker & Política de DLQ
1. O `EmailWorker` consome a mensagem com limite de `prefetch=50`.
2. Gera o código de ativação numérico OTP de 6 dígitos via `crypto.randomInt`.
3. Executa a chamada SMTP ao provedor de e-mail.
4. **Cenário de Sucesso:** Disparo realizado com sucesso ➔ envia `ACK` ao broker ➔ mensagem é removida da fila.
5. **Cenário de Falha:**
   - Tentativas 1 e 2: Republica a mensagem com cabeçalho `x-retry-count` incrementado e backoff exponencial.
   - Tentativa 3 (Esgotada): O worker envia `NACK` com `requeue=false`.
   - O RabbitMQ aciona a topologia de Dead Letter Exchange (`zyconomes_dlx`) e deposita a mensagem intacta na fila `zyconomes_emails_dlq` com metadados para investigação.

---

## 3. Matriz de Tempos e Latências (Budget Transacional)

| Sub-Operação | Componente | Mecanismo | Latência Média Alvo |
| :--- | :--- | :--- | :--- |
| Ingestão & Roteamento | Express | Middleware & Router | ~0.8 ms |
| Trava de Idempotência | Redis | Primitiva `SETNX` | ~1.5 ms |
| Hash de Senha | libuv / crypto | PBKDF2 (100k) | ~6.5 ms |
| Insert SQL no Banco | PgBouncer ➔ Postgres | Transaction Pool | ~8.0 ms |
| Publicação na Fila | RabbitMQ | Confirm Channel | ~3.5 ms |
| Emissão de Logs & Serialização | stdout | JSON Logger | ~0.5 ms |
| **LATÊNCIA TOTAL DA API (P95)** | **Core API** | **Ponta a Ponta Síncrona** | **~20.8 ms (Alvo < 40ms)** |
| Disparo de E-mail (Assíncrono) | Worker | SMTP Provider | 150 - 450 ms (Desacoplado) |
