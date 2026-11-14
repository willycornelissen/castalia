# RFC / Concept Brief: Ghost Clone (SPA + Firebase) — Versão Refinada Pós-Revisão

* **Autor**: Willy Garabini Cornelissen
* **Status**: Aprovado para Drafting
* **Data**: 14/11/2026

## 1. Contexto e Visão Geral
* **Objetivo**: Criar uma aplicação web no formato SPA (Single Page Application) que funcione como um clone estético e funcional do Ghost (motor de blog e painel administrativo minimalista), baseada no tema [Newspaper v1.1.3](file:///home/willy/Dablio/castalia/newspaper.zip) e utilizando **Firebase** como backend sem servidor (Backend-as-a-Service) e plataforma de hospedagem unificada (**Firebase Hosting**).
* **Stack Tecnológico Base**: **React + TypeScript + Vite + Firebase SDK v10+** (Auth, Firestore, Storage, Hosting).
* **Identidade Visual**: Estética editorial de jornal tradicional (tipografia serifada, fonte `Chomsky` para o masthead, grid editorial clássico, barra de notícias/ticker).
* **Público e Acesso**:
  * **Leitores**: Acesso 100% público a artigos publicados. Sem paywall, sem membros, sem newsletter e sem comentários.
  * **Administrador**: Gestão de publicações através de um painel de controle inspirado no Ghost Admin, protegido por autenticação Firebase Auth (usuário único / blog pessoal).

---

## 2. Síntese da Auditoria Imparcial Goldfish

A hipótese inicial passou por auditoria paralela de 3 subagentes independentes:
* **`egm-zoom-out` (Skeptical Architect)**: Recomendou colapsar o Firestore em **uma única coleção (`posts`)**, transformar autor e configurações em arquivo estático (`site.config.ts`), cortar agendamento e apontou a superioridade do Firebase Hosting sobre o hack de 404 do GitHub Pages.
* **`egm-design` (Hostile Critic)**: Alertou para risco de estouro de cota do Firestore (50k reads/dia) e Storage (1 GB/mês), ausência de regras do Storage, risco de XSS no Markdown, falha de OpenGraph em redes sociais e a necessidade de usar o próprio `slug` como ID do documento para garantir unicidade atômica.
* **`egm-implementation-readiness` (Tech Lead)**: Apontou ausência de especificação do upload de imagens inline no Markdown, falta de mecanismo de preview de rascunhos, dependência ambígua de Fuse.js e necessidade de travar o UID do admin diretamente nas regras.

---

## 3. Decisões Arquiteturais Refinadas

### 3.1. Modelo de Hospedagem e Roteamento (Firebase Hosting)
* **Hospedagem Unificada**: **Firebase Hosting** nativo (`firebase.json` com `rewrites: [{ "source": "**", "destination": "/index.html" }]`). Elimina o hack de 404 do GitHub Pages, fornece SSL automático, CDN global do Google e suporte nativo ao `BrowserRouter` do React.
* **Code-Splitting Estrito**: A rota `/admin` será carregada via `React.lazy()` / dynamic import. O visitante público baixa apenas o bundle leve do leitor (<100 kB), sem carregar bibliotecas pesadas de edição de Markdown.

### 3.2. Simplificação Radical do Banco de Dados (Firestore NoSQL)
* **Coleção Única**: Apenas `posts/`.
* **Configurações e Autor**: Eliminadas coleções `settings` e `authors`. As informações do blog e do autor único ficam em um arquivo estático versionado no repositório (`src/config/site.config.ts`).
  * *Vantagem*: Zero leituras consumidas do Firestore para renderizar cabeçalho, rodapé, bio do autor e redes sociais.
* **Tags**: Armazenadas como array simples de strings no documento do post: `tags: ["tecnologia", "politica"]`. Eliminado CRUD complexo de tags no MVP.
* **Chave Primária Atômica (Garantia de Unicidade de Slug)**:
  * O Document ID do Firestore DEVE ser o próprio `slug` sanitizado: `/posts/{slug}`.
  * Garante unicidade nativa no banco (se tentar salvar o mesmo slug, o Firestore detecta colisão), elimina a necessidade de índices secundários e permite leitura direta $O(1)$ em `/post/:slug`.

### 3.3. Ciclo de Vida do Post e Escopo Podado (YAGNI)
* **Status**: Apenas `"draft"` ou `"published"`.
* **Corte de Publicação Agendada**: Removida do escopo da V1. Em uma SPA sem workers de background, agendamento exigiria Cloud Functions ativas ou filtros complexos de timestamp que mascaram posts na API.
* **Mecânica de Preview de Rascunho**:
  * O autor autenticado pode visualizar o post em tempo real diretamente no Editor do Admin via modo *Preview* que reusa o mesmo componente visual de leitura do tema Newspaper.
  * Para visualização em tela cheia, a rota `/post/:slug` aceitará exibir rascunhos se e somente se o usuário logado for o administrador.

### 3.4. Pipeline de Mídia e Imagens (Firebase Storage)
* **Compressão no Cliente**: Antes do envio para o Firebase Storage, as imagens passam por compressão client-side (via `browser-image-compression`) convertendo para WebP com resolução máxima de 1600px e tamanho inferior a 400 kB.
  * *Impacto*: Evita estourar o limite gratuito de 1 GB/mês de tráfego de saída do Firebase Storage.
* **Uploads no Editor**:
  * *Feature Image*: Campo dedicado no painel lateral do post.
  * *Inline Images*: Suporte a drag-and-drop / seleção de arquivo na barra de ferramentas do Markdown, gerando o upload para `/posts/{slug}/images/{filename}` e injetando a tag `![alt](url)` no texto.

### 3.5. Busca Simplificada
* **Filtro Local (Client-Side)**: Em vez de baixar todos os posts para rodar Fuse.js (o que esgotaria cotas de leitura), a busca na V1 fará busca instantânea em memória sobre os posts já carregados na página ou uma consulta leve limitada por prefixo de título.

---

## 4. Segurança, Permissões e Sanitização

### 4.1. Regras do Cloud Firestore (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.uid == "ADMIN_UID_SUBSTITUIR";
    }

    match /posts/{slug} {
      allow read: if resource.data.status == 'published' || isAdmin();
      allow create, update, delete: if isAdmin();
    }
  }
}
```

### 4.2. Regras do Firebase Storage (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && request.auth.uid == "ADMIN_UID_SUBSTITUIR";
    }

    match /posts/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin()
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 4.3. Prevenção de XSS no Markdown
* Toda renderização de Markdown no Leitor e no Admin utilizará um pipeline seguro com sanitização ativa (ex.: `react-markdown` acompanhado de `rehype-sanitize` e `remark-gfm`).
* Injeção de tags `<script>` ou iframes não autorizados é descartada em tempo de renderização.

### 4.4. Controle de Acesso e Auto-Registro no Firebase Auth
* A criação de contas públicas será **desativada** no Firebase Console. Apenas o e-mail do administrador será cadastrado previamente. A tela de login do Admin não conterá opção de "Criar Conta" / Sign-up.

---

## 5. Estrutura do Modelo de Dados

### Coleção `posts`
* **Document ID**: `slug` (ex.: `"meu-primeiro-artigo"`)
* **Campos**:
  * `title`: string
  * `slug`: string
  * `content_markdown`: string
  * `excerpt`: string
  * `feature_image`: string (URL Firebase Storage)
  * `status`: `"draft" | "published"`
  * `tags`: array de strings (ex.: `["editorial", "tecnologia"]`)
  * `reading_time`: number (minutos calculados automaticamente)
  * `published_at`: timestamp
  * `created_at`: timestamp
  * `updated_at`: timestamp
