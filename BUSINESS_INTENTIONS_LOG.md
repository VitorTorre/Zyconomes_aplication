# REGISTRO DE ALTERAÇÕES E INTENÇÕES DE NEGÓCIO (BUSINESS INTENTIONS LOG)

Este documento registra cada intervenção arquitetural no projeto Zyconomes, justificando-a exclusivamente sob a ótica de **Sustentabilidade Financeira**, **Geração de Caixa** e **Redução de Risco**.

## [2026-09-09] - Implementação de Idempotência no Cadastro e Ordens (Redis SETNX)
*   **O que foi feito:** Travas de concorrência usando chaves únicas de transação.
*   **Intenção de Negócio (Por que importa):** Prevenir o "Double-Spending" (gasto duplo). Em um sistema financeiro, se um usuário clica duas vezes no botão de "Comprar" por lentidão da rede, executar a ordem duas vezes gera passivo financeiro, disputas judiciais e perda de confiança. A idempotência protege o **capital da empresa** e estanca perdas operacionais antes que elas ocorram.

## [2026-09-09] - Circuit Breakers e Multiplexação (PgBouncer)
*   **O que foi feito:** Limite estrito de conexões com o banco de dados e corte rápido (Fail-Fast) em caso de sobrecarga.
*   **Intenção de Negócio (Por que importa):** Autocusteio e Eficiência de Nuvem (Unit Economics). Bancos de dados relacionais são os recursos mais caros da nuvem. Em vez de pagar por instâncias gigantes para aguentar picos (desperdício de dinheiro), o sistema enfileira ordens de forma inteligente. Isso mantém a conta de infraestrutura baixa (lucratividade maior) enquanto garante que o sistema nunca saia do ar (retenção de clientes).

## [2026-09-09] - Order Book com Bypass de Renderização (Ref/requestAnimationFrame)
*   **O que foi feito:** Desacoplamento da atualização de preços do ciclo padrão do React.
*   **Intenção de Negócio (Por que importa):** Retenção e Vantagem Competitiva. Operadores de alta frequência abandonam plataformas que travam ou consomem muita memória RAM. Ao entregar uma experiência fluida de 60 frames por segundo diretamente no navegador (sem necessidade de instalar softwares pesados), reduzimos a fricção de entrada e aumentamos o volume de ordens operadas (maior receita de corretagem).
