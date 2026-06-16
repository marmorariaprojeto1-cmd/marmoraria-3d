import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  buildPublicSitePath,
  fallbackCompany,
  fetchPublicCompany,
  resolvePublicCompanyIdentifier,
} from '../publicSite/siteData';

export function Footer() {
  const publicCompanyIdentifier = resolvePublicCompanyIdentifier();
  const { data: company = fallbackCompany } = useQuery({
    queryKey: ['public-company-footer', publicCompanyIdentifier.cacheKey],
    queryFn: fetchPublicCompany,
  });

  return (
    <footer id="contato" className="border-t border-stoneLine bg-white/80">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 text-sm text-stone-600 sm:px-6 md:grid-cols-[1fr_0.7fr_0.9fr] lg:px-8">
        <div>
          <p className="font-bold text-graphite">{company.name}</p>
          <p className="mt-3 max-w-sm leading-6">
            Plataforma de simulação 3D para marmorarias. Visualize, simule e
            receba orçamentos de forma rápida e prática.
          </p>
        </div>

        <div>
          <p className="font-bold uppercase text-graphite">Navegação</p>
          <div className="mt-3 grid gap-2">
            <a href={buildPublicSitePath('/#pedras')} className="hover:text-graphite">Pedras</a>
            <a href={buildPublicSitePath('/#como-funciona')} className="hover:text-graphite">Como funciona</a>
            <Link to={buildPublicSitePath('/configurador-tampo')} className="hover:text-graphite">
              Simulador
            </Link>
          </div>
        </div>

        <div>
          <p className="font-bold uppercase text-graphite">Contato</p>
          <div className="mt-3 grid gap-2">
            <span>{company.whatsapp ?? 'WhatsApp não informado'}</span>
            <span>{company.email ?? 'E-mail não informado'}</span>
            <span>{company.city ?? 'Cidade não informada'}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-stoneLine px-4 py-4 text-center text-xs text-stone-500">
        © 2024 {company.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
