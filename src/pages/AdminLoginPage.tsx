import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailPassword } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import { siteConfig } from '@/config/site.config';

export function AdminLoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !meta;
    const previousContent = meta?.content ?? '';
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';

    if (user) {
      navigate('/admin', { replace: true });
    }

    return () => {
      if (created) {
        meta?.remove();
      } else if (meta) {
        meta.content = previousContent;
      }
    };
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailPassword(email, password);
      navigate('/admin');
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? (err as { code: string }).code
          : '';
      if (code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.');
      } else {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="font-masthead text-4xl text-ink">{siteConfig.title}</h1>
          <p className="font-condensed text-xs uppercase tracking-widest text-muted mt-2">
            Acesso à Redação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="admin@exemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ink text-white font-medium py-2.5 rounded hover:bg-black transition-colors disabled:opacity-50"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
