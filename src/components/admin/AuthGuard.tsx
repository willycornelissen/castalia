import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <p className="font-condensed text-sm uppercase tracking-widest text-muted">
          Verificando sessão...
        </p>
      </div>
    );
  }

  const configuredAdminUid = import.meta.env.VITE_FIREBASE_ADMIN_UID;
  if (!user || (configuredAdminUid && user.uid !== configuredAdminUid)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
