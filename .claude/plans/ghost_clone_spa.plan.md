# Implementation Plan: Ghost Clone SPA (Firebase + Newspaper Theme)

## Overview
This implementation plan establishes a personal publishing platform marrying the classic Ghost Newspaper editorial aesthetic (v1.1.3, Chomsky masthead, 3-column layout) with a distraction-free, authenticated Ghost-like admin dashboard. Built as a zero-maintenance React 18/19 Single Page Application (SPA) deployed to Firebase Hosting, it integrates Cloud Firestore (single `/posts/{slug}` collection), Firebase Authentication (single-administrator access), and Firebase Storage with client-side WebP compression (<400 kB) to operate permanently within the Firebase free tier.

## Requirements
- **Hosting & Routing**: Vite + React SPA on Firebase Hosting with native rewrites (`** -> /index.html`) to support direct deep linking (CUJ 3) without 404 flicker.
- **Visual Design**: Faithful reproduction of the Newspaper theme aesthetic using `chomsky.otf` (extracted from `newspaper.zip`), editorial typography (EB Garamond, Open Sans), breaking news ticker, and multi-column article grids.
- **Admin Authoring**: Private, lazy-loaded `/admin` workspace featuring Markdown editing with live split preview, tags, excerpt customization, and client-side WebP image conversion.
- **Security & Data Integrity**: Single-author security model enforced at Firestore and Firebase Storage security rule levels; public registrations disabled; immutable slugs on publication; XSS-safe Markdown rendering (`rehype-sanitize`).
- **Performance & Quotas**: Point-in-time Firestore queries (`limit <= 20`) with persistent IndexedDB caching; client-side image compression (<400 kB hero, <60 kB thumbnail) with immutable Cache-Control headers to safeguard free-tier egress.
- **Testing & Quality**: Strict Test-Driven Development (TDD: Red -> Green -> Refactor) with $\ge 80\%$ test coverage on domain logic, services, and core UI components.

## Architecture Changes
- `package.json`, `tsconfig.json`, `vite.config.ts`: Scaffold Vite + React + TypeScript with `@/*` path aliases, Tailwind CSS, Firebase SDK v10, and Rollup chunk splitting to isolate `/admin`.
- `vitest.config.ts`, `src/setupTests.ts`: Vitest test harness with jsdom and Testing Library.
- `firebase.json`: Hosting configuration with SPA rewrite rules and aggressive cache headers for static fonts and media.
- `firestore.rules`: Security rules enforcing single admin write, atomic create (`!exists`), slug document ID immutability, and safe queries.
- `storage.rules`: Security rules enforcing admin-only upload to `/media/`, size < 1MB, and image MIME verification.
- `src/config/site.config.ts`: Zero-read static configuration for site identity, navigation, and author profile.
- `src/services/firebase.ts`: Singleton initializing Auth, Firestore (with `persistentLocalCache`), and Storage.
- `src/services/posts.service.ts`: Point-in-time Firestore CRUD with slug uniqueness and limit guardrails.
- `src/services/storage.service.ts`: Client WebP compression pipeline uploading to `/media/{timestamp}-{filename}.webp`.
- `src/components/reader/*`: Public editorial components (Masthead, AnnouncementBar, ArticleCard, ArticleGrid, PostContent, Footer).
- `src/components/admin/*`: Lazy-loaded administrative workspace (AuthGuard, AdminLayout, PostList, PostEditor, PostSettingsSidebar, ImageUploader).

---

## Implementation Steps

### Phase 1: Project Initialization, Build Harness & Routing Shell
1. **Scaffold Project Manifest & Dependencies** (File: `package.json`)
   - Action: Define React 18/19, Vite, TypeScript, Tailwind CSS, Lucide icons, `firebase`, `browser-image-compression`, `react-markdown`, `remark-gfm`, `rehype-sanitize`, Vitest, `@testing-library/react`, `@testing-library/jest-dom`, and jsdom.
   - Why: Establishes all production and development dependencies required by the specification.
   - Dependencies: None
   - Complexity: Low
   - Risk: Low

2. **Configure TypeScript and Path Aliases** (Files: `tsconfig.json`, `tsconfig.node.json`, `src/vite-env.d.ts`)
   - Action: Configure strict type checking, ESNext targets, and path resolution for `@/*` mapped to `./src/*`. Declare Vite environment variable types.
   - Why: Ensures type safety and consistent module resolution across tests and application code.
   - Dependencies: Step 1
   - Complexity: Low
   - Risk: Low

3. **Set Up Vitest Test Runner** (Files: `vitest.config.ts`, `src/setupTests.ts`)
   - Action: Configure Vitest with `jsdom` environment, `@/*` alias resolution, coverage thresholds ($\ge 80\%$), and Testing Library DOM matchers in `setupTests.ts`.
   - Why: Enables immediate TDD workflow for all subsequent phases.
   - Dependencies: Steps 1-2
   - Complexity: Low
   - Risk: Low

4. **Extract Theme Font & Configure Styling** (Files: `src/assets/fonts/chomsky.otf`, `tailwind.config.js`, `postcss.config.js`, `src/assets/css/index.css`, `src/assets/css/newspaper.css`, `index.html`)
   - Action: Unpack `newspaper.zip` to extract `chomsky.otf` into `src/assets/fonts/`. Configure Tailwind theme with Chomsky, EB Garamond, and Open Sans fonts, editorial background (`#F6F6F6`), and text (`#222222`). Define `@font-face` rules in `index.css`.
   - Why: Fulfills the Newspaper theme visual identity requirement before UI components are styled.
   - Dependencies: Step 1
   - Complexity: Medium
   - Risk: Low

5. **Configure Firebase Infrastructure & Rules** (Files: `firebase.json`, `firestore.rules`, `storage.rules`, `.env.example`, `scripts/deploy-rules.mjs`)
   - Action: Configure `firebase.json` with SPA rewrite to `/index.html` and 1-year immutable cache headers for fonts and media. Write `firestore.rules` (single admin UID, atomic create, safe read) and `storage.rules` (media size <1MB, image MIME). Create rule deployment script with `ADMIN_UID` substitution.
   - Why: Hardens backend security boundaries and prevents SPA 404 refresh bugs from the start.
   - Dependencies: Step 1
   - Complexity: Medium
   - Risk: Medium (Rules must correctly allow `resource == null` safe reads for 404 detection without throwing permission denials).

6. **Create Base Routing Shell & HTML Entrypoint** (Files: `index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`)
   - Action: Configure Vite bundler with `@/*` aliases and Rollup chunk isolation for admin routes. Mount React root with `BrowserRouter` in `App.tsx` with placeholder routes (`/`, `/post/:slug`, `/tag/:tag`, `/admin/*`).
   - Why: Provides the routing context required by all link-bearing components.
   - Dependencies: Steps 2-4
   - Complexity: Low
   - Risk: Low

---

### Phase 2: Core Domain Models, Utilities & Service Layer (TDD)
7. **Define Post & Site Types and Static Config** (Files: `src/types/post.ts`, `src/types/site.ts`, `src/config/site.config.ts`)
   - Action: Define `Post`, `PostStatus` (`"draft" | "published"`), `CreatePostDTO`, `UpdatePostDTO`, and `SiteConfig` interfaces. Populate `site.config.ts` with static author profile, blog metadata, and navigation links.
   - Why: Single-author static configuration eliminates unnecessary Firestore reads, protecting the 50,000 daily read quota.
   - Dependencies: Step 2
   - Complexity: Low
   - Risk: Low

8. **TDD: Slug Generator Utility** (Files: `tests/utils/slugify.test.ts`, `src/utils/slugify.ts`)
   - Action (Red -> Green -> Refactor):
     - Red: Write unit tests covering lowercasing, accent/diacritic removal, space-to-hyphen conversion, non-alphanumeric stripping, consecutive hyphen collapsing, and trimming.
     - Green: Implement `slugify` matching all test cases.
     - Refactor: Optimize regex performance and edge cases (e.g. empty inputs or trailing hyphens).
   - Why: Atomic Firestore document IDs rely on deterministic, clean URL slugs.
   - Dependencies: Step 3
   - Complexity: Low
   - Risk: Low

9. **TDD: Reading Time & Date Formatting Utilities** (Files: `tests/utils/readingTime.test.ts`, `src/utils/readingTime.ts`, `tests/utils/formatDate.test.ts`, `src/utils/formatDate.ts`)
   - Action (Red -> Green -> Refactor):
     - Red: Write tests for `readingTime` (words / 200 wpm calculation, min 1 min fallback for empty/short texts) and `formatDate` (editorial format: "Friday, November 14, 2026").
     - Green: Implement functions cleanly using standard JavaScript Date APIs.
     - Refactor: Consolidate locale formatting options.
   - Why: Reusable presentation helpers for article cards and post headers.
   - Dependencies: Step 3
   - Complexity: Low
   - Risk: Low

10. **Initialize Firebase SDK Singleton** (File: `src/services/firebase.ts`)
    - Action: Initialize Firebase app with environment variables (`import.meta.env`). Export `auth`, `storage`, and `db` initialized with `initializeFirestore` using `persistentLocalCache` and `persistentMultipleTabManager`.
    - Why: Ensures client-side offline persistence and eliminates duplicate Firestore reads across page navigations.
    - Dependencies: Steps 1, 5
    - Complexity: Medium
    - Risk: Medium (Must handle missing or invalid env variables gracefully during tests).

11. **TDD: Authentication Service & AuthContext** (Files: `tests/services/auth.service.test.ts`, `src/services/auth.service.ts`, `tests/context/AuthContext.test.tsx`, `src/context/AuthContext.tsx`)
    - Action (Red -> Green -> Refactor):
      - Red: Write tests mocking Firebase Auth for `signInWithEmailPassword`, `signOutUser`, and `AuthContext` state transitions (`user`, `loading`, `logout`).
      - Green: Implement authentication methods and `AuthProvider` utilizing `onAuthStateChanged`.
      - Refactor: Ensure initial `loading` defaults to `true` to prevent unauthorized redirects during auth resolution.
    - Why: Guarantees authenticated access control and avoids flashing login screens on browser refresh.
    - Dependencies: Steps 7, 10
    - Complexity: Medium
    - Risk: Medium

12. **TDD: Firestore Posts Service** (Files: `tests/services/posts.service.test.ts`, `src/services/posts.service.ts`)
    - Action (Red -> Green -> Refactor):
      - Red: Write tests covering:
        1. `getPublishedPosts(limitCount = 20, cursorDoc?)`: Point-in-time query with status filter and limit.
        2. `getPostBySlug(slug: string)`: Fetching `/posts/{slug}`.
        3. `getPostsByTag(tag: string, limitCount = 20)`: Tag array query.
        4. `createPost(data: CreatePostDTO)`: Slug existence check via `getDoc` before atomic `setDoc`.
        5. `updatePost(slug: string, data: UpdatePostDTO)`: Update existing document, enforcing slug immutability if published.
        6. `deletePost(slug: string)`: Document deletion.
        7. `getAllPostsAdmin()`: Unrestricted list for admin dashboard.
      - Green: Implement `posts.service.ts` using Firestore SDK v10 functions (`collection`, `query`, `where`, `orderBy`, `limit`, `getDocs`, `getDoc`, `setDoc`, `updateDoc`, `deleteDoc`).
      - Refactor: Standardize error codes and clean timestamp conversions (`Timestamp` to `Date`).
    - Why: Core data layer managing the single Firestore collection with free-tier guardrails.
    - Dependencies: Steps 7, 8, 9, 10
    - Complexity: High
    - Risk: Medium (Must mock Firestore SDK accurately in unit tests).

13. **TDD: Media Compression & Firebase Storage Service** (Files: `tests/services/storage.service.test.ts`, `src/services/storage.service.ts`)
    - Action (Red -> Green -> Refactor):
      - Red: Write tests for WebP compression parameters (maxSizeMB: 0.4 for hero, 0.06 for card, fileType: "image/webp") and storage upload paths (`/media/{timestamp}-{filename}.webp`) with Cache-Control metadata.
      - Green: Implement `compressAndUploadMedia` using `browser-image-compression` and `uploadBytesResumable` / `getDownloadURL`. Implement cascade delete helper `deleteMediaByUrl`.
      - Refactor: Add upload progress callback support.
    - Why: Strictly enforces <400 kB file size to keep total bandwidth within the 1 GB/month free tier egress limit.
    - Dependencies: Steps 7, 10
    - Complexity: Medium
    - Risk: Low

---

### Phase 3: Public Reader Interface (Newspaper Theme)
14. **Create Tag Badge & Colophon Footer** (Files: `src/components/reader/TagBadge.tsx`, `src/components/reader/Footer.tsx`)
    - Action: Build `TagBadge` for category chips with hover transitions and link to `/tag/:tag`. Build `Footer` displaying colophon, author biography, static navigation links, and copyright notice from `siteConfig`.
    - Why: Shared visual anchors across all reader pages.
    - Dependencies: Steps 4, 7
    - Complexity: Low
    - Risk: Low

15. **Build Masthead & Breaking News Announcement Bar** (Files: `src/components/reader/Masthead.tsx`, `src/components/reader/AnnouncementBar.tsx`)
    - Action: Implement `Masthead` with Chomsky headline font, dynamic editorial dateline, volume/issue numbers, and horizontal separator rules. Implement `AnnouncementBar` ticker rendering the latest published headline with marquee animation.
    - Why: Recreates the defining visual identity of the Ghost Newspaper theme v1.1.3.
    - Dependencies: Steps 4, 7, 9
    - Complexity: Medium
    - Risk: Low

16. **TDD: Article Cards & Responsive Grid** (Files: `tests/components/ArticleCard.test.tsx`, `src/components/reader/ArticleCard.tsx`, `tests/components/ArticleGrid.test.tsx`, `src/components/reader/ArticleGrid.tsx`)
    - Action (Red -> Green -> Refactor):
      - Red: Write tests verifying card variant rendering (`big` for hero story with large image and excerpt, `horizontal` with side thumbnail, `small` for compact column list) and grid pagination trigger.
      - Green: Implement `ArticleCard` and `ArticleGrid` with 3-column newspaper layout and cursor-based "Carregar Mais" (Load More) pagination.
      - Refactor: Ensure image lazy-loading (`loading="lazy"`) and responsive layout breakpoints (single-column mobile, 3-column desktop).
    - Why: Delivers the core newspaper front-page reading experience.
    - Dependencies: Steps 4, 7, 9, 14
    - Complexity: Medium
    - Risk: Low

17. **TDD: Secure Markdown Post Content Renderer** (Files: `tests/components/PostContent.test.tsx`, `src/components/reader/PostContent.tsx`)
    - Action (Red -> Green -> Refactor):
      - Red: Write XSS security tests ensuring `<script>` tags, inline `onload`/`onerror` handlers, malicious `javascript:` URIs, and dangerous iframes are stripped or neutralized, while valid markdown (headings, quotes, tables, code blocks, images) renders cleanly.
      - Green: Implement `PostContent` using `react-markdown`, `remark-gfm`, and `rehype-sanitize` with customized schema for responsive images.
      - Refactor: Apply newspaper editorial prose styling (`newspaper.css` font pairing, drop-caps, styled blockquotes).
    - Why: Prevents stored XSS attacks from Markdown content while preserving elegant editorial typography.
    - Dependencies: Steps 1, 4
    - Complexity: Medium
    - Risk: High (XSS vulnerability risk mitigated by `rehype-sanitize`).

18. **Build Public Reader Pages** (Files: `src/pages/HomePage.tsx`, `src/pages/PostPage.tsx`, `src/pages/TagPage.tsx`, `src/pages/NotFoundPage.tsx`)
    - Action:
      - `HomePage`: Mounts `AnnouncementBar`, `Masthead`, fetches published articles via `posts.service`, and renders `ArticleGrid`.
      - `PostPage`: Reads `/post/:slug`, displays title, dateline, reading time, author, feature image, and `PostContent`. Supports `?preview=true` for admin draft preview. Displays clean editorial 404 state if document is not found.
      - `TagPage`: Displays tag header and filtered list of articles with pagination.
      - `NotFoundPage`: Gothic editorial "404 - Noticia Nao Encontrada" page with return home button.
    - Why: Assembles complete reader-facing journeys (CUJ 1 & CUJ 3).
    - Dependencies: Steps 12, 14, 15, 16, 17
    - Complexity: Medium
    - Risk: Low

---

### Phase 4: Admin Publishing Dashboard (Ghost Clone Experience)
19. **TDD: AuthGuard & Admin Layout Shell** (Files: `tests/components/AuthGuard.test.tsx`, `src/components/admin/AuthGuard.tsx`, `src/components/admin/AdminLayout.tsx`)
    - Action (Red -> Green -> Refactor):
      - Red: Test `AuthGuard` redirects unauthenticated users to `/admin/login`, renders spinner while `loading === true`, and passes through authenticated admin.
      - Green: Implement `AuthGuard` and `AdminLayout` with Ghost-style minimalist dark sidebar (Stories, New Post, View Site, Logout).
      - Refactor: Add active link highlighting and responsive mobile drawer toggle.
    - Why: Secures administrative surface against unauthorized visitors.
    - Dependencies: Steps 11, 14
    - Complexity: Medium
    - Risk: Low

20. **TDD: Administrator Login View** (Files: `tests/pages/AdminLoginPage.test.tsx`, `src/pages/AdminLoginPage.tsx`)
    - Action (Red -> Green -> Refactor):
      - Red: Test form submission with email/password, error message display on invalid credentials, and navigation to `/admin` on success. Test `<meta name="robots" content="noindex, nofollow">` presence.
      - Green: Implement `AdminLoginPage` with clean minimalist login card and direct auth service binding.
      - Refactor: Add rate-limiting UX feedback (disable button during pending request).
    - Why: Sole entrypoint for the blog author.
    - Dependencies: Steps 11, 19
    - Complexity: Low
    - Risk: Low

21. **Build Posts Management Dashboard** (Files: `src/components/admin/PostList.tsx`, `src/pages/AdminDashboardPage.tsx`)
    - Action: Build filterable post table (Tabs: "All", "Drafts", "Published") displaying title, slug, status badge, updated date, and quick actions (Edit, Preview, Delete). Include modal confirmation before post deletion and trigger cascade deletion of associated storage images.
    - Why: Central management hub for author content lifecycle.
    - Dependencies: Steps 12, 13, 19
    - Complexity: Medium
    - Risk: Low

22. **TDD: Image Drag-and-Drop Uploader** (Files: `tests/components/ImageUploader.test.tsx`, `src/components/admin/ImageUploader.tsx`)
    - Action (Red -> Green -> Refactor):
      - Red: Test drag-and-drop dropzone, file type validation (images only), compression triggering, progress bar rendering, and callback on upload completion.
      - Green: Implement `ImageUploader` integrating `storage.service` client WebP conversion and upload.
      - Refactor: Allow click-to-upload and preview replacement.
    - Why: Streamlines feature image and inline asset embedding directly from the browser.
    - Dependencies: Step 13
    - Complexity: Medium
    - Risk: Low

23. **Build Post Settings Flyout Drawer** (File: `src/components/admin/PostSettingsSidebar.tsx`)
    - Action: Implement collapsible drawer containing:
      - Feature image upload dropzone.
      - Slug input: Editable for `draft` posts; **disabled and locked** with explanatory badge once `published` (enforces slug immutability invariant).
      - Tags input (multi-chip editor).
      - Excerpt textarea (1–2 sentences for cards and metadata).
    - Why: Manages article metadata and enforces URL permalink stability.
    - Dependencies: Steps 8, 22
    - Complexity: Medium
    - Risk: Medium (Must prevent modifying slug on already published posts).

24. **TDD: Distraction-Free Post Editor Workspace** (Files: `tests/components/PostEditor.test.tsx`, `src/components/admin/PostEditor.tsx`, `src/pages/AdminEditorPage.tsx`)
    - Action (Red -> Green -> Refactor):
      - Red: Test title change auto-populating draft slug, Markdown input updating live preview, reading time auto-calculating, "Save Draft" triggering `posts.service.createPost`/`updatePost`, and "Publish" flipping status to `published`.
      - Green: Implement `PostEditor` with distraction-free typography, split-screen live preview (using `PostContent`), top action bar (Back, Status Indicator, Settings Toggle, Publish button), and mount in `AdminEditorPage`.
      - Refactor: Add keyboard shortcuts (`Cmd/Ctrl+S` to save draft).
    - Why: Recreates the Ghost Admin writing experience for CUJ 2.
    - Dependencies: Steps 8, 9, 12, 17, 22, 23
    - Complexity: High
    - Risk: Medium

---

### Phase 5: Code Splitting, Bundle Isolation & Performance Hardening
25. **Implement Route Code Splitting with React.lazy** (Files: `src/App.tsx`, `vite.config.ts`)
    - Action: Wrap `AdminDashboardPage`, `AdminEditorPage`, and `AdminLoginPage` in `React.lazy()` with Suspense fallback. Configure Vite Rollup `manualChunks` to isolate Firebase admin utilities and heavy editor libraries into a separate chunk.
    - Why: Guarantees the public reader bundle remains lightweight (<100 kB initial load), ensuring rapid first-contentful-paint (FCP).
    - Dependencies: Steps 6, 18, 20, 21, 24
    - Complexity: Medium
    - Risk: Low

26. **Verify Firebase Emulator & Native SPA Rewrites** (Files: `firebase.json`, `firestore.rules`, `storage.rules`)
    - Action: Test deep URL direct navigation (`/post/artigo-teste`, `/admin`, `/tag/editorial`) on the Firebase Hosting emulator to guarantee HTTP 200 without page flickers or 404 errors (verifying CUJ 3). Execute dry-run security rules tests to verify unauthorized writes are rejected.
    - Why: Validates deployment readiness against the actual Firebase runtime emulator.
    - Dependencies: Steps 5, 25
    - Complexity: Medium
    - Risk: Medium

---

### Phase 6: Verification, Documentation & Production Readiness
27. **Execute Complete Test Suite & Coverage Gate** (Files: `tests/**/*.test.ts*`)
    - Action: Run `npm run test:coverage` (or `vitest run --coverage`). Assert all tests pass and test coverage meets or exceeds the $\ge 80\%$ threshold across utils, services, and components.
    - Why: ECC and TDD engineering gate requirement.
    - Dependencies: Steps 8, 9, 11, 12, 13, 16, 17, 19, 20, 22, 24
    - Complexity: Medium
    - Risk: Low

28. **Production Build & Type Check Gate** (Files: `package.json`, `dist/`)
    - Action: Execute `npm run build` (`tsc --noEmit && vite build`). Verify zero TypeScript errors and confirm production bundle size metrics.
    - Why: Validates build harness and compiler integrity before deployment.
    - Dependencies: Steps 25, 27
    - Complexity: Low
    - Risk: Low

29. **Create Project Documentation & Setup Guide** (File: `README.md`)
    - Action: Document setup instructions, environment variable configuration (`.env`), Firebase emulator startup commands, rules deployment procedure (`npm run deploy:rules`), and author publishing guide.
    - Why: Ensures maintainability and clean handover.
    - Dependencies: Steps 5, 28
    - Complexity: Low
    - Risk: Low

---

## Testing Strategy
- **Unit Tests**:
  - `tests/utils/slugify.test.ts`: Diacritics stripping, punctuation filtering, duplicate hyphen cleanup, collision handling.
  - `tests/utils/readingTime.test.ts`: Word-to-minute ratio calculation, edge cases (empty strings, code snippets).
  - `tests/utils/formatDate.test.ts`: Editorial date formatting across locales.
  - `tests/services/storage.service.test.ts`: WebP compression parameters, upload destination path generation, metadata verification.
- **Integration Tests**:
  - `tests/services/posts.service.test.ts`: Firestore CRUD queries, query pagination limit compliance ($\le 20$), atomic create with uniqueness verification, slug immutability on publication.
  - `tests/context/AuthContext.test.tsx`: Authentication state resolution, persistence, and loading spinner lifecycle.
  - `tests/components/PostContent.test.tsx`: Comprehensive XSS sanitization checks against malicious script tags, iframes, and onerror payloads.
  - `tests/components/AuthGuard.test.tsx`: Route gating, unauthenticated redirection, and authenticated pass-through.
  - `tests/components/PostEditor.test.tsx`: Live preview rendering, draft vs published state toggling, and slug locking behavior.
- **E2E & Emulator Verification**:
  - Local verification via Firebase Suite Emulator (`firebase emulators:start`):
    - Hosting rewrites for direct deep links (`/post/:slug`, `/admin`).
    - Firestore rules enforcement (unauthenticated write denial, single admin UID verification).
    - Storage rules enforcement (max 1 MB size restriction, image MIME enforcement).

---

## Risks & Mitigations
- **Risk**: Overwriting existing posts or slug collisions during creation.
  - *Mitigation*: Slug is verified via `getDoc` before `setDoc`, and Firestore security rule strictly enforces `!exists(/databases/$(database)/documents/posts/$(slug))`.
- **Risk**: Broken permalinks or foreign references caused by modifying published slugs.
  - *Mitigation*: The UI disables slug editing for any post where `status === 'published'`, and `updatePost` service enforces slug immutability.
- **Risk**: Exceeding Firebase Storage 1 GB/month free-tier egress limit.
  - *Mitigation*: Mandatory client-side WebP compression (`browser-image-compression`) capping hero images at <400 kB and thumbnails at <60 kB; 1-year immutable cache headers configured in `firebase.json`.
- **Risk**: Exceeding Firestore 50,000 daily read quota on public traffic spikes.
  - *Mitigation*: Static blog metadata in `site.config.ts` eliminates settings reads; queries strictly capped (`limit <= 20`); Firestore initialized with `persistentLocalCache` to serve return visitors from IndexedDB.
- **Risk**: Stored XSS attacks via author-provided Markdown.
  - *Mitigation*: Markdown rendering pipeline strictly enforces `rehype-sanitize` with a hardened HTML whitelist.
- **Risk**: Flash of unauthenticated content or premature redirect to login on page reload.
  - *Mitigation*: `AuthContext` initializes `loading: true` until `onAuthStateChanged` resolves, and `AuthGuard` displays a clean editorial spinner until authentication state is deterministic.

---

## Success Criteria
- [ ] Reader visits homepage (`/`) and views the classic Newspaper theme with Chomsky masthead, announcement ticker, and 3-column article grid.
- [ ] Reader opens deep article link directly (`/post/{slug}`) on page refresh and page renders instantly without 404 flicker.
- [ ] Administrator signs in at `/admin/login`, accesses dashboard, and writes Markdown post with live split preview.
- [ ] Uploaded images are converted client-side to WebP (<400 kB) before uploading to Firebase Storage.
- [ ] Published post slug is strictly immutable; attempting to overwrite an existing slug fails atomically.
- [ ] Public reader bundle remains isolated and under 100 kB via `React.lazy()` admin route splitting.
- [ ] All Vitest test suites pass with $\ge 80\%$ test coverage across utils, services, and components.
- [ ] Firestore and Storage security rules pass validation in Firebase Emulator rejecting unauthenticated writes.
- [ ] Production build (`npm run build`) completes cleanly with zero TypeScript errors.
