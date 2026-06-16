import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchPublicStoneCatalog,
  resolvePublicCompanyIdentifier,
  type PublicCatalogStone,
  type PublicStoneCatalogGroup,
} from '../publicSite/siteData';

export function StoneCatalogPage() {
  const publicCompanyIdentifier = resolvePublicCompanyIdentifier();
  const {
    data: groups = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public-stone-catalog', publicCompanyIdentifier.cacheKey],
    queryFn: fetchPublicStoneCatalog,
  });

  return (
    <section className="overflow-hidden rounded-xl border border-stoneLine bg-white shadow-sm">
      <style>
        {`
          @keyframes stoneCatalogCardEnter {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .stone-catalog-card-enter {
            opacity: 0;
            animation: stoneCatalogCardEnter 640ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .stone-catalog-section {
            opacity: 0;
            transform: translateY(28px);
            transition:
              opacity 680ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 680ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .stone-catalog-section.is-visible {
            opacity: 1;
            transform: translateY(0);
          }

          .stone-catalog-shine {
            transform: translateX(-130%) skewX(-16deg);
            transition: transform 720ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .stone-catalog-card:hover .stone-catalog-shine {
            transform: translateX(130%) skewX(-16deg);
          }

        `}
      </style>

      <StoneCatalogHero />

      <div className="space-y-12 px-6 py-10 sm:px-10 lg:px-12">
        {isLoading && (
          <p className="text-center text-sm text-stone-600">
            Carregando catálogo de pedras...
          </p>
        )}

        {isError && (
          <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar o catálogo de pedras no momento.
          </p>
        )}

        {!isLoading && !isError && groups.length === 0 && (
          <p className="rounded-lg border border-stoneLine bg-stone-50 p-4 text-sm text-stone-700">
            Nenhuma pedra ativa cadastrada para exibição pública.
          </p>
        )}

        {groups.map((group) => (
          <StoneCatalogSection key={group.category.id} group={group} />
        ))}
      </div>
    </section>
  );
}

function StoneCatalogHero() {
  const benefits = [
    {
      title: 'Materiais selecionados',
      text: 'Qualidade e procedência',
    },
    {
      title: 'Alta durabilidade',
      text: 'Resistência e beleza',
    },
    {
      title: 'Para todos os estilos',
      text: 'Do clássico ao moderno',
    },
  ];

  return (
    <header className="overflow-hidden border-b border-stoneLine bg-gradient-to-br from-[#fbfaf7] via-white to-[#f0ede6] px-6 py-12 sm:px-10 lg:px-12">
      <div className="grid min-h-[380px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-moss">
            Catálogo
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-bold leading-tight text-graphite sm:text-5xl">
            Catálogo de{' '}
            <span className="text-moss">Pedras</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-700">
            Conheça os materiais disponíveis para o seu projeto.
          </p>
          <div className="mt-7 h-0.5 w-12 rounded-full bg-moss" />

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-moss/25 bg-white/70 shadow-sm">
                  <span className="h-3 w-3 rotate-45 rounded-sm border border-moss" />
                </span>
                <h2 className="mt-3 text-sm font-bold text-graphite">
                  {benefit.title}
                </h2>
                <p className="mt-1 text-xs leading-5 text-stone-600">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[280px] items-center justify-center lg:min-h-[380px] lg:justify-end">
          <img
            alt="Chapas de pedra em pé"
            className="relative h-[280px] w-full max-w-[620px] object-contain sm:h-[340px] lg:h-[390px] lg:max-w-[700px]"
            src="/catalog/hero-stone-slabs.webp"
          />
        </div>
      </div>
    </header>
  );
}

function StoneCatalogSection({ group }: { group: PublicStoneCatalogGroup }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) {
      return undefined;
    }

    const rect = element.getBoundingClientRect();

    if (rect.top < window.innerHeight * 0.92) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.18 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={[
        'stone-catalog-section',
        isVisible ? 'is-visible' : '',
      ].join(' ')}
    >
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-stoneLine pb-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-moss">
          {group.category.name}
        </h2>
        <div className="flex min-w-[120px] items-center gap-3 text-right">
          <span className="h-px flex-1 bg-stoneLine" />
          <span className="text-sm font-medium text-stone-500">
            {group.stones.length} {group.stones.length === 1 ? 'pedra' : 'pedras'}
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {group.stones.map((stone, index) => (
          <StoneCatalogCard
            key={stone.id}
            stone={stone}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function StoneCatalogCard({
  stone,
  index,
}: {
  stone: PublicCatalogStone;
  index: number;
}) {
  return (
    <article
      className="stone-catalog-card stone-catalog-card-enter group relative min-h-[270px] overflow-hidden rounded-xl border border-stoneLine bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
      style={{ animationDelay: `${Math.min(index * 70, 490)}ms` }}
    >
      <div className="relative h-[216px] overflow-hidden bg-stone-100">
        {stone.image_url ? (
          <img
            alt={stone.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            src={stone.image_url}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 via-white to-stone-200">
            <div className="h-20 w-32 rounded-full bg-white/75 shadow-inner" />
          </div>
        )}
        <div className="stone-catalog-shine pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      <div className="flex min-h-[64px] items-center px-5 py-4">
        <h3 className="text-base font-bold leading-snug text-graphite">
          {stone.name}
        </h3>
      </div>
    </article>
  );
}
