import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, PlusCircle, ListOrdered, ExternalLink, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { siteConfig } from '@/config/site.config';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] text-ink">
      <aside className="w-64 shrink-0 bg-[#15171A] text-white flex flex-col justify-between">
        <div>
          <div className="px-6 py-6 border-b border-white/10">
            <Link to="/admin" className="block">
              <span className="font-masthead text-2xl text-white tracking-tight">
                {siteConfig.title}
              </span>
              <span className="block font-condensed text-[11px] uppercase tracking-widest text-gray-400 mt-1">
                Ghost Admin
              </span>
            </Link>
          </div>

          <nav className="p-4 space-y-1">
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                location.pathname === '/admin'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Publicações
            </Link>
            <Link
              to="/admin/editor"
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                location.pathname.startsWith('/admin/editor')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Novo Artigo
            </Link>
            <Link
              to="/admin/menu"
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                location.pathname === '/admin/menu'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Menu
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Site
            </a>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-gray-400 truncate mb-3 px-2">{user?.email}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
