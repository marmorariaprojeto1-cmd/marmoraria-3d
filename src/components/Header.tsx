import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  buildPublicSitePath,
  fallbackCompany,
  fetchPublicCompany,
  resolvePublicCompanyIdentifier,
} from '../publicSite/siteData';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/#pedras', label: 'Pedras' },
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#contato', label: 'Contato' },
];

export function Header() {
  const publicCompanyIdentifier = resolvePublicCompanyIdentifier();
  const { data: company = fallbackCompany } = useQuery({
    queryKey: ['public-company-header', publicCompanyIdentifier.cacheKey],
    queryFn: fetchPublicCompany,
  });

  return (
    <header className="sticky top-0 z-20 border-b border-stoneLine bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-auto w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:h-16 lg:px-8 lg:py-0">
        <Link to={buildPublicSitePath('/')} className="flex items-center gap-3">
          {company.logo_url ? (
            <img
              alt={`Logo ${company.name}`}
              className="h-9 w-9 rounded-md object-contain"
              src={company.logo_url}
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-stoneLine bg-stone-50 text-sm font-bold text-moss">
              3D
            </div>
          )}
          <span className="text-base font-bold text-graphite">{company.name}</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-graphite"
              href={buildPublicSitePath(item.href)}
            >
              {item.label}
            </a>
          ))}
          <Link to={buildPublicSitePath('/configurador-tampo')} className="primary-button px-4 py-2 text-center text-sm">
            Simular projeto
          </Link>
        </nav>
      </div>
    </header>
  );
}
