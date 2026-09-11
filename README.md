<div align="center">

# 🖥️ Ninx Front

**Cliente desktop do sistema Ninx (ERP/POS para pequenos comércios), em Tauri v2 + React +
TypeScript + Tailwind CSS.**

![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## 🧩 Sobre o sistema Ninx

| Repositório | Papel |
|---|---|
| [ninx-api](../ninx-api) | Backend: autenticação, regras de negócio, dados. |
| **ninx-front** (este) | Cliente desktop (ERP/POS), Tauri v2 + React. |
| [ninx-signature](../ninx-signature) | Página pública de assinatura de documentos de venda. |

## 🛠️ Stack

React 19 + TypeScript + Vite, empacotado com **Tauri v2** (bundle nativo, mais leve que
Electron). UI com **Tailwind CSS v4 + shadcn/ui**; dados via **React Query**; formulários com
**react-hook-form + zod**; roteamento com `react-router-dom` (`HashRouter`).

## 🚀 Setup

```bash
npm install
cp .env.example .env   # já aponta para a API em produção
npm run tauri dev      # app desktop (exige Rust + MSVC Build Tools no Windows)
npm run tauri build    # gera o instalador nativo (.msi/.exe no Windows)
```

Extensões recomendadas no VS Code: `tauri-apps.tauri-vscode` e `rust-lang.rust-analyzer`.

## 🗂️ Estrutura

```
src/
├── types/          DTOs/enums espelhando a API (ninx-api)
├── services/       client HTTP + um arquivo por domínio (React Query)
├── context/        AuthContext — sessão do usuário (token só em memória)
├── hooks/          usePermissions, useAppUpdater, ...
├── lib/            validators (CPF/CNPJ/CEP), currency, jwt
├── components/     ui/ (shadcn), shared/, layout/, AppUpdateGate
├── routes/         RequireAuth, RequireOwner (guards de rota)
└── pages/          telas da aplicação
```

## 🔄 Atualização automática

Após login, `AppUpdateGate` checa por nova versão uma vez por sessão; se houver, o
`UpdateDialog` baixa e reinicia o app via `@tauri-apps/plugin-updater`. Configuração em
`src-tauri/tauri.conf.json` (`plugins.updater`), chave privada de assinatura em `.tauri/`


## 📦 Release / CI-CD

`.github/workflows/release.yml` builda e publica no GitHub Releases a cada tag `v*`
(`git tag v0.1.0 && git push --tags`). Requer os secrets `TAURI_PRIVATE_KEY` e
`TAURI_KEY_PASSWORD` no repositório.
