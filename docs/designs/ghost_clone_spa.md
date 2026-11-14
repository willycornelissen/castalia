# Ghost Clone SPA (Firebase + Newspaper Theme)

*   **Author:** Willy Garabini Cornelissen
*   **Status:** Approved (Post-Goldfish Swarm Review)
*   **Date:** 2026-11-14

--------------------------------------------------------------------------------

## Overview

This project builds a personal publishing platform that replicates the reading aesthetic of the Ghost Newspaper theme (v1.1.3) and the streamlined authoring experience of the Ghost Admin dashboard. The entire application runs as a Single Page Application (SPA) on **Firebase Hosting**, using **Cloud Firestore** for data persistence, **Firebase Authentication** for single-administrator access control, and **Firebase Storage** for media delivery.

## The Problem

Traditional Ghost instances require server maintenance (Node.js, MySQL, Ghost-CLI updates, reverse proxy configuration) or paid managed hosting. For an independent personal blog with a single author, running a dedicated server introduces unnecessary operational overhead and cost. Conversely, static site generators (SSGs) lack an intuitive online administrative dashboard with image uploads and immediate publishing from any device.

This solution pairs a serverless backend-as-a-service (Firebase) with a static React Single Page Application (SPA), delivering:
1. Zero server maintenance and zero monthly fixed hosting costs on the Firebase free tier.
2. A traditional editorial newspaper reading experience based on the Newspaper theme assets (located at `newspaper.zip` in the repository root) and Chomsky typography.
3. A private, authenticated Ghost-like admin dashboard with real-time Markdown editing, image uploading, and instant publishing.

## Goals

*   **Zero-Maintenance Architecture**: Host the frontend on Firebase Hosting with zero server maintenance and native SPA rewrites.
*   **Editorial Reading Experience**: Faithfully recreate the Newspaper theme visual structure (Chomsky masthead, newspaper grid, breaking news announcement ticker, clean typography).
*   **Fast Content Authoring**: Provide a distraction-free administrative dashboard with Markdown editing, live preview, and integrated image uploads.
*   **Safe Single-Author Security**: Enforce single-admin write permissions through strict Firestore and Firebase Storage security rules, locking out unauthorized access and public registrations.
*   **Atomic Slugs & Fast Reads**: Guarantee URL uniqueness by using sanitized post slugs directly as Firestore document IDs (`/posts/{slug}`).
*   **Bandwidth & Quota Guardrails**: Enforce client-side WebP image compression before upload to remain within Firebase Storage free-tier egress limits.

## Non-Goals

*   **Membership & Paywalls**: No member signups, tiers, Stripe billing, or gated content (100% public reader view).
*   **Comments & Newsletters**: No comment threads, email subscriptions, or transactional email pipelines.
*   **Multi-Author Role Management**: No support for multiple contributor accounts, permissions hierarchies, or author invites.
*   **Scheduled Background Publishing**: No background tasks, Cloud Functions, or cron jobs to flip draft status automatically at future timestamps (only immediate `draft` and `published` states).
*   **Server-Side Rendering (SSR) / Dynamic OpenGraph**: In V1, the pure client-side SPA serves default static site OpenGraph metadata; dynamic post-level social crawler card previews are out of scope.

## Open Questions

*   None remaining. Architecture decisions, single-author scope, Firebase Hosting adoption, decoupled storage paths, and single-collection Firestore modeling have been approved.

## Critical User Journeys (CUJs)

### CUJ 1: Reader Browses the Newspaper Blog

*   **Given**: An anonymous visitor arrives at the blog homepage or a deep link (`/post/my-article`).
*   **When**: The visitor loads the page or navigates through tags and articles.
*   **Then**: 
    1. Firebase Hosting serves `index.html` with HTTP 200 without 404 redirects.
    2. React mounts and fetches only published articles from Firestore (`status == "published"`) using point-in-time queries (`getDocs`) with persistent IndexedDB caching.
    3. The reader sees the classic newspaper layout, masthead typography, announcement bar, and formatted post content with zero authentication prompts.

### CUJ 2: Administrator Writes and Publishes an Article

*   **Given**: The administrator navigates to `/admin` and logs in with Firebase Authentication credentials.
*   **When**: The administrator enters the post editor, types a title, writes Markdown content, uploads a feature image, selects tags, and clicks "Publish".
*   **Then**:
    1. The feature image is compressed client-side to WebP (<400 kB for heroes, <60 kB for cards) and uploaded to Firebase Storage at `/media/{timestamp}-{filename}.webp`.
    2. A sanitized slug is generated from the title and verified atomically via `!exists(...)`.
    3. Firestore saves the document at `/posts/{slug}` with `status: "published"`.
    4. The slug becomes immutable, and the article becomes instantly accessible on the public reader view at `/post/{slug}`.

### CUJ 3: Direct URL Refresh & Deep Linking

*   **Given**: A reader or administrator reloads (F5) or directly pastes a deep URL (e.g. `/post/first-post` or `/admin`).
*   **When**: The browser requests the path from Firebase Hosting.
*   **Then**: Firebase Hosting rewrites the request to `index.html`, React Router mounts with `BrowserRouter`, resolves the route instantly, and loads the corresponding view without errors or page flickers.

---

## Technical Plan (Architecture)

### 1. High-Level System Architecture

The application is architected as an optimized Single Page Application (SPA) deployed to Firebase Hosting, interfacing with Google Cloud Firebase managed services.

```mermaid
flowchart TD
    subgraph Client_Browser["Client Browser (SPA)"]
        Router["React Router (BrowserRouter)"]
        
        subgraph Reader_Bundle["Reader View (Public, <100 kB)"]
            Masthead["Masthead (Chomsky font)"]
            Ticker["Announcement Bar / Ticker"]
            Grid["Newspaper Card Grid (Big, Horizontal, Small)"]
            PostView["Sanitized Markdown Post View (rehype-sanitize)"]
            LocalCache["IndexedDB Persistent Cache (persistentLocalCache)"]
        end
        
        subgraph Admin_Bundle["Admin View (Lazy Loaded via React.lazy)"]
            AuthGuard["Firebase Auth Guard & AuthContext"]
            Dashboard["Posts List (Drafts / Published)"]
            Editor["Markdown Editor + Split Preview"]
            Compressor["Client-Side Image Compressor (browser-image-compression)"]
        end
    end

    subgraph Firebase_Platform["Firebase Backend-as-a-Service"]
        Hosting["Firebase Hosting<br/>- Global CDN<br/>- SPA rewrites to /index.html"]
        Auth["Firebase Authentication<br/>- Single-user email/password<br/>- Public signups disabled"]
        Firestore["Cloud Firestore<br/>- Single collection: /posts/{slug}<br/>- Atomic slug Document IDs"]
        Storage["Firebase Storage<br/>- Decoupled Path: /media/{filename}.webp<br/>- Compressed WebP assets"]
    end

    Hosting -->|Serves index.html + assets| Router
    Router --> Reader_Bundle
    Router --> Admin_Bundle
    
    Reader_Bundle -->|Point-in-time getDocs| LocalCache
    LocalCache <-->|Sync queries (limit <= 20)| Firestore
    Reader_Bundle -->|Fetch WebP images| Storage

    Admin_Bundle -->|Login credentials| Auth
    Admin_Bundle -->|Atomic CRUD (!exists check)| Firestore
    Compressor -->|Upload WebP (<400 kB)| Storage
```

### 2. Frontend Component & Directory Layout

```text
src/
├── assets/
│   ├── fonts/
│   │   └── chomsky.otf            # Newspaper masthead typography (from newspaper.zip)
│   └── css/
│       ├── index.css              # Tailwind imports & @font-face rules
│       └── newspaper.css          # Newspaper theme editorial styles & print grid
├── config/
│   └── site.config.ts             # Static blog metadata, navigation, author profile
├── context/
│   └── AuthContext.tsx            # Firebase Auth state provider with loading state
├── services/
│   ├── firebase.ts                # Firebase app, auth, db (persistent cache), storage init
│   ├── posts.service.ts           # Firestore CRUD operations & slug uniqueness checks
│   ├── storage.service.ts         # Client WebP compression & Storage upload pipeline
│   └── auth.service.ts            # Authentication state & login/logout methods
├── utils/
│   ├── slugify.ts                 # Deterministic slug generator
│   ├── readingTime.ts             # Estimated reading time calculator (~200 wpm)
│   └── formatDate.ts              # Editorial print date formatting
├── types/
│   ├── post.ts                    # Post interface & validation schemas
│   └── site.ts                    # Site configuration interface
├── components/
│   ├── reader/
│   │   ├── Masthead.tsx           # Classic newspaper header
│   │   ├── AnnouncementBar.tsx    # Breaking news ticker
│   │   ├── ArticleCard.tsx        # Card variations (Big, Horizontal, Small)
│   │   ├── ArticleGrid.tsx        # Column newspaper homepage layout with pagination
│   │   ├── PostContent.tsx        # Markdown renderer with rehype-sanitize
│   │   └── Footer.tsx             # Editorial footer with social links
│   └── admin/
│       ├── AuthGuard.tsx          # Route protection handling auth loading spinner
│       ├── AdminLayout.tsx        # Minimalist sidebar navigation & status bar
│       ├── PostList.tsx           # Drafts/Published filterable table with delete modal
│       ├── PostEditor.tsx         # Title, Markdown editor, and preview
│       ├── ImageUploader.tsx      # Feature & inline image dropzone with WebP conversion
│       └── PostSettingsSidebar.tsx# Slug, tags, excerpt, and publish toggle
├── pages/
│   ├── HomePage.tsx               # Public Newspaper front page
│   ├── PostPage.tsx               # Public article page (supports ?preview=true for admin)
│   ├── TagPage.tsx                # Filtered articles by tag
│   ├── AdminLoginPage.tsx         # Secret administrator sign-in (<meta name="robots" content="noindex">)
│   └── AdminDashboardPage.tsx     # Lazy-loaded admin entry point
├── App.tsx                        # Root router configuration with lazy admin loading
└── main.tsx                       # Entrypoint mounting React 18/19
```

### 3. Data Model & Firestore Schema

All dynamic data is modeled within a single Firestore collection: `posts`.

#### Document Path: `/posts/{slug}`
*   **Document ID**: Sanitized unique slug (e.g. `primeiro-artigo-editorial`).
*   **Slug Immutability Invariant**: The slug is derived from the title and can be edited while `status === "draft"`. Once a post is published (`status === "published"`), the slug is **strictly immutable** to prevent breaking permalinks and foreign references.
*   **Fields**:
    *   `title` (string, required): Full headline of the article.
    *   `slug` (string, required): Matching the Document ID.
    *   `content_markdown` (string, required): Raw Markdown body text.
    *   `excerpt` (string, optional): 1–2 sentence summary used on homepage cards and search summaries.
    *   `feature_image` (string, optional): HTTPS download URL from Firebase Storage.
    *   `status` (string, required): Enum `"draft" | "published"`.
    *   `tags` (string[], required): Simple string array of category tags (e.g. `["editorial", "tecnologia"]`).
    *   `reading_time` (number, required): Estimated reading duration in minutes.
    *   `published_at` (timestamp, optional): Date and time of publication.
    *   `created_at` (timestamp, required): Record creation timestamp.
    *   `updated_at` (timestamp, required): Last modification timestamp.

#### Static Blog Metadata: `src/config/site.config.ts`
```typescript
export const siteConfig = {
  title: "The Daily Chronicle",
  description: "Independent journalism and personal commentary.",
  author: {
    name: "Willy Garabini Cornelissen",
    bio: "Software architect and writer.",
    avatar: "/assets/author.jpg",
    social: {
      github: "https://github.com/...",
      twitter: "https://twitter.com/..."
    }
  },
  navigation: [
    { label: "Home", path: "/" },
    { label: "Editorial", path: "/tag/editorial" },
    { label: "Tecnologia", path: "/tag/tecnologia" },
    { label: "Sobre", path: "/sobre" }
  ]
};
```

### 4. Security Rules Specification

#### Cloud Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Verified against the provisioned administrator UID
    function isAdmin() {
      return request.auth != null && request.auth.uid == "ADMIN_UID_ENV_PLACEHOLDER";
    }

    match /posts/{slug} {
      // Safe read: handles 404 queries (resource == null) without throwing permission errors
      allow get: if resource == null || resource.data.status == 'published' || isAdmin();
      allow list: if request.query.limit <= 20 && (resource.data.status == 'published' || isAdmin());
      
      // Strict write: prevents overwriting existing documents on create
      allow create: if isAdmin()
                    && !exists(/databases/$(database)/documents/posts/$(slug))
                    && request.resource.data.slug == slug
                    && request.resource.data.title is string
                    && request.resource.data.title.size() > 0
                    && request.resource.data.status in ['draft', 'published']
                    && request.resource.data.content_markdown is string;

      allow update: if isAdmin()
                    && request.resource.data.slug == slug
                    && request.resource.data.status in ['draft', 'published'];

      allow delete: if isAdmin();
    }
  }
}
```

#### Firebase Storage Security Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && request.auth.uid == "ADMIN_UID_ENV_PLACEHOLDER";
    }

    match /media/{allImages=**} {
      // Public read access to all uploaded media
      allow read: if true;
      
      // Strict write access: admin only, max 1MB (enforcing client-side compression), image MIME
      allow write: if isAdmin()
                   && request.resource.size < 1 * 1024 * 1024
                   && request.resource.contentType.matches('image/(jpeg|png|webp)');
    }
  }
}
```

*Note on Rules Deployment*: An npm script (`npm run deploy:rules`) uses `envsubst` or a small TypeScript helper to replace `ADMIN_UID_ENV_PLACEHOLDER` with the actual administrator UID from `.env` before triggering `firebase deploy --only firestore:rules,storage`.

### 5. Media Compression & Storage Pipeline

To prevent exceeding the 1 GB/month egress limit on Firebase Storage:
1. When an image is dropped or selected in the editor, `browser-image-compression` resizes and converts the file to `.webp` with quality 0.82.
2. Target size is `< 400 kB` for feature images, with card thumbnails capped at `< 60 kB`.
3. Decoupled path: Uploaded directly to `/media/{timestamp}-{filename}.webp`. This allows authors to upload images in drafts before the post title or slug is defined.
4. Upload metadata explicitly sets `Cache-Control: public, max-age=31536000, immutable`.
5. When a post is permanently deleted from the admin dashboard, associated media references are cascade-deleted to prevent storage leaks.

### 6. Hosting & Build Configuration (`firebase.json`)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp|otf|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

---

## Alternatives Considered

### Alternative A: GitHub Pages with 404.html Redirect Hack

*   **Pros**: Tightly integrated with GitHub repositories, zero setup if already using GitHub Actions.
*   **Cons**: Lacks native URL rewrite capabilities for SPAs. Deep link requests return HTTP 404, requiring a client-side JavaScript redirect hack inside `404.html`. This introduces perceptible page flicker, increases Time to Interactive (TTI), and causes network delay on direct page reloads.
*   **Reason for Rejection**: `Rejected by author: GitHub Pages lacks native SPA rewrite support, causing latency penalties and page flicker on deep link refreshes, whereas Firebase Hosting provides native rewrites and zero-maintenance static hosting with no hacks.`

### Alternative B: Self-Hosted Ghost on a Virtual Private Server (VPS)

*   **Pros**: Full native Ghost feature set (memberships, newsletters, themes out of the box, standard Koenig editor).
*   **Cons**: Introduces recurring infrastructure costs ($5–$12/month for VPS), ongoing operating system maintenance, MySQL database administration, Node.js version management, Ghost-CLI upgrades, reverse proxy (Nginx) configuration, and manual backup routines.
*   **Reason for Rejection**: `Rejected by author: Violates the zero-cost and zero-maintenance requirement for a personal single-author blog.`

### Alternative C: Multi-Collection Firestore Schema (`settings`, `authors`, `tags`, `posts`)

*   **Pros**: Mirrors the traditional relational Ghost database schema directly.
*   **Cons**: Increases Firestore read operations on every public page hit (reading settings, authors, and tag metadata separately), which rapidly consumes the 50,000 daily read quota on the Spark plan. Adds unnecessary administrative screens for values that change infrequently.
*   **Reason for Rejection**: `Rejected by author: Redundant for a single-author blog; static configuration in site.config.ts eliminates Firestore read overhead and simplifies data governance.`

### Alternative D: Client-Side Full-Text Search Engine (Fuse.js over all posts)

*   **Pros**: Rich fuzzy searching and instant typography highlighting.
*   **Cons**: Requires downloading the entire article database into browser memory on every search interaction, creating a network read spike that can exhaust Firestore free-tier limits.
*   **Reason for Rejection**: `Rejected by author: Downloads excessive document payloads on client search, risking Firestore free-tier read quota exhaustion; Tag filtering and chronological pagination are sufficient for V1.`

---

## Detailed Implementation Plan

The implementation is structured into phased deliverables designed for Test-Driven Development (TDD) and clean architectural separation.

### 1. Phased Execution Order

1.  **Phase 1: Project Initialization, Routing Shell & Build Harness**:
    *   Scaffold Vite + React + TypeScript with Tailwind CSS and path aliases (`@/*`).
    *   Extract `chomsky.otf` from `newspaper.zip` into `src/assets/fonts/`.
    *   Configure `index.html`, `tailwind.config.js`, `postcss.config.js`, `firebase.json`, `firestore.rules`, and `storage.rules`.
    *   Mount base `BrowserRouter` shell in `App.tsx` so router context is available for all link components.
    *   Set up testing framework (`vitest.config.ts`, `setupTests.ts`).
2.  **Phase 2: Core Domain Models, Utilities & Service Layer (TDD)**:
    *   Write tests and implement utilities (`slugify.ts`, `readingTime.ts`, `formatDate.ts`).
    *   Implement `src/types/post.ts` and `src/config/site.config.ts`.
    *   Implement and test `auth.service.ts` and `AuthContext.tsx`.
    *   Implement and test `posts.service.ts` (Firestore queries with limit, atomic create, read by slug, slug immutability on publish).
    *   Implement and test `storage.service.ts` (WebP compression <400 kB and upload to `/media/`).
3.  **Phase 3: Reader Interface (Newspaper Theme)**:
    *   Implement `Masthead.tsx` (dateline, Chomsky typography).
    *   Implement `AnnouncementBar.tsx` (ticker of latest headlines).
    *   Implement `ArticleCard.tsx` (variants: Big, Horizontal, Small) and `ArticleGrid.tsx` with pagination ("Load More" cursor).
    *   Implement `PostContent.tsx` with `react-markdown` and `rehype-sanitize`.
    *   Assemble `HomePage.tsx`, `PostPage.tsx` (with 404 handling), `TagPage.tsx`, and `Footer.tsx`.
4.  **Phase 4: Admin Interface (Ghost Clone)**:
    *   Implement `AuthGuard.tsx` with loading spinner during auth state resolution.
    *   Implement `AdminLayout.tsx` (Stories, Settings, Sign Out).
    *   Implement `PostList.tsx` (Drafts/Published filter, delete confirmation modal).
    *   Implement `ImageUploader.tsx` (drag-and-drop WebP compressor).
    *   Implement `PostSettingsSidebar.tsx` (slug edit allowed in draft only, tags, excerpt).
    *   Implement `PostEditor.tsx` with live split preview.
    *   Assemble `AdminLoginPage.tsx`, `AdminDashboardPage.tsx`, and `AdminEditorPage.tsx`.
5.  **Phase 5: Code Splitting & Performance Hardening**:
    *   Wrap `/admin` routes with `React.lazy()` and Suspense fallback.
    *   Audit bundle sizes (public reader bundle <100 kB).
    *   Verify direct URL refresh (CUJ 3) on Firebase Hosting emulator.
6.  **Phase 6: Quality Gate & Verification**:
    *   Run test suite with Vitest ($\ge 80\%$ test coverage).
    *   Verify XSS sanitization and Firestore security rules in Firebase Emulator.

---

### 2. Comprehensive File Inventory

#### Configuration & Infrastructure

*   `package.json`: Project manifest declaring dependencies: React, Vite, TypeScript, Tailwind CSS, Firebase SDK v10, `browser-image-compression`, `react-markdown`, `remark-gfm`, `rehype-sanitize`, Lucide icons, Vitest, `@testing-library/react`.
*   `.env.example`: Template for environment variables (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `ADMIN_UID`).
*   `src/vite-env.d.ts`: TypeScript declarations for `import.meta.env`.
*   `vitest.config.ts`: Vitest test runner configuration.
*   `src/setupTests.ts`: Testing Library extensions and mock setup.
*   `tsconfig.json`: Root TypeScript configuration with strict mode and path alias (`@/*`).
*   `vite.config.ts`: Bundler configuration declaring path resolution and Rollup manual chunking to isolate `/admin`.
*   `tailwind.config.js`: Design tokens for Newspaper theme (`#F6F6F6` background, `#222222` text, fonts: `Chomsky`, `EB Garamond`, `Open Sans`).
*   `postcss.config.js`: PostCSS configuration for Tailwind.
*   `index.html`: Entrypoint mounting node loading Chomsky font.
*   `firebase.json`: Hosting rewrites, cache headers, and emulator bindings.
*   `firestore.rules`: Security rules enforcing single-admin write, atomic create, and safe read evaluation.
*   `storage.rules`: Security rules restricting `/media/**` uploads to admin (<1MB, image MIME).

#### Core Configuration, Utilities & Types

*   `src/config/site.config.ts`: Static blog metadata, navigation links, and author profile.
*   `src/types/post.ts`: Entity definitions for `Post`, `PostStatus`, `CreatePostDTO`, `UpdatePostDTO`.
*   `src/types/site.ts`: Site configuration interfaces.
*   `src/utils/slugify.ts`: Deterministic string-to-slug transformation.
*   `src/utils/readingTime.ts`: Word-count-to-reading-minutes calculator.
*   `src/utils/formatDate.ts`: Editorial newspaper date formatting.

#### Service Layer & State

*   `src/services/firebase.ts`: Firebase singleton exporting `auth`, `db` (with `persistentLocalCache`), and `storage`.
*   `src/context/AuthContext.tsx`: React Context providing `{ user, loading, logout }` to resolve auth race conditions.
*   `src/services/auth.service.ts`: Firebase Authentication wrappers (`signIn`, `signOut`).
*   `src/services/posts.service.ts`: Firestore CRUD: paginated published queries, slug lookup, atomic create, slug-locked updates.
*   `src/services/storage.service.ts`: Client WebP compression (<400 kB) and upload handling to `/media/`.

#### Assets & Styles

*   `src/assets/fonts/chomsky.otf`: Gothic newspaper font extracted from `newspaper.zip`.
*   `src/assets/css/index.css`: Global stylesheet with Tailwind directives and `@font-face`.
*   `src/assets/css/newspaper.css`: Editorial newspaper styles, bordered cards, and column dividers.

#### Public Reader Components (`src/components/reader/`)

*   `Masthead.tsx`: Traditional newspaper masthead with date line and Chomsky typography.
*   `AnnouncementBar.tsx`: Breaking news ticker scrolling latest headlines.
*   `ArticleCard.tsx`: Card variants: `big` (lead story), `horizontal` (featured row), `small` (column item).
*   `ArticleGrid.tsx`: Frontpage newspaper column grid with pagination.
*   `PostContent.tsx`: Secure Markdown content renderer (`react-markdown` + `rehype-sanitize`).
*   `TagBadge.tsx`: Reusable category chip component.
*   `Footer.tsx`: Editorial footer with colophon and social links.

#### Admin Dashboard Components (`src/components/admin/`)

*   `AuthGuard.tsx`: Route protector rendering loading spinner until `AuthContext` resolves.
*   `AdminLayout.tsx`: Ghost-like sidebar navigation.
*   `PostList.tsx`: Filterable table (All, Drafts, Published) with delete confirmation modal.
*   `PostEditor.tsx`: Distraction-free Markdown editor with live split-screen preview.
*   `PostSettingsSidebar.tsx`: Flyout drawer for slug, tags, excerpt, and feature image.
*   `ImageUploader.tsx`: Drag-and-drop WebP compression and upload zone.

#### Pages & Routing

*   `src/pages/HomePage.tsx`: Public front-page assembling Masthead, Ticker, and ArticleGrid.
*   `src/pages/PostPage.tsx`: Single article view with reading time, author bio, and 404 fallback.
*   `src/pages/TagPage.tsx`: Archive view filtering articles by tag.
*   `src/pages/AdminLoginPage.tsx`: Secret admin login page (`<meta name="robots" content="noindex">`).
*   `src/pages/AdminDashboardPage.tsx`: Management portal hosting PostList.
*   `src/pages/AdminEditorPage.tsx`: Dedicated post editing workspace.
*   `src/pages/NotFoundPage.tsx`: 404 editorial error page.
*   `src/App.tsx`: Router configuration with lazy-loaded admin routes.
*   `src/main.tsx`: React DOM bootstrap entrypoint.

#### Test Suites (`tests/`)

*   `tests/utils/slugify.test.ts`: Slug generation and sanitization tests.
*   `tests/services/posts.service.test.ts`: Firestore CRUD, query limits, and slug immutability tests.
*   `tests/services/storage.service.test.ts`: WebP compression bounds and storage path tests.
*   `tests/components/PostContent.test.tsx`: XSS prevention and Markdown sanitization tests.
