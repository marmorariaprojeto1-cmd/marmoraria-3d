import { hasSupabaseConfig, supabase } from '../lib/supabase';

export const PUBLIC_COMPANY_ID = import.meta.env.VITE_SIMULATOR_COMPANY_ID as
  | string
  | undefined;

const PLATFORM_DOMAIN = 'marmoraria3d.com.br';

export type PublicCompany = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  home_title: string | null;
  home_subtitle: string | null;
  home_image_url: string | null;
};

export type PublicStone = {
  id: string;
  name: string;
  image_url: string | null;
  price_per_m2: number;
};

export type PublicStoneCategory = {
  id: string;
  name: string;
  slug: string | null;
  sort_order: number | null;
};

export type PublicCatalogStone = {
  id: string;
  name: string;
  image_url: string | null;
  category_id: string | null;
};

export type PublicStoneCatalogGroup = {
  category: PublicStoneCategory;
  stones: PublicCatalogStone[];
};

export type PublicCompanyIdentifier = {
  source: 'query' | 'custom_domain' | 'subdomain' | 'fallback';
  value: string | null;
  cacheKey: string;
};

export const fallbackCompany: PublicCompany = {
  id: 'fallback-company',
  name: 'Marmoraria 3D',
  slug: 'marmoraria-3d',
  custom_domain: null,
  logo_url: null,
  whatsapp: null,
  email: null,
  city: null,
  home_title: null,
  home_subtitle: null,
  home_image_url: null,
};

function normalizeDomain(value: string) {
  return value
    .toLowerCase()
    .replace(/^www\./, '')
    .trim();
}

function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getBrowserLocation() {
  if (typeof window === 'undefined') {
    return {
      hostname: '',
      search: '',
    };
  }

  return {
    hostname: window.location.hostname,
    search: window.location.search,
  };
}

export function resolvePublicCompanyIdentifier(): PublicCompanyIdentifier {
  const { hostname, search } = getBrowserLocation();
  const companyParam = new URLSearchParams(search).get('company');
  const companySlug = companyParam ? normalizeSlug(companyParam) : '';

  if (companySlug) {
    return {
      source: 'query',
      value: companySlug,
      cacheKey: `query:${companySlug}`,
    };
  }

  const normalizedHostname = normalizeDomain(hostname);

  if (
    !normalizedHostname ||
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1'
  ) {
    return {
      source: 'fallback',
      value: PUBLIC_COMPANY_ID ?? null,
      cacheKey: `fallback:${PUBLIC_COMPANY_ID ?? 'none'}`,
    };
  }

  if (normalizedHostname === PLATFORM_DOMAIN) {
    return {
      source: 'fallback',
      value: PUBLIC_COMPANY_ID ?? null,
      cacheKey: `fallback:${PUBLIC_COMPANY_ID ?? 'none'}`,
    };
  }

  if (normalizedHostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const subdomain = normalizedHostname
      .slice(0, -`.${PLATFORM_DOMAIN}`.length)
      .split('.')
      .pop();
    const subdomainSlug = subdomain ? normalizeSlug(subdomain) : '';

    if (subdomainSlug && subdomainSlug !== 'www') {
      return {
        source: 'subdomain',
        value: subdomainSlug,
        cacheKey: `subdomain:${subdomainSlug}`,
      };
    }
  }

  return {
    source: 'custom_domain',
    value: normalizedHostname,
    cacheKey: `custom_domain:${normalizedHostname}`,
  };
}

export function buildPublicSitePath(path: string) {
  const identifier = resolvePublicCompanyIdentifier();

  if (identifier.source !== 'query' || !identifier.value) {
    return path;
  }

  const [basePath, hash = ''] = path.split('#');
  const separator = basePath.includes('?') ? '&' : '?';
  const pathWithCompany = `${basePath}${separator}company=${encodeURIComponent(
    identifier.value,
  )}`;

  return hash ? `${pathWithCompany}#${hash}` : pathWithCompany;
}

async function fetchResolvedPublicCompany() {
  if (!hasSupabaseConfig) {
    return fallbackCompany;
  }

  const identifier = resolvePublicCompanyIdentifier();
  let query = supabase
    .from('companies')
    .select(
      'id, name, slug, custom_domain, logo_url, whatsapp, email, city, home_title, home_subtitle, home_image_url',
    )
    .eq('active', true);

  if (
    (identifier.source === 'query' || identifier.source === 'subdomain') &&
    identifier.value
  ) {
    query = query.eq('slug', identifier.value);
  } else if (identifier.source === 'custom_domain' && identifier.value) {
    query = query.eq('custom_domain', identifier.value);
  } else if (PUBLIC_COMPANY_ID) {
    query = query.eq('id', PUBLIC_COMPANY_ID);
  } else {
    return fallbackCompany;
  }

  const { data, error } = await query.maybeSingle<PublicCompany>();

  if (error) {
    throw error;
  }

  return data ?? fallbackCompany;
}

export async function fetchPublicCompany() {
  return fetchResolvedPublicCompany();
}

export async function fetchPublicStones() {
  if (!hasSupabaseConfig) {
    return [];
  }

  const company = await fetchResolvedPublicCompany();

  if (company.id === fallbackCompany.id) {
    return [];
  }

  const { data, error } = await supabase
    .from('stones')
    .select('id, name, image_url, price_per_m2')
    .eq('company_id', company.id)
    .eq('active', true)
    .order('name', { ascending: true })
    .limit(4);

  if (error) {
    throw error;
  }

  return (data ?? []) as PublicStone[];
}

export async function fetchPublicStoneCatalog() {
  if (!hasSupabaseConfig) {
    return [];
  }

  const company = await fetchResolvedPublicCompany();

  if (company.id === fallbackCompany.id) {
    return [];
  }

  const [categoriesResult, stonesResult] = await Promise.all([
    supabase
      .from('stone_categories')
      .select('id, name, slug, sort_order')
      .eq('company_id', company.id)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('stones')
      .select('id, name, image_url, category_id')
      .eq('company_id', company.id)
      .eq('active', true)
      .order('name', { ascending: true }),
  ]);

  if (categoriesResult.error) {
    throw categoriesResult.error;
  }

  if (stonesResult.error) {
    throw stonesResult.error;
  }

  const categories = (categoriesResult.data ?? []) as PublicStoneCategory[];
  const stones = (stonesResult.data ?? []) as PublicCatalogStone[];
  const fallbackCategory = categories.find(
    (category) => category.slug === 'outros',
  );

  return categories
    .map((category) => ({
      category,
      stones: stones.filter((stone) => {
        if (stone.category_id) {
          return stone.category_id === category.id;
        }

        return fallbackCategory?.id === category.id;
      }),
    }))
    .filter((group) => group.stones.length > 0) as PublicStoneCatalogGroup[];
}

export function normalizeBrazilianWhatsApp(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function buildWhatsAppUrl(value: string | null | undefined, message: string) {
  const phone = normalizeBrazilianWhatsApp(value);

  if (!phone) {
    return '';
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
