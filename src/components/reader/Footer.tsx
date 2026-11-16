import { Link } from 'react-router-dom';
import { siteConfig } from '@/config/site.config';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t-2 border-ink bg-paper py-10">
      <div className="newspaper-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-ink/15">
          <div>
            <Link to="/" className="font-masthead text-3xl text-ink block mb-2">
              {siteConfig.title}
            </Link>
            <p className="text-sm text-muted leading-relaxed">{siteConfig.description}</p>
          </div>

          <div>
            <h4 className="font-condensed text-xs uppercase tracking-widest font-bold text-ink mb-3">
              Redação & Autor
            </h4>
            <p className="font-serif text-base font-semibold text-ink">
              {siteConfig.author.name}
            </p>
            <p className="text-sm text-muted mt-1">{siteConfig.author.bio}</p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-muted font-condensed tracking-wider uppercase gap-2">
          <span>
            &copy; {year} {siteConfig.title}. Todos os direitos reservados.
          </span>
          <Link to="/admin" className="hover:text-ink transition-colors">
            Redação / Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
