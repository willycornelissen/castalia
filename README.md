# Castalia — Ghost Newspaper Clone (Firebase Hosting SPA)

Aplicação Single-Page Application (SPA) inspirada no CMS **Ghost** e no tema editorial **Newspaper**, desenvolvida com **React + TypeScript + Vite + Tailwind CSS** e hospedada no **Firebase Hosting** utilizando **Cloud Firestore**, **Firebase Authentication** e **Firebase Storage**.

## Arquitetura

- **Leitor Público (`/`, `/post/:slug`, `/tag/:tag`)**:
  - Estética editorial clássica (masthead com fonte `chomsky.otf`, ticker *Últimas*, grid jornalístico de 3 colunas, leitura de artigos em Markdown sanitizado com `rehype-sanitize`).
  - Cache offline persistente do Firestore (`persistentLocalCache` + `persistentMultipleTabManager`).
- **Painel Administrativo (`/admin/login`, `/admin`, `/admin/editor`, `/admin/editor/:slug`)**:
  - Carregado sob demanda via `React.lazy()` + `Suspense` e protegido por `AuthGuard` e regras de segurança Firebase baseadas no `ADMIN_UID`.
  - Editor Markdown com preview ao vivo, seleção de tags, upload e compressão automática de imagens em WebP no cliente (`browser-image-compression`), e trava de slug após publicação.
- **Hospedagem e URLs Limpas**:
  - `firebase.json` reescreve todas as rotas (`**`) para `/index.html` com suporte a `BrowserRouter` e cache imutável para assets estáticos.

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
   ```

4. Ajuste os metadados editoriais (título do jornal, descrição, barra de anúncios, redes sociais e links do rodapé) em `src/config/site.config.ts`.

## Desenvolvimento e Testes

- Iniciar servidor local de desenvolvimento:
  ```bash
  npm run dev
  ```

- Executar suíte de testes unitários e de componentes:
  ```bash
  npm test
  ```

- Verificar cobertura de testes (limites mínimos configurados no Vitest: 80% linhas/funções/instruções, 75% branches):
  ```bash
  npm run test:coverage
  ```

- Build de produção com verificação de tipos TypeScript:
  ```bash
  npm run build
  ```

## Deploy no Firebase

Certifique-se de ter o Firebase CLI autenticado (`firebase login`) e o projeto vinculado (`firebase use <project-id>`):

1. **Publicar Regras de Segurança (Firestore + Storage)** — aplica `ADMIN_UID` do `.env` e faz deploy das regras:
   ```bash
   npm run deploy:rules
   ```

2. **Publicar Aplicação SPA no Firebase Hosting**:
   ```bash
   npm run deploy:hosting
   ```
