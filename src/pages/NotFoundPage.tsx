import { Link } from 'react-router-dom';
import { Masthead } from '@/components/reader/Masthead';
import { Footer } from '@/components/reader/Footer';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Masthead />
      <main className="flex-1 newspaper-container flex flex-col items-center justify-center py-20 text-center">
        <span className="font-condensed text-xs uppercase tracking-widest text-muted mb-2">
          Erro de Edição
        </span>
        <h2 className="font-masthead text-7xl text-ink mb-4">404</h2>
        <p className="font-serif text-2xl text-muted italic max-w-md mb-8">
          A página ou matéria solicitada não foi localizada nos arquivos desta edição.
        </p>
        <Link
          to="/"
          className="font-condensed text-sm uppercase tracking-widest font-bold border-2 border-ink px-6 py-2.5 hover:bg-ink hover:text-paper transition-colors"
        >
          Voltar à Primeira Página
        </Link>
      </main>
      <Footer />
    </div>
  );
}
