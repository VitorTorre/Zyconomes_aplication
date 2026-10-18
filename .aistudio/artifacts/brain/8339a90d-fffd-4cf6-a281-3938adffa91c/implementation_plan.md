# Plano de Implementação — Agente de IA Financeiro Pessoal Zyconomes (Agent-S Inspired)

## Visão Geral & Escopo Arquitetural
Implementação do **Agente de IA Financeiro Pessoal** no ecossistema Zyconomes, inspirado nos princípios de planejamento hierárquico e ACI (Action-Computer Interface) do **Agent-S**. O agente modela uma trajetória fiduciária realista e matematicamente consistente:
- **Ponto de Partida (Curto Prazo / 0 a 12 meses):** Início com R$ 1.000,00, preservação e alocação em reserva de oportunidade/CDI.
- **Progressão de Aportes Trimestrais:** Acréscimo dinâmico escalonado de +R$ 150 a +R$ 2.000 por trimestre conforme expansão de renda e fluxo de caixa.
- **Regra Fiduciária de Proventos/Rendimentos:** 
  - 20% para gastos pessoais / recompensa do investidor;
  - 25% para negócios nichados promissores (equity assimétrico / microcaps / ventures locais);
  - 40% em ações e fundos multimercados globais;
  - 15% em reserva de oportunidade e liquidez em renda fixa / soberanos.
- **Multiplicação no Médio Prazo (1 a 5 anos):** Multiplicação de **5x a 8x** sobre a base de capital acumulada através da sinergia entre proventos reinvestidos e aportes trimestrais crescentes.
- **Horizonte de Longo Prazo (10 a 15 anos):** Dolarização progressiva do patrimônio para consolidar um fundo perpétuo capaz de gerar **USD $2.000 por semana** (Safe Withdrawal Rate de 4%-5% a.a., exigindo patrimônio global de USD $2.080.000 a USD $2.600.000).
- **Cockpit com Alternância de Tom/Persona:** Transição imediata entre "Tom Formidável / Arrojado" (captura de ondas de liquidez e assimetrias), "Tom Cético & Perseverante" (blindagem patrimonial, sobrevivência e testes de estresse) e "Equilibrado / Institucional".

---

## Fases de Execução Propostas

### Fase 1: Motor Matemático e Algorítmico do Agente (`src/lib/agentSFinanceEngine.ts`)
1. Implementar o modelador de trajetória patrimonial com suporte a:
   - Progressão trimestral de poupança (+R$ 150 a +R$ 2.000/trimestre).
   - Motor de divisão de juros/proventos (20% gastos, 25% nichos, 40% ações/multimercado, 15% liquidez).
   - Transição cambial gradual BRL → USD com paridade de poder de compra e desvalorização esperada.
   - Cálculo estocástico de probabilidade (P10, P50 mediana, P90) para o alvo de 5x a 8x em 3-5 anos e USD 2.000/semana em 10-15 anos.
   - Simulação de 4 Ciclos de Mercado: Acumulação, Expansão de Liquidez, Euforia/Distribuição e Contração/Bear Market.
2. Escrever testes unitários rigorosos em `tests/agentSFinanceEngine.test.ts` cobrindo cenários determinísticos, testes de estresse e precisão em ponto fixo.

### Fase 2: Componente do Cockpit Interativo do Agente (`src/components/AgentSCockpit.tsx`)
1. Interface reativa e rápida (< 50ms):
   - **Seletor de Tom do Agente:** Alternância entre *Tom Arrojado & Formidável* (foco em capturar ondas de liquidez em negócios nichados) e *Tom Cético & Perseverante* (foco em resiliência, anti-drawdown e disciplina).
   - **Visualizador de Ciclos de Mercado:** Card dinâmico ressaltando em qual fase da onda de liquidez o mercado se encontra e qual a postura tática prescrita.
   - **Painel de Regra de Proventos:** Visualizador interativo de divisão (20% / 25% / 40% / 15%) com gráficos de pizza/barras de liquidez.
   - **Trajetória de Marcos (Milestones):**
     - R$ 1.000 (Início)
     - R$ 5.000 - R$ 8.000 (Médio Prazo 5x-8x)
     - R$ 50.000 (Consolidação de Negócios Nichados)
     - USD 100.000 (Dolarização Ativa)
     - USD 2.080.000 - 2.600.000 (Meta USD 2.000/semana)
   - **Simulador Interativo de Parâmetros:** Sliders ajustáveis para incremento trimestral de aporte, taxa esperada de negócios nichados e câmbio USD/BRL.

### Fase 3: Integração no App Zyconomes e Navegação
1. Conectar o cockpit à barra de navegação principal (`src/App.tsx`), permitindo acesso direto e instantâneo ao Agente Pessoal.
2. Integrar com o estado de autenticação e histórico de simulações com persistência criptografada (AES-256-GCM).
3. Atualizar o `README.md` com a **Pauta 13** detalhando toda a fundamentação, fórmulas matemáticas e notas de release.

### Fase 4: Verificação de Build, Lints e Suíte de Testes
1. Executar suíte completa de testes (`npm test`) garantindo que todos os novos testes e os 57 testes prévios continuem passando com 100% de sucesso.
2. Executar `compile_applet` para validação de integridade do build.
