# Aparato de Segurança Institucional & Blindagem Cibernética — Zyconomes

Implementação do aparato de segurança em profundidade de nível inicial para a plataforma Zyconomes, integrando proteção estrita contra IDOR (Insecure Direct Object References), controle de acesso temporal (11:00 às 13:45) restrito a contas autorizadas, cabeçalhos de perímetro WAF/HSTS/CSP, criptografia de dados sensíveis em repouso (AES-256-GCM) e cockpit interativo de testes de penetração e quarentena no SuperAdmin.

---

## Decisões Críticas & Confirmações do Usuário

> [!IMPORTANT]
> As seguintes diretrizes operacionais foram confirmadas e incorporadas como requisitos de alta precedência:
>
> 1. **Os 3 Pilares Ativos Simultaneamente:**
>    - **Pilar A (IDOR & Intrusão):** Proteção integral de rotas contra adulteração de IDs e injeção de parâmetros, acompanhada de suíte automatizada de testes de invasão no Vitest.
>    - **Pilar B (Perímetro & WAF):** Cabeçalhos HTTP estritos (HSTS, CSP `default-src 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) e gateway de sanitização com Zod `.strict()`.
>    - **Pilar C (Criptografia em Repouso):** Encriptação simétrica autenticada AES-256-GCM para dados pessoais identificáveis (PII) e metadados sensíveis de simulações financeiras antes de persistir no PostgreSQL.
>
> 2. **Política de Acesso Administrativo Estrito & Janela Temporal (TBAC):**
>    - **Contas Exclusivas:** Apenas o e-mail do fundador (`v.torresko2015@gmail.com`) e a identidade do Desenvolvedor/Sistema possuem privilégios administrativos (`ADMIN`, `SECURITY_ADMIN`, `SUPER_ADMIN`). Todas as demais contas registradas são estritamente confinadas ao perfil `USER`.
>    - **Janela de Acesso Operacional (11:00 às 13:45 Horário de Brasília / UTC-3):** Ações administrativas e mutações privilegiadas só são autorizadas durante esse intervalo diário. Requisições administrativas fora dessa janela são bloqueadas pelo middleware com HTTP 403 e registradas no ledger de segurança com severidade `HIGH` (com mecanismo de emergência Break-Glass auditado para situações críticas).
>
> 3. **Suíte Interativa de Simulação e Verificação IDOR:**
>    - Middleware ativo de detecção com isolamento automático e quarentena preventiva via firewall comportamental.
>    - Painel visual interativo integrado ao `SuperAdminSecurityPlane` para auditoria de incidentes em tempo real e seção exclusiva de execução de testes de penetração sintéticos (IDOR sandbox).

---

## 1. Visão Geral & Conceito Central

- **O que Entrega:** Uma fortaleza de segurança em 4 camadas que garante que nenhum usuário, funcionário ou serviço consiga acessar informações financeiras além do estritamente necessário. Se um invasor adulterar o ID de uma simulação, tentar inspecionar perfis alheios ou enviar requisições fora do horário permitido, o sistema neutraliza a ação na borda, incrementa a pontuação de anomalia no firewall e isola o IP/ator em quarentena sem revelar detalhes da infraestrutura.
- **Público-Alvo:** O investidor da Zyconomes (que usufrui de privacidade garantida por isolamento matemático) e os operadores técnicos autorizados (fundador e desenvolvedor) que gerenciam a plataforma através de governança transparente e auditável.
- **Valor Principal:** Eliminação de pontos únicos de falha de autorização, cumprimento de requisitos de conformidade com a LGPD (artigos 46 a 49) e prevenção proativa contra fraudes e exfiltração de dados.

---

## 2. Experiência do Usuário & Design Visual

### Fluxos Principais
1. **Fluxo do Usuário Comum:** Navegação fluida e transparente. O usuário acessa suas simulações salvas (`/api/simulations`), edita parâmetros e executa projeções sem atrito perceptível. O sistema filtra os dados com base exclusiva na identidade do token criptográfico, sem risco de contaminação cruzada entre contas.
2. **Fluxo Administrativo com Janela de Tempo (TBAC):** O fundador (`v.torresko2015@gmail.com`) acessa `#admin`. Se o acesso ocorrer entre 11:00 e 13:45 (UTC-3), o dashboard libera os controles de gestão e telemetria. Fora dessa janela, o painel exibe aviso de governança temporal ativa (*"Janela Administrativa Fechada: Reabertura às 11:00"*), com opção de elevação de emergência mediante justificativa de auditoria.
3. **Cockpit de Simulação de Intrusão (SuperAdmin):** Na aba de segurança, os administradores dispõem de uma seção de testes de penetração com botões de disparo de cenários controlados:
   - *Cenário 1: Tentativa de leitura IDOR cruzada.*
   - *Cenário 2: Adulteração de payload com userId forjado.*
   - *Cenário 3: Acesso administrativo fora da janela temporal.*
   - *Cenário 4: Requisição com parâmetros não mapeados (violação Zod strict).*
   O painel exibe em milissegundos o bloqueio gerado, o incremento na pontuação de anomalia e a assinatura no ledger HMAC SHA-256.

### Identidade Visual & Diretrizes
- **Estilo:** Utilitário institucional de alta precisão, aderente ao design system do Zyconomes (fundo neutro limpo, superfícies escuras para telemetria no modo dark, bordas milimétricas `border-zinc-200 dark:border-zinc-800`).
- **Disciplina Zero-Pill:** Metadados estruturados com separadores tipográficos discretos (`·`, `/`). Sem cápsulas coloridas desnecessárias ou emblemas decorativos.
- **Tipografia:** Números e métricas de telemetria estritamente em algarismos tabulares monospaçados (`font-mono tabular-nums`).

---

## 3. Decisões de Produto & Engenharia

### Decisão 1: Mitigação Canônica de IDOR na Camada de Dados
- **Abordagem Escolhida:** Nunca utilizar identificadores enviados pelo cliente em consultas sensíveis. As rotas `GET /api/simulations`, `PUT /api/simulations/:id`, `DELETE /api/simulations/:id` e `GET /api/simulations/:id` vinculam suas cláusulas `WHERE` conjuntamente ao `id` do registro e ao `userId` do token validado (`and(eq(simulations.id, paramId), eq(simulations.userId, req.dbUser.id))`).
- **Por quê:** Elimina 100% dos vetores de IDOR direto por manipulação de URL ou JSON. Se o ID não pertencer ao usuário autenticado, a consulta retorna zero linhas, devolvendo `404 Not Found` (impedindo inclusive enumeração de existência de recursos alheios).

### Decisão 2: Controle de Acesso Baseado em Tempo (TBAC)
- **Abordagem Escolhida:** Middleware dedicado `enforceAdminTimeWindow` associado à lista de permissões administrativas.
- **Configuração:** Horário operacional configurável com padrão das 11:00 às 13:45 (Horário Oficial de Brasília, América/São Paulo).
- **Tratamento de Exceções:** Inclusão de header de elevação emergencial (`x-emergency-breakglass`) que exige senha mestra + justificativa textual, registrando evento de severidade `CRITICAL` no ledger criptográfico.

### Decisão 3: Criptografia AES-256-GCM para Campos Sensíveis em Repouso
- **Abordagem Escolhida:** Módulo `src/lib/encryption.ts` utilizando o algoritmo nativo `aes-256-gcm` com IV aleatório de 12 bytes gerado por `crypto.randomBytes` e tag de autenticação de 16 bytes.
- **Campos Cobertos:** PII de contato (telefone, e-mails secundários) e payloads de simulação patrimonial sensível antes da inserção no banco de dados.

### Decisão 4: Cabeçalhos WAF e Sanitização Estrita
- **Abordagem Escolhida:** Middleware global com Content Security Policy restritivo, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e rejeição de payloads com chaves não declaradas via Zod `.strict()`.

---

## 4. Arquitetura Técnica & Estratégia de Dados

### Diagrama de Fluxo e Defesa em Profundidade

```
[CLIENTE / ATACANTE]
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 1: Borda, WAF & Cabeçalhos HTTP                                     │
│ • Limite de payload: 100kb                                                  │
│ • HSTS, CSP (default-src 'self'), X-Frame-Options: DENY                     │
│ • Sanitização recursiva profunda (deepSanitizeInput)                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 2: Autenticação, Identidade & Restrição de Contas                   │
│ • Token JWT verificado via Firebase Admin                                  │
│ • Validação de Whitelist: apenas v.torresko2015@gmail.com e dev são admins │
│ • TBAC Middleware: Janela operacional estrita (11:00 às 13:45 BRT)          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 3: Firewall Comportamental & Detecção de IDOR                        │
│ • Schemas Zod com .strict() (Drop de campos arbitrários)                   │
│ • Detecção de tentativa de acesso a objetos de outros usuários             │
│ • Registro automático de anomalia (+4 pontos) e Quarentena Preventiva      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 4: Persistência Criptográfica & Ledger Imutável                      │
│ • Drizzle ORM: WHERE simulations.userId = req.dbUser.id                     │
│ • Criptografia AES-256-GCM para dados sensíveis em repouso                  │
│ • Registro no Ledger Encadeado com HMAC SHA-256                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Entidades e Módulos Técnicos
- `src/lib/encryption.ts`: Funções de encriptação e decriptação AES-256-GCM com autenticação de integridade.
- `src/middleware/timeAccessControl.ts`: Validador de janela temporal (11:00 - 13:45) e controle de contas exclusivas.
- `src/components/SecurityIntrusionSandbox.tsx`: Componente de testes de penetração controlados no SuperAdmin.
- `tests/idorPenetration.test.ts`: Bateria de testes de regressão automatizados simulando tentativas de adulteração de IDs e injeção de parâmetros.
- `README.md`: Atualização documental com o registro formal das pautas e diretrizes de blindagem implementadas.

---

## Verificação e Próximos Passos
1. Após a aprovação deste plano, o código será desenvolvido de ponta a ponta sem qualquer stub ou mock.
2. Todas as alterações serão validadas por compilação (`compile_applet`), verificação de tipos estática (`tsc --noEmit`) e execução completa da suíte de testes do Vitest.
