/**
 * Matriz Operacional Coordenativa da Zyconomes — MOSC-ZYC
 * 
 * Princípio Operacional:
 * Dado → Validação → Cálculo → Interpretação → Cenário → Evidência → Atendimento → Decisão humana → Registro → Acompanhamento → Resultado
 * 
 * Princípio de Governança:
 * "Quanto maior o impacto potencial de uma ação, maior deve ser o nível de autorização, rastreabilidade e revisão humana."
 */

export type MoscOperatorId =
  | 'CLIENTE'
  | 'AGENTE_FINANCEIRO'
  | 'ESPECIALISTA_FINANCEIRO'
  | 'PLANEJADOR_FINANCEIRO'
  | 'ANALISTA_OPERACIONAL'
  | 'AUDITOR_CONTROLADOR'
  | 'SUPERVISOR'
  | 'ADMINISTRADOR_SEGURANCA'
  | 'ADMINISTRADOR_PLATAFORMA'
  | 'SISTEMA_NOTIFICACOES'
  | 'MOTOR_REGRAS'
  | 'MOTOR_AUDITORIA';

export interface MoscOperatorDefinition {
  id: MoscOperatorId;
  title: string;
  category: 'HUMANO_EXTERNO' | 'HUMANO_OPERACIONAL' | 'HUMANO_ESPECIALISTA' | 'HUMANO_GOVERNANCA' | 'SISTEMA_AUTOMATIZADO';
  centralFunction: string;
  canView: string;
  canExecute: string;
  canApprove: string;
  canAlterFinancialData: string;
  canInteractWithClient: 'Sim' | 'Não' | 'Assistido' | 'Limitada' | 'Automatizada' | 'Excepcional';
  evidenceRequirement: 'Baixa (Autodeclaração)' | 'Média (Comprovantes Bancários/Extratos)' | 'Alta (Laudo Técnico/Certificação)' | 'Máxima (Cadeia Criptográfica / Hash Inalterável)';
  requiredAuthorizationLevel: 'Própria' | 'Supervisionada' | 'Alçada Profissional' | 'Alçada de Governança / Colegiada' | 'Determinística / Zero Humana';
  riskMitigationRule: string;
}

export const MOSC_ZYC_PIPELINE_STAGES = [
  { step: 1, name: 'Dado', desc: 'Ingestão e sanitização estrita de inputs no client/gateway' },
  { step: 2, name: 'Validação', desc: 'Validação por schemas Zod (.strict) e checagem de tipos' },
  { step: 3, name: 'Cálculo', desc: 'Execução determinística pelos motores matemáticos puros' },
  { step: 4, name: 'Interpretação', desc: 'Análise contextual de volatilidade, liquidez e horizontes' },
  { step: 5, name: 'Cenário', desc: 'Simulação de estresse macroeconômico e paridade de risco' },
  { step: 6, name: 'Evidência', desc: 'Anexação de documentos e comprovantes assinados digitalmente' },
  { step: 7, name: 'Atendimento', desc: 'Interação orientada entre cliente e especialistas certificados' },
  { step: 8, name: 'Decisão Humana', desc: 'Consentimento e decisão soberana do titular do patrimônio' },
  { step: 9, name: 'Registro', desc: 'Gravação imutável no ledger encadeado com HMAC SHA-256' },
  { step: 10, name: 'Acompanhamento', desc: 'Monitoramento contínuo de desvios de metas e rebalanceamento' },
  { step: 11, name: 'Resultado', desc: 'Mensuração auditável de retorno real, Sharpe e preservação de capital' }
] as const;

export const MOSC_ZYC_MATRIX: MoscOperatorDefinition[] = [
  {
    id: 'CLIENTE',
    title: 'Usuário / Cliente',
    category: 'HUMANO_EXTERNO',
    centralFunction: 'Fornecer dados fidedignos e consumir diagnósticos/análises patrimoniais',
    canView: 'Exclusivamente os próprios casos, simulações e dados autorizados',
    canExecute: 'Simulações, diagnósticos, consultas e emissão de relatórios próprios',
    canApprove: 'Consentimentos próprios, adesão a planos e alocações de portfólio',
    canAlterFinancialData: 'Apenas os próprios dados patrimoniais sob sua titularidade',
    canInteractWithClient: 'Sim',
    evidenceRequirement: 'Média (Comprovantes Bancários/Extratos)',
    requiredAuthorizationLevel: 'Própria',
    riskMitigationRule: 'Isolamento estrito contra IDOR: predicado conjunto where(userId == dbUser.id) no banco.'
  },
  {
    id: 'AGENTE_FINANCEIRO',
    title: 'Agente Financeiro',
    category: 'HUMANO_OPERACIONAL',
    centralFunction: 'Interpretar dados patrimoniais, orquestrar simulações e preparar relatórios preliminares',
    canView: 'Dados explicitamente autorizados e consentidos pelo cliente no caso ativo',
    canExecute: 'Cálculos matemáticos, cenários de estresse, validações e minutas de relatórios',
    canApprove: 'Não possui alçada de aprovação de estratégias ou movimentações',
    canAlterFinancialData: 'Não pode alterar dados financeiros brutos diretamente',
    canInteractWithClient: 'Assistido',
    evidenceRequirement: 'Média (Comprovantes Bancários/Extratos)',
    requiredAuthorizationLevel: 'Supervisionada',
    riskMitigationRule: 'Todo parecer gerado deve ser referenciado a um hash de simulação previamente auditado.'
  },
  {
    id: 'ESPECIALISTA_FINANCEIRO',
    title: 'Especialista Financeiro',
    category: 'HUMANO_ESPECIALISTA',
    centralFunction: 'Análise técnica profissional aprofundada, pareceres e orientações estratégicas',
    canView: 'Casos atribuídos formalmente com consentimento ativo do cliente',
    canExecute: 'Emissão de laudos analíticos, estudos de viabilidade e pareceres técnicos',
    canApprove: 'Decisões e pareceres profissionais estritamente sob sua alçada certificada',
    canAlterFinancialData: 'Somente ajustes analíticos conforme escopo contratual formalizado',
    canInteractWithClient: 'Sim',
    evidenceRequirement: 'Alta (Laudo Técnico/Certificação)',
    requiredAuthorizationLevel: 'Alçada Profissional',
    riskMitigationRule: 'Assinatura digital e carimbo de tempo obrigatório em cada recomendação.'
  },
  {
    id: 'PLANEJADOR_FINANCEIRO',
    title: 'Planejador Financeiro (CFP)',
    category: 'HUMANO_ESPECIALISTA',
    centralFunction: 'Construção do plano de longo prazo, cenários de independência e metas de aposentadoria',
    canView: 'Casos patrimoniais formalmente atribuídos sob termo de sigilo',
    canExecute: 'Planejamento de fluxo de caixa perpétuo, projeções analíticas e bandas de alocação',
    canApprove: 'Planos e arquiteturas de alocação sob sua responsabilidade técnica',
    canAlterFinancialData: 'Parâmetros de metas e prazos conforme procuração ou mandato',
    canInteractWithClient: 'Sim',
    evidenceRequirement: 'Alta (Laudo Técnico/Certificação)',
    requiredAuthorizationLevel: 'Alçada Profissional',
    riskMitigationRule: 'Projeções devem demonstrar limites estocásticos de volatilidade (cenários base, otimista e estresse).'
  },
  {
    id: 'ANALISTA_OPERACIONAL',
    title: 'Analista Operacional',
    category: 'HUMANO_OPERACIONAL',
    centralFunction: 'Conferência, reconciliação de extratos, classificação fiscal e saneamento de cadastros',
    canView: 'Casos abertos para processamento operacional e esteiras de conferência',
    canExecute: 'Reconciliação contábil, conferência de batimento de saldo e classificação de despesas',
    canApprove: 'Não aprova estratégias patrimoniais nem planos de investimento',
    canAlterFinancialData: 'Apenas saneamento de dados cadastrais e operacionais mediante justificativa',
    canInteractWithClient: 'Limitada',
    evidenceRequirement: 'Média (Comprovantes Bancários/Extratos)',
    requiredAuthorizationLevel: 'Supervisionada',
    riskMitigationRule: 'Quatro olhos (Two-Man Rule): qualquer correção manual exige validação cruzada do Supervisor.'
  },
  {
    id: 'AUDITOR_CONTROLADOR',
    title: 'Auditor / Controlador de Risco',
    category: 'HUMANO_GOVERNANCA',
    centralFunction: 'Verificar consistência matemática, aderência regulatória, integridade do ledger e rastreabilidade',
    canView: 'Logs de auditoria, evidências, fórmulas aplicadas, amostras de cálculos e trilha de eventos',
    canExecute: 'Auditorias forenses, amostragem estatística, testes de estresse e conferência de integridade',
    canApprove: 'Pode sinalizar inconformidades, suspender relatórios e reter operações suspeitas',
    canAlterFinancialData: 'Vedação absoluta: não pode alterar qualquer dado financeiro',
    canInteractWithClient: 'Não',
    evidenceRequirement: 'Máxima (Cadeia Criptográfica / Hash Inalterável)',
    requiredAuthorizationLevel: 'Alçada de Governança / Colegiada',
    riskMitigationRule: 'Acesso read-only universal com verificação periódica de integridade HMAC SHA-256.'
  },
  {
    id: 'SUPERVISOR',
    title: 'Supervisor Operacional',
    category: 'HUMANO_GOVERNANCA',
    centralFunction: 'Coordenar esteiras de atendimento, redistribuir cargas e aprovar exceções operacionais',
    canView: 'Equipes e casos autorizados no escopo de sua diretoria ou regional',
    canExecute: 'Redistribuição de carteiras, escalonamento de prazos e relatórios gerenciais',
    canApprove: 'Aprovações operacionais de segunda instância e exceções de alçada intermediária',
    canAlterFinancialData: 'Excepcional: mediante incidente registrado e autorização documentada',
    canInteractWithClient: 'Sim',
    evidenceRequirement: 'Alta (Laudo Técnico/Certificação)',
    requiredAuthorizationLevel: 'Alçada de Governança / Colegiada',
    riskMitigationRule: 'Qualquer intervenção direta em registros dispara notificação simultânea ao Auditor.'
  },
  {
    id: 'ADMINISTRADOR_SEGURANCA',
    title: 'Administrador de Segurança (SecOps)',
    category: 'HUMANO_GOVERNANCA',
    centralFunction: 'Governança de identidade, gestão de RBAC, firewall comportamental e resposta a incidentes',
    canView: 'Metadados de tráfego, telemetria de segurança, anomalias e logs do firewall comportamental',
    canExecute: 'Quarentenas, liberação de IP, rotação de chaves e configuração de políticas de proteção',
    canApprove: 'Políticas técnicas de segurança da informação e mitigação de vulnerabilidades',
    canAlterFinancialData: 'Vedação estrita: não possui acesso de leitura ou escrita a dados financeiros de clientes',
    canInteractWithClient: 'Não',
    evidenceRequirement: 'Máxima (Cadeia Criptográfica / Hash Inalterável)',
    requiredAuthorizationLevel: 'Alçada de Governança / Colegiada',
    riskMitigationRule: 'Operações privilegiadas exigem autenticação Step-Up e respeitam a janela das 11:00 às 13:45 BRT.'
  },
  {
    id: 'ADMINISTRADOR_PLATAFORMA',
    title: 'Administrador da Plataforma (DevOps / SRE)',
    category: 'HUMANO_GOVERNANCA',
    centralFunction: 'Operar infraestrutura em nuvem, CI/CD, banco de dados relacional e alta disponibilidade',
    canView: 'Métricas de concorrência, latência, saturação de pool de conexões e logs de infraestrutura',
    canExecute: 'Deployments, comutação de releases, monitoramento de saúde e provisionamento de recursos',
    canApprove: 'Mudanças de infraestrutura e janelas de manutenção técnica',
    canAlterFinancialData: 'Vedação arquitetural: não deve acessar conteúdo financeiro legível (isolamento zero-knowledge)',
    canInteractWithClient: 'Não',
    evidenceRequirement: 'Alta (Laudo Técnico/Certificação)',
    requiredAuthorizationLevel: 'Alçada de Governança / Colegiada',
    riskMitigationRule: 'Tabelas sensíveis protegidas com criptografia AES-256-GCM em repouso impedem visualização direta no DB.'
  },
  {
    id: 'SISTEMA_NOTIFICACOES',
    title: 'Sistema de Notificações (Event Dispatcher)',
    category: 'SISTEMA_AUTOMATIZADO',
    centralFunction: 'Entregar notificações transacionais e alertas de rebalanceamento nos canais autorizados',
    canView: 'Somente o payload mínimo estritamente necessário para o envio da mensagem',
    canExecute: 'Disparo assíncrono de e-mails, webhooks e mensagens transacionais estruturadas',
    canApprove: 'Não',
    canAlterFinancialData: 'Não',
    canInteractWithClient: 'Automatizada',
    evidenceRequirement: 'Média (Comprovantes Bancários/Extratos)',
    requiredAuthorizationLevel: 'Determinística / Zero Humana',
    riskMitigationRule: 'Sanitização de templates contra injeção de HTML e vazamento de saldo no assunto de notificações.'
  },
  {
    id: 'MOTOR_REGRAS',
    title: 'Motor de Regras Determinístico (Engine Core)',
    category: 'SISTEMA_AUTOMATIZADO',
    centralFunction: 'Aplicar modelos matemáticos canônicos, MPT, Paridade de Risco, Price e validações fiscais',
    canView: 'Variáveis numéricas e temporais injetadas no contexto da simulação',
    canExecute: 'Resolução de equações analíticas puras sem efeitos colaterais de estado',
    canApprove: 'Não',
    canAlterFinancialData: 'Não',
    canInteractWithClient: 'Não',
    evidenceRequirement: 'Máxima (Cadeia Criptográfica / Hash Inalterável)',
    requiredAuthorizationLevel: 'Determinística / Zero Humana',
    riskMitigationRule: 'Fórmulas analíticas canônicas em funções puras validadas por suítes contínuas de 57 testes de regressão.'
  },
  {
    id: 'MOTOR_AUDITORIA',
    title: 'Motor de Auditoria (Immutable Ledger)',
    category: 'SISTEMA_AUTOMATIZADO',
    centralFunction: 'Registrar evidências em malha criptográfica retroalimentada, encadeamento de hashes e HMAC',
    canView: 'Eventos de mutação, acessos privilegiados, quebras de parâmetros e requisições administrativas',
    canExecute: 'Geração de hashes encadeados (prevHash → entryHash), assinatura HMAC e conferência de integridade',
    canApprove: 'Pode invalidar automaticamente sessões e acionar alarmes em caso de quebra de hash',
    canAlterFinancialData: 'Não (Gravação estritamente append-only)',
    canInteractWithClient: 'Não',
    evidenceRequirement: 'Máxima (Cadeia Criptográfica / Hash Inalterável)',
    requiredAuthorizationLevel: 'Determinística / Zero Humana',
    riskMitigationRule: 'Estrutura imutável estilo blockchain: qualquer edição manual em log invalida a cadeia por completo.'
  }
];
