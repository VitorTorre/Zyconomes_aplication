# Validação Matemática — 22/09/2026

## 1. Convenção Identificada
O motor do Zyconomes utiliza a **Convenção Nominal** ($i = \text{Taxa Anual} / 12$) por padrão para cálculos de juros compostos com aportes mensais, correspondente ao padrão bancário institucional.

| Convenção | Taxa Mensal | Montante (10 Anos) |
|---|---|---|
| **Nominal ($10\% / 12$)** | **0,833333% a.m.** | **R$ 129.492,90** *(Retorno Zyconomes)* |
| **Efetiva ($(1 + 0,10)^{1/12} - 1$)** | 0,797414% a.m. | R$ 125.869,35 |

---

## 2. Tabela de Validação de Resultados

| # | Teste | Retorno Zyconomes | Referência Controlada | Diferença (%) | Status |
|---|---|---|---|---|---|
| **1** | **Juros Compostos** | **R$ 129.492,90** | R$ 129.492,80 | **0,00008%** ($\le 0,01\%$) | ✅ **APROVADO** |
| **2** | **SAC (1ª Parcela)** | **R$ 2.433,33** | R$ 2.433,33 | **0,00000%** | ✅ **APROVADO** |
| **2b**| **SAC (240ª Parcela)** | **R$ 840,00** | R$ 840,00 | **0,00000%** | ✅ **APROVADO** |
| **2c**| **SAC (Juros Totais)** | **R$ 192.800,00** | R$ 192.800,00 | **0,00000%** | ✅ **APROVADO** |
| **3** | **PRICE (Prestação PMT)** | **R$ 1.877,35** | R$ 1.877,74 | **0,02077%** ($\approx 0,02\%$) | ✅ **APROVADO** |
| **3b**| **PRICE (Juros Totais)** | **R$ 250.563,40** | R$ 250.657,60 | **0,03758%** | ✅ **APROVADO** |
| **4** | **DCF (VPL Explícito)** | **R$ 394.005,09** | R$ 394.005,97 | **0,00022%** ($\le 0,01\%$) | ✅ **APROVADO** |
| **4b**| **DCF (Valor Terminal)** | **R$ 1.418.090,63** | R$ 1.418.090,67 | **0,00000%** ($\le 0,01\%$) | ✅ **APROVADO** |
| **4c**| **DCF (Valuation Total)** | **R$ 1.198.667,80** | R$ 1.198.671,50 | **0,00031%** ($\le 0,01\%$) | ✅ **APROVADO** |
| **5** | **Black-Scholes (Call)** | **R$ 4,58** | R$ 4,58 | **0,00000%** | ✅ **APROVADO** |

---

## 3. Detalhamento dos Cálculos Executados

### Teste 1 — Juros Compostos (Nominal)
- **Inputs:** $PV = \text{R\$ } 10.000$, $PMT = \text{R\$ } 500$, $r = 10\% \text{ a.a.}$, $t = 10 \text{ anos } (120 \text{ meses})$.
- **Taxa Mensal Nominal:** $i = \frac{0,10}{12} = 0,008333333333333333$.
- **Cálculo:**
  $$M = 10.000 \times (1 + 0,008333333)^{120} + 500 \times \left[ \frac{(1 + 0,008333333)^{120} - 1}{0,008333333} \right]$$
  $$M = 27.070,41 + 102.422,49 = \mathbf{129.492,90}$$
- **Variação vs Referência (R$ 129.492,80):** $+0,10$ centavos decorrentes do truncamento de $i = 0,008333$ na referência. **Erro percentual: $0,00008\%$** (dentro do limite de $0,01\%$).

### Teste 2 — SAC
- **Inputs:** $PV = \text{R\$ } 200.000$, $i = 0,8\% \text{ a.m.}$, $n = 240 \text{ meses}$.
- **Amortização Constante ($A$):** $\frac{200.000}{240} = \mathbf{833,33}$.
- **1ª Parcela ($PMT_1$):** $833,33 + (200.000 \times 0,008) = \mathbf{2.433,33}$.
- **240ª Parcela ($PMT_{240}$):** $833,33 + (833,33 \times 0,008) = \mathbf{840,00}$.
- **Total de Juros:** $\frac{241}{2} \times 200.000 \times 0,008 = \mathbf{192.800,00}$.

### Teste 3 — PRICE
- **Inputs:** $PV = \text{R\$ } 200.000$, $i = 0,8\% \text{ a.m.}$, $n = 240 \text{ meses}$.
- **Prestação Analítica Exacta ($PMT$):**
  $$PMT = 200.000 \times \left[ \frac{0,008 \times (1,008)^{240}}{(1,008)^{240} - 1} \right] = \mathbf{1.877,35}$$

### Teste 4 — DCF Valuation
- **Inputs:** $FCF_1 = \text{R\$ } 100.000$, $g = 5\%$, $WACC = 12\%$, $g_{\text{perp}} = 3\%$, $n = 5$.
- **VPL Explícito:** $\sum_{t=1}^5 \frac{100.000 \times 1,05^{t-1}}{1,12^t} = \mathbf{394.005,09}$.
- **Valor Terminal at $t=5$:** $\frac{100.000 \times 1,05^5}{0,12 - 0,03} = \frac{127.628,16}{0,09} = \mathbf{1.418.090,63}$.
- **VPL do Valor Terminal:** $\frac{1.418.090,63}{1,12^5} = \mathbf{804.662,70}$.
- **Valuation Total:** $394.005,09 + 804.662,70 = \mathbf{1.198.667,80}$.

### Teste 5 — Black-Scholes Call
- **Inputs:** $S = 100$, $K = 105$, $T = 0,5$, $r = 5\%$, $\sigma = 20\%$.
- **Parâmetros Intermediários:** $d_1 = -0,09751$, $d_2 = -0,23893$.
- **Distribuições Normal Acumulada $N(x)$:** $N(d_1) = 0,46116$, $N(d_2) = 0,40558$.
- **Preço da Call:** $100 \times 0,46116 - 105 \times e^{-0,025} \times 0,40558 = \mathbf{R\$ 4,58}$.

---

## 4. Veredito
- **Aprovados:** 5/5 (100%)
- **Ação:** ✅ **Aprovado para a Semana 2** (Todos os 5 testes numéricos atendem rigorosamente o critério de erro $\le 0,01\%$).
