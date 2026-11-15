# Castalia — Ghost Newspaper Clone (GitHub Pages + Firebase)

Aplicação Single-Page Application (SPA) inspirada no CMS **Ghost** e no tema editorial **Newspaper**, desenvolvida com **React + TypeScript + Vite + Tailwind CSS**, pronta para publicação no **GitHub Pages** (com migração opcional para Firebase Hosting) e backend no **Firebase** (**Cloud Firestore**, **Firebase Authentication** e opcionalmente **Firebase Storage**).

## Arquitetura

- **Leitor Público (`/`, `/post/:slug`, `/tag/:tag`)**:
  - Estética editorial clássica (masthead com fonte `chomsky.otf`, ticker *Últimas*, grid jornalístico de 3 colunas, leitura de artigos em Markdown sanitizado com `rehype-sanitize`).
  - Cache offline persistente do Firestore (`persistentLocalCache` + `persistentMultipleTabManager`).
- **Painel Administrativo (`/admin/login`, `/admin`, `/admin/editor`, `/admin/editor/:slug`)**:
  - Carregado sob demanda via `React.lazy()` + `Suspense` e protegido por `AuthGuard` e regras de segurança Firebase baseadas no `ADMIN_UID`.
  - Editor Markdown com preview ao vivo, seleção de tags, upload/compressão WebP client-side ou URL externa de imagens, e trava de slug após publicação.
- **GitHub Pages + URLs Limpas**:
  - `vite.config.ts` usa `base: '/castalia/'` em builds de produção (configurável via `VITE_BASE_PATH=/` para domínios customizados na raiz ou Firebase Hosting).
  - `BrowserRouter` usa `basename={import.meta.env.BASE_URL}` combinado com `public/404.html` + restauração de rota em `index.html` e `public/.nojekyll` para suportar URLs limpas no GitHub Pages.

## Configuração Inicial

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie o arquivo `.env` a partir do template `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Preencha no `.env` as credenciais do seu projeto Firebase (`VITE_FIREBASE_*`) e o UID do administrador único:
   ```env
   ADMIN_UID=seu_uid_do_firebase_auth
   VITE_FIREBASE_ADMIN_UID=seu_uid_do_firebase_auth
   ```

4. Ajuste os metadados editoriais (título do jornal, descrição, barra de anúncios, redes sociais e links do rodapé) em `src/config/site.config.ts`.

## Desenvolvimento e Testes

- Servidor local de desenvolvimento:
  ```bash
  npm run dev
  ```

- Suíte de testes unitários e de componentes:
  ```bash
  npm test
  ```

- Cobertura de testes (limites mínimos: 80% linhas/funções/instruções, 75% branches):
  ```bash
  npm run test:coverage
  ```

- Build de produção (gera `dist/` configurado para `/castalia/`):
  ```bash
  npm run build
  ```

## Deploy do Backend Firebase (Regras e Índices)

Certifique-se de ter feito `firebase login` e `firebase use --add`:

- **Apenas Firestore (plano gratuito Spark, sem Storage/Blaze):**
  ```bash
  npm run deploy:firestore
  ```
- **Firestore + Storage (caso tenha ativado o Firebase Storage):**
  ```bash
  npm run deploy:rules
  ```

## Deploy no GitHub Pages

### Opção 1: Publicação direta pelo terminal (usa o `.env` local)
1. Execute:
   ```bash
   npm run deploy:gh-pages
   ```
2. No GitHub (**Settings → Pages**), selecione **Deploy from a branch** → branch **`gh-pages`** → pasta **`/ (root)`**.
3. Acesse `https://willycornelissen.github.io/castalia/`.

### Opção 2: Publicação automática via GitHub Actions
1. No GitHub (**Settings → Secrets and variables → Actions**), cadastre os secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_ADMIN_UID`
2. Em **Settings → Pages**, selecione **Source: GitHub Actions**.
3. Cada `git push` na branch `main` fará build e deploy automaticamente por meio de `.github/workflows/deploy-gh-pages.yml`.

> **Importante (Firebase Auth):** no Firebase Console, em **Authentication → Settings → Authorized domains**, adicione `willycornelissen.github.io` para permitir login no `/admin/login` quando hospedado no GitHub Pages.
