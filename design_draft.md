# Ghost Clone SPA (Firebase + Newspaper Theme)

*   **Author:** Willy Garabini Cornelissen
*   **Status:** Draft
*   **Date:** 2026-11-14

--------------------------------------------------------------------------------

## Overview

This project builds a personal publishing platform that replicates the reading aesthetic of the Ghost Newspaper theme (v1.1.3) and the streamlined authoring experience of the Ghost Admin dashboard. The entire application runs as a Single Page Application (SPA) on **Firebase Hosting**, using **Cloud Firestore** for data persistence, **Firebase Authentication** for single-administrator access control, and **Firebase Storage** for media delivery.

## The Problem

Traditional Ghost instances require server maintenance (Node.js, MySQL, Ghost-CLI updates, reverse proxy configuration) or paid managed hosting. For an independent personal blog with a single author, running a dedicated server introduces unnecessary operational overhead and cost. Conversely, static site generators (SSGs) lack an intuitive online administrative dashboard with image uploads and immediate publishing from any device.

This solution pairs a serverless backend-as-a-service (Firebase) with a static React Single Page Application (SPA), delivering:
1. Zero server maintenance and zero monthly fixed hosting costs on the Firebase free tier.
2. A traditional editorial newspaper reading experience based on the Newspaper theme assets and Chomsky typography.
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
*   **Server-Side Rendering (SSR) / Edge Workers**: No dynamic OpenGraph social crawler pre-rendering in V1.

## Open Questions

*   None remaining. Architecture decisions, single-author scope, Firebase Hosting adoption, and single-collection Firestore modeling have been aligned.

## Critical User Journeys (CUJs)

### CUJ 1: Reader Browses the Newspaper Blog

*   **Given**: An anonymous visitor arrives at the blog homepage or a deep link (`/post/my-article`).
*   **When**: The visitor loads the page or navigates through tags and articles.
*   **Then**: 
    1. Firebase Hosting serves `index.html` with HTTP 200 without 404 redirects.
    2. React mounts and fetches only published articles from Firestore (`status == "published"`).
    3. The reader sees the classic newspaper layout, masthead typography, announcement bar, and formatted post content with zero authentication prompts.

### CUJ 2: Administrator Writes and Publishes an Article

*   **Given**: The administrator navigates to `/admin` and logs in with Firebase Authentication credentials.
*   **When**: The administrator enters the post editor, types a title, writes Markdown content, uploads a feature image, selects tags, and clicks "Publish".
*   **Then**:
    1. The feature image is compressed client-side to WebP (<400 kB) and uploaded to Firebase Storage.
    2. A sanitized slug is generated from the title and verified atomically.
    3. Firestore saves the document at `/posts/{slug}` with `status: "published"`.
    4. The article becomes instantly accessible on the public reader view at `/post/{slug}`.

### CUJ 3: Direct URL Refresh & Deep Linking

*   **Given**: A reader or administrator reloads (F5) or directly pastes a deep URL (e.g. `/post/first-post` or `/admin`).
*   **When**: The browser requests the path from Firebase Hosting.
*   **Then**: Firebase Hosting rewrites the request to `index.html`, React Router mounts with `BrowserRouter`, resolves the route instantly, and loads the corresponding view without errors or page flickers.


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
            AuthGuard["Firebase Auth Guard"]
            Dashboard["Posts List (Drafts / Published)"]
            Editor["Markdown Editor + Split Preview"]
            Compressor["Client-Side Image Compressor (browser-image-compression)"]
        end
    end

    subgraph Firebase_Platform["Firebase Backend-as-a-Service"]
        Hosting["Firebase Hosting<br/>- Global CDN<br/>- SPA rewrites to /index.html"]
        Auth["Firebase Authentication<br/>- Single-user email/password<br/>- Public signups disabled"]
        Firestore["Cloud Firestore<br/>- Single collection: /posts/{slug}<br/>- Atomic slug Document IDs"]
        Storage["Firebase Storage<br/>- Path: /posts/{slug}/images/<br/>- Compressed WebP assets"]
    end

    Hosting -->|Serves index.html + assets| Router
    Router --> Reader_Bundle
    Router --> Admin_Bundle
    
    Reader_Bundle -->|Read published posts| LocalCache
    LocalCache <-->|Sync queries (limit <= 20)| Firestore
    Reader_Bundle -->|Fetch WebP images| Storage

    Admin_Bundle -->|Login credentials| Auth
    Admin_Bundle -->|Atomic CRUD| Firestore
    Compressor -->|Upload WebP (<400 kB)| Storage
```

### 2. Frontend Component & Directory Layout

```text
src/
├── assets/
│   ├── fonts/
│   │   └── chomsky.otf            # Newspaper masthead typography
│   └── css/
│       ├── newspaper.css          # Newspaper theme editorial styles & grid
│       └── admin.css              # Ghost-like minimalist admin styles
├── config/
│   └── site.config.ts             # Static blog metadata, navigation, author profile
├── services/
│   ├── firebase.ts                # Firebase app, auth, db (persistent cache), storage init
│   ├── posts.service.ts           # Firestore CRUD operations & slug uniqueness checks
│   ├── storage.service.ts         # Client WebP compression & Storage upload pipeline
│   └── auth.service.ts            # Authentication state & login/logout methods
├── types/
│   ├── post.ts                    # Post interface & validation schemas
│   └── site.ts                    # Site configuration interface
├── components/
│   ├── reader/
│   │   ├── Masthead.tsx           # Classic newspaper header
│   │   ├── AnnouncementBar.tsx    # Breaking news ticker
│   │   ├── ArticleCard.tsx        # Card variations (Big, Horizontal, Small)
│   │   ├── ArticleGrid.tsx        # Column newspaper homepage layout
│   │   ├── PostContent.tsx        # Markdown renderer with rehype-sanitize
│   │   └── Footer.tsx             # Editorial footer with social links
│   └── admin/
│       ├── AdminLayout.tsx        # Sidebar navigation & status bar
│       ├── PostList.tsx           # Drafts/Published filterable table
│       ├── PostEditor.tsx         # Title, Markdown editor, and preview
│       ├── ImageUploader.tsx      # Feature & inline image dropzone with WebP conversion
│       └── PostSettingsSidebar.tsx# Slug, tags, excerpt, and publish date
├── pages/
│   ├── HomePage.tsx               # Public Newspaper front page
│   ├── PostPage.tsx               # Public article page (supports ?preview=true for admin)
│   ├── TagPage.tsx                # Filtered articles by tag
│   ├── AdminLoginPage.tsx         # Secret administrator sign-in
│   └── AdminDashboardPage.tsx     # Lazy-loaded admin entry point
├── App.tsx                        # Root router configuration
└── main.tsx                       # Entrypoint mounting React 18/19
```

### 3. Data Model & Firestore Schema

To maximize performance and eliminate query join overhead, all dynamic data is modeled within a single Firestore collection: `posts`.

#### Document Path: `/posts/{slug}`
*   **Document ID**: Sanitized unique slug (e.g. `primeiro-artigo-editorial`). Using the slug directly as the document key enforces native atomic uniqueness without separate lock tables or multi-document transactions.
*   **Fields**:
    *   `title` (string, required): Full headline of the article.
    *   `slug` (string, required): Matching the Document ID.
    *   `content_markdown` (string, required): Raw Markdown body text.
    *   `excerpt` (string, optional): 1–2 sentence summary used on homepage cards and search summaries.
    *   `feature_image` (string, optional): HTTPS download URL from Firebase Storage.
    *   `status` (string, required): Enum `"draft" | "published"`.
    *   `tags` (string[], required): Simple string array of category tags (e.g. `["editorial", "tecnologia"]`).
    *   `reading_time` (number, required): Estimated reading duration in minutes (calculated automatically based on word count).
    *   `published_at` (timestamp, optional): Date and time of publication.
    *   `created_at` (timestamp, required): Record creation timestamp.
    *   `updated_at` (timestamp, required): Last modification timestamp.

#### Static Blog Metadata: `src/config/site.config.ts`
All non-dynamic settings are compiled into the build, eliminating Firestore reads for layout scaffolding:
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
    // Replaces with the exact provisioned administrator UID
    function isAdmin() {
      return request.auth != null && request.auth.uid == "ADMIN_UID_ENV_PLACEHOLDER";
    }

    match /posts/{slug} {
      // Public read access only for published articles.
      // Drafts can only be read by the authenticated administrator.
      allow read: if resource.data.status == 'published' || isAdmin();
      
      // Strict write access restricted exclusively to the admin UID
      allow create, update, delete: if isAdmin();
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

    match /posts/{slug}/{allImages=**} {
      // Public read access to all post images
      allow read: if true;
      
      // Strict write access: admin only, max 5MB, valid image MIME types
      allow write: if isAdmin()
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/(jpeg|png|webp|gif)');
    }
  }
}
```

### 5. Media Compression & Storage Pipeline

To prevent exceeding the 1 GB/month egress limit on Firebase Storage, all image uploads pass through a client-side conversion worker:
1. File dropped or selected in the editor.
2. `browser-image-compression` resizes images to a maximum width of 1600px (standard post header width) and converts to `.webp` with quality 0.82.
3. Target file size is bounded to `< 400 kB`.
4. Uploaded directly to `/posts/{slug}/images/{timestamp}-{filename}.webp`.
5. The public HTTPS download URL is retrieved and embedded into the post.

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


## Alternatives Considered

### Alternative A: GitHub Pages with 404.html Redirect Hack

*   **Pros**: Tightly integrated with GitHub repositories, zero setup if already using GitHub Actions.
*   **Cons**: Lacks native URL rewrite capabilities for SPAs. Deep link requests (e.g. `/post/my-article` or `/admin`) return HTTP 404, requiring a client-side JavaScript redirect hack inside `404.html` to recover the path and mount `index.html`. This introduces perceptible page flicker, increases Time to Interactive (TTI), and causes social media crawlers (WhatsApp, Twitter/X, LinkedIn) to drop preview cards entirely.
*   **Reason for Rejection**: `Rejected by author: GitHub Pages lacks native SPA rewrite support, causing social media preview failures (OpenGraph) and latency penalties on deep link refreshes, whereas Firebase Hosting provides native rewrites and zero-maintenance static hosting with no hacks.`

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
*   **Reason for Rejection**: `Rejected by author: Downloads excessive document payloads on client search, risking Firestore free-tier read quota exhaustion; in-memory filtering of loaded posts is sufficient for V1.`


## Detailed Implementation Plan

The implementation is structured into phased deliverables designed for Test-Driven Development (TDD) and clean architectural separation.

### 1. Phased Execution Order

1.  **Phase 1: Project Initialization & Build Harness**: Scaffold Vite + React + TypeScript with Tailwind CSS, configure path aliases, asset fonts (Chomsky), and Firebase configurations (`firebase.json`, `firestore.rules`, `storage.rules`).
2.  **Phase 2: Core Domain Models & Services**: Implement typed interfaces, Firebase initialization with persistent local cache, authentication service, storage service with WebP compression, and Firestore post CRUD operations.
3.  **Phase 3: Reader Interface (Newspaper Theme)**: Recreate Newspaper theme layout and components (Masthead, AnnouncementBar, ArticleGrid, ArticleCard variants, sanitized Markdown PostContent, and Tag filter).
4.  **Phase 4: Admin Interface (Ghost Clone)**: Implement AuthGuard, minimalist PostList dashboard, distraction-free PostEditor with live split preview, and PostSettingsSidebar with image upload.
5.  **Phase 5: Route Integration & Code Splitting**: Connect React Router with `BrowserRouter`, apply `React.lazy()` to isolate the administrative bundle, and verify direct URL deep-linking.
6.  **Phase 6: Quality Gate & Verification**: Unit tests for services, sanitization pipeline verification, and build bundle size auditing.

---

### 2. Comprehensive File Inventory

#### Configuration & Infrastructure

*   `package.json`: Project manifest specifying React 18/19, Vite, TypeScript, Tailwind CSS, Firebase SDK v10, `browser-image-compression`, `react-markdown`, `remark-gfm`, `rehype-sanitize`, and Lucide icons.
*   `tsconfig.json`: Root TypeScript configuration with strict mode, ES2022 target, and path alias mapping (`@/*` to `./src/*`).
*   `vite.config.ts`: Vite bundler configuration declaring path resolution and Rollup manual chunking to isolate the `/admin` bundle.
*   `tailwind.config.js`: Tailwind design tokens defining Newspaper theme colors (`#F6F6F6` background, `#222222` text), border styles, and typography font families (`Chomsky`, `EB Garamond`, `Open Sans`).
*   `postcss.config.js`: PostCSS configuration loading Tailwind CSS and Autoprefixer.
*   `index.html`: Single-page application entrypoint loading the Chomsky local font, viewport definitions, and root mounting node.
*   `firebase.json`: Firebase Hosting rewrites (`**` to `/index.html`), cache headers for immutable assets, and Firestore/Storage emulator settings.
*   `firestore.rules`: Security rules enforcing admin-only writes, public published reads, and draft isolation.
*   `storage.rules`: Security rules restricting upload access to the admin UID, enforcing 5MB size bounds and image MIME types.

#### Core Configuration & Types

*   `src/config/site.config.ts`: Static configuration file holding the blog title, description, author profile (name, bio, avatar, socials), and header navigation links.
*   `src/types/post.ts`: TypeScript definitions for the `Post` document entity, `PostStatus` (`draft` | `published`), `CreatePostDTO`, and `UpdatePostDTO`.
*   `src/types/site.ts`: TypeScript interfaces for site configuration and navigation items.

#### Service Layer

*   `src/services/firebase.ts`: Firebase App initialization, exporting singleton instances for `auth`, `db` (with `persistentLocalCache`), and `storage`.
*   `src/services/auth.service.ts`: Encapsulates Firebase Authentication methods (`signIn`, `signOut`, `subscribeToAuthChanges`).
*   `src/services/posts.service.ts`: Encapsulates Firestore operations: querying published posts with pagination, retrieving post by slug, checking slug availability, and creating/updating/deleting posts.
*   `src/services/storage.service.ts`: Client-side image compression worker using `browser-image-compression` (<400 kB WebP) and upload handling to Firebase Storage.

#### Assets & Styles

*   `src/assets/fonts/chomsky.otf`: Classic gothic newspaper font extracted from `newspaper.zip` for masthead titles.
*   `src/assets/css/index.css`: Global stylesheet importing Tailwind directives, `@font-face` for Chomsky, and custom utility classes.
*   `src/assets/css/newspaper.css`: Editorial layout rules, thin border separators, multi-column print simulation, and serif typography styling.

#### Public Reader Components (`src/components/reader/`)

*   `Masthead.tsx`: Traditional newspaper masthead component displaying the formatted date line, Chomsky publication title, and volume/edition markers.
*   `AnnouncementBar.tsx`: Breaking news ticker component displaying recent headlines with marquee/slider behavior.
*   `ArticleCard.tsx`: Reusable article card supporting multiple layout variants (`big` for lead story, `horizontal` for featured rows, `small` for column lists).
*   `ArticleGrid.tsx`: Newspaper grid orchestrator structuring the homepage into traditional front-page editorial columns.
*   `PostContent.tsx`: Markdown content renderer utilizing `react-markdown`, `remark-gfm`, and `rehype-sanitize` to guarantee secure, styled prose.
*   `TagBadge.tsx`: Minimalist category chip component for article tagging.
*   `SearchModal.tsx`: In-memory modal filter allowing instant search across currently loaded articles without triggering billable database queries.
*   `Footer.tsx`: Editorial footer providing colophon, copyright, author bio link, and social links.

#### Admin Dashboard Components (`src/components/admin/`)

*   `AuthGuard.tsx`: Route protection component verifying Firebase Auth state and redirecting unauthenticated users to `/admin/login`.
*   `AdminLayout.tsx`: Ghost-inspired sidebar navigation with links to Stories, Analytics summary, and Sign Out.
*   `PostList.tsx`: Filterable management table displaying posts segmented by status (All, Drafts, Published) with quick actions.
*   `PostEditor.tsx`: Distraction-free Markdown editor with real-time word count, reading time calculator, and split-screen preview.
*   `PostSettingsSidebar.tsx`: Ghost-like flyout drawer for editing the post slug, publication status, tags, excerpt, and feature image.
*   `ImageUploader.tsx`: Drag-and-drop file upload zone triggering automatic client-side WebP compression and progress feedback.

#### Pages & Routing

*   `src/pages/HomePage.tsx`: Public front-page assembling the Masthead, AnnouncementBar, and ArticleGrid.
*   `src/pages/PostPage.tsx`: Public article view rendering the feature image, post metadata, sanitized Markdown body, and author card.
*   `src/pages/TagPage.tsx`: Public archive view filtering posts by category tag.
*   `src/pages/AdminLoginPage.tsx`: Clean, unindexed administrator sign-in page.
*   `src/pages/AdminDashboardPage.tsx`: Management portal displaying post metrics and the PostList component.
*   `src/pages/AdminEditorPage.tsx`: Dedicated authoring workspace mounting PostEditor and PostSettingsSidebar.
*   `src/pages/NotFoundPage.tsx`: Styled 404 editorial error view.
*   `src/App.tsx`: Application router wrapping public views and lazy-loaded administrative routes.
*   `src/main.tsx`: React DOM bootstrap script.
