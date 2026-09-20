# ARTEFATO 1 — ESPECIFICAÇÃO PRÉVIA (FASE 0 E FASE A)

## INFORMAÇÕES GERAIS
- **Documento:** Especificação Técnica de Fundação (MVP)
- **Autor:** Arquiteto-Documentador (IA)
- **Status:** Aguardando Assinatura do Fundador
- **Objetivo:** Estabelecer as regras de negócio, infraestrutura e arquitetura para as 5 ferramentas gratuitas e Home Page institucional.

## 1. ESPECIFICAÇÃO DE INFRAESTRUTURA (FASE 0)
- **Frontend:** React + Vite + TailwindCSS
- **Hospedagem Alvo:** Cloudflare Pages
- **Banco de Dados Alvo:** Supabase (Apenas para captura de e-mails na Fase A)
- **Roteamento:** Client-Side rendering.
- **Analytics:** Google Analytics 4 (DataLayer injections nos botões de cálculo).

## 2. ESPECIFICAÇÃO DOS MOTORES MATEMÁTICOS (FASE 0)
*Regra de Ouro: Nenhuma ferramenta falha silenciosamente (Runtime validation).*

1. **Diagnóstico Financeiro:** 
   - Entrada: Renda, Despesa
   - Saída: Fluxo de Caixa Livre (Renda - Despesa) e Taxa de Poupança ((Fluxo/Renda)*100).
   - Limitação: Não aceita valores negativos de renda.

2. **Juros Compostos:**
   - Fórmula: FV = PV(1+i)^n + PMT[((1+i)^n - 1)/i]
   - Premissa: Taxa de juros convertida proporcionalmente ao mês. Não abate inflação.

3. **Reserva de Emergência:**
   - Objetivo: 6x o Custo Mensal (Despesa).
   - Saída: Barra de progresso visual de 0 a 100%.

4. **Financiamento/Dívida:**
   - Metodologia: Tabela Price (Sistema de Amortização Francês).
   - Saída: Parcela Fixa (PMT) e Juros Totais acumulados.

5. **Patrimônio:**
   - Metodologia: Isolamento do "n" (tempo) via logaritmo natural.
   - Saída: Anos e meses exatos para cruzar a linha do Patrimônio Alvo.

## 3. ESPECIFICAÇÃO DA HOME PAGE (FASE A)
- **Restrição de Informação:** Apenas 3 CTA's principais permitidos ("Diagnóstico Gratuito", "Ferramentas", "Blog").
- **Métrica de Aceite:** Google Lighthouse Performance > 90.
- **Design:** Sóbrio (Visa Pattern - Azul, Branco, Esmeralda). Zero fricção (sem login obrigatório).

## 4. CRITÉRIO DE ACEITE (PORTÃO DE SAÍDA)
[ ] Metodologia aprovada pelo contador/economista
[ ] Política de Privacidade elaborada e atrelada
[ ] Home Page no ar com conversão limpa (Lighthouse > 90)
[ ] 5 calculadoras rodando sem bugs matemáticos

---
*Fim da Especificação. Liberado para codificação (ou refatoração) após o ciente.*
