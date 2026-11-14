# Consolidated Review Report: EGM Goldfish Review Protocol

**Documento Auditado:** [docs/designs/ghost_clone_spa.md](file:///home/willy/Dablio/castalia/docs/designs/ghost_clone_spa.md)  
**Data:** 14/11/2026  
**Avaliadores (Enxame Goldfish):**
1. `egm-zoom-out` (Skeptical Architect - Initial & Intermediate)
2. `egm-comprehension` (Naive Reader / Comprehension Auditor)
3. `egm-design` (Hostile Architecture & Security Critic)
4. `egm-implementation-readiness` (Pragmatic Tech Lead & Senior Implementer)

---

## 1. Executive Summary & Veredito Consolidado

* **Veredito Geral:** **APROVADO COM CONDICIONANTES (Conditional Pass / 4.2 de 5.0)**
* **Avaliação Arquitetural:**
  A decisão de migrar para o **Firebase Hosting** e colapsar o banco de dados em uma **coleção única (`/posts/{slug}`)** foi amplamente elogiada por todos os revisores, eliminando custos fixos, servidores Linux e os gargalos do hack de 404 do GitHub Pages.
* **Pontos de Ajuste Obrigatórios:**
  Para autorizar a implementação sem retrabalho ou riscos de cota, os revisores identificaram 4 pontos que exigem ajuste cirúrgico no documento de design:
  1. **Desacoplamento do Caminho de Armazenamento de Imagens**: Mudar de `/posts/{slug}/images/` para `/media/{timestamp}-{filename}.webp`, permitindo uploads imediatos em rascunhos antes da digitação do título ou definição do slug.
  2. **Imutabilidade de Slugs Publicados**: Travar o slug após a publicação de um artigo, eliminando quebra de links externos e a complexidade de recriar chaves primárias no Firestore.
  3. **Harness de Testes TDD e Arquivos de Ambiente no Inventário**: Incluir explicitamente `vitest.config.ts`, `setupTests.ts`, `.env.example`, `vite-env.d.ts` e `AuthContext.tsx` no inventário de arquivos.
  4. **Proteção de Quota de Egress do Storage**: Reduzir thumbnails de cards para `<60 kB`, configurar cabeçalhos `Cache-Control: public, max-age=31536000, immutable` no upload e ajustar as regras do Firestore para checar `!exists(...)` e tratar `resource == null` em rotas 404.

---

## 2. Matriz de Rastreabilidade de Achados (Traceability Matrix)

| ID | Severidade | Revisor(es) | Escopo / Linhas | Descrição do Achado | Ação de Resolução |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | 🔴 Blocker | `implementation-readiness` | L322, L331, L335 | Ausência de arquivos de teste no inventário (paradoxo TDD) | Mover testes para a Fase 2 e adicionar `vitest.config.ts`, `setupTests.ts` e testes unitários no inventário. |
| **B2** | 🔴 Blocker | `design`, `comprehension` | L214, L235 | Injeção estática do `ADMIN_UID_ENV_PLACEHOLDER` | Documentar o script de substituição ou uso de Custom Claims / UID fixo no `firestore.rules`. |
| **B3** | 🔴 Blocker | `design` | L29, L240, L251 | Risco de estouro do limite de 1 GB/mês de egress do Storage | Adicionar cache imutável nos uploads e limitar thumbnails de cards a `<60 kB`. |
| **B4** | 🔴 Blocker | `design`, `zoom-out` | L298, L37 | Contradição sobre OpenGraph na SPA | Documentar expressamente que na V1 a SPA não faz pré-renderização de cards sociais dinâmicos. |
| **M1** | 🟡 Major | `zoom-out`, `comprehension`, `implementation-readiness` | L166, L257, L385 | Acoplamento de storage ao slug e mutação de slugs | Tornar slugs imutáveis após publicação e mudar pasta de imagens para `/media/**`. |
| **M2** | 🟡 Major | `implementation-readiness` | L358, L381 | Race condition na hidratação do login no `AuthGuard` | Adicionar `src/context/AuthContext.tsx` com estado explícito de `loading`. |
| **M3** | 🟡 Major | `design` | L208-L227 | Erro de regra do Firestore em slugs inexistentes (`resource == null`) | Ajustar regra com `allow get: if resource == null || ...` e `!exists(...)` no create. |
| **M4** | 🟡 Major | `zoom-out` | L87, L109, L359 | Risco de estouro de conexões simultâneas (100 conexões Spark) | Cravar uso de consultas pontuais `getDocs()` com cache persistente no leitor. |
| **M5** | 🟡 Major | `implementation-readiness` | L350 | Ausência de utilitários no inventário de arquivos | Adicionar `src/utils/slugify.ts`, `readingTime.ts` e `formatDate.ts`. |
| **N1** | 🟢 Nit | `zoom-out` | L382 | Feature especulativa de Analytics no admin | Remover "Analytics summary" da V1 (YAGNI). |
| **N2** | 🟢 Nit | `comprehension` | L364 | Origem do `newspaper.zip` não contextualizada | Documentar que o arquivo é um asset local na raiz do repositório. |
| **N3** | 🟢 Nit | `implementation-readiness` | L366 | Discrepância de `admin.css` | Unificar estilização do admin via classes utilitárias do Tailwind CSS. |

---

## 3. Plano de Ajustes Cirúrgicos no Documento de Design

Para transformar o design doc em **100% pronto para codificação (GO)**, aplicaremos as seguintes alterações em `docs/designs/ghost_clone_spa.md`:

1. **Seção de Armazenamento e Regras de Segurança**:
   * Desacoplar imagens para o caminho neutro `/media/{timestamp}-{filename}.webp`.
   * Atualizar `storage.rules` para:
     ```javascript
     match /media/{allImages=**} {
       allow read: if true;
       allow write: if isAdmin() 
                    && request.resource.size < 1 * 1024 * 1024 
                    && request.resource.contentType.matches('image/(jpeg|png|webp)');
     }
     ```
   * Atualizar `firestore.rules` com validação de campos, proteção de 404 (`resource == null`) e trava contra sobreescrita (`!exists(...)`).
2. **Ciclo de Vida do Slug**:
   * Adicionar a regra: *"Slugs são gerados a partir do título e podem ser editados enquanto o post for rascunho (`draft`). Uma vez publicado (`published`), o slug torna-se estritamente imutável para preservar permalinks."*
3. **Inventário de Arquivos do Plano de Implementação**:
   * Adicionar `.env.example`, `src/vite-env.d.ts`.
   * Adicionar `src/context/AuthContext.tsx`.
   * Adicionar `src/utils/slugify.ts`, `src/utils/readingTime.ts` e `src/utils/formatDate.ts`.
   * Adicionar o harness de testes: `vitest.config.ts`, `src/setupTests.ts`, `tests/services/posts.service.test.ts` e `tests/components/PostContent.test.tsx`.
   * Antecipar a montagem dos testes unitários para a Fase 2 (TDD).
4. **Poda de Escopo (YAGNI)**:
   * Remover referência a "Analytics summary" no painel admin.
