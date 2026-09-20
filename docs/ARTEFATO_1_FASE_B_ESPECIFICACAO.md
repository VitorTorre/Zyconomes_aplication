# ARTEFATO 1 — ESPECIFICAÇÃO PRÉVIA (FASE B - VALIDAÇÃO)

## INFORMAÇÕES GERAIS
- **Documento:** Especificação Técnica de Validação e Atração (MVP - Fase B)
- **Autor:** Arquiteto-Documentador (IA)
- **Status:** Aguardando Assinatura do Fundador
- **Objetivo:** Estabelecer a arquitetura do motor de Blog (SEO), injeção de Analytics (Métricas) e funil de captura de Leads (Retenção).

## 1. PREMISSAS ESTRATÉGICAS DEFINIDAS (OS 8 QUESTIONAMENTOS)
1. **Geração de Tráfego:** O Blog será nativo (`/blog`). Nada de tráfego fragmentado para Medium ou Substack. Todo o SEO fortificará o domínio principal da Zyconomes.
2. **Tática de Retenção:** Zero fricção mantida. A métrica de retorno (>20%) será lida via `localStorage` (usuários anônimos). Contudo, na tela de resultado, introduziremos a captura passiva: "Enviar resultado para meu e-mail".
3. **Design do Analytics:** O rastreio (DataLayer) ocorrerá exclusivamente na **Conclusão** (botão "Calcular" ou visualização do resultado) para evitar ruído de dados.
4. **Ouvidoria de Usuários:** As 20 entrevistas exigidas no roteiro serão feitas via saída direta (Link para WhatsApp/LinkedIn do Fundador no rodapé dos resultados). Sem formulários complexos (Typeform) agora.
5. **Motor do Blog:** Utilizaremos Markdown (`react-markdown`) renderizado estaticamente. Mantém o Lighthouse > 90 e custo zero de banco de dados.
6. **Testes A/B:** Protelados. Faremos validação sequencial: lançamos, medimos, melhoramos. Overengineering de A/B agora fere a regra de simplicidade.
7. **Ciclo Virtuoso:** Cross-selling de conteúdo. Ex: Se a Reserva de Emergência for 0%, a interface sugere dinamicamente o artigo "Como montar sua primeira reserva".
8. **Dívida Paga:** O Analytics e a Captura de E-mails, deixados para trás na Fase A, compõem o escopo principal desta fase.

## 2. ESPECIFICAÇÃO DE ENGENHARIA (FASE B)

### 2.1 Motor de Conteúdo (Blog SEO)
- **Tecnologia:** Componente React renderizando arquivos `.md` locais.
- **Roteamento:** Simularemos um roteador client-side simples para exibir a lista de artigos (Home do Blog) e o Artigo Específico, sem recarregar a página (SPA).
- **SEO Metadata:** Injeção de tags semânticas (`<article>`, `<h1>` corretos) no DOM virtual.

### 2.2 Observabilidade (Analytics Mock/DataLayer)
- **Estrutura:** Criação de um utilitário `analytics.ts`.
- **Eventos a Rastrear:**
  - `tool_view`: Quando o usuário abre uma das 5 ferramentas.
  - `tool_calculate`: Quando o usuário completa a simulação.
  - `lead_capture`: Quando o usuário deixa o e-mail.

### 2.3 Captura de Leads (Retenção)
- **Posicionamento:** Embutido de forma não-invasiva no card de "Resultado" de cada calculadora.
- **Mock de Banco:** O e-mail será validado (Regex) e armazenado no console/localStorage simulando a futura integração com Supabase.

## 3. CRITÉRIO DE ACEITE (PORTÃO DE SAÍDA - FASE B)
[ ] Motor de Blog renderizando Markdown com sucesso.
[ ] Injeção de Analytics disparando os 3 eventos principais sem erros no Console.
[ ] Ponto de captura de e-mail (Lead) funcional nas calculadoras.
[ ] Cross-selling contextualizado entre as Ferramentas e o Blog.

---
*Fim da Especificação. Liberado para codificação (ou refatoração) após o ciente.*
