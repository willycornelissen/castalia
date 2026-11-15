import { Link } from 'react-router-dom';
import { siteConfig } from '@/config/site.config';
import { useNavigation } from '@/context/NavigationContext';
import { isExternalNavUrl } from '@/services/navigation.service';
import { formatMastheadDate } from '@/utils/formatDate';

export function Masthead() {
  const today = formatMastheadDate(new Date());
  const { items: navigationItems } = useNavigation();

  return (
    <header className="bg-paper pt-4 pb-2">
      <div className="newspaper-container">
        <div className="flex flex-wrap justify-between items-center text-xs font-condensed uppercase tracking-widest text-muted pb-3 border-b border-ink/15 gap-2">
          <span>{today}</span>
          <span>{siteConfig.editionLabel}</span>
        </div>

        <div className="py-6 text-center border-b border-ink/15">
          <Link to="/" className="inline-block">
            <h1 className="font-masthead text-5xl sm:text-6xl md:text-7xl text-ink tracking-tight leading-none">
              {siteConfig.title}
            </h1>
          </Link>
          <p className="mt-2 font-serif italic text-base sm:text-lg text-muted">
            {siteConfig.subtitle}
          </p>
        </div>

        <nav
          aria-label="Navegação principal"
          className="py-3 border-b-2 border-ink flex flex-wrap justify-center gap-6 sm:gap-10"
        >
          {navigationItems.map((item, index) =>
            isExternalNavUrl(item.path) ? (
              <a
                key={`${index}-${item.path}`}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="font-condensed text-sm uppercase tracking-widest font-bold text-ink hover:opacity-65 transition-opacity"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={`${index}-${item.path}`}
                to={item.path}
                className="font-condensed text-sm uppercase tracking-widest font-bold text-ink hover:opacity-65 transition-opacity"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
