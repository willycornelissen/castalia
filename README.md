# Castalia — Ghost Newspaper Clone (Firebase Hosting + Firebase)

Aplicação Single-Page Application (SPA) inspirada no CMS **Ghost** e no tema editorial **Newspaper**, desenvolvida com **React + TypeScript + Vite + Tailwind CSS**, hospedada no **Firebase Hosting** (`https://castalia.web.app`) e com backend no **Firebase** (**Cloud Firestore**, **Firebase Authentication** e opcionalmente **Firebase Storage**).

## Arquitetura

- **Leitor Público (`/`, `/post/:slug`, `/tag/:tag`)**:
  - Estética editorial clássica (masthead com fonte `chomsky.otf`, ticker *Últimas*, grid jornalístico de 3 colunas, leitura de artigos em Markdown sanitizado com `rehype-sanitize`).
  - Cache offline persistente do Firestore (`persistentLocalCache` + `persistentMultipleTabManager`).
- **Painel Administrativo (`/admin/login`, `/admin`, `/admin/editor`, `/admin/editor/:slug`)**:
  - Carregado sob demanda via `React.lazy()` + `Suspense` e protegido por `AuthGuard` e regras de segurança Firebase baseadas no `ADMIN_UID`.
  - Editor Markdown com preview ao vivo, seleção de tags, upload/compressão WebP client-side ou URL externa de imagens, e trava de slug após publicação.
- **Firebase Hosting + URLs Limpas (`https://castalia.web.app`)**:
  - `vite.config.ts` usa `base: '/'` por padrão.
  - `firebase.json` configura o target `castalia` (mapeado em `.firebaserc` para o site `castalia` no projeto `castalia-5a039`) com rewrite nativo `** -> /index.html`, headers de segurança e cache imutável de 1 ano para assets estáticos e fontes.

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

- Build de produção (gera `dist/` configurado para `/` em `https://castalia.web.app`):
  ```bash
  npm run build
  ```

## Deploy do Backend Firebase (Regras e Índices)

Certifique-se de ter feito `firebase login` e configurado o projeto em `.firebaserc` (`castalia-5a039`):

- **Apenas Firestore (plano gratuito Spark, sem Storage/Blaze):**
  ```bash
  npm run deploy:firestore
  ```
- **Firestore + Storage (caso tenha ativado o Firebase Storage):**
  ```bash
  npm run deploy:rules
  ```

## Deploy no Firebase Hosting (`castalia.web.app`)

### Opção 1: Publicação direta pelo terminal (usa o `.env` local)
1. Certifique-se de estar autenticado na CLI do Firebase (`firebase login`).
2. Execute:
   ```bash
   npm run deploy:hosting
   ```
3. Acesse `https://castalia.web.app/`.

### Opção 2: Publicação automática via GitHub Actions
1. No GitHub (**Settings → Secrets and variables → Actions**), cadastre os secrets:
   - `FIREBASE_SERVICE_ACCOUNT_CASTALIA_5A039` (JSON da service account com permissão *Firebase Hosting Admin*)
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_ADMIN_UID`
2. Cada `git push` na branch `main` fará build e deploy automaticamente em `https://castalia.web.app` por meio de `.github/workflows/deploy-firebase-hosting.yml`.

> **Importante (Firebase Auth):** no Firebase Console, em **Authentication → Settings → Authorized domains**, confirme que `castalia.web.app` está listado para permitir login no `/admin/login`.
