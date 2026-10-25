import React, { useState, useMemo } from 'react';
import { 
  GitFork, 
  Workflow, 
  FileCode, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Calculator, 
  TrendingUp, 
  Lock, 
  Zap, 
  Download, 
  Search, 
  Layers, 
  ArrowRight, 
  Copy, 
  Check, 
  ChevronRight,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';

export interface FlowchartNode {
  id: string;
  type: 'start' | 'process' | 'decision' | 'security' | 'fallback' | 'output';
  label: string;
  description: string;
  codeSnippet?: string;
  x: number;
  y: number;
  connectsTo?: { targetId: string; label?: string }[];
}

export interface AlgorithmDefinition {
  id: string;
  title: string;
  category: 'financeMath' | 'selfHealing' | 'securityAudit' | 'concurrency' | 'aiAgent';
  categoryLabel: string;
  filePath: string;
  functionName: string;
  timeComplexity: string;
  spaceComplexity: string;
  mathematicalFormula: string;
  isoStandard: string;
  nielsenHeuristic: string;
  summary: string;
  inputs: { name: string; type: string; desc: string }[];
  outputs: { name: string; type: string; desc: string }[];
  nodes: FlowchartNode[];
  rawSourceCode: string;
}

export const ALGORITHM_REGISTRY: AlgorithmDefinition[] = [
  // 1. Diagnóstico de Fluxo de Caixa
  {
    id: 'cashflow_diagnostics',
    title: 'Diagnóstico de Fluxo de Caixa & Cobertura de Reserva',
    category: 'financeMath',
    categoryLabel: 'Motores Matemáticos & Atuariais',
    filePath: 'src/lib/financeMath.ts',
    functionName: 'calculateEmergencyFundMonths(savings, expenses)',
    timeComplexity: 'O(1) - Tempo Constante',
    spaceComplexity: 'O(1) - Memória Estática',
    mathematicalFormula: 'M_{reserva} = \\frac{S_{atual}}{D_{mensal}}, \\quad Fluxo = R_{mensal} - D_{mensal}, \\quad Tx_{poup} = \\frac{Fluxo}{R_{mensal}} \\times 100',
    isoStandard: 'ISO/IEC 25010 (Adequação Funcional & Exatidão de Cálculo)',
    nielsenHeuristic: 'Heurística #1 (Visibilidade do Status) & Heurística #5 (Prevenção de Erros)',
    summary: 'Calcula a solvência imediata do investidor avaliando cobertura em meses de sobrevivência sem renda ativa e taxa de geração de caixa livre fiduciário.',
    inputs: [
      { name: 'income', type: 'number', desc: 'Renda líquida mensal do investidor (R$)' },
      { name: 'expenses', type: 'number', desc: 'Despesas correntes mensais obrigatórias (R$)' },
      { name: 'savings', type: 'number', desc: 'Saldo atual alocado em reserva líquida (R$)' }
    ],
    outputs: [
      { name: 'freeCashFlow', type: 'number', desc: 'Fluxo livre mensal para reinvestimento' },
      { name: 'savingsRate', type: 'number', desc: 'Percentual poupado sobre a renda' },
      { name: 'monthsCovered', type: 'number', desc: 'Meses de subsistência assegurados' }
    ],
    nodes: [
      { id: 'node_in', type: 'start', label: '1. Ingestão de Dados', description: 'Recebe renda, despesas e reserva via formulário reativo sanitizado.', codeSnippet: 'const inc = safeMonetaryInput(income);\nconst exp = safeMonetaryInput(expenses);\nconst sav = safeMonetaryInput(savings);', x: 50, y: 50, connectsTo: [{ targetId: 'node_check' }] },
      { id: 'node_check', type: 'decision', label: '2. Despesas > 0?', description: 'Verifica se despesas mensais são estritamente positivas para evitar divisão por zero.', codeSnippet: 'if (expenses <= 0) return 0;', x: 260, y: 50, connectsTo: [{ targetId: 'node_zero', label: 'Não' }, { targetId: 'node_calc', label: 'Sim' }] },
      { id: 'node_zero', type: 'fallback', label: 'Fallback Divisão por Zero', description: 'Retorna 0 meses com aviso fiduciário preservando integridade sem crash.', codeSnippet: 'return 0;', x: 260, y: 170, connectsTo: [{ targetId: 'node_out' }] },
      { id: 'node_calc', type: 'process', label: '3. Divisão & Razão Contábil', description: 'Aplica a razão fiduciária savings / expenses e calcula a taxa de poupança.', codeSnippet: 'const months = savings / expenses;\nconst fcf = income - expenses;\nconst rate = (fcf / income) * 100;', x: 500, y: 50, connectsTo: [{ targetId: 'node_snapshot' }] },
      { id: 'node_snapshot', type: 'security', label: '4. Gravação de Snapshot', description: 'Persiste estado íntegro no motor de autocura para restauração graciosa.', codeSnippet: 'recordStableSnapshot("Diagnóstico Financeiro", { income, expenses, savings });', x: 740, y: 50, connectsTo: [{ targetId: 'node_out' }] },
      { id: 'node_out', type: 'output', label: '5. Diagnóstico Consolidado', description: 'Exibe métricas no card com alertas fiduciários de liquidez (Meta: 6 meses).', codeSnippet: 'return { freeCashFlow: fcf, savingsRate: rate, monthsCovered: months };', x: 960, y: 50 }
    ],
    rawSourceCode: `export function calculateEmergencyFundMonths(savings: number, expenses: number): number {\n  if (!expenses || expenses <= 0) return 0;\n  const safeSavings = Math.max(0, Number(savings) || 0);\n  const safeExpenses = Math.max(0.01, Number(expenses) || 0);\n  return safeSavings / safeExpenses;\n}`
  },

  // 2. Juros Compostos
  {
    id: 'compound_interest',
    title: 'Simulação Exponencial de Juros Compostos com Aportes',
    category: 'financeMath',
    categoryLabel: 'Motores Matemáticos & Atuariais',
    filePath: 'src/lib/financeMath.ts',
    functionName: 'simulateCompoundInterest(initial, monthly, rate, years)',
    timeComplexity: 'O(N) - N = anos simulados (limite max = 60)',
    spaceComplexity: 'O(N) - Vetor determinístico de projeção anual',
    mathematicalFormula: 'FV = PV(1 + i)^n + PMT \\cdot \\frac{(1 + i)^n - 1}{i}, \\quad i = (1 + i_{anual})^{1/12} - 1',
    isoStandard: 'ISO/IEC 25010 (Confiabilidade & Estabilidade Numérica)',
    nielsenHeuristic: 'Heurística #6 (Reconhecimento em vez de Memorização)',
    summary: 'Projeta a evolução patrimonial separando o montante acumulado por juros daquele decorrente dos aportes nominais, calculando curva temporal de acumulação.',
    inputs: [
      { name: 'initial', type: 'number', desc: 'Capital inicial investido (PV em R$)' },
      { name: 'monthly', type: 'number', desc: 'Aporte periódico mensal constante (PMT em R$)' },
      { name: 'rate', type: 'number', desc: 'Taxa anual nominal/efetiva (% a.a.)' },
      { name: 'years', type: 'number', desc: 'Horizonte de investimento em anos' }
    ],
    outputs: [
      { name: 'compoundResult', type: 'number', desc: 'Montante final acumulado projetado' },
      { name: 'totalInvested', type: 'number', desc: 'Soma dos desembolsos do investidor' },
      { name: 'compoundChartData', type: 'array', desc: 'Série temporal anual para Recharts' }
    ],
    nodes: [
      { id: 'c_start', type: 'start', label: '1. Parâmetros Iniciais', description: 'Normaliza PV, PMT, taxa e horizonte em anos com limitador conservador.', codeSnippet: 'const pv = Math.max(0, initial);\nconst pmt = Math.max(0, monthly);\nconst i = Math.max(0, rate) / 100;', x: 50, y: 50, connectsTo: [{ targetId: 'c_rate_conv' }] },
      { id: 'c_rate_conv', type: 'process', label: '2. Conversão da Taxa Mensal', description: 'Calcula taxa equivalente mensal composta: i_m = (1 + i_a)^(1/12) - 1.', codeSnippet: 'const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;', x: 270, y: 50, connectsTo: [{ targetId: 'c_loop' }] },
      { id: 'c_loop', type: 'decision', label: '3. Ano <= Horizonte?', description: 'Itera ano a ano capitalizando o saldo com 12 aportes mensais por ciclo.', codeSnippet: 'for (let y = 1; y <= years; y++) { ... }', x: 500, y: 50, connectsTo: [{ targetId: 'c_step_calc', label: 'Sim' }, { targetId: 'c_finalize', label: 'Não' }] },
      { id: 'c_step_calc', type: 'process', label: '4. Capitalização & Aportes', description: 'Aplica juros sobre saldo anterior e acumula montante investido.', codeSnippet: 'total = (total + pmt) * (1 + monthlyRate);\ninvested += pmt;', x: 500, y: 170, connectsTo: [{ targetId: 'c_loop' }] },
      { id: 'c_finalize', type: 'security', label: '5. Validação de Precisão', description: 'Arredonda para 2 casas decimais e descarta NaNs ou Infinity.', codeSnippet: 'const finalTotal = safeNumber(total);\nconst finalInvested = safeNumber(invested);', x: 730, y: 50, connectsTo: [{ targetId: 'c_render' }] },
      { id: 'c_render', type: 'output', label: '6. Curva Gráfica & Total', description: 'Alimenta gráfico de área de dupla camada e montante final auditável.', codeSnippet: 'return { total: finalTotal, data: chartArray };', x: 950, y: 50 }
    ],
    rawSourceCode: `export function simulateCompoundInterest(initial: number, monthly: number, rate: number, years: number) {\n  let total = initial;\n  let invested = initial;\n  const monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;\n  const data = [];\n  for (let y = 1; y <= years; y++) {\n    for (let m = 1; m <= 12; m++) {\n      total = total * (1 + monthlyRate) + monthly;\n      invested += monthly;\n    }\n    data.push({ year: y, Total: Math.round(total), Investido: Math.round(invested) });\n  }\n  return { total, invested, data };\n}`
  },

  // 3. Acelerador de Quitação Habitacional (SAC vs PRICE)
  {
    id: 'mortgage_payoff_sac',
    title: 'Acelerador de Quitação Habitacional (SAC vs PRICE & Amortização Extraordinária)',
    category: 'financeMath',
    categoryLabel: 'Motores Matemáticos & Atuariais',
    filePath: 'src/lib/financeMath.ts',
    functionName: 'simulateAcceleratedLoanPayoff(amount, rate, years, extraMonthly, ...)',
    timeComplexity: 'O(M) - M = meses simulados (max 420 meses / 35 anos)',
    spaceComplexity: 'O(M) - Tabela analítica de amortização',
    mathematicalFormula: 'SAC: A_k = \\frac{SD_0}{n}, \\quad J_k = SD_{k-1} \\cdot i, \\quad PMT_k = A_k + J_k + Amort_{extra}',
    isoStandard: 'ISO/IEC 25010 & Resolução BACEN nº 3.517 (Custo Efetivo Total)',
    nielsenHeuristic: 'Heurística #7 (Flexibilidade e Eficiência de Uso) & #8 (Estética e Minimalismo)',
    summary: 'Mapeia a redução exponencial do prazo e a aniquilação de juros bancários decorrente de amortizações regulares e aportes bienais via FGTS.',
    inputs: [
      { name: 'amount', type: 'number', desc: 'Saldo devedor financiado contratado (R$)' },
      { name: 'rate', type: 'number', desc: 'Taxa de juros efetiva anual contratada (% a.a.)' },
      { name: 'years', type: 'number', desc: 'Prazo total pactuado em anos (ex: 30 anos / 360 meses)' },
      { name: 'extraMonthly', type: 'number', desc: 'Amortização extraordinária mensal direta no saldo devedor' },
      { name: 'amortStrategy', type: 'string', desc: 'Redução de Prazo (Term) ou Redução de Parcela (Installment)' }
    ],
    outputs: [
      { name: 'savedInterest', type: 'number', desc: 'Economia monetária líquida em juros evitados (R$)' },
      { name: 'monthsSaved', type: 'number', desc: 'Meses eliminados do cronograma bancário' },
      { name: 'payoffYears', type: 'number', desc: 'Novo tempo real até quitação plena do imóvel' }
    ],
    nodes: [
      { id: 'sac_in', type: 'start', label: '1. Parâmetros do Contrato', description: 'Carrega saldo, taxa bancária, sistema (SAC/PRICE) e meta de amortização.', codeSnippet: 'let balance = loanAmount;\nconst monthlyRate = Math.pow(1 + annualRate / 100, 1/12) - 1;\nlet remainingMonths = loanYears * 12;', x: 40, y: 50, connectsTo: [{ targetId: 'sac_system' }] },
      { id: 'sac_system', type: 'decision', label: '2. Sistema SAC ou PRICE?', description: 'Seleciona fórmula de amortização constante ou prestação constante.', codeSnippet: 'const isSAC = amortSystem === "SAC";', x: 260, y: 50, connectsTo: [{ targetId: 'sac_calc', label: 'SAC' }, { targetId: 'price_calc', label: 'PRICE' }] },
      { id: 'sac_calc', type: 'process', label: '3. Amortização Linear (SAC)', description: 'Amortização contratual = Saldo / Meses Restantes. Juros = Saldo * Taxa.', codeSnippet: 'const A = balance / remainingMonths;\nconst J = balance * monthlyRate;\nconst PMT = A + J;', x: 260, y: 160, connectsTo: [{ targetId: 'sac_extra' }] },
      { id: 'price_calc', type: 'process', label: '3B. Prestação Constante (PRICE)', description: 'PMT fixo pela fórmula da Anuidade de Gauss / Tabela Price.', codeSnippet: 'const PMT = (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -remainingMonths));', x: 470, y: 50, connectsTo: [{ targetId: 'sac_extra' }] },
      { id: 'sac_extra', type: 'process', label: '4. Injeção de Amortização Extra', description: 'Abate aporte extraordinário direto no principal antes da virada do mês.', codeSnippet: 'balance -= (A + extraMonthly + (isBiennial ? fgtsBonus : 0));\nremainingMonths--;', x: 470, y: 160, connectsTo: [{ targetId: 'sac_check' }] },
      { id: 'sac_check', type: 'decision', label: '5. Saldo <= 0 ou Fim?', description: 'Verifica se o saldo devedor foi aniquilado antes do prazo estipulado.', codeSnippet: 'if (balance <= 0 || remainingMonths === 0) break;', x: 710, y: 160, connectsTo: [{ targetId: 'sac_extra', label: 'Continuar' }, { targetId: 'sac_metrics', label: 'Quitado' }] },
      { id: 'sac_metrics', type: 'security', label: '6. Consolidação de Economia', description: 'Calcula juros totais sem aceleração vs juros pagos acelerados.', codeSnippet: 'const savedInterest = originalTotalInterest - acceleratedTotalInterest;\nconst monthsSaved = originalTermMonths - elapsedMonths;', x: 920, y: 160, connectsTo: [{ targetId: 'sac_out' }] },
      { id: 'sac_out', type: 'output', label: '7. Painel de Liberdade da Casa', description: 'Emite novo prazo de quitação, economia de juros e tabela comparativa.', codeSnippet: 'return { savedInterest, monthsSaved, newTermYears: elapsedMonths / 12 };', x: 920, y: 50 }
    ],
    rawSourceCode: `export function simulateAcceleratedLoanPayoff(amount: number, rate: number, years: number, extraMonthly: number, system: 'SAC' | 'PRICE') {\n  let balance = amount;\n  let totalInterest = 0;\n  let months = 0;\n  const i = Math.pow(1 + rate / 100, 1 / 12) - 1;\n  while (balance > 0 && months < years * 12) {\n    const interest = balance * i;\n    totalInterest += interest;\n    const amortization = system === 'SAC' ? (amount / (years * 12)) : (amount * i) / (1 - Math.pow(1 + i, -years * 12)) - interest;\n    balance -= (amortization + extraMonthly);\n    months++;\n  }\n  return { totalInterest, payoffMonths: months };\n}`
  },

  // 4. Comparador Multidívidas (Avalanche vs Bola de Neve)
  {
    id: 'debt_avalanche_snowball',
    title: 'Comparador Multidívidas: Método Avalanche vs Bola de Neve',
    category: 'financeMath',
    categoryLabel: 'Motores Matemáticos & Atuariais',
    filePath: 'src/lib/financeMath.ts',
    functionName: 'simulateDebtPayoffComparison(debts, extraBudget)',
    timeComplexity: 'O(D · log D + D · M) - D = dívidas, M = meses até extinção',
    spaceComplexity: 'O(D) - Estrutura de priorização em memória',
    mathematicalFormula: 'Avalanche = \\arg\\max(i_k), \\quad Bola\\ de\\ Neve = \\arg\\min(SD_k)',
    isoStandard: 'ISO/IEC 25010 & Psicologia Financeira Comportamental',
    nielsenHeuristic: 'Heurística #2 (Correspondência entre o Sistema e o Mundo Real)',
    summary: 'Compara a otimização matemática estrita de juros (Avalanche - maior taxa) com o reforço psicológico de vitórias rápidas (Bola de Neve - menor saldo).',
    inputs: [
      { name: 'debts', type: 'DebtItem[]', desc: 'Lista de dívidas (Cartão, Cheque Especial, Empréstimo, Veículo)' },
      { name: 'extraBudget', type: 'number', desc: 'Verba extra mensal dedicada à aceleração de quitação (R$)' }
    ],
    outputs: [
      { name: 'avalancheMonths', type: 'number', desc: 'Meses totais para zerar todas as dívidas via Avalanche' },
      { name: 'snowballMonths', type: 'number', desc: 'Meses totais para zerar todas as dívidas via Bola de Neve' },
      { name: 'interestDifference', type: 'number', desc: 'Economia financeira real do método ótimo' }
    ],
    nodes: [
      { id: 'db_in', type: 'start', label: '1. Ingestão da Carteira Devedora', description: 'Carrega vetor de passivos com saldo, taxa de juros e pagamento mínimo.', codeSnippet: 'const debtsList = [...debts];\nconst budget = safeNumber(extraBudget);', x: 50, y: 50, connectsTo: [{ targetId: 'db_sort' }] },
      { id: 'db_sort', type: 'process', label: '2. Ordenação de Prioridade', description: 'Avalanche ordena decrescente por taxa; Bola de Neve crescente por saldo.', codeSnippet: 'avalancheDebts.sort((a,b) => b.rate - a.rate);\nsnowballDebts.sort((a,b) => a.balance - b.balance);', x: 270, y: 50, connectsTo: [{ targetId: 'db_sim_both' }] },
      { id: 'db_sim_both', type: 'process', label: '3. Simulação Concorrente', description: 'Executa simulação mês a mês transferindo o fluxo mínimo das dívidas quitadas para a próxima.', codeSnippet: 'let rolledBudget = extraBudget + paidMinPayment;', x: 510, y: 50, connectsTo: [{ targetId: 'db_compare' }] },
      { id: 'db_compare', type: 'decision', label: '4. Todas Dívidas Zeradas?', description: 'Checa término das duas esteiras simultaneamente.', codeSnippet: 'if (allAvalancheZero && allSnowballZero) break;', x: 740, y: 50, connectsTo: [{ targetId: 'db_sim_both', label: 'Iterar' }, { targetId: 'db_out', label: 'Concluído' }] },
      { id: 'db_out', type: 'output', label: '5. Relatório Comparativo', description: 'Exibe tempo de quitação, juros totais de cada estratégia e recomendação fiduciária.', codeSnippet: 'return { avalancheResult, snowballResult, deltaInterest };', x: 960, y: 50 }
    ],
    rawSourceCode: `export function simulateDebtPayoffComparison(debts: DebtItem[], extraBudget: number) {\n  const runSimulation = (strategy: 'avalanche' | 'snowball') => {\n    const sorted = [...debts].sort(strategy === 'avalanche' \n      ? (a, b) => b.annualRatePercent - a.annualRatePercent \n      : (a, b) => a.balance - b.balance);\n    // Simulação contínua com roll-over do fluxo liberado\n    return simulateEngine(sorted, extraBudget);\n  };\n  return { avalanche: runSimulation('avalanche'), snowball: runSimulation('snowball') };\n}`
  },

  // 5. Autocura & AtomicErrorBoundary
  {
    id: 'self_healing_engine',
    title: 'Motor de Autocura Fiduciária & Regeneração Atômica',
    category: 'selfHealing',
    categoryLabel: 'Autocura & Tolerância a Falhas',
    filePath: 'src/lib/selfHealingEngine.ts',
    functionName: 'safeExecute(fn, fallbackValue, context)',
    timeComplexity: 'O(1) - Interceptação sem overhead assintótico',
    spaceComplexity: 'O(1) - Snapshot em anel de memória circular',
    mathematicalFormula: 'P(Crash_{sistema}) = \\prod P(Falha_{módulo}) = 0 \\implies Isolamento\\ Atômico',
    isoStandard: 'ISO 22301 (Continuidade de Negócios) & ISO/IEC 25010 (Tolerância a Falhas)',
    nielsenHeuristic: 'Heurística #9 (Auxiliar os Usuários a Reconhecer e Recuperar de Erros)',
    summary: 'Intercepta qualquer erro de execução em tempo real, encapsula parâmetros digitados, restaura estado estável anterior em 15 segundos e notifica o administrador com print SVG sem expor dados a outros usuários.',
    inputs: [
      { name: 'fn', type: 'Function', desc: 'Operação matemática ou renderização sujeita a falha' },
      { name: 'context', type: 'string', desc: 'Nome do módulo financeiro em execução' },
      { name: 'capturedInputs', type: 'Record<string, any>', desc: 'Inputs já digitados pelo usuário' }
    ],
    outputs: [
      { name: 'result', type: 'T', desc: 'Resultado íntegro calculado ou estado recuperado' },
      { name: 'recoveryStatus', type: 'string', desc: '"O contratempo foi sanado com sucesso"' }
    ],
    nodes: [
      { id: 'sh_exec', type: 'start', label: '1. Chamada Segura de Função', description: 'Executa algoritmo matemático encapsulado no bloco de proteção.', codeSnippet: 'try {\n  return fn();\n} catch (error) { ... }', x: 50, y: 50, connectsTo: [{ targetId: 'sh_err_check' }] },
      { id: 'sh_err_check', type: 'decision', label: '2. Ocorreu Exceção?', description: 'Monitora erros de ponto flutuante, estouro de pilha ou tipo inesperado.', codeSnippet: 'if (error instanceof Error) { ... }', x: 270, y: 50, connectsTo: [{ targetId: 'sh_success', label: 'Não' }, { targetId: 'sh_intercept', label: 'Sim' }] },
      { id: 'sh_success', type: 'output', label: '3. Execução Normal', description: 'Retorna resultado matemático puro sem intervenção.', codeSnippet: 'return calculationResult;', x: 270, y: 170 },
      { id: 'sh_intercept', type: 'fallback', label: '4. Encapsular Parâmetros', description: 'Preserva imediatamente renda, despesas e reserva informadas no snapshot.', codeSnippet: 'const snapshot = getLastStableSnapshot(context) || defaultValues;', x: 500, y: 50, connectsTo: [{ targetId: 'sh_forensic' }] },
      { id: 'sh_forensic', type: 'security', label: '5. Diagnóstico & Print Forense', description: 'Gera print SVG codificado em Base64 e despacha POST /api/system/report-error.', codeSnippet: 'const printSvg = generateErrorScreenSvg(context, error.message);\nreportDiagnosedError({ context, printSvg, inputs: capturedInputs });', x: 740, y: 50, connectsTo: [{ targetId: 'sh_countdown' }] },
      { id: 'sh_countdown', type: 'output', label: '6. Regressiva de 15s & Sanado', description: 'Exibe aviso de autocura por 15s máximo: "O contratempo foi sanado com sucesso".', codeSnippet: 'startCountdown(15, () => onAutoRecover(snapshot));', x: 960, y: 50 }
    ],
    rawSourceCode: `export function safeExecute<T>(fn: () => T, fallbackValue: T, contextName: string): T {\n  try {\n    return fn();\n  } catch (err: any) {\n    const printSvg = generateErrorScreenSvg(contextName, err?.message || 'Falha de cálculo');\n    reportDiagnosedError({\n      moduleName: contextName,\n      errorMessage: err?.message || 'Erro inesperado',\n      timestamp: new Date().toISOString(),\n      capturedInputs: {},\n      printBase64: printSvg\n    });\n    return fallbackValue;\n  }\n}`
  },

  // 6. Malha de Auditoria Encadeada (Ledger Blockchain-Style)
  {
    id: 'security_ledger_audit',
    title: 'Malha de Auditoria Encadeada Imutável (Merkle-Ledger Blockchain-Style)',
    category: 'securityAudit',
    categoryLabel: 'Criptografia & Ledger Imutável',
    filePath: 'src/lib/securityAudit.ts',
    functionName: 'recordSecurityEvent(category, severity, action, actor, details)',
    timeComplexity: 'O(1) - SHA-256 e HMAC em bloco único',
    spaceComplexity: 'O(K) - Memória circular limitada a K=500 blocos',
    mathematicalFormula: 'H_k = \\text{SHA-256}(k \\parallel H_{k-1} \\parallel T_k \\parallel Payload), \\quad \\text{HMAC} = \\text{HMAC}_{SHA256}(H_k, Key)',
    isoStandard: 'ISO/IEC 27001 (A.12.4 Registro e Monitoramento) & ISO 27701 (Privacidade)',
    nielsenHeuristic: 'Heurística #10 (Ajuda e Documentação Forense)',
    summary: 'Registra eventos de segurança em cadeia de blocos criptográfica onde qualquer adulteração clandestina de registros quebra o hash encadeado e aciona alarme imediato.',
    inputs: [
      { name: 'category', type: 'SecurityEventCategory', desc: 'Categoria (ex: TBAC_VIOLATION, PRIVILEGED_ACTION, IDOR_ATTEMPT)' },
      { name: 'severity', type: 'LOW | MEDIUM | HIGH | CRITICAL', desc: 'Severidade do evento' },
      { name: 'action', type: 'string', desc: 'Identificador canônico da mutação' },
      { name: 'actor', type: 'string', desc: 'Identidade auditada do usuário (ou IP da borda)' }
    ],
    outputs: [
      { name: 'entryHash', type: 'string', desc: 'Hash criptográfico SHA-256 do bloco' },
      { name: 'serverHmac', type: 'string', desc: 'Assinatura fiduciária inviolável' },
      { name: 'isValidChain', type: 'boolean', desc: 'Validação da cadeia sequencial' }
    ],
    nodes: [
      { id: 'sec_in', type: 'start', label: '1. Evento de Auditoria', description: 'Ingestão de evento com timestamp determinístico de alta precisão.', codeSnippet: 'const prevBlock = ledger[ledger.length - 1];\nconst prevHash = prevBlock ? prevBlock.entryHash : GENESIS_HASH;', x: 50, y: 50, connectsTo: [{ targetId: 'sec_canon' }] },
      { id: 'sec_canon', type: 'process', label: '2. Normalização Lexicográfica', description: 'Ordena chaves do JSON para digest imutável imune a variações de serialização.', codeSnippet: 'const canonicalPayload = canonicalizeJson(details);', x: 270, y: 50, connectsTo: [{ targetId: 'sec_hash' }] },
      { id: 'sec_hash', type: 'security', label: '3. Encadeamento SHA-256', description: 'Calcula SHA-256 sobre índice, prevHash, timestamp e payload canônico.', codeSnippet: 'const entryHash = sha256(index + prevHash + timestamp + canonicalPayload);', x: 500, y: 50, connectsTo: [{ targetId: 'sec_hmac' }] },
      { id: 'sec_hmac', type: 'security', label: '4. Assinatura HMAC-SHA256', description: 'Assina o hash do bloco com o segredo do servidor na borda.', codeSnippet: 'const serverHmac = hmacSha256(entryHash, SERVER_AUDIT_SECRET);', x: 740, y: 50, connectsTo: [{ targetId: 'sec_verify' }] },
      { id: 'sec_verify', type: 'decision', label: '5. Elo Válido?', description: 'Confronta prevHash com o bloco anterior; se divergir, dispara quarentena.', codeSnippet: 'if (block.prevHash !== expectedPrevHash) raiseTamperingAlert();', x: 960, y: 50, connectsTo: [{ targetId: 'sec_out', label: 'Sim' }, { targetId: 'sec_alert', label: 'Não' }] },
      { id: 'sec_alert', type: 'fallback', label: 'Alerta de Adulteração', description: 'Aciona quarentena cibernética e notifica superadmin imediatamente.', codeSnippet: 'triggerQuarantineAlert("ADULTERAÇÃO DETECTADA");', x: 960, y: 170 },
      { id: 'sec_out', type: 'output', label: '6. Bloco Imutável Gravado', description: 'Bloco adicionado à memória circular e persistido no banco com integridade provada.', codeSnippet: 'ledger.push(block); return block;', x: 1160, y: 50 }
    ],
    rawSourceCode: `export function recordSecurityEvent(category, severity, action, actor, details = {}) {\n  const index = inMemoryAuditLedger.length;\n  const prevBlock = inMemoryAuditLedger[index - 1];\n  const prevHash = prevBlock ? prevBlock.entryHash : '0'.repeat(64);\n  const timestamp = new Date().toISOString();\n  const rawDigest = [index, prevHash, timestamp, category, severity, action, actor, canonicalJson(details)].join('|');\n  const entryHash = crypto.createHash('sha256').update(rawDigest).digest('hex');\n  const serverHmac = crypto.createHmac('sha256', AUDIT_HMAC_KEY).update(entryHash).digest('hex');\n  const block = { index, prevHash, entryHash, serverHmac, timestamp, category, severity, action, actor, details };\n  inMemoryAuditLedger.push(block);\n  return block;\n}`
  },

  // 7. Agente IA Multi-Ciclos (15 Anos)
  {
    id: 'ai_personal_agent_15y',
    title: 'Agente IA Multi-Ciclos: Trajetória Patrimonial Escalar de 15 Anos',
    category: 'aiAgent',
    categoryLabel: 'Agente IA & Otimização Multi-Ciclos',
    filePath: 'src/components/PersonalAgentCockpit.tsx',
    functionName: 'calculateLifeCycleTrajectory(initialAmount, monthlySavings, ...)',
    timeComplexity: 'O(180) - 180 meses (15 anos) de simulação contínua',
    spaceComplexity: 'O(1) - Variáveis de acumulação em registro',
    mathematicalFormula: '\\text{Ciclo 1: Preservação (R\\$ 1k)} \\to \\text{Ciclo 2: 5x a 8x (Curto/Médio)} \\to \\text{Ciclo 3: US\\$ 2.000/sem (Trinity 4\\%)}',
    isoStandard: 'ISO 42001 (Sistemas de Gestão de IA) & ISO/IEC 25010',
    nielsenHeuristic: 'Heurística #1 (Visibilidade do Status) & #4 (Consistência e Padrões)',
    summary: 'Modela a jornada algorítmica de 15 anos inspirada no framework Agent-S: curto prazo focado em preservar R$ 1.000, médio prazo multiplicando 5x a 8x via poupança disciplinada, e longo prazo migrando para USD $2.000/semana sob regra de Trinity.',
    inputs: [
      { name: 'startCapital', type: 'number', desc: 'Capital inicial do Ciclo 1 (R$ 1.000)' },
      { name: 'monthlyAddition', type: 'number', desc: 'Aporte poupado pelo investidor (R$)' },
      { name: 'usdExchangeRate', type: 'number', desc: 'Taxa de câmbio BRL/USD projetada' }
    ],
    outputs: [
      { name: 'cycle1Net', type: 'number', desc: 'Resultado da blindagem inicial de curto prazo' },
      { name: 'cycle2Mult', type: 'number', desc: 'Multiplicação de 5x a 8x no médio prazo' },
      { name: 'cycle3PassiveUsd', type: 'number', desc: 'Renda semanal em moeda forte atingida' }
    ],
    nodes: [
      { id: 'ai_in', type: 'start', label: '1. Início Ciclo 1: R$ 1.000', description: 'Aloca capital em liquidez pura com zero risco de ruína assimétrica.', codeSnippet: 'const cycle1 = { capital: 1000, focus: "Preservação Estrita" };', x: 50, y: 50, connectsTo: [{ targetId: 'ai_cycle2' }] },
      { id: 'ai_cycle2', type: 'process', label: '2. Ciclo 2: Alavancagem por Poupança', description: 'Multiplica o patrimônio em 5x a 8x no médio prazo (3 a 5 anos) via taxa de poupança.', codeSnippet: 'const targetMult = initial * 6.5; // Média 5x a 8x', x: 280, y: 50, connectsTo: [{ targetId: 'ai_trinity_check' }] },
      { id: 'ai_trinity_check', type: 'decision', label: '3. Atingiu Patamar Dólar?', description: 'Checa maturidade de carteira para iniciar transição fiduciária internacional.', codeSnippet: 'if (wealthBRL >= 150000) initiateDollarization();', x: 520, y: 50, connectsTo: [{ targetId: 'ai_cycle2', label: 'Acumular' }, { targetId: 'ai_cycle3', label: 'Dolarizar' }] },
      { id: 'ai_cycle3', type: 'security', label: '4. Ciclo 3: Renda USD $2.000/sem', description: 'Dimensiona carteira fiduciária global para saque seguro perpétuo (SWR 4%).', codeSnippet: 'const annualRequiredUSD = 2000 * 52; // USD 104.000/ano\nconst targetWealthUSD = annualRequiredUSD / 0.04;', x: 760, y: 50, connectsTo: [{ targetId: 'ai_out' }] },
      { id: 'ai_out', type: 'output', label: '5. Cockpit de 15 Anos Consolidado', description: 'Exibe trajetória com split 20% pessoal / 25% negócios / 40% ações / 15% liquidez.', codeSnippet: 'return { trajectory15Years, allocationBlueprint };', x: 1000, y: 50 }
    ],
    rawSourceCode: `export function simulate15YearAgentTrajectory(initialAmount: number, monthlySaving: number, usdRate: number = 5.65) {\n  const cycle1 = { target: 1000, status: initialAmount >= 1000 ? 'PROTECTED' : 'BUILDING' };\n  const cycle2 = { target: initialAmount * 6.5, horizonYears: '3 to 5 years' };\n  const annualUsdRequired = 2000 * 52; // USD 104.000\n  const cycle3TargetUsd = annualUsdRequired / 0.04; // SWR 4% -> USD 2.6M\n  return { cycle1, cycle2, cycle3: { annualUsd: annualUsdRequired, requiredPortfolioUsd: cycle3TargetUsd, requiredPortfolioBRL: cycle3TargetUsd * usdRate } };\n}`
  },

  // 8. Arbitragem de Capital: Quitar vs Investir
  {
    id: 'arbitrage_payoff_vs_invest',
    title: 'Arbitragem de Capital: Quitação Antecipada vs Aplicação com IR Regressivo',
    category: 'financeMath',
    categoryLabel: 'Motores Matemáticos & Atuariais',
    filePath: 'src/lib/financeMath.ts',
    functionName: 'calculatePayoffVsInvestOpportunity(loanRate, investmentGrossRate, irRate)',
    timeComplexity: 'O(1) - Resolução analítica direta',
    spaceComplexity: 'O(1) - Variáveis escalares em registro',
    mathematicalFormula: 'R_{liq} = R_{bruto} \\cdot (1 - IR), \\quad \\Delta = R_{liq} - i_{financiamento}',
    isoStandard: 'ISO/IEC 25010 & Princípios de Eficiência Tributária',
    nielsenHeuristic: 'Heurística #8 (Estética e Design Minimalista)',
    summary: 'Compara o rendimento líquido real de investimentos conservadores (descontado de IR e inflação) contra o custo efetivo total do financiamento imobiliário.',
    inputs: [
      { name: 'loanRate', type: 'number', desc: 'Taxa anual do financiamento habitacional (% a.a.)' },
      { name: 'investmentGrossRate', type: 'number', desc: 'Rentabilidade bruta anual do investimento / CDI (% a.a.)' },
      { name: 'irRate', type: 'number', desc: 'Alíquota de imposto de renda da tabela regressiva (%)' }
    ],
    outputs: [
      { name: 'netInvestmentRate', type: 'number', desc: 'Taxa líquida real anual da aplicação' },
      { name: 'spreadPercent', type: 'number', desc: 'Diferença líquida percentual (Spread de arbitragem)' },
      { name: 'recommendation', type: 'string', desc: 'Diretriz fiduciária: "Quitar Financiamento" ou "Manter Investido"' }
    ],
    nodes: [
      { id: 'arb_in', type: 'start', label: '1. Ingestão de Taxas & Tributos', description: 'Carrega taxa do financiamento e rendimento bruto com alíquota de IR.', codeSnippet: 'const iFin = safeNumber(loanRate);\nconst iInvGross = safeNumber(investmentGrossRate);\nconst ir = safeNumber(irRate) / 100;', x: 50, y: 50, connectsTo: [{ targetId: 'arb_net' }] },
      { id: 'arb_net', type: 'process', label: '2. Desconto do Imposto de Renda', description: 'Calcula retorno líquido: R_liq = R_bruto * (1 - IR).', codeSnippet: 'const netRate = iInvGross * (1 - ir);', x: 280, y: 50, connectsTo: [{ targetId: 'arb_decision' }] },
      { id: 'arb_decision', type: 'decision', label: '3. Retorno Líquido > Taxa Dívida?', description: 'Compara rentabilidade líquida do investimento contra juros do empréstimo.', codeSnippet: 'if (netRate > iFin) { ... }', x: 520, y: 50, connectsTo: [{ targetId: 'arb_invest', label: 'Sim' }, { targetId: 'arb_payoff', label: 'Não' }] },
      { id: 'arb_invest', type: 'process', label: '4A. Vantagem Investimento', description: 'Arbitragem positiva: manter recursos aplicados rende mais que o custo do banco.', codeSnippet: 'const spread = netRate - iFin;\nconst verdict = "Investir gera ganho real";', x: 520, y: 170, connectsTo: [{ targetId: 'arb_out' }] },
      { id: 'arb_payoff', type: 'process', label: '4B. Vantagem Quitação', description: 'Arbitragem negativa: juros bancários corroem o patrimônio mais rápido que o investimento.', codeSnippet: 'const spread = iFin - netRate;\nconst verdict = "Quitar antecipado é a melhor decisão fiduciária";', x: 760, y: 50, connectsTo: [{ targetId: 'arb_out' }] },
      { id: 'arb_out', type: 'output', label: '5. Parecer Fiduciário Imparcial', description: 'Apresenta spread em pontos percentuais e recomendação matemática sem viés de gerente.', codeSnippet: 'return { netRate, spread, verdict };', x: 1000, y: 50 }
    ],
    rawSourceCode: `export function calculatePayoffVsInvestOpportunity(loanRate: number, investmentGrossRate: number, irRate = 15) {\n  const netInvestmentRate = investmentGrossRate * (1 - irRate / 100);\n  const spread = netInvestmentRate - loanRate;\n  const isInvestBetter = spread > 0;\n  return {\n    netInvestmentRate,\n    spread: Math.abs(spread),\n    recommendation: isInvestBetter \n      ? 'Manter capital aplicado supera o custo bancário' \n      : 'Amortizar o saldo devedor gera retorno real garantido superior'\n  };\n}`
  },

  // 9. Independência Financeira & Equação dos 4%
  {
    id: 'fi_four_percent_rule',
    title: 'Independência Financeira (Fator Tempo & Safe Withdrawal Rate 4%)',
    category: 'financeMath',
    categoryLabel: 'Motores Matemáticos & Atuariais',
    filePath: 'src/lib/financeMath.ts',
    functionName: 'calculateYearsToTargetWealth(current, target, monthly, realRate)',
    timeComplexity: 'O(log N) - Resolução analítica por logaritmos naturais',
    spaceComplexity: 'O(1) - Variáveis primitivas',
    mathematicalFormula: 'n = \\frac{\\ln\\left(\\frac{FV \\cdot i + PMT}{PV \\cdot i + PMT}\\right)}{\\ln(1 + i)}, \\quad Target = Despesas_{anuais} \\times 25',
    isoStandard: 'ISO/IEC 25010 (Modelagem Atuarial de Longo Prazo)',
    nielsenHeuristic: 'Heurística #1 (Visibilidade do Status) & #7 (Eficiência)',
    summary: 'Aplica a Regra de Trinity (saque perpétuo de 4% a.a.) para calcular o capital gerador de renda passiva e deduz analiticamente o tempo exato em anos até a meta.',
    inputs: [
      { name: 'current', type: 'number', desc: 'Patrimônio acumulado atual (R$)' },
      { name: 'target', type: 'number', desc: 'Meta de patrimônio gerador de renda (R$)' },
      { name: 'monthly', type: 'number', desc: 'Aporte poupado mensalmente (R$)' },
      { name: 'realRate', type: 'number', desc: 'Taxa de juros real anual líquida acima da inflação (% a.a.)' }
    ],
    outputs: [
      { name: 'yearsToTarget', type: 'number', desc: 'Anos necessários até atingir o capital' },
      { name: 'monthlyPassiveIncome', type: 'number', desc: 'Renda mensal perpétua assegurada (4% a.a.)' }
    ],
    nodes: [
      { id: 'fi_in', type: 'start', label: '1. Ingestão de Metas & Aportes', description: 'Carrega patrimônio inicial, meta e taxa de retorno real líquida.', codeSnippet: 'const pv = Math.max(0, current);\nconst fv = Math.max(pv, target);\nconst pmt = Math.max(0, monthly);\nconst i = Math.pow(1 + realRate / 100, 1/12) - 1;', x: 50, y: 50, connectsTo: [{ targetId: 'fi_pv_check' }] },
      { id: 'fi_pv_check', type: 'decision', label: '2. Já Atingiu a Meta?', description: 'Se o patrimônio atual for maior ou igual à meta, tempo restante é zero.', codeSnippet: 'if (pv >= fv) return 0;', x: 280, y: 50, connectsTo: [{ targetId: 'fi_zero', label: 'Sim' }, { targetId: 'fi_log_calc', label: 'Não' }] },
      { id: 'fi_zero', type: 'output', label: 'Independente', description: 'Usuário já atingiu a autonomia financeira.', codeSnippet: 'return { years: 0, months: 0 };', x: 280, y: 170 },
      { id: 'fi_log_calc', type: 'process', label: '3. Dedução Logarítmica', description: 'Aplica fórmula atuarial fechada sem necessidade de loops lentos.', codeSnippet: 'const num = Math.log((fv * i + pmt) / (pv * i + pmt));\nconst den = Math.log(1 + i);\nconst months = num / den;', x: 520, y: 50, connectsTo: [{ targetId: 'fi_trinity' }] },
      { id: 'fi_trinity', type: 'security', label: '4. Cálculo da Renda Perpétua', description: 'Dimensiona retirada segura fiduciária de 4% ao ano (Regra de Trinity).', codeSnippet: 'const passiveMonthly = (fv * 0.04) / 12;', x: 760, y: 50, connectsTo: [{ targetId: 'fi_out' }] },
      { id: 'fi_out', type: 'output', label: '5. Projeção de Independência', description: 'Emite anos e meses exatos restantes com renda passiva perpétua garantida.', codeSnippet: 'return { years: months / 12, passiveMonthly };', x: 1000, y: 50 }
    ],
    rawSourceCode: `export function calculateYearsToTargetWealth(current: number, target: number, monthly: number, realRate: number) {\n  if (current >= target) return 0;\n  const i = Math.pow(1 + realRate / 100, 1 / 12) - 1;\n  if (i <= 0) return (target - current) / (monthly * 12);\n  const months = Math.log((target * i + monthly) / (current * i + monthly)) / Math.log(1 + i);\n  return Math.max(0, months / 12);\n}`
  },

  // 10. Teoria Moderna de Portfólio (MPT de Markowitz) & Alocação Institucional
  {
    id: 'mpt_asset_allocation',
    title: 'Teoria Moderna de Portfólio (MPT de Markowitz) & Alocação Institucional',
    category: 'financeMath',
    categoryLabel: 'Motores Matemáticos & Atuariais',
    filePath: 'src/lib/financeMath.ts',
    functionName: 'calculateAssetAllocation(modelId, totalCapital)',
    timeComplexity: 'O(K) - K = número de classes de ativos da estratégia (K <= 10)',
    spaceComplexity: 'O(K) - Vetor de distribuição monetária exata',
    mathematicalFormula: '\\max \\frac{E(R_p) - R_f}{\\sigma_p}, \\quad \\sigma_p = \\sqrt{\\sum_i \\sum_j w_i w_j \\sigma_{ij}}, \\quad \\sum w_i = 1',
    isoStandard: 'ISO/IEC 25010 & Padrão Institucional High Net Worth (CVM/Anbima)',
    nielsenHeuristic: 'Heurística #4 (Consistência e Padrões)',
    summary: 'Distribui o capital em classes descorrelacionadas (Ações Globais, Renda Fixa Soberana, Inflação Longa, Ouro, Commodities) maximizando o Índice de Sharpe e blindando contra cauda.',
    inputs: [
      { name: 'modelId', type: 'string', desc: 'Modelo institucional (All Weather, Swensen Yale, Harry Browne, 60/40)' },
      { name: 'totalCapital', type: 'number', desc: 'Montante monetário total a ser alocado (R$)' }
    ],
    outputs: [
      { name: 'allocatedAssets', type: 'array', desc: 'Vetor com pesos, valores exatos e instrumentos' },
      { name: 'expectedSharpe', type: 'number', desc: 'Relação risco/retorno estimada' }
    ],
    nodes: [
      { id: 'mpt_in', type: 'start', label: '1. Seleção do Modelo Fiduciário', description: 'Carrega pesos percentuais do portfólio de referência selecionado.', codeSnippet: 'const strategy = INSTITUTIONAL_STRATEGIES.find(s => s.id === modelId);\nconst capital = Math.max(1000, totalCapital);', x: 50, y: 50, connectsTo: [{ targetId: 'mpt_distrib' }] },
      { id: 'mpt_distrib', type: 'process', label: '2. Ponderação & Alocação Nominal', description: 'Calcula montante exato por classe: amount_k = capital * (weight_k / 100).', codeSnippet: 'const assets = strategy.assets.map(a => ({\n  ...a,\n  amount: (capital * a.percentage) / 100\n}));', x: 280, y: 50, connectsTo: [{ targetId: 'mpt_rebalance_check' }] },
      { id: 'mpt_rebalance_check', type: 'decision', label: '3. Banda de Rebalanceamento?', description: 'Define gatilhos de rebalanceamento (ex: banda de 5% ou semestral) para evitar drift de risco.', codeSnippet: 'const bandTrigger = strategy.rebalanceBand;', x: 520, y: 50, connectsTo: [{ targetId: 'mpt_instruments' }] },
      { id: 'mpt_instruments', type: 'security', label: '4. Mapeamento de Instrumentos', description: 'Atribui ETFs, títulos públicos federais e contratos para execução no Brasil e no exterior.', codeSnippet: 'assignPracticalInstruments(assets);', x: 760, y: 50, connectsTo: [{ targetId: 'mpt_out' }] },
      { id: 'mpt_out', type: 'output', label: '5. Blueprint Institucional', description: 'Renderiza gráfico Donut, tabela de execução com alíquotas fiscais e liquidez.', codeSnippet: 'return { assets, sharpe: strategy.sharpeEstimate };', x: 1000, y: 50 }
    ],
    rawSourceCode: `export function calculateAssetAllocation(strategyId: string, capital: number) {\n  const strat = INSTITUTIONAL_STRATEGIES.find(s => s.id === strategyId) || INSTITUTIONAL_STRATEGIES[0];\n  return strat.assets.map(asset => ({\n    name: asset.name,\n    percentage: asset.percentage,\n    amount: (capital * asset.percentage) / 100,\n    color: asset.color,\n    instruments: asset.recommendedInstruments\n  }));\n}`
  },

  // 11. AtomicErrorBoundary do React 19
  {
    id: 'atomic_error_boundary_react',
    title: 'Ciclo de Vida de Contenção de Falha (AtomicErrorBoundary)',
    category: 'selfHealing',
    categoryLabel: 'Autocura & Tolerância a Falhas',
    filePath: 'src/components/AtomicErrorBoundary.tsx',
    functionName: 'componentDidCatch(error, errorInfo)',
    timeComplexity: 'O(1) - Captura assíncrona',
    spaceComplexity: 'O(1) - Estado interno de rollback',
    mathematicalFormula: '\\text{State}(t) = \\begin{cases} \\text{ActiveComponent}, & \\text{se } err = \\emptyset \\\\ \\text{GracefulRollback(15s)}, & \\text{se } err \\neq \\emptyset \\end{cases}',
    isoStandard: 'ISO/IEC 25010 (Confiabilidade & Recuperabilidade)',
    nielsenHeuristic: 'Heurística #5 (Prevenção de Erros) & #9 (Recuperação de Erros)',
    summary: 'Garante que se um componente visual falhar, ele não provoque tela branca nem derrube o restante da página, preservando dados digitados e restaurando a estabilidade em 15 segundos.',
    inputs: [
      { name: 'error', type: 'Error', desc: 'Objeto de exceção lançado pelo ciclo de renderização' },
      { name: 'capturedInputs', type: 'object', desc: 'Dados parciais digitados pelo investidor' }
    ],
    outputs: [
      { name: 'hasError', type: 'boolean', desc: 'Flag de contenção atômica' },
      { name: 'autoRecoveredState', type: 'object', desc: 'Estado estável restaurado automaticamente' }
    ],
    nodes: [
      { id: 'eb_start', type: 'start', label: '1. Renderização de Subárvore', description: 'Monitora o ciclo de montagem e atualização dos nós filhos no React 19.', codeSnippet: '<AtomicErrorBoundary moduleName="Diagnóstico"> ... </AtomicErrorBoundary>', x: 50, y: 50, connectsTo: [{ targetId: 'eb_detect' }] },
      { id: 'eb_detect', type: 'decision', label: '2. Lançou Exceção no Ciclo?', description: 'Intercepta falha em getDerivedStateFromError.', codeSnippet: 'static getDerivedStateFromError(error) { return { hasError: true }; }', x: 280, y: 50, connectsTo: [{ targetId: 'eb_ok', label: 'Não' }, { targetId: 'eb_isolate', label: 'Sim' }] },
      { id: 'eb_ok', type: 'output', label: 'Renderização Íntegra', description: 'DOM montado e reativo sem intervenção.', codeSnippet: 'return this.props.children;', x: 280, y: 170 },
      { id: 'eb_isolate', type: 'fallback', label: '3. Encapsulamento & Freeze', description: 'Congela subárvore com falha e preserva variáveis de entrada recebidas.', codeSnippet: 'this.setState({ capturedState: this.props.capturedInputs });', x: 520, y: 50, connectsTo: [{ targetId: 'eb_timer' }] },
      { id: 'eb_timer', type: 'security', label: '4. Regressiva de 15 Segundos', description: 'Inicia contador regressivo de 15s com mensagem: "O contratempo foi sanado com sucesso".', codeSnippet: 'setInterval(() => setCountdown(c => c - 1), 1000);', x: 760, y: 50, connectsTo: [{ targetId: 'eb_restore' }] },
      { id: 'eb_restore', type: 'output', label: '5. Restauração Automática', description: 'Reinicia o módulo na versão estável preservando os campos preenchidos.', codeSnippet: 'this.props.onAutoRecover(snapshot); this.setState({ hasError: false });', x: 1000, y: 50 }
    ],
    rawSourceCode: `export class AtomicErrorBoundary extends Component {\n  componentDidCatch(error: Error, errorInfo: any) {\n    const snapshot = getLastStableSnapshot(this.props.moduleName);\n    reportDiagnosedError({ module: this.props.moduleName, error: error.message });\n    setTimeout(() => {\n      this.props.onAutoRecover?.(snapshot);\n      this.setState({ hasError: false });\n    }, 15000);\n  }\n}`
  },

  // 12. Controle Temporal de Acesso (TBAC)
  {
    id: 'time_based_access_control',
    title: 'Controle de Acesso Temporal Fiduciário (TBAC - Time-Based Access Control)',
    category: 'securityAudit',
    categoryLabel: 'Criptografia & Ledger Imutável',
    filePath: 'src/lib/securityAudit.ts',
    functionName: 'isOperationPermittedInTimeWindow()',
    timeComplexity: 'O(1) - Cálculo modular temporal',
    spaceComplexity: 'O(1) - Variáveis de fuso em memória',
    mathematicalFormula: '660 \\le (\\text{UTC}_{horas} \\cdot 60 + \\text{UTC}_{min} - 180) \\le 825 \\implies \\text{Permitido}',
    isoStandard: 'ISO/IEC 27001 (A.9.4 Restrição de Acesso a Informações Sensíveis)',
    nielsenHeuristic: 'Heurística #5 (Prevenção de Erros Graves Fora de Expediente)',
    summary: 'Impede operações administrativas sensíveis fora da janela de governança autorizada (11:00 às 13:45 BRT / Horário de Brasília), mitigando vazamento de credenciais fora do horário vigiado.',
    inputs: [
      { name: 'currentUtcTimestamp', type: 'string', desc: 'Carimbo de data/hora atual emitido pelo servidor' }
    ],
    outputs: [
      { name: 'isAllowed', type: 'boolean', desc: 'Autorização temporal concedida ou recusada' },
      { name: 'timeRemaining', type: 'string', desc: 'Minutos restantes na janela vigente' }
    ],
    nodes: [
      { id: 'tbac_in', type: 'start', label: '1. Requisição Administrativa', description: 'Requisitante tenta mutação crítica no sistema de segurança.', codeSnippet: 'const now = new Date();\nconst utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();', x: 50, y: 50, connectsTo: [{ targetId: 'tbac_norm' }] },
      { id: 'tbac_norm', type: 'process', label: '2. Normalização Fuso BRT (UTC-3)', description: 'Subtrai 180 minutos de UTC de forma absoluta para blindar contra desvios de NTP.', codeSnippet: 'let brtMinutes = (utcMinutes - 180 + 1440) % 1440;', x: 280, y: 50, connectsTo: [{ targetId: 'tbac_window' }] },
      { id: 'tbac_window', type: 'decision', label: '3. 11:00 <= BRT <= 13:45?', description: 'Verifica se o minuto do dia está no intervalo fiduciário restrito [660, 825].', codeSnippet: 'if (brtMinutes >= 660 && brtMinutes <= 825) { ... }', x: 520, y: 50, connectsTo: [{ targetId: 'tbac_permit', label: 'Sim' }, { targetId: 'tbac_block', label: 'Não' }] },
      { id: 'tbac_permit', type: 'security', label: '4A. Acesso Concedido', description: 'Registra autorização no ledger e processa mutação.', codeSnippet: 'recordSecurityEvent("TBAC_PERMITTED", "LOW", "MUTATION_PROCESSED");', x: 760, y: 50, connectsTo: [{ targetId: 'tbac_out' }] },
      { id: 'tbac_block', type: 'fallback', label: '4B. Bloqueio Fail-Closed', description: 'Recusa com HTTP 403 e registra tentativa anômala fora de expediente.', codeSnippet: 'recordSecurityEvent("TBAC_VIOLATION", "HIGH", "OUT_OF_WINDOW_ATTEMPT");', x: 520, y: 170, connectsTo: [{ targetId: 'tbac_out' }] },
      { id: 'tbac_out', type: 'output', label: '5. Resposta Fiduciária', description: 'Retorna autorização ou rejeição protegendo o patrimônio corporativo.', codeSnippet: 'return { isPermitted, window: "11:00 - 13:45 BRT" };', x: 1000, y: 50 }
    ],
    rawSourceCode: `export function isOperationPermittedInTimeWindow() {\n  const now = new Date();\n  const utcHours = now.getUTCHours();\n  const utcMinutes = now.getUTCMinutes();\n  const brtTotalMinutes = ((utcHours * 60 + utcMinutes - 180) + 1440) % 1440;\n  // 11:00 = 660 minutos | 13:45 = 825 minutos\n  return brtTotalMinutes >= 660 && brtTotalMinutes <= 825;\n}`
  },

  // 13. Pipeline de Sincronização Unidirecional de Estado (React Context API)
  {
    id: 'unidirectional_context_sync',
    title: 'Pipeline de Sincronização Unidirecional de Estado (React Context API)',
    category: 'concurrency',
    categoryLabel: 'Concorrência & Pipeline de Dados',
    filePath: 'src/context/FinancialDataContext.tsx',
    functionName: 'syncAllCalculators(surplusPayload)',
    timeComplexity: 'O(1) - Notificação pub/sub reativa',
    spaceComplexity: 'O(1) - Estado compartilhado único na raiz',
    mathematicalFormula: '\\Delta \\text{Estado}_{global} \\to \\text{Dispatch}(\\text{Context}) \\to \\prod_{k=1}^6 \\text{Recalculate}_k',
    isoStandard: 'ISO/IEC 25010 (Consistência & Integridade de Estado)',
    nielsenHeuristic: 'Heurística #4 (Consistência e Padrões) & #1 (Visibilidade)',
    summary: 'Propaga atualizações de renda, despesas, aportes e patrimônio entre Diagnóstico, Juros Compostos, Reserva, Dívidas e Alocação IA sem dependência circular.',
    inputs: [
      { name: 'income', type: 'number', desc: 'Renda mensal atualizada' },
      { name: 'expenses', type: 'number', desc: 'Despesas correntes atualizadas' }
    ],
    outputs: [
      { name: 'synchronizedContext', type: 'FinancialDataState', desc: 'Contexto global pronto para todas as ferramentas' }
    ],
    nodes: [
      { id: 'ctx_in', type: 'start', label: '1. Evento de Input no Formulário', description: 'Investidor altera valor de campo em qualquer uma das calculadoras.', codeSnippet: 'onChange={(e) => setIncome(safeMonetaryInput(e.target.value))}', x: 50, y: 50, connectsTo: [{ targetId: 'ctx_sanitize' }] },
      { id: 'ctx_sanitize', type: 'process', label: '2. Sanitização & Imutabilidade', description: 'Garante tipo numérico positivo válido eliminando injection de strings.', codeSnippet: 'const cleanVal = Math.max(0, Number(val) || 0);', x: 280, y: 50, connectsTo: [{ targetId: 'ctx_dispatch' }] },
      { id: 'ctx_dispatch', type: 'process', label: '3. Reducer Dispatch Unidirecional', description: 'Atualiza o nó raiz do React Context disparando re-render apenas nos dependentes.', codeSnippet: 'dispatch({ type: "SET_FINANCIAL_METRICS", payload: { income: cleanVal } });', x: 520, y: 50, connectsTo: [{ targetId: 'ctx_debounce' }] },
      { id: 'ctx_debounce', type: 'security', label: '4. Debounce LocalStorage (500ms)', description: 'Persiste no navegador de forma amortecida sem travar o event loop da UI.', codeSnippet: 'debounce(() => localStorage.setItem("zyc_income", cleanVal), 500);', x: 760, y: 50, connectsTo: [{ targetId: 'ctx_out' }] },
      { id: 'ctx_out', type: 'output', label: '5. Motores Recalculados em O(1)', description: 'Juros, Reserva e Dívidas atualizam montantes instantaneamente.', codeSnippet: 'window.dispatchEvent(new CustomEvent("zyc_data_synced"));', x: 1000, y: 50 }
    ],
    rawSourceCode: `export function useFinancialDataSync() {\n  const { state, dispatch } = useContext(FinancialDataContext);\n  const updateMetric = (key: string, value: number) => {\n    const safe = Math.max(0, Number(value) || 0);\n    dispatch({ type: 'UPDATE_FIELD', key, value: safe });\n    try { localStorage.setItem('zyc_' + key, String(safe)); } catch {}\n  };\n  return { state, updateMetric };\n}`
  },

  // 14. Algoritmo SingleFlight de Concorrência
  {
    id: 'single_flight_concurrency',
    title: 'Deduplicação de Requisições Concorrentes (SingleFlight Pattern)',
    category: 'concurrency',
    categoryLabel: 'Concorrência & Pipeline de Dados',
    filePath: 'src/services/zyconomesEngine.ts',
    functionName: 'singleFlight<T>(key, fetcherFn)',
    timeComplexity: 'O(1) - Lookup em Map hash em memória',
    spaceComplexity: 'O(P) - P = promessas em trânsito simultâneo',
    mathematicalFormula: 'N \\text{ chamadas com chave } K \\implies 1 \\text{ execução física no banco } + N-1 \\text{ assinantes}',
    isoStandard: 'ISO/IEC 25010 (Eficiência de Desempenho & Concorrência)',
    nielsenHeuristic: 'Heurística #1 (Visibilidade do Status do Sistema)',
    summary: 'Agrupa requisições simultâneas com a mesma chave em uma única execução de I/O em voo, prevenindo tempestades de cache (cache stampede) e exaustão do pool de conexões do PostgreSQL.',
    inputs: [
      { name: 'key', type: 'string', desc: 'Identificador único da operação concorrente' },
      { name: 'fetcherFn', type: '() => Promise<T>', desc: 'Função executora pesada de banco ou cálculo' }
    ],
    outputs: [
      { name: 'result', type: 'Promise<T>', desc: 'Promessa resolvida compartilhada por todos os chamadores' }
    ],
    nodes: [
      { id: 'sf_in', type: 'start', label: '1. Requisição Concorrente', description: 'Requisição chega via HTTP ou clique duplo do investidor.', codeSnippet: 'singleFlight("calc:user:123", () => executeHeavyMonteCarlo());', x: 50, y: 50, connectsTo: [{ targetId: 'sf_check' }] },
      { id: 'sf_check', type: 'decision', label: '2. Chave já em Voo (In-Flight)?', description: 'Verifica existência no Map de promessas ativas em memória.', codeSnippet: 'if (inFlightMap.has(key)) return inFlightMap.get(key);', x: 280, y: 50, connectsTo: [{ targetId: 'sf_subscribe', label: 'Sim' }, { targetId: 'sf_create', label: 'Não' }] },
      { id: 'sf_subscribe', type: 'process', label: '3A. Anexar à Promessa Existente', description: 'Não executa nova consulta ao banco; aguarda a resposta da chamada em curso.', codeSnippet: 'return activePromise; // Zero consultas extras ao banco', x: 280, y: 170, connectsTo: [{ targetId: 'sf_out' }] },
      { id: 'sf_create', type: 'security', label: '3B. Iniciar Nova Execução & Travar', description: 'Cria promessa, registra no Map e executa consulta física única no PostgreSQL.', codeSnippet: 'const promise = fetcherFn().finally(() => inFlightMap.delete(key));\ninFlightMap.set(key, promise);', x: 520, y: 50, connectsTo: [{ targetId: 'sf_cleanup' }] },
      { id: 'sf_cleanup', type: 'process', label: '4. Resolução & Limpeza de Trava', description: 'Descarrega resultado, remove chave do Map e libera memória.', codeSnippet: 'inFlightMap.delete(key); return data;', x: 760, y: 50, connectsTo: [{ targetId: 'sf_out' }] },
      { id: 'sf_out', type: 'output', label: '5. Retorno Consistente', description: 'Todas as requisições paralelas recebem o mesmo resultado idêntico.', codeSnippet: 'return resolvedData;', x: 1000, y: 50 }
    ],
    rawSourceCode: `const inFlight = new Map<string, Promise<any>>();\nexport function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {\n  if (inFlight.has(key)) {\n    return inFlight.get(key)!;\n  }\n  const promise = fn().finally(() => inFlight.delete(key));\n  inFlight.set(key, promise);\n  return promise;\n}`
  },

  // 15. Dimensionamento de Reserva de Emergência
  {
    id: 'emergency_reserve_math',
    title: 'Dimensionamento Dinâmico de Reserva de Emergência Fiduciária',
    category: 'financeMath',
    categoryLabel: 'Motores Matemáticos & Atuariais',
    filePath: 'src/lib/financeMath.ts',
    functionName: 'calculateEmergencyReserveTarget(essentialExpenses, stabilityFactor)',
    timeComplexity: 'O(1) - Tempo constante',
    spaceComplexity: 'O(1) - Variáveis numéricas',
    mathematicalFormula: '\\text{Reserva}_{alvo} = D_{essencial} \\cdot (6 \\text{ a } 12) \\cdot F_{estabilidade}',
    isoStandard: 'ISO/IEC 25010 & Princípios de Gestão de Risco Pessoal',
    nielsenHeuristic: 'Heurística #1 (Visibilidade do Status) & #8 (Design Minimalista)',
    summary: 'Determina o colchão de segurança patrimonial recomendando de 6 a 12 meses de custos essenciais ponderados pela estabilidade do fluxo de renda (CLT vs PJ/Autônomo).',
    inputs: [
      { name: 'essentialExpenses', type: 'number', desc: 'Despesas mensais vitais de sobrevivência (R$)' },
      { name: 'stabilityFactor', type: 'number', desc: 'Fator de risco ocupacional (CLT = 6 meses; Autônomo/PJ = 12 meses)' }
    ],
    outputs: [
      { name: 'targetFund', type: 'number', desc: 'Montante monetário exato a ser mantido em liquidez diária pura' },
      { name: 'monthsCovered', type: 'number', desc: 'Tempo de subsistência total' }
    ],
    nodes: [
      { id: 're_in', type: 'start', label: '1. Ingestão de Custos Vitais', description: 'Carrega gastos essenciais de sobrevivência e estabilidade do fluxo de renda.', codeSnippet: 'const expense = safeNumber(essentialExpenses);\nconst months = isFreelance ? 12 : 6;', x: 50, y: 50, connectsTo: [{ targetId: 're_calc' }] },
      { id: 're_calc', type: 'process', label: '2. Multiplicação Fiduciária', description: 'Calcula montante alvo: Target = Despesas * Meses Recomendados.', codeSnippet: 'const target = expense * months;', x: 280, y: 50, connectsTo: [{ targetId: 're_alloc' }] },
      { id: 're_alloc', type: 'security', label: '3. Diretriz de Alocação Segura', description: 'Impõe restrição estrita: 100% em ativos pós-fixados soberanos com liquidez D+0 (Tesouro Selic / CDB DI).', codeSnippet: 'const assetRecommendation = "Tesouro Selic D+0 ou CDB 100% CDI Líquido";', x: 520, y: 50, connectsTo: [{ targetId: 're_out' }] },
      { id: 're_out', type: 'output', label: '4. Meta de Segurança Blindada', description: 'Exibe meta monetária e progresso atual do investidor.', codeSnippet: 'return { target, monthsRecommended: months };', x: 760, y: 50 }
    ],
    rawSourceCode: `export function calculateEmergencyReserveTarget(essentialExpenses: number, isFreelance = false) {\n  const months = isFreelance ? 12 : 6;\n  const safeExp = Math.max(0, Number(essentialExpenses) || 0);\n  return {\n    monthsRecommended: months,\n    targetAmount: safeExp * months,\n    instrument: 'Tesouro Selic D+0'\n  };\n}`
  },

  // 16. Verificação Exata de Inputs e Blindagem Anti-Injeção
  {
    id: 'exact_input_verification',
    title: 'Verificação Exata de Inputs e Blindagem Anti-Injeção de Comandos/Scripts',
    category: 'securityAudit',
    categoryLabel: 'Auditoria, Criptografia & Segurança',
    filePath: 'src/lib/inputEncapsulator.ts',
    functionName: 'verifyExactInput(rawValue, fieldId, fallback, min, max)',
    timeComplexity: 'O(K) - Comparação linear de padrões regex e filtragem in-place',
    spaceComplexity: 'O(1) - Sanitização local sem alocação dinâmica de heap',
    mathematicalFormula: '\\text{Sanitize}(X) = \\text{Clamp}(\\text{Parse}(\\text{FilterNonDigits}(\\text{Inspect}(X))), [\\min, \\max])',
    isoStandard: 'ISO/IEC 27001 (A.14) & ISO/IEC 25010 (Confiabilidade & Segurança)',
    nielsenHeuristic: 'Heurística #5 (Prevenção de Erros) & #9 (Recuperação Graciosa)',
    summary: 'Compara minuciosamente cada input do usuário contra assinaturas de scripts (XSS), comandos de terminal shell, injeções SQL e caracteres proibidos, neutralizando tentativas de ataque sem travar ou interromper a aplicação.',
    inputs: [
      { name: 'rawValue', type: 'any', desc: 'Entrada bruta digitada ou colada pelo usuário no campo' },
      { name: 'fieldId', type: 'string', desc: 'Identificador do campo financeiro (ex: income, expenses)' },
      { name: 'fallbackDefault', type: 'number', desc: 'Valor padrão fiduciário em caso de entrada nula ou hostil' }
    ],
    outputs: [
      { name: 'sanitizedValue', type: 'number', desc: 'Valor numérico validado e restrito aos limites seguros' },
      { name: 'hasCommandOrScriptThreat', type: 'boolean', desc: 'Flag indicando se comando ou script foi detectado e neutralizado' },
      { name: 'feedbackMessage', type: 'string', desc: 'Mensagem informativa não-bloqueante para a interface' }
    ],
    nodes: [
      { id: 'inp_in', type: 'start', label: '1. Ingestão do Input', description: 'Recebe o valor bruto digitado ou colado no campo pelo usuário.', codeSnippet: 'const rawString = String(rawValue);', x: 50, y: 50, connectsTo: [{ targetId: 'inp_threat_check' }] },
      { id: 'inp_threat_check', type: 'decision', label: '2. Contém Comandos/Scripts?', description: 'Compara contra assinaturas XSS, Shell, SQL injection e code execution.', codeSnippet: 'const threatCheck = inspectForCommandsAndScripts(rawString);', x: 280, y: 50, connectsTo: [{ targetId: 'inp_block', label: 'Sim' }, { targetId: 'inp_filter', label: 'Não' }] },
      { id: 'inp_block', type: 'fallback', label: 'Bloqueio & Registro de Incidente', description: 'Registra a ameaça na base de auditoria e despacha aviso não-intrusivo para a UI.', codeSnippet: 'recordLocalOperationalIncident({ fieldId, errorReason: "Ameaça neutralizada" });', x: 280, y: 170, connectsTo: [{ targetId: 'inp_filter' }] },
      { id: 'inp_filter', type: 'process', label: '3. Filtro Estrito de Dígitos', description: 'Remove todos os caracteres que não sejam dígitos 0-9 e pontuação monetária.', codeSnippet: 'const cleanNumeric = rawString.replace(/[^0-9.,]/g, "").replace(",", ".");', x: 540, y: 50, connectsTo: [{ targetId: 'inp_clamp' }] },
      { id: 'inp_clamp', type: 'security', label: '4. Clamping de Limites Fiduciários', description: 'Garante que o número permaneça no intervalo matematicamente válido [min, max].', codeSnippet: 'const clamped = Math.max(min, Math.min(max, parsed));', x: 780, y: 50, connectsTo: [{ targetId: 'inp_out' }] },
      { id: 'inp_out', type: 'output', label: '5. Valor Seguro para os Motores', description: 'Retorna o número puro para as fórmulas financeiras com estabilidade garantida.', codeSnippet: 'return { sanitizedValue: clamped, wasSanitized: true };', x: 1020, y: 50 }
    ],
    rawSourceCode: `export function verifyExactInput(rawValue, fieldId = 'unknown', fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {\n  const rawString = String(rawValue || '');\n  const threatCheck = inspectForCommandsAndScripts(rawString);\n  const cleanNumeric = rawString.replace(/<[^>]*>/g, '').replace(/[^0-9.,]/g, '').replace(',', '.');\n  const num = parseFloat(cleanNumeric);\n  const parsed = Number.isNaN(num) ? fallback : num;\n  const clamped = Math.max(min, Math.min(max, parsed));\n  if (threatCheck.hasThreat) {\n    recordLocalOperationalIncident({ fieldId, receivedParam: rawString, sanitizedParam: String(clamped) });\n  }\n  return { sanitizedValue: clamped, hasCommandOrScriptThreat: threatCheck.hasThreat };\n}`
  }
];

export const AlgorithmFlowchartEngine: React.FC = () => {
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('cashflow_diagnostics');
  const [activeTab, setActiveTab] = useState<'flowchart' | 'code' | 'mermaid' | 'specs'>('flowchart');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Simulador de execução passo-a-passo
  const [simulatingNodeIndex, setSimulatingNodeIndex] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<FlowchartNode | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const filteredAlgorithms = useMemo(() => {
    return ALGORITHM_REGISTRY.filter(algo => {
      const matchesCategory = filterCategory === 'all' || algo.category === filterCategory;
      const matchesSearch = algo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            algo.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            algo.functionName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchTerm]);

  const currentAlgorithm = useMemo(() => {
    return ALGORITHM_REGISTRY.find(a => a.id === selectedAlgoId) || ALGORITHM_REGISTRY[0];
  }, [selectedAlgoId]);

  // Execução interativa passo a passo
  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulatingNodeIndex(0);
    setSelectedNodeDetails(currentAlgorithm.nodes[0]);

    currentAlgorithm.nodes.forEach((_, idx) => {
      setTimeout(() => {
        setSimulatingNodeIndex(idx);
        setSelectedNodeDetails(currentAlgorithm.nodes[idx]);
        if (idx === currentAlgorithm.nodes.length - 1) {
          setTimeout(() => {
            setIsSimulating(false);
          }, 800);
        }
      }, (idx + 1) * 750);
    });
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulatingNodeIndex(null);
    setSelectedNodeDetails(null);
  };

  // Gerador dinâmico de sintaxe Mermaid.js
  const mermaidSyntax = useMemo(() => {
    let code = 'graph TD\n';
    currentAlgorithm.nodes.forEach(node => {
      const shape = node.type === 'decision' ? `{${node.label}}` :
                    node.type === 'start' ? `([${node.label}])` :
                    node.type === 'output' ? `[[${node.label}]]` :
                    node.type === 'security' ? `[(${node.label})]` :
                    `[${node.label}]`;
      code += `  ${node.id}${shape}\n`;
      if (node.connectsTo) {
        node.connectsTo.forEach(conn => {
          if (conn.label) {
            code += `  ${node.id} -->|${conn.label}| ${conn.targetId}\n`;
          } else {
            code += `  ${node.id} --> ${conn.targetId}\n`;
          }
        });
      }
    });
    return code;
  }, [currentAlgorithm]);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportSvg = () => {
    const svgElement = document.getElementById('zyconomes-flowchart-svg');
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fluxograma_${currentAlgorithm.id}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="fluxogramas" className="py-20 bg-zinc-50 dark:bg-[#0a0a0a] border-t border-zinc-200 dark:border-zinc-800 transition-colors scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CABEÇALHO DA SEÇÃO DE ENGENHARIA */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1A1F71]/10 dark:bg-sky-950/60 text-[#1A1F71] dark:text-sky-400 border border-[#1A1F71]/20 dark:border-sky-800/50 rounded-full text-xs font-bold uppercase tracking-wider mb-4 transition-colors">
            <Workflow className="w-3.5 h-3.5" />
            <span>Engenharia de Software & Compilador de Algoritmos</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            Fluxogramas dos <span className="text-[#1A1F71] dark:text-sky-400 dark:drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]">Algoritmos.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 font-light leading-relaxed">
            Mapeamento analítico e computacional de todos os algoritmos que compõem o ecossistema Zyconomes. Visualização estrita de ingestão de dados, pontos de decisão, isolamento de exceção e garantias de estabilidade contínua.
          </p>
        </div>

        {/* BARRA DE FILTROS & PESQUISA */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Todos os Módulos' },
              { id: 'financeMath', label: 'Motores Atuariais (financeMath.ts)' },
              { id: 'selfHealing', label: 'Autocura (selfHealingEngine.ts)' },
              { id: 'securityAudit', label: 'Ledger Imutável (securityAudit.ts)' },
              { id: 'aiAgent', label: 'Agente IA 15 Anos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === tab.id
                    ? 'bg-[#1A1F71] dark:bg-sky-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar algoritmo ou arquivo..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* CONTAINER PRINCIPAL (GRID: SELETOR LATERAL + VISUALIZADOR DE FLUXOGRAMA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: LISTA DE ALGORITMOS */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
              Catálogo de Algoritmos ({filteredAlgorithms.length})
            </div>

            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredAlgorithms.map(algo => {
                const isSelected = algo.id === currentAlgorithm.id;
                return (
                  <button
                    key={algo.id}
                    onClick={() => {
                      setSelectedAlgoId(algo.id);
                      resetSimulation();
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1A1F71] dark:border-sky-500 bg-white dark:bg-zinc-900 shadow-md ring-2 ring-[#1A1F71]/10 dark:ring-sky-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                          {algo.filePath}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {algo.timeComplexity.split('-')[0]}
                        </span>
                      </div>
                      <h4 className={`text-sm font-bold leading-snug ${isSelected ? 'text-[#1A1F71] dark:text-sky-400' : 'text-zinc-900 dark:text-white'}`}>
                        {algo.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                        {algo.summary}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="font-mono">{algo.nodes.length} nós no fluxograma</span>
                      <span className="flex items-center gap-1 font-bold text-xs text-[#1A1F71] dark:text-sky-400">
                        Inspecionar <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUNA DIREITA: CANVAS DO FLUXOGRAMA & CONTROLES */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD SUPERIOR DE METADADOS DO ALGORITMO ATIVO */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1A1F71] dark:text-sky-400">
                      {currentAlgorithm.categoryLabel}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {currentAlgorithm.functionName}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    {currentAlgorithm.title}
                  </h3>
                </div>

                {/* BOTÕES DE CONTROLE & SIMULAÇÃO */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="bg-[#1A1F71] dark:bg-sky-600 hover:bg-[#121652] dark:hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isSimulating ? 'Executando...' : 'Compilar & Simular Fluxo'}</span>
                  </button>
                  <button
                    onClick={resetSimulation}
                    title="Resetar Simulação"
                    className="p-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleExportSvg}
                    title="Exportar Fluxograma em SVG"
                    className="p-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* METADADOS DE ENGENHARIA (COMPLEXIDADE, FÓRMULA, ISO) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider block mb-1 text-[10px]">Complexidade Assintótica</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{currentAlgorithm.timeComplexity}</span>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{currentAlgorithm.spaceComplexity}</div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider block mb-1 text-[10px]">Fórmula Determinística</span>
                  <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 break-all">{currentAlgorithm.mathematicalFormula}</span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider block mb-1 text-[10px]">Conformidade & Heurística</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block">{currentAlgorithm.isoStandard.split('(')[0]}</span>
                  <div className="text-[11px] text-zinc-500 truncate">{currentAlgorithm.nielsenHeuristic}</div>
                </div>
              </div>
            </div>

            {/* ABAS DO VISUALIZADOR (FLUXOGRAMA SVG / CÓDIGO FONTE / MERMAID / CONTRATOS) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 bg-zinc-50 dark:bg-zinc-950/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('flowchart')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'flowchart'
                        ? 'bg-[#1A1F71] dark:bg-sky-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Fluxograma Interativo SVG
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'code'
                        ? 'bg-[#1A1F71] dark:bg-sky-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Código-Fonte TypeScript
                  </button>
                  <button
                    onClick={() => setActiveTab('mermaid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'mermaid'
                        ? 'bg-[#1A1F71] dark:bg-sky-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Sintaxe Mermaid.js
                  </button>
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'specs'
                        ? 'bg-[#1A1F71] dark:bg-sky-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Contratos I/O
                  </button>
                </div>

                <div className="text-[11px] text-zinc-400 font-mono hidden sm:block">
                  Arquivo: {currentAlgorithm.filePath}
                </div>
              </div>

              {/* ABA 1: FLUXOGRAMA INTERATIVO EM SVG */}
              {activeTab === 'flowchart' && (
                <div className="p-6">
                  {/* LEGENDA DOS TIPOS DE NÓS */}
                  <div className="flex flex-wrap items-center gap-3 text-xs pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Legenda dos Nós:</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Início / Input</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Decisão Lógica</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Processamento</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Criptografia / Snapshot</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Fallback / Autocura</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Saída Consolidada</span>
                  </div>

                  {/* SVG CANVAS DO FLUXOGRAMA */}
                  <div className="w-full overflow-x-auto pb-4">
                    <svg
                      id="zyconomes-flowchart-svg"
                      viewBox="0 0 1250 280"
                      className="w-full min-w-[1000px] h-[280px] bg-zinc-50 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-colors"
                    >
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 9 5 L 0 9 z" fill="#71717a" />
                        </marker>
                        <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                        </marker>
                      </defs>

                      {/* CONECTORES (LINHAS E SETAS) */}
                      {currentAlgorithm.nodes.map(node => {
                        if (!node.connectsTo) return null;
                        return node.connectsTo.map((conn, cIdx) => {
                          const target = currentAlgorithm.nodes.find(n => n.id === conn.targetId);
                          if (!target) return null;

                          const startX = node.x + 85;
                          const startY = node.y + 40;
                          const targetX = target.x + 85;
                          const targetY = target.y + 40;

                          const isSimActive = simulatingNodeIndex !== null && 
                            currentAlgorithm.nodes[simulatingNodeIndex]?.id === node.id;

                          return (
                            <g key={`${node.id}-${conn.targetId}-${cIdx}`}>
                              <line
                                x1={startX}
                                y1={startY}
                                x2={targetX}
                                y2={targetY}
                                stroke={isSimActive ? '#38bdf8' : '#71717a'}
                                strokeWidth={isSimActive ? 3 : 2}
                                strokeDasharray={node.type === 'decision' ? '4 4' : undefined}
                                markerEnd={isSimActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                                className="transition-all duration-300"
                              />
                              {conn.label && (
                                <text
                                  x={(startX + targetX) / 2}
                                  y={(startY + targetY) / 2 - 8}
                                  fill={conn.label === 'Sim' ? '#10b981' : '#f59e0b'}
                                  fontSize="10"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {conn.label}
                                </text>
                              )}
                            </g>
                          );
                        });
                      })}

                      {/* NÓS DO FLUXOGRAMA (RETÂNGULOS / LOSANGOS / CÁPSULAS) */}
                      {currentAlgorithm.nodes.map((node, idx) => {
                        const isSimulatingThisNode = simulatingNodeIndex === idx;
                        const isSelectedThisNode = selectedNodeDetails?.id === node.id;

                        let strokeColor = '#3f3f46';
                        let fillColor = '#ffffff';

                        if (node.type === 'start') { strokeColor = '#3b82f6'; }
                        else if (node.type === 'decision') { strokeColor = '#f59e0b'; }
                        else if (node.type === 'process') { strokeColor = '#6366f1'; }
                        else if (node.type === 'security') { strokeColor = '#a855f7'; }
                        else if (node.type === 'fallback') { strokeColor = '#ef4444'; }
                        else if (node.type === 'output') { strokeColor = '#10b981'; }

                        if (isSimulatingThisNode) {
                          strokeColor = '#38bdf8';
                        }

                        return (
                          <g
                            key={node.id}
                            transform={`translate(${node.x}, ${node.y})`}
                            onClick={() => setSelectedNodeDetails(node)}
                            className="cursor-pointer group"
                          >
                            {/* Borda / Fundo do Nó */}
                            <rect
                              width="170"
                              height="80"
                              rx={node.type === 'decision' ? 8 : node.type === 'start' || node.type === 'output' ? 24 : 14}
                              fill={isSelectedThisNode ? '#1e293b' : '#18181b'}
                              stroke={strokeColor}
                              strokeWidth={isSimulatingThisNode || isSelectedThisNode ? 3 : 1.5}
                              className="transition-all duration-200 group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                            />

                            {/* Indicador de Pulso Ativo durante simulação */}
                            {isSimulatingThisNode && (
                              <circle cx="155" cy="15" r="5" fill="#38bdf8">
                                <animate attributeName="r" values="3;7;3" dur="1s" repeatCount="indefinite" />
                              </circle>
                            )}

                            {/* Título do Nó */}
                            <text
                              x="85"
                              y="32"
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="select-none pointer-events-none"
                            >
                              {node.label.length > 22 ? `${node.label.slice(0, 20)}...` : node.label}
                            </text>

                            {/* Subtítulo / Descrição Curta */}
                            <text
                              x="85"
                              y="52"
                              fill="#94a3b8"
                              fontSize="9.5"
                              textAnchor="middle"
                              className="select-none pointer-events-none"
                            >
                              {node.type.toUpperCase()}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* PAINEL DE INSPEÇÃO DO NÓ SELECIONADO */}
                  <div className="mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#1A1F71] dark:text-sky-400" />
                        <h5 className="font-bold text-sm text-zinc-900 dark:text-white">
                          {selectedNodeDetails ? `Inspeção do Nó: ${selectedNodeDetails.label}` : 'Clique em qualquer nó do fluxograma para inspecionar'}
                        </h5>
                      </div>
                      {selectedNodeDetails && (
                        <span className="text-[10px] font-mono uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded">
                          Tipo: {selectedNodeDetails.type}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
                      {selectedNodeDetails?.description || 'O fluxograma representa o grafo direcionado acíclico (DAG) das chamadas matemáticas. Cada etapa possui invariantes lógicas estritas para assegurar estabilidade de 2 a 4 horas sem crash.'}
                    </p>

                    {selectedNodeDetails?.codeSnippet && (
                      <div className="relative">
                        <pre className="p-3 bg-zinc-900 text-sky-300 rounded-xl font-mono text-[11px] overflow-x-auto border border-zinc-800">
                          <code>{selectedNodeDetails.codeSnippet}</code>
                        </pre>
                        <button
                          onClick={() => handleCopyCode(selectedNodeDetails.codeSnippet || '')}
                          className="absolute right-2 top-2 p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors cursor-pointer"
                          title="Copiar Trecho"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 2: CÓDIGO FONTE TYPESCRIPT REAL */}
              {activeTab === 'code' && (
                <div className="p-6 relative">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-mono text-zinc-500">
                      Arquivo: <strong className="text-zinc-800 dark:text-zinc-200">{currentAlgorithm.filePath}</strong>
                    </span>
                    <button
                      onClick={() => handleCopyCode(currentAlgorithm.rawSourceCode)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-zinc-950 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed max-h-[450px]">
                    <code>{currentAlgorithm.rawSourceCode}</code>
                  </pre>
                </div>
              )}

              {/* ABA 3: SINTAXE MERMAID.JS */}
              {activeTab === 'mermaid' && (
                <div className="p-6 relative">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 font-mono">
                      Definição textual padronizada para documentação Markdown / GitHub
                    </span>
                    <button
                      onClick={() => handleCopyCode(mermaidSyntax)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copiado!' : 'Copiar Mermaid'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-zinc-950 text-sky-300 rounded-2xl font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed">
                    <code>{mermaidSyntax}</code>
                  </pre>
                </div>
              )}

              {/* ABA 4: CONTRATOS DE ENTRADA & SAÍDA */}
              {activeTab === 'specs' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                      Parâmetros de Entrada (Input Contract)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {currentAlgorithm.inputs.map((inp, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
                          <div className="font-mono font-bold text-[#1A1F71] dark:text-sky-400">{inp.name}: <span className="text-zinc-500">{inp.type}</span></div>
                          <div className="text-zinc-600 dark:text-zinc-400 mt-1">{inp.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                      Valores de Saída (Output Contract)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {currentAlgorithm.outputs.map((out, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{out.name}: <span className="text-zinc-500">{out.type}</span></div>
                          <div className="text-zinc-600 dark:text-zinc-400 mt-1">{out.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
