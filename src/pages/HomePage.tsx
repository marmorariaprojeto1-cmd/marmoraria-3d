import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  buildWhatsAppUrl,
  buildPublicSitePath,
  fallbackCompany,
  fetchPublicCompany,
  fetchPublicStones,
  resolvePublicCompanyIdentifier,
  type PublicCompany,
  type PublicStone,
} from '../publicSite/siteData';

const fallbackHeroTitle = 'Sua bancada, do seu jeito.';
const fallbackHeroSubtitle =
  'Simule em 3D, escolha a pedra e envie seu projeto para orçamento de forma rápida.';

const steps = [
  {
    number: '1',
    title: 'Escolha sua pedra',
    text: 'Navegue pelo catálogo e selecione a pedra ideal para seu projeto.',
  },
  {
    number: '2',
    title: 'Defina medidas',
    text: 'Informe as medidas da sua bancada, cuba e recortes de forma prática.',
  },
  {
    number: '3',
    title: 'Visualize em 3D',
    text: 'Veja seu projeto ganhar vida com renderização em tempo real.',
  },
  {
    number: '4',
    title: 'Receba o orçamento',
    text: 'Envie seu projeto diretamente para a marmoraria.',
  },
];

const benefits = [
  {
    title: 'Simulação realista',
    text: 'Projetos em 3D com acabamentos fiéis à realidade.',
  },
  {
    title: 'Preço transparente',
    text: 'Valor calculado na hora, sem surpresas e sem compromisso.',
  },
  {
    title: 'Atendimento rápido',
    text: 'Seu pedido chega direto no painel da marmoraria.',
  },
  {
    title: 'Segurança e confiança',
    text: 'Seus dados protegidos e processo simples.',
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function resolveHeroTitle(company: PublicCompany) {
  return company.home_title?.trim() || fallbackHeroTitle;
}

function resolveHeroSubtitle(company: PublicCompany) {
  return company.home_subtitle?.trim() || fallbackHeroSubtitle;
}

export function HomePage() {
  const publicCompanyIdentifier = resolvePublicCompanyIdentifier();
  const { data: company = fallbackCompany } = useQuery({
    queryKey: ['public-company-home', publicCompanyIdentifier.cacheKey],
    queryFn: fetchPublicCompany,
  });

  const { data: stones = [] } = useQuery({
    queryKey: ['public-stones-home', publicCompanyIdentifier.cacheKey],
    queryFn: fetchPublicStones,
  });

  const heroTitle = resolveHeroTitle(company);
  const heroSubtitle = resolveHeroSubtitle(company);
  const whatsappUrl = buildWhatsAppUrl(
    company.whatsapp,
    `Olá! Vim pela Home da ${company.name} e quero simular meu projeto.`,
  );

  return (
    <div className="space-y-0 overflow-hidden rounded-[28px] border border-stoneLine bg-white shadow-[0_24px_80px_rgba(31,31,31,0.10)]">
      <style>
        {`
          @media (min-width: 1024px) {
            .home-hero-design {
              min-height: var(--hero-height, 500px);
            }

            .home-hero-image {
              filter:
                brightness(var(--hero-image-brightness, 1))
                contrast(var(--hero-image-contrast, 1))
                saturate(var(--hero-image-saturation, 1));
            }

            .home-hero-dark-overlay {
              background: rgba(0, 0, 0, var(--hero-overlay-dark, 0));
            }

            .home-hero-light-overlay {
              background: linear-gradient(
                to right,
                rgba(255, 255, 255, var(--hero-overlay-light, 0)),
                transparent 58%
              );
            }

            .home-hero-card {
              left: var(--hero-card-x, 35px);
              top: calc(50% + var(--hero-card-y, 0px));
              width: var(--hero-card-width, 452px);
              min-height: var(--hero-card-height, 426px);
              padding: var(--hero-card-padding, 20px);
              border-radius: var(--hero-card-radius, 48px);
              background: rgba(255, 255, 255, var(--hero-card-opacity, 0.4));
              box-shadow: var(--hero-card-shadow, 0 17px 45px rgba(0,0,0,0.12));
              backdrop-filter: blur(var(--hero-card-blur, 7px));
              -webkit-backdrop-filter: blur(var(--hero-card-blur, 7px));
            }

            .home-hero-title {
              max-width: var(--hero-title-width, 250px);
              font-size: var(--hero-title-size, 40px);
              line-height: var(--hero-title-line-height, 0.95);
              letter-spacing: var(--hero-title-letter-spacing, 0.02em);
            }

            .home-hero-subtitle {
              max-width: var(--hero-subtitle-width, 342px);
              font-size: var(--hero-subtitle-size, 12px);
            }

            .home-hero-buttons {
              gap: var(--hero-button-gap, 1px);
            }

            .home-hero-button {
              width: var(--hero-button-width, 320px);
              height: var(--hero-button-height, 43px);
              border-radius: var(--hero-button-radius, 11px);
            }
          }
        `}
      </style>
      <section className="home-hero-design relative min-h-[560px] overflow-hidden border-b border-stoneLine">
        {company.home_image_url && (
          <>
            <img
              alt="Imagem principal da Home"
              className="absolute inset-0 hidden h-full w-full object-cover object-center lg:block"
              src={company.home_image_url}
            />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-black/[0.08] via-transparent to-transparent lg:block" />
          </>
        )}

        <div className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 lg:absolute lg:left-[64px] lg:top-1/2 lg:w-[520px] lg:-translate-y-1/2 lg:rounded-[28px] lg:border lg:border-white/[0.65] lg:bg-white/[0.42] lg:px-12 lg:py-11 lg:shadow-[0_34px_110px_rgba(0,0,0,0.18)] lg:backdrop-blur-[22px]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss">
            Visualize. Simule. Receba.
          </p>
          <h1 className="mt-6 max-w-xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-graphite sm:text-6xl">
            {heroTitle}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-800 sm:text-lg">
            {heroSubtitle}
          </p>

          <div className="mt-10 flex gap-4">
            <Link
              to={buildPublicSitePath('/configurador-tampo')}
              className="primary-button rounded-lg px-7 py-3.5 text-center leading-tight transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              Simular meu projeto
            </Link>
            {whatsappUrl ? (
              <a
                className="secondary-button rounded-lg border-white/70 bg-white/35 px-7 py-3.5 text-center leading-tight transition duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-sm"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                Falar no WhatsApp
              </a>
            ) : (
              <span className="secondary-button cursor-not-allowed rounded-lg border-white/70 bg-white/35 px-7 py-3.5 text-center leading-tight opacity-60">
                WhatsApp indisponível
              </span>
            )}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-0 text-center text-xs text-stone-800 divide-x divide-stone-400/30">
            <span className="px-4 font-semibold leading-tight">
              Visualização 3D
            </span>
            <span className="px-4 font-semibold leading-tight">
              Preço na hora
            </span>
            <span className="px-4 font-semibold leading-tight">
              Envio direto
            </span>
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden bg-stone-100 lg:min-h-[560px] lg:bg-transparent">
          {company.home_image_url ? (
            <img
              alt="Imagem principal da Home"
              className="h-full min-h-[360px] w-full object-cover object-center lg:hidden"
              src={company.home_image_url}
            />
          ) : (
            <HeroPlaceholder />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-transparent" />
        </div>
      </section>

      <section id="como-funciona" className="border-b border-stoneLine px-6 py-14 sm:px-10 lg:px-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">
            Como funciona
          </p>
          <h2 className="mt-3 text-3xl font-bold text-graphite">
            Em 4 passos simples
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="rounded-lg border border-stoneLine bg-white p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-moss text-sm font-bold text-white">
                {step.number}
              </span>
              <h3 className="mt-5 text-base font-bold text-graphite">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="pedras" className="border-b border-stoneLine bg-stone-50/70 px-6 py-14 sm:px-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">
              Catálogo
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-graphite">
              Pedras para todos os estilos
            </h2>
            <p className="mt-4 text-sm leading-6 text-stone-700">
              Materiais selecionados com qualidade e variedade para transformar
              seu ambiente.
            </p>
            <Link
              to={buildPublicSitePath('/catalogo-pedras')}
              className="secondary-button mt-6 inline-flex px-4 py-2"
            >
              Ver catálogo completo
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stones.length > 0
              ? stones.map((stone) => <StoneCard key={stone.id} stone={stone} />)
              : Array.from({ length: 4 }, (_, index) => (
                <StonePlaceholder key={index} />
              ))}
          </div>
        </div>
      </section>

      <section className="bg-graphite px-6 py-14 text-white sm:px-10 lg:px-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-green-300">
            Por que escolher a gente
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Tecnologia e qualidade que fazem a diferença
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <h3 className="text-base font-bold">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-200">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-stoneLine px-6 py-12 sm:px-10 lg:px-12">
        <div className="flex flex-col gap-6 rounded-xl border border-stoneLine bg-stone-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">
              Pronto para começar?
            </p>
            <h2 className="mt-2 text-2xl font-bold text-graphite">
              Simule agora seu projeto
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              É rápido, gratuito e sem compromisso.
            </p>
          </div>
          <Link
            to={buildPublicSitePath('/configurador-tampo')}
            className="primary-button text-center"
          >
            Simular meu projeto
          </Link>
        </div>
      </section>

    </div>
  );
}

function HeroPlaceholder() {
  return (
    <div className="flex h-full min-h-[560px] items-center justify-center bg-gradient-to-br from-stone-100 via-white to-stone-200 p-10">
      <div className="relative h-72 w-full max-w-lg rounded-xl border border-stone-300 bg-gradient-to-br from-white via-stone-100 to-stone-300 shadow-xl">
        <div className="absolute left-1/2 top-1/2 h-20 w-28 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-stone-500 bg-white/80 shadow-inner" />
        <div className="absolute -bottom-8 right-10 h-20 w-24 rounded-t-xl bg-graphite/80" />
      </div>
    </div>
  );
}

function StoneCard({ stone }: { stone: PublicStone }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stoneLine bg-white">
      {stone.image_url ? (
        <img
          alt={stone.name}
          className="h-36 w-full object-cover"
          src={stone.image_url}
        />
      ) : (
        <div className="h-36 bg-gradient-to-br from-stone-100 via-white to-stone-200" />
      )}
      <div className="p-4">
        <h3 className="text-sm font-bold text-graphite">{stone.name}</h3>
        <p className="mt-4 text-xs text-stone-500">A partir de</p>
        <p className="mt-1 text-sm font-bold text-graphite">
          {formatCurrency(stone.price_per_m2)} / m²
        </p>
      </div>
    </div>
  );
}

function StonePlaceholder() {
  return (
    <div className="overflow-hidden rounded-lg border border-stoneLine bg-white">
      <div className="h-36 bg-gradient-to-br from-stone-100 via-white to-stone-200" />
      <div className="p-4">
        <h3 className="text-sm font-bold text-graphite">Pedra em cadastro</h3>
        <p className="mt-4 text-xs text-stone-500">A partir de</p>
        <p className="mt-1 text-sm font-bold text-graphite">Preço sob consulta</p>
      </div>
    </div>
  );
}
