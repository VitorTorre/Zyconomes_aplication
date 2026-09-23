/**
 * Modelos Institucionais de Alocação de Ativos e Carteiras Teóricas de Alta Relevância
 * Baseado nas práticas de Gestores Globais, Family Offices, Fundos Soberanos e Teoria Moderna de Portfólio.
 */

export interface AssetAllocationItem {
  id: string;
  name: string;
  category: 'Renda Fixa Pós-Fixada' | 'Renda Fixa Inflação' | 'Ações Brasil' | 'Ativos Globais' | 'Real Estate / FIIs' | 'Hedge & Ouro' | 'Alternativos / Cripto';
  percentage: number;
  amount: number;
  recommendedInstruments: string[];
  rationale: string;
  taxStatus: string;
  liquidity: string;
  color: string;
}

export interface InstitutionalPortfolioStrategy {
  id: string;
  title: string;
  subtitle: string;
  referenceAuthor: string;
  badge: string;
  riskProfile: 'Conservador' | 'Moderado' | 'Agressivo';
  expectedRealReturn: string;
  volatilityEstimate: string;
  sharpeEstimate: number;
  rebalanceBand: string;
  thesis: string;
  bestFor: string;
  assets: Omit<AssetAllocationItem, 'amount'>[];
}

export const INSTITUTIONAL_STRATEGIES: InstitutionalPortfolioStrategy[] = [
  {
    id: 'all-weather',
    title: 'All Weather (Ray Dalio)',
    subtitle: 'Paridade de Risco para Todas as 4 Estações Econômicas',
    referenceAuthor: 'Ray Dalio • Bridgewater Associates',
    badge: 'Referência Global',
    riskProfile: 'Moderado',
    expectedRealReturn: 'IPCA + 5,8% a.a.',
    volatilityEstimate: '6,4% a.a. (Baixa/Média)',
    sharpeEstimate: 0.95,
    rebalanceBand: 'Semestral ou desvio > 5% em qualquer classe',
    thesis: 'Construída para prosperar em 4 ambientes macroeconômicos: crescimento acima da expectativa, inflação em alta, recessão ou deflação. Minimiza drawdown com forte amortecimento de renda fixa soberana e ouro.',
    bestFor: 'Investidores focados em consistência e estabilidade máxima de patrimônio sem sobressaltos.',
    assets: [
      {
        id: 'aw-ipca-longo',
        name: 'Títulos Públicos Indexados à Inflação Longos',
        category: 'Renda Fixa Inflação',
        percentage: 40,
        recommendedInstruments: ['Tesouro IPCA+ 2035 / 2045', 'NTN-B Principal'],
        rationale: 'Proteção contra inflação severa e valorização explosiva via marcação a mercado em ciclos de queda de juros.',
        taxStatus: 'Tabela Regressiva (15% após 2 anos)',
        liquidity: 'D+1 (Resgate Tesouro Direto)',
        color: '#2563EB',
      },
      {
        id: 'aw-equities',
        name: 'Ações Globais e Domésticas (Equities)',
        category: 'Ativos Globais',
        percentage: 30,
        recommendedInstruments: ['IVVB11 (S&P 500)', 'WRLD11 (Total World)', 'BOVA11 (Ibovespa)'],
        rationale: 'Motor de valorização durante períodos de crescimento econômico e expansão corporativa.',
        taxStatus: '15% sobre ganho de capital em ETFs de ações',
        liquidity: 'D+2 (Mercado à vista B3)',
        color: '#10B981',
      },
      {
        id: 'aw-pos-fixado',
        name: 'Renda Fixa Soberana Médio Prazo / Liquidez',
        category: 'Renda Fixa Pós-Fixada',
        percentage: 15,
        recommendedInstruments: ['Tesouro Selic', 'LCI / LCA 95%+ CDI (Bancos AA)'],
        rationale: 'Garante estabilidade na cota, caixa de liquidez e previsibilidade de rendimento nominal.',
        taxStatus: 'LCI/LCA isentas para PF; Tesouro Selic regressivo',
        liquidity: 'D+0 / D+1',
        color: '#06B6D4',
      },
      {
        id: 'aw-ouro',
        name: 'Ouro Físico / Ativos de Proteção Cambial',
        category: 'Hedge & Ouro',
        percentage: 7.5,
        recommendedInstruments: ['GOLD11 (ETF Ouro B3)', 'OZ1D (BM&F)', 'Contratos Futuros de Ouro'],
        rationale: 'Ativo de refúgio secular contra desvalorização fiduciária, tensões geopolíticas e crises cambiais.',
        taxStatus: 'Tributação padrão sobre ganhos líquidos',
        liquidity: 'D+2',
        color: '#F59E0B',
      },
      {
        id: 'aw-commodities',
        name: 'Commodities e Recursos Básicos',
        category: 'Hedge & Ouro',
        percentage: 7.5,
        recommendedInstruments: ['CMDB11 (ETF Commodities)', 'Exposição em Energia e Agro'],
        rationale: 'Hedge eficiente em cenários de choque de oferta e estagflação generalizada.',
        taxStatus: '15% sobre o ganho de capital',
        liquidity: 'D+2',
        color: '#D97706',
      },
    ],
  },
  {
    id: 'family-office-br',
    title: 'Family Office Macro Brasil',
    subtitle: 'Preservação de Poder de Compra e Fluxo de Yield Isento',
    referenceAuthor: 'Multi-Family Offices • High Net Worth Brasil',
    badge: 'Alta Renda BR',
    riskProfile: 'Moderado',
    expectedRealReturn: 'IPCA + 6,6% a.a.',
    volatilityEstimate: '7,8% a.a.',
    sharpeEstimate: 0.92,
    rebalanceBand: 'Anual com reinvestimento contínuo de proventos',
    thesis: 'Modelo consagrado das maiores famílias e gestoras de patrimônio no Brasil: combinação de juros reais atrativos isentos de IR, dividendos mensais em FIIs, ações de valor e hedge em moeda forte (Dólar).',
    bestFor: 'Investidores com patrimônio relevante buscando renda recorrente livre de impostos e proteção cambial.',
    assets: [
      {
        id: 'fo-ipca-isento',
        name: 'Renda Fixa IPCA+ Isenta & Tesouro Direto',
        category: 'Renda Fixa Inflação',
        percentage: 35,
        recommendedInstruments: ['Debêntures Incentivadas AAA (IPCA + 6,5%)', 'CRI / CRA High Grade', 'Tesouro IPCA+'],
        rationale: 'Captura taxas reais históricas do Brasil com benefício da isenção de IR na pessoa física.',
        taxStatus: 'Isento de IR para PF (Lei 12.431)',
        liquidity: 'D+1 a D+30 (Mercado Secundário)',
        color: '#2563EB',
      },
      {
        id: 'fo-pos-caixa',
        name: 'Caixa Estratégico Pós-Fixado (CDI)',
        category: 'Renda Fixa Pós-Fixada',
        percentage: 25,
        recommendedInstruments: ['Tesouro Selic', 'CDB Liquidez Diária 100%+ CDI', 'LCI Liquidez 90D'],
        rationale: 'Reserva tática para aproveitar janelas de oportunidade e pagar despesas de curto prazo.',
        taxStatus: 'LCI isenta; CDB/Tesouro tabela regressiva',
        liquidity: 'D+0 Imediato',
        color: '#06B6D4',
      },
      {
        id: 'fo-fiis',
        name: 'Fundos Imobiliários (Tijolo Logístico & Renda Urbana)',
        category: 'Real Estate / FIIs',
        percentage: 15,
        recommendedInstruments: ['HGLG11 / BTLG11 (Galpões Logísticos)', 'XPML11 / VISC11 (Shoppings)', 'KNIP11 (Recebíveis High Grade)'],
        rationale: 'Fluxo previsível de rendimentos mensais creditados em conta com proteção inflacionária no valor dos imóveis.',
        taxStatus: 'Dividendos 100% Isentos de Imposto de Renda para PF',
        liquidity: 'D+2 na B3',
        color: '#8B5CF6',
      },
      {
        id: 'fo-dividendos',
        name: 'Ações Nacionais Pagadoras de Dividendos (Value)',
        category: 'Ações Brasil',
        percentage: 15,
        recommendedInstruments: ['Bancos Líderes (ITUB4, BBAS3)', 'Elétricas e Saneamento (EGIE3, TAEE11, SBSP3)', 'Vale / BBSE3'],
        rationale: 'Sociedade em empresas geradoras de caixa com dividend yield acima da taxa Selic de longo prazo.',
        taxStatus: 'Proventos isentos de IR; Vendas até R$ 20k/mês isentas de ganho',
        liquidity: 'D+2',
        color: '#10B981',
      },
      {
        id: 'fo-offshore',
        name: 'Offshore & Hedge em Moeda Forte (USD)',
        category: 'Ativos Globais',
        percentage: 10,
        recommendedInstruments: ['IVVB11', 'BDRs de Empresas Globais (AAPL, MSFT, BRK.B)', 'Treasuries Americanas (US10Y)'],
        rationale: 'Descorrelação em relação ao risco-país Brasil e proteção contra choque desvalorizatório da moeda local.',
        taxStatus: 'Tributação de ativos internacionais conforme legislação vigente',
        liquidity: 'D+2',
        color: '#6366F1',
      },
    ],
  },
  {
    id: 'yale-endowment',
    title: 'Endowment Model (Yale / Swensen)',
    subtitle: 'Retorno Máximo no Longo Prazo com Ativos Reais e Equities',
    referenceAuthor: 'David F. Swensen • Yale University Endowment',
    badge: 'Máximo Crescimento',
    riskProfile: 'Agressivo',
    expectedRealReturn: 'IPCA + 8,0% a.a.',
    volatilityEstimate: '11,5% a.a. (Volatilidade Alta)',
    sharpeEstimate: 0.88,
    rebalanceBand: 'Anual ou após grandes movimentos de mercado',
    thesis: 'Rejeitou a carteira tradicional 60/40 em prol de forte peso em ativos de capital (ações, fundos imobiliários, private equity e ativos globais). Gera os maiores retornos compostos se mantido por décadas.',
    bestFor: 'Investidores com horizonte temporal superior a 10 anos que toleram oscilações de curto prazo.',
    assets: [
      {
        id: 'ye-global',
        name: 'Ações Globais Desarbitradas (EUA & Mercados Desenvolvidos)',
        category: 'Ativos Globais',
        percentage: 30,
        recommendedInstruments: ['WRLD11 (VT Vanguard Total World)', 'IVVB11 (S&P 500)', 'BDRs Globais'],
        rationale: 'Acesso às empresas mais lucrativas do planeta com escala global de mercado.',
        taxStatus: '15% sobre ganho de capital',
        liquidity: 'D+2',
        color: '#10B981',
      },
      {
        id: 'ye-br-equities',
        name: 'Equities Brasil (Large & Small Caps Assimétricas)',
        category: 'Ações Brasil',
        percentage: 25,
        recommendedInstruments: ['SMAL11 (Small Caps)', 'BOVA11 / Carteira Focada em Valor'],
        rationale: 'Captura do prêmio de risco histórico de economias emergentes com múltiplos atrativos.',
        taxStatus: '15% sobre o lucro líquido',
        liquidity: 'D+2',
        color: '#059669',
      },
      {
        id: 'ye-real-estate',
        name: 'Real Estate & Ativos Reais Ilíquidos/FIIs',
        category: 'Real Estate / FIIs',
        percentage: 20,
        recommendedInstruments: ['FIIs de Tijolo e Desenvolvimento', 'CRIs de infraestrutura'],
        rationale: 'Ativo tangível com capacidade de repasse de inflação e geração de renda real perpétua.',
        taxStatus: 'Rendimentos mensais isentos de IR para PF',
        liquidity: 'D+2',
        color: '#8B5CF6',
      },
      {
        id: 'ye-ipca-longo',
        name: 'Títulos de Dívida Soberana Real (IPCA+ 2035/2045)',
        category: 'Renda Fixa Inflação',
        percentage: 15,
        recommendedInstruments: ['Tesouro IPCA+ 2045', 'NTN-B com juros semestrais'],
        rationale: 'Estabilizador de choques inflacionários e hedge deflationário extremo.',
        taxStatus: 'Tabela regressiva (15%)',
        liquidity: 'D+1',
        color: '#2563EB',
      },
      {
        id: 'ye-liquidez',
        name: 'Liquidez Tática de Oportunidade',
        category: 'Renda Fixa Pós-Fixada',
        percentage: 10,
        recommendedInstruments: ['Tesouro Selic', 'CDB 105% CDI'],
        rationale: 'Pólvora seca pronta para alocação em momentos de pânico e capitulação do mercado.',
        taxStatus: 'Regressivo padrão',
        liquidity: 'D+0',
        color: '#06B6D4',
      },
    ],
  },
  {
    id: 'markowitz-mpt',
    title: 'Fronteira Eficiente (Markowitz)',
    subtitle: 'Maximização do Índice de Sharpe e Mínima Variância',
    referenceAuthor: 'Harry Markowitz • Teoria Moderna de Portfólio (Prêmio Nobel)',
    badge: 'Matemática e Risco',
    riskProfile: 'Moderado',
    expectedRealReturn: 'IPCA + 6,2% a.a.',
    volatilityEstimate: '7,0% a.a.',
    sharpeEstimate: 1.05,
    rebalanceBand: 'Trimestral ou re-otimização por matriz de covariância',
    thesis: 'Diversificação matemática ótima onde ativos não-correlacionados se anulam nos riscos idiossincráticos, elevando o retorno por unidade de risco ao topo da fronteira convexa eficiente.',
    bestFor: 'Investidores quantitativos que buscam a melhor relação risco-retorno comprovada academicamente.',
    assets: [
      {
        id: 'mk-ipca',
        name: 'Renda Fixa Inflação Médio Prazo (NTN-B 2029)',
        category: 'Renda Fixa Inflação',
        percentage: 35,
        recommendedInstruments: ['Tesouro IPCA+ 2029 / 2035', 'Debêntures Incentivadas'],
        rationale: 'Cupom real estável com baixa correlação frente ao mercado de ações doméstico.',
        taxStatus: 'Regressivo ou isento para debêntures de infraestrutura',
        liquidity: 'D+1',
        color: '#2563EB',
      },
      {
        id: 'mk-pos',
        name: 'Pós-Fixado Soberano / Selic',
        category: 'Renda Fixa Pós-Fixada',
        percentage: 25,
        recommendedInstruments: ['Tesouro Selic', 'CDB 100%+ CDI'],
        rationale: 'Ativo livre de risco de crédito com volatilidade próxima de zero.',
        taxStatus: 'Regressivo padrão',
        liquidity: 'D+0',
        color: '#06B6D4',
      },
      {
        id: 'mk-global',
        name: 'Equities Globais (Correlação Descasada com Brasil)',
        category: 'Ativos Globais',
        percentage: 20,
        recommendedInstruments: ['IVVB11', 'WRLD11', 'SPY / QQQ'],
        rationale: 'Correlação histórica moderada ou negativa com os ciclos de juros brasileiros.',
        taxStatus: '15% sobre o ganho de capital',
        liquidity: 'D+2',
        color: '#10B981',
      },
      {
        id: 'mk-fiis',
        name: 'Real Estate / FIIs de Renda',
        category: 'Real Estate / FIIs',
        percentage: 10,
        recommendedInstruments: ['FIIs de Tijolo e Galpões AAA'],
        rationale: 'Comportamento híbrido entre títulos corporativos de dívida e equities.',
        taxStatus: 'Rendimentos mensais isentos',
        liquidity: 'D+2',
        color: '#8B5CF6',
      },
      {
        id: 'mk-br-lowbeta',
        name: 'Ações Brasil com Baixo Beta e Volatilidade Controlada',
        category: 'Ações Brasil',
        percentage: 10,
        recommendedInstruments: ['Setores Defensivos (Energia, Saneamento, Telecom)'],
        rationale: 'Gera alfa sem sobrecarregar a volatilidade da carteira total.',
        taxStatus: 'Isento até R$ 20k de vendas/mês',
        liquidity: 'D+2',
        color: '#059669',
      },
    ],
  },
  {
    id: 'boglehead-3fund',
    title: 'Boglehead 3-Fund (John Bogle)',
    subtitle: 'Simplicidade Operacional, Taxas Quase Zero e Retorno Médio Passivo',
    referenceAuthor: 'John C. Bogle • Fundador da Vanguard',
    badge: 'Index Investing',
    riskProfile: 'Moderado',
    expectedRealReturn: 'IPCA + 5,9% a.a.',
    volatilityEstimate: '8,2% a.a.',
    sharpeEstimate: 0.90,
    rebalanceBand: 'Anual no momento dos novos aportes',
    thesis: 'Não procure a agulha no palheiro; compre o palheiro inteiro. Ao investir em índices amplos com taxas operacionais mínimas e reinvestir dividendos, você bate mais de 90% dos gestores ativos de fundos no longo prazo.',
    bestFor: 'Investidores práticos que querem rentabilidade superior sem gastar horas analisando balanços diários.',
    assets: [
      {
        id: 'bg-world',
        name: 'Total World Stock ETF (Mercado Global Completo)',
        category: 'Ativos Globais',
        percentage: 50,
        recommendedInstruments: ['WRLD11 (Total World B3)', 'IVVB11 (S&P 500)'],
        rationale: 'Propriedade de mais de 9.000 empresas em mais de 40 países do mundo.',
        taxStatus: '15% sobre o ganho de capital em alienações',
        liquidity: 'D+2',
        color: '#10B981',
      },
      {
        id: 'bg-rf-br',
        name: 'Renda Fixa Soberana Brasileira (Selic + IPCA+)',
        category: 'Renda Fixa Inflação',
        percentage: 30,
        recommendedInstruments: ['Tesouro Selic', 'Tesouro IPCA+ 2035'],
        rationale: 'Estabilizador com alta remuneração real soberana para cobrir passivos domésticos.',
        taxStatus: 'Regressivo (15% no longo prazo)',
        liquidity: 'D+1',
        color: '#2563EB',
      },
      {
        id: 'bg-br-index',
        name: 'Ações Domésticas Amplo Brasil (Ibovespa / IBrX)',
        category: 'Ações Brasil',
        percentage: 20,
        recommendedInstruments: ['BOVA11', 'PIBB11 (IBrX-50)', 'DIVO11 (Dividendos)'],
        rationale: 'Captura o crescimento da economia brasileira com diversificação passiva.',
        taxStatus: '15% sobre ganho em ETF',
        liquidity: 'D+2',
        color: '#059669',
      },
    ],
  },
  {
    id: 'taleb-barbell',
    title: 'Barbell Antifrágil (Nassim Taleb)',
    subtitle: 'Zero Risco de Ruína com 85% Hiperseguro + 15% Convexidade Extrema',
    referenceAuthor: 'Nassim Nicholas Taleb • Autor de O Cisne Negro e Antifrágil',
    badge: 'Antifrágil',
    riskProfile: 'Conservador',
    expectedRealReturn: 'IPCA + 5,5% a.a. (+ Opcionalidade Ilimitada)',
    volatilityEstimate: '4,5% a.a. na porção defensiva',
    sharpeEstimate: 0.98,
    rebalanceBand: 'Trimestral ou após explosão assimétrica nos 15%',
    thesis: 'Rejeita o falso meio-termo de fundos moderados. Mantém 85% do dinheiro em ativos 100% livres de risco soberano e 15% em apostas puramente assimétricas (onde a perda máxima é 1x e o ganho potencial é 10x, 50x ou 100x).',
    bestFor: 'Investidores com aversão visceral a perdas permanentes que desejam exposição a grandes saltos de valor.',
    assets: [
      {
        id: 'tb-soberano',
        name: 'Renda Fixa Hipersegura Soberana (Tesouro Selic / T-Bills)',
        category: 'Renda Fixa Pós-Fixada',
        percentage: 85,
        recommendedInstruments: ['Tesouro Selic', 'T-Bills Americanas (Curto Prazo)', 'LCI/LCA Banco do Brasil/Caixa'],
        rationale: 'Blindagem total. Risco de crédito zero da dívida soberana; liquidez incondicional para nunca ser forçado a liquidar ativos em baixa.',
        taxStatus: 'LCI isenta; Tesouro regressivo',
        liquidity: 'D+0 / D+1',
        color: '#2563EB',
      },
      {
        id: 'tb-convexo',
        name: 'Ativos Convexos de Retorno Assimétrico',
        category: 'Alternativos / Cripto',
        percentage: 15,
        recommendedInstruments: ['Bitcoin / Ethereum (Criptoativos)', 'Ações de Tecnologia Exponencial', 'Opções OTM de Proteção / Cisne Negro', 'Startups / Venture'],
        rationale: 'Se caírem a zero, o patrimônio perde apenas 15% (recuperável em meses pelos 85% em juros). Se explodirem, multiplicam o portfólio.',
        taxStatus: 'Varia conforme o ativo',
        liquidity: 'D+0 a D+2',
        color: '#F59E0B',
      },
    ],
  },
];

/**
 * Calcula os montantes nominais em R$ para cada classe de ativo com base no valor total.
 */
export function calculatePortfolioAllocation(strategy: InstitutionalPortfolioStrategy, totalAmount: number): AssetAllocationItem[] {
  const safeTotal = Math.max(100, isNaN(totalAmount) ? 100000 : totalAmount);
  return strategy.assets.map(asset => {
    const amount = (safeTotal * asset.percentage) / 100;
    return {
      ...asset,
      amount,
    };
  });
}

/**
 * Retorna uma estratégia institucional com base no perfil de risco convencional.
 */
export function getStrategyByRiskProfile(profile: 'Conservador' | 'Moderado' | 'Agressivo'): InstitutionalPortfolioStrategy {
  switch (profile) {
    case 'Conservador':
      return INSTITUTIONAL_STRATEGIES.find(s => s.id === 'taleb-barbell') || INSTITUTIONAL_STRATEGIES[0];
    case 'Agressivo':
      return INSTITUTIONAL_STRATEGIES.find(s => s.id === 'yale-endowment') || INSTITUTIONAL_STRATEGIES[2];
    case 'Moderado':
    default:
      return INSTITUTIONAL_STRATEGIES.find(s => s.id === 'family-office-br') || INSTITUTIONAL_STRATEGIES[1];
  }
}
