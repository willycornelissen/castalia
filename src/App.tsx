import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGuard } from '@/components/admin/AuthGuard';
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

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
      <p className="font-condensed text-sm uppercase tracking-widest text-muted">
        Carregando painel administrativo...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public Reader Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/post/:slug" element={<PostPage />} />
          <Route path="/tag/:tag" element={<TagPage />} />

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

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
