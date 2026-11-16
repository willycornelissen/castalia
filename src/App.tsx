import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { siteConfig } from '@/config/site.config';
import { extractStaticTagSections } from '@/utils/tags';
import { HomePage } from '@/pages/HomePage';
import { PostPage } from '@/pages/PostPage';
import { TagPage } from '@/pages/TagPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const AdminLoginPage = lazy(() =>
  import('@/pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('@/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminEditorPage = lazy(() =>
  import('@/pages/AdminEditorPage').then((m) => ({ default: m.AdminEditorPage }))
);
const AdminMenuPage = lazy(() =>
  import('@/pages/AdminMenuPage').then((m) => ({ default: m.AdminMenuPage }))
);

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
      <p className="font-condensed text-sm uppercase tracking-widest text-muted">
        Carregando painel administrativo...
      </p>
    </div>
  );
}

const quickArchiveRoutes = extractStaticTagSections(siteConfig.quickArchive);

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public Reader Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/post/:slug" element={<PostPage />} />
          <Route path="/tag/:tag" element={<TagPage />} />
          {quickArchiveRoutes.map((section) => (
            <Route
              key={section.path}
              path={section.path}
              element={<TagPage tag={section.tag} />}
            />
          ))}

          {/* Lazy-Loaded Admin Routes */}
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminLoginPage />
              </Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AuthGuard>
                  <AdminDashboardPage />
                </AuthGuard>
              </Suspense>
            }
          />
          <Route
            path="/admin/editor"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AuthGuard>
                  <AdminEditorPage />
                </AuthGuard>
              </Suspense>
            }
          />
          <Route
            path="/admin/editor/:slug"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AuthGuard>
                  <AdminEditorPage />
                </AuthGuard>
              </Suspense>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AuthGuard>
                  <AdminMenuPage />
                </AuthGuard>
              </Suspense>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </BrowserRouter>
      </NavigationProvider>
    </AuthProvider>
  );
}
