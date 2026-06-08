# Time Tracker (React + TypeScript)

> Aplicação de rastreamento de tempo pessoal construída com React, TypeScript, Vite e Supabase.

Descrição curta: uma app leve para registar entradas de tempo, gerir notas, importar feriados e sincronizar preferências com Supabase.

---

**Índice**

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração e execução](#configuração-e-execução)
- [Configurar Supabase / Auth](#configurar-supabase--auth)
- [Ícones e fontes (Tabler / Google Fonts)](#ícones-e-fontes-tabler--google-fonts)
- [Teste e build](#teste-e-build)
- [Depuração & Troubleshooting](#depuração--troubleshooting)
- [Contribuir](#contribuir)
- [Licença](#licença)

---

## Características

- Login com Supabase (email/senha + OAuth Google)
- Registo e gestão de entradas de tempo
- Painel de notas com marcação e ordenação
- Importação de feriados públicos via API (Nager.Date)
- Temas personalizados e seleção de fontes
- Export/import de preferências para sincronização com Supabase

## Tecnologias

- React + TypeScript
- Vite
- Supabase (Auth + armazenamento de prefs)
- Tabler Icons (icon-font via CSS)

## Estrutura do projeto (destacados)

- [src/App.tsx](src/App.tsx) — entrypoint da aplicação
- [src/context/AppContext.tsx](src/context/AppContext.tsx) — Provider e estado global
- [src/components/Auth/Auth.tsx](src/components/Auth/Auth.tsx) — tela de login e registo
- [src/components/Layout/Topbar.tsx](src/components/Layout/Topbar.tsx) — topo / menus
- [src/components/Settings/Settings.tsx](src/components/Settings/Settings.tsx) — painel de configurações
- [src/supabase/supabaseClient.ts](src/supabase/supabaseClient.ts) — cliente supabase
- [src/components/Auth/Auth.css](src/components/Auth/Auth.css) — estilos do login

Use estes arquivos como ponto de partida para entender fluxos e personalizações.

## Pré-requisitos

- Node.js 18+ (recomendado) — versões antigas do Node podem falhar na build devido a operadores sintáticos modernos (ex.: `??=`).
- npm ou yarn
- Conta e projeto Supabase configurado

## Configuração e execução

1. Clone o repositório e instale dependências:

```bash
git clone <repo-url>
cd time-tracker-react
npm install
# ou
# yarn
```

2. Variáveis de ambiente

Crie um ficheiro `.env.local` na raíz com as chaves do Supabase:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
# Opcional (redirects para OAuth)
VITE_APP_URL=http://localhost:5173
```

3. Executar em modo desenvolvimento:

```bash
npm run dev
# ou
# yarn dev
```

4. Build de produção:

```bash
npm run build
npm run preview
```

## Configurar Supabase / Auth

- No dashboard do Supabase ative o provider Google (Auth → Providers) e adicione a URI de redirect igual a `VITE_APP_URL` (ex.: `http://localhost:5173`).
- Certifique-se de que as keys em `.env.local` correspondem ao projeto do Supabase.
- O app guarda preferências no Supabase quando um usuário está autenticado.

## Ícones e fontes (Tabler / Google Fonts)

- Tabler Icons: a app usa a icon-font de Tabler (classes `ti ti-*`). Para garantir que as icons apareçam em produção, inclua o CSS/font em `index.html` ou importe via CDN: ex.:

```html
<!-- index.html -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabler-icons@latest/iconfont/tabler-icons.min.css">
```

- Fonts: o seletor de fontes já injeta links do Google Fonts (Inter, Nunito, Geist) quando necessário; não é preciso adicionar manualmente.

## Teste e build

- Tipos: `npm run tsc` (o `build` já executa `tsc` antes do `vite build`).
- Build: `npm run build` → gera assets para produção.

## Depuração & Troubleshooting

- Erro na build: `SyntaxError: Unexpected token '??='` — significa que a versão do Node é antiga; instale Node >= 18. Para trocar com `nvm`:

```bash
nvm install 18
nvm use 18
npm install
npm run build
```

- Problemas com OAuth (Google): verifique a URI de redirect e as credenciais no painel do Google Cloud e no Supabase.
- Reset de preferências locais (testar comportamento login): limpar `localStorage` no browser ou executar no console:

```js
localStorage.removeItem('tt_last_auth_provider');
localStorage.removeItem('tt_last_auth_email');
```

## Contribuir

- Fork → branch feature → PR.
- Execute linters e `npm run build` antes de abrir PR.
- Siga o padrão de código em TypeScript e mantenha alterações de estilo em `src/components/*/*.css` quando possível.

## Checklist de revisão antes de PR

- [ ] Testes locais (compilação e navegação nas páginas principais)
- [ ] Verificou autenticação (login/registo + OAuth)
- [ ] Nenhum segredo deixado em `.env` ou código

## Licença

Escolha uma licença, por exemplo MIT. Adicione `LICENSE` com o texto apropriado.

---

Se quiser, faço também:

- adicionar badges (build, license)
- gerar um `LICENSE` (MIT)
- adicionar um `CONTRIBUTING.md` e `CODE_OF_CONDUCT.md`

Diz-me o que preferes e eu faço.
