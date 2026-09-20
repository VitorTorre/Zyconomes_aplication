# Topologia de Arquitetura Zyconomes

A Zyconomes foi desenhada sob um paradigma de *Alta Concorrência* e *Isolamento Matemático*, assegurando que a lógica financeira seja auditável no client-side enquanto o estado persistente e as filas de processamento pesado fiquem protegidas no backend.

## Visão Geral da Arquitetura

O sistema é dividido em três camadas principais:
1. **Frontend (Edge / Client-Side)**
2. **Gateway & APIs (Middleware)**
3. **Persistência & Mensageria (Data Layer)**

---

## 1. Camada Frontend (React + Vite + Tailwind)
- **Hospedagem:** Google Cloud Run (Containerizado) ou CDN Global.
- **Processamento Matemático:** 100% isolado no Client-Side (Navegador). Os dados digitados nas calculadoras nunca tocam o servidor a menos que o usuário clique em "Salvar Resultado". Isso garante latência zero para os cálculos em tempo real e atende rigorosamente à LGPD (Privacy by Design).
- **Gerenciamento de Estado:** React Hooks locais com sincronização em `localStorage` para retenção temporária e recuperação em caso de falha de conexão.
- **Navegação:** Roteamento baseado em Hash (SPA State), permitindo transições super rápidas e uso de `framer-motion` para suavização visual.
- **Performance:** Monitoramento em tempo real do Core Web Vitals (INP, LCP, CLS, FCP) diretamente injetado no DOM (`web-vitals`).

## 2. Camada de Middleware & Gateway (Node.js + Express)
- **Servidor:** Instância Node.js rodando Express.
- **Autenticação (IdP):** Firebase Authentication. O token JWT (Google Sign-In) gerado no client-side é validado no backend usando o Firebase Admin SDK.
- **Autorização (RBAC):** Middlewares que verificam a *Role* do usuário no banco de dados (ex: 'free', 'premium', 'admin') para liberar endpoints restritos, como o painel de estatísticas ou salvamento em nuvem.

## 3. Camada de Persistência e Mensageria (Cloud SQL + RabbitMQ)

### 3.1. Google Cloud SQL (PostgreSQL) + PgBouncer
- **Database:** PostgreSQL provisionado no Google Cloud (Região `us-west2`). A escolha por SQL em vez de NoSQL garante integridade transacional ACID nas informações patrimoniais dos assinantes.
- **Pool de Conexões (PgBouncer):** Como a aplicação foi desenhada para alta concorrência (ex: lançamentos de campanhas onde milhares simulam ao mesmo tempo), conexões diretas ao PostgreSQL esgotariam os sockets rapidamente. O **PgBouncer** atua na frente do banco, multiplexando conexões abertas e reciclando instâncias, o que reduz o overhead de handshake no banco para níveis insignificantes.
- **ORM:** Drizzle ORM, permitindo queries Type-Safe e migrações ágeis.

### 3.2. Mensageria Assíncrona (RabbitMQ)
- **Broker de Mensagens:** RabbitMQ é utilizado como *Message Broker* central.
- **Casos de Uso na Zyconomes:**
  - **Captura de Leads:** Quando um e-mail é submetido, em vez de salvar diretamente no banco de forma síncrona e atrasar a interface, o Node envia um evento para a fila (ex: `lead.captured`). Um worker consome a fila e insere no CRM e no PostgreSQL.
  - **Relatórios Premium:** Para assinantes Pro, a geração de PDFs detalhados de Amortização Price exige processamento de CPU. O backend joga o payload na fila, um worker gera o PDF assincronamente, salva no bucket e notifica o usuário, liberando a Main Thread do Express para novos clientes.
  - **Analytics:** Eventos granulares de performance e preenchimento de campos vão para uma fila de baixa prioridade (`analytics.stream`), desonerando as transações críticas de banco.

---

## Fluxo de Dados (Diagrama Conceitual)

```mermaid
graph TD;
    A[Usuário - Navegador] -->|JWT Token + Dados| B(Express Node.js API);
    B -->|Validação JWT| C{Firebase Admin Auth};
    B -->|Queries (Type-Safe)| D[Drizzle ORM];
    D --> E[PgBouncer Pooler];
    E --> F[(Cloud SQL PostgreSQL)];
    
    B -->|Eventos Assíncronos| G[[RabbitMQ Exchange]];
    G --> H[Fila: Geração de Relatórios];
    G --> I[Fila: E-mail Marketing / Leads];
    H --> J(Worker Node);
    I --> K(Worker Node);
```

### O Fluxo "Salvar Simulação"
1. Usuário preenche `Juros Compostos`. (Matemática ocorre localmente no browser).
2. Clica em "Salvar Resultado na Nuvem".
3. React emite um HTTP POST `/api/simulations` passando o JWT no Header.
4. Express intercepta, chama o Firebase Admin para validar o token.
5. Em caso de sucesso, o backend verifica no PostgreSQL se o `dbUser` existe (ou cria um novo baseado no Firebase UID).
6. A simulação (id, tool_id, json_data) é disparada via Drizzle ORM para o PgBouncer, e inserida com sucesso no banco.
7. Resposta HTTP 200 volta para o React.
8. Componente reage exibindo *“Simulação Salva!”* e o ícone de sucesso.
