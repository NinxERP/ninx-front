# ninx-novofront

Cliente desktop do sistema **Ninx** (ERP/POS para pequenos comércios), em **Tauri v2 + React
+ TypeScript + Tailwind CSS**, substituindo o app `.NET MAUI` em `ninx-front`.

## Sobre o sistema Ninx

Este repositório é um dos quatro que compõem o Ninx:

| Repositório | Papel |
|---|---|
| [ninx-api](../ninx-api) | Backend: autenticação, regras de negócio, dados. |
| **ninx-novofront** (este) | Cliente desktop (ERP/POS) em Tauri v2 + React. |
| [ninx-front](../ninx-front) | Cliente desktop antigo, em .NET MAUI — mantido só como referência de UI/UX e regras de negócio até a paridade funcional ser confirmada; não é mais editado. |
| [ninx-signature](../ninx-signature) | Página pública onde o cliente final assina documentos de venda (QR code gerado aqui, fluxo de assinatura roda naquele app). |

## Stack

| Necessidade | Escolha | Por quê |
|---|---|---|
| Framework | React 19 + TypeScript + Vite | Base do Tauri v2 recomendada oficialmente. |
| Desktop shell | Tauri v2 | Bundle nativo (Windows/macOS/Linux) muito mais leve que Electron, usa o WebView do SO. |
| Estilo | Tailwind CSS v4 + `shadcn/ui` (preset "Nova": Base UI + Tailwind) | Componentes acessíveis (Dialog/Select/Table/Toast), 100% utilitário, dark mode nativo via classe `.dark`. |
| HTTP/cache | `@tanstack/react-query` + `fetch` nativo | API é JSON simples sobre HTTPS; React Query resolve cache/retry/invalidação sem reinventar em cada tela; sem axios, o wrapper de auth (`services/api/client.ts`) é ~50 linhas. |
| Formulário/validação | `react-hook-form` + `zod` | Usados nas telas com formulário mais complexo (Login). |
| CPF/CNPJ/CEP | Código próprio (`src/lib/validators.ts`) | ~30 linhas, espelha exatamente o algoritmo do backend; não justifica dependência externa. |
| Ícones | `lucide-react` | Padrão do ecossistema shadcn/Tailwind, tree-shakeable. |
| Estado global | Context API (`useState`) | Sessão é um objeto único e raso (`SessionUser \| null`); `useReducer` seria boilerplate sem ganho. |
| Notificações | `sonner` | Toasts de erro/sucesso das mutações. |
| Gráficos | `chart.js` + `react-chartjs-2` | Mesma lib usada no MAUI (`Relatorio.razor`) — migração ~1:1 dos datasets/options. |
| QR Code | `qrcode.react` | Geração client-side do QR de assinatura eletrônica, sem chamada de rede. |
| Roteamento | `react-router-dom` (`HashRouter`) | Tauri não tem roteador de arquivo; `HashRouter` evita depender de fallback de servidor dentro do bundle da app. |
| Atualização automática | `@tauri-apps/plugin-updater` + `@tauri-apps/plugin-process` | Checagem/instalação de novas versões direto no app, ver seção própria abaixo. |

## Setup

```bash
npm install
cp .env.example .env   # já aponta para a API em produção; troque VITE_API_BASE_URL para localhost se for rodar a API localmente
npm run dev            # servidor Vite (navegador, sem os plugins nativos do Tauri)
npm run tauri dev      # app desktop de verdade (exige Rust + MSVC Build Tools no Windows)
npm run build           # build de produção do front (tsc + vite build)
npm run tauri build    # gera o instalador nativo (.msi/.exe no Windows)
```

## Estrutura

```
src/
├── types/          interfaces TypeScript espelhando 1:1 os DTOs/enums da API (ninx-api)
├── services/
│   ├── api/        client HTTP (fetch): injeta Bearer token, trata 401 centralizado
│   ├── produto.ts, cliente.ts, venda.ts, ...   um arquivo por domínio, hooks React Query
├── context/        AuthContext — sessão do usuário (token só em memória)
├── hooks/          usePermissions, useDebouncedValue, useCurrencyInput, useTheme, useAppUpdater
├── lib/            validators (CPF/CNPJ/CEP), currency (máscara), jwt, produtoStatus, query
├── components/
│   ├── ui/         primitivos shadcn/ui (Base UI + Tailwind)
│   ├── shared/     ConfirmDialog, EmptyState, Pagination, StatusPill
│   ├── layout/     AppLayout, Sidebar
│   └── AppUpdateGate.tsx, UpdateDialog.tsx   fluxo de auto-update
├── routes/         RequireAuth, RequireOwner (guards de rota)
└── pages/          telas da aplicação (ver tabela abaixo)
```

## Telas e rotas

| Rota | Tela | Observação |
|---|---|---|
| `/login` | Login | Lê `?reset=success` e mostra toast de confirmação pós-redefinição de senha. |
| `/forgot-password` | Esqueci a Senha | Fluxo de 2 etapas (e-mail → código + nova senha), cooldown de reenvio de 60s. |
| `/mainpage` | Início | Cards de navegação por módulo. |
| `/mainpage/produtosestoque` | Produtos e Estoque | CRUD + filtros de status + resumo (ativos/normal/baixo/zerado). |
| `/mainpage/clientes` | Clientes | CRUD + modal de fiado (histórico, pagamento individual/geral, QR de assinatura). |
| `/mainpage/venda` | Venda (PDV) | Fluxo de 5 etapas: carrinho → tipo de venda → pagamento → QR (só fiado) → confirmação. |
| `/mainpage/relatorios`\* | Relatórios | 5 abas (Visão Geral, Vendas, Financeiro, Estoque, Clientes) + "Comparativo" quando o usuário tem mais de um comércio — única tela com scroll interno permitido. |
| `/mainpage/assinatura`\* | Minha Assinatura | Plano atual, histórico de pagamentos, cancelamento agendado. |
| `/mainpage/gestao`\* | Gestão | Hub para as 4 telas abaixo. |
| `/mainpage/gestao/usuarios`\* | Usuários | Fluxo de 3 passos para adicionar membro (buscar por e-mail → vincular ou criar). |
| `/mainpage/gestao/cargos`\* | Cargos | CRUD, peso deve ser menor que o do usuário logado (exceto admin de plataforma). |
| `/mainpage/gestao/categoria-produto`\* | Categorias | CRUD simples paginado. |
| `/mainpage/gestao/comercio`\* | Comércio | Dados do comércio e limite de crédito padrão. |

\* Só acessível a dono do comércio ou admin de plataforma (`RequireOwner`, baseado em
`cargoPeso`/`admin` do JWT — ver `src/hooks/usePermissions.ts`).

A tela `FeaturePage` do MAUI não foi portada: era código morto, sem nenhuma navegação
apontando para ela (confirmado por busca no código-fonte antes da migração).

## Estado e autenticação

- **Sessão** (`AuthContext`): guarda o usuário decodificado do JWT (`src/lib/jwt.ts`) e o
  token — **só em memória, sem persistência em disco**. Fechar o app sempre exige novo
  login; é uma decisão deliberada (replica o comportamento do MAUI), não uma limitação —
  evita deixar um JWT sem refresh e sem revogação exposto em `localStorage`/disco.
- **401 centralizado**: `services/api/client.ts` dispara um handler registrado pelo
  `AuthContext` em qualquer resposta 401 — limpa a sessão; o `RequireAuth` redireciona pro
  login sozinho por reagir ao estado de autenticação (sem navegação manual dentro do client
  HTTP).
- **Cache de dados**: React Query, uma query key por domínio; mutações invalidam a query
  correspondente (ver qualquer arquivo em `src/services/`).

## Layout sem scroll

Todas as telas cabem na viewport sem rolagem (`h-screen overflow-hidden` na raiz da app,
cada tela organiza o próprio conteúdo com flexbox). A exceção deliberada é a tela de
**Relatórios**, que pode rolar — usa a classe utilitária `.scroll-styled` (definida em
`src/index.css`) para manter a barra de rolagem estilizada em vez da padrão do sistema.

## Atualização automática (Tauri Updater)

Fluxo: após login bem-sucedido, `AppUpdateGate` chama `checkForUpdate()` uma vez por sessão.
Se houver versão nova, `UpdateDialog` (modal shadcn) pergunta ao usuário; aceitando, baixa
com barra de progresso e reinicia o app (`@tauri-apps/plugin-process`); recusando, só fecha
o modal e a navegação segue normal.

Configuração em `src-tauri/tauri.conf.json` (`plugins.updater`):
- `pubkey` — chave pública do par gerado via `npx @tauri-apps/cli signer generate` (a
  privada fica em `.tauri/`, git-ignorada, nunca commitada).
- `endpoints` — hoje aponta para
  `https://github.com/<owner>/<repo>/releases/latest/download/latest.json`; **troque
  `<owner>/<repo>` pelo repositório real assim que ele existir no GitHub**, senão o updater
  nunca encontra uma versão nova.

## Release / CI-CD

`.github/workflows/release.yml` builda e publica no GitHub Releases a cada tag `v*`
(`git tag v0.1.0 && git push --tags`), assinando os artefatos do updater com
`tauri-apps/tauri-action`. Requer estes secrets no repositório (Settings → Secrets and
variables → Actions):

- `TAURI_PRIVATE_KEY` — conteúdo de `.tauri/ninx-novofront.key`.
- `TAURI_KEY_PASSWORD` — senha da chave, se tiver sido gerada com uma (a atual não tem).

`GITHUB_TOKEN` é automático, não precisa cadastrar.

## Limitações conhecidas / próximos passos

Registradas aqui para não ficarem escondidas — nenhuma delas quebra o fluxo principal:

- **Refresh token**: a API não tem; planejado como etapa extra ao final do roadmap de
  migração, não bloqueia o uso atual (só exige login de novo após ~20h).

