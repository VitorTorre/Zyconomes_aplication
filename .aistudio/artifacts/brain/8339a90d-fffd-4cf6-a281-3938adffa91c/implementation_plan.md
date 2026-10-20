# Blindagem de Infraestrutura, Governança Estrita de CI/CD & Travas de Ambiente

Plano arquitetural para blindar a plataforma Zyconomes contra falhas de deploy no Cloudflare Pages/Workers e GitHub Actions, eliminando ambiguidades entre gerenciadores de pacotes (`npm` vs `bun`/`yarn`), garantindo paridade total de lockfile via `npm ci` e estabelecendo a rotina pré-push via script unificado `npm run validate`.

## Decisões Confirmadas & Governança

> [!IMPORTANT]
> **Decisões Alinhadas com o Usuário:**
> - **Gerenciador Oficial Estrito**: Bloqueio definitivo em `npm@10.9.2` e Node.js `>=20.0.0` via campos `packageManager` e `engines` no `package.json`.
> - **CI/CD no GitHub Actions**: Padronização dos workflows de CI/CD para execução determinística com `npm ci` e pipeline de validação completa.
> - **Documentação & Pauta 16 no README.md**: Seção dedicada à infraestrutura de servidores com explicação didática sobre a quebra por falsa simetria, eliminação de arquivos fantasmas (`bun.lock`, `yarn.lock`) e rotina pré-push.

---

## 1. Visão Geral & Problemas Resolvidos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUXO DE INTEGRAÇÃO CONTÍNUA                          │
│                                                                             │
│  [Dev Local] ───────────► [Pré-Push: npm run validate] ────► [git push]     │
│   (npm install)             ├─ tsc --noEmit (Tipos)                         │
│                             ├─ vitest run (75 Testes)                       │
│                             └─ vite build (Compilação)                      │
│                                                                             │
│  [Cloudflare / GitHub CI] ◄─────────────────────────────────────────────────┘
│   (npm ci estrito)                                                          │
│   ├─ packageManager: npm@10.9.2                                             │
│   ├─ engines: node >= 20.0.0                                                │
│   └─ Lockfile congelado e auditado (Zero Exit Code 1)                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### O que causou as falhas anteriores:
1. **Falsa Simetria (Cloudflare Exit Code 1)**: O comando `npm install` local atualizou arquivos sem garantir o congelamento do `package-lock.json`. Ao rodar em produção com `npm ci`, o servidor detectou divergência e abortou a esteira.
2. **Esquizofrenia de Gerenciadores (Bun vs NPM)**: A coexistência acidental de traços ou lockfiles alternativos induziu servidores a tentar `bun install --frozen-lockfile`, resultando em falhas críticas de build.
3. **Falsos Positivos de Validação**: Testes e checagens rodados isoladamente mascaravam falhas cruzadas que só apareciam no empacotamento final.

---

## 2. Mudanças de Engenharia & Configuração

### 2.1. Travas Arquiteturais no `package.json`
- Adição dos campos de conformidade:
  ```json
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.9.2"
  ```
- Adição do script de verificação combinada:
  ```json
  "validate": "npm run lint && npm test && npm run build"
  ```

### 2.2. Padronização dos Workflows do GitHub Actions
- Atualização e consolidação de `.github/workflows/main.yml` e `.github/workflows/ci.yml`:
  - Utilização estrita de `npm ci`.
  - Execução da etapa de validação unificada (`npm run validate`).
  - Cache nativo do `npm` indexado ao `package-lock.json`.

### 2.3. Seção Dedicada & Pauta 16 no `README.md`
- **Seção de Infraestrutura & CI/CD**:
  - Tabela comparativa clara: `npm install` (apenas para adicionar/alterar dependências locais) vs `npm ci` (obrigatório para reproduzir o estado fiel de produção).
  - Como purgar e regenerar `node_modules` e `package-lock.json` de forma limpa.
  - Regra de ouro da rotina pré-push: `npm run validate` antes de qualquer `git push`.
- **Pauta 16 Formalizada**:
  - Registro da resolução de infraestrutura, lições aprendidas de infraestrutura em nuvem, e diretrizes contra lockfiles concorrentes.

---

## 3. Plano de Verificação & Testes

1. **Validação de Sintaxe e Scripts**:
   - Executar `npm run validate` localmente para certificar que `lint`, `test` (15 suítes, 75 testes) e `build` passam sucessivamente sem nenhum aviso ou quebra.
2. **Auditoria de Arquivos de Lock**:
   - Garantir a ausência de arquivos concorrentes (`bun.lock`, `bun.lockb`, `yarn.lock`, `pnpm-lock.yaml`).
3. **Compilação e Integridade**:
   - Executar `compile_applet` e `lint_applet` para assegurar build verde.
