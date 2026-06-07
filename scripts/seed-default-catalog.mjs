/* global console, process */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const CONFIRMATION_VALUE = 'yes';

const products = [
  {
    name: 'Bancada de Cozinha',
    description:
      'Bancada para cozinha residencial ou comercial, com medidas personalizadas.',
  },
  {
    name: 'Ilha Gourmet',
    description:
      'Ilha central para cozinha, area gourmet ou integracao com ambientes sociais.',
  },
  {
    name: 'Pia de Banheiro',
    description: 'Pia para banheiro com pedra, cuba e acabamento configuraveis.',
  },
  {
    name: 'Lavatorio Esculpido',
    description:
      'Lavatorio produzido na propria pedra, com cuba esculpida e acabamento personalizado.',
  },
  {
    name: 'Soleira',
    description: 'Peca linear usada em portas, passagens e transicoes de piso.',
  },
  {
    name: 'Peitoril',
    description: 'Peca para acabamento de janelas, areas externas e vaos.',
  },
  {
    name: 'Nicho',
    description: 'Nicho em pedra para banheiro, area de banho ou decoracao.',
  },
  {
    name: 'Escada',
    description:
      'Degraus, pisos e espelhos de escada em pedra natural ou industrializada.',
  },
  {
    name: 'Mesa',
    description: 'Tampo de mesa em pedra, com medidas e material configuraveis.',
  },
  {
    name: 'Churrasqueira',
    description: 'Bancada ou acabamento em pedra para churrasqueira e area gourmet.',
  },
];

const stones = [
  ['Preto Sao Gabriel', 'Granito', 420],
  ['Preto Absoluto', 'Granito', 680],
  ['Verde Ubatuba', 'Granito', 360],
  ['Branco Siena', 'Granito', 390],
  ['Branco Itaunas', 'Granito', 430],
  ['Cinza Corumba', 'Granito', 340],
  ['Amarelo Ornamental', 'Granito', 370],
  ['Branco Dallas', 'Granito', 410],
  ['Branco Fortaleza', 'Granito', 400],
  ['Cafe Imperial', 'Granito', 520],
  ['Verde Labrador', 'Granito', 560],
  ['Cinza Andorinha', 'Granito', 330],
  ['Quartzo Branco', 'Quartzo', 980],
  ['Quartzo Branco Prime', 'Quartzo', 1180],
  ['Quartzo Cinza', 'Quartzo', 1020],
  ['Quartzo Cinza Claro', 'Quartzo', 1040],
  ['Quartzo Preto', 'Quartzo', 1120],
  ['Quartzo Calacatta', 'Quartzo', 1480],
  ['Quartzo Carrara', 'Quartzo', 1380],
  ['Quartzo Bege', 'Quartzo', 990],
  ['Branco Parana', 'Marmore', 920],
  ['Branco Pigues', 'Marmore', 1180],
  ['Carrara', 'Marmore', 1280],
  ['Calacatta', 'Marmore', 1680],
  ['Travertino Romano', 'Marmore', 980],
  ['Crema Marfil', 'Marmore', 1080],
  ['Nero Marquina', 'Marmore', 1480],
  ['Imperador', 'Marmore', 1180],
  ['Dekton Aura', 'Superficie Industrializada', 1980],
  ['Dekton Sirius', 'Superficie Industrializada', 1880],
  ['Dekton Kelya', 'Superficie Industrializada', 1920],
  ['Silestone Branco Zeus', 'Superficie Industrializada', 1720],
  ['Silestone Eternal Calacatta', 'Superficie Industrializada', 1960],
  ['Neolith Calacatta', 'Superficie Industrializada', 2100],
  ['Onix Branco', 'Categoria Especial', 2600],
  ['Onix Mel', 'Categoria Especial', 2800],
  ['Quartzito Taj Mahal', 'Categoria Especial', 2400],
  ['Quartzito Mont Blanc', 'Categoria Especial', 2550],
];

const sinks = [
  ['Cuba inox simples', 'Inox', 320],
  ['Cuba inox dupla', 'Inox', 620],
  ['Cuba gourmet', 'Gourmet', 780],
  ['Cuba esculpida', 'Esculpida', 1200],
  ['Cuba de apoio redonda', 'Apoio', 360],
  ['Cuba de apoio quadrada', 'Apoio', 390],
];

const finishes = [
  ['Reto', 'linear_meter', 45],
  ['Meia esquadria', 'linear_meter', 180],
  ['Boleado simples', 'linear_meter', 95],
  ['Boleado duplo', 'linear_meter', 140],
  ['Saia reta', 'linear_meter', 160],
  ['Saia com meia esquadria', 'linear_meter', 240],
];

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');

  try {
    const contents = readFileSync(envPath, 'utf8');

    for (const line of contents.split('\n')) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // A .env file is optional when the variables are provided by the shell.
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }

  return value;
}

async function upsertCatalogTable(supabase, tableName, rows) {
  const { error } = await supabase
    .from(tableName)
    .upsert(rows, {
      onConflict: 'company_id,name',
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`Falha ao inserir ${tableName}: ${error.message}`);
  }
}

async function main() {
  loadDotEnv();

  if (process.env.CONFIRM_DEFAULT_CATALOG_SEED !== CONFIRMATION_VALUE) {
    console.log(
      `Seed bloqueado. Para executar, rode com CONFIRM_DEFAULT_CATALOG_SEED=${CONFIRMATION_VALUE}.`,
    );
    return;
  }

  const supabaseUrl = requireEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY');
  const companyId = requireEnv('VITE_SIMULATOR_COMPANY_ID');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  if (process.env.SEED_USER_EMAIL && process.env.SEED_USER_PASSWORD) {
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.SEED_USER_EMAIL,
      password: process.env.SEED_USER_PASSWORD,
    });

    if (error) {
      throw new Error(`Falha ao autenticar usuario do seed: ${error.message}`);
    }
  }

  const productRows = products.map((product) => ({
    company_id: companyId,
    name: product.name,
    description: product.description,
    active: true,
  }));

  const stoneRows = stones.map(([name, , pricePerM2]) => ({
    company_id: companyId,
    name,
    category_id: null,
    image_url: null,
    price_per_m2: pricePerM2,
    active: true,
  }));

  const sinkRows = sinks.map(([name, category, price]) => ({
    company_id: companyId,
    name,
    category,
    price,
    active: true,
  }));

  const finishRows = finishes.map(([name, pricingType, price]) => ({
    company_id: companyId,
    name,
    pricing_type: pricingType,
    price,
    active: true,
  }));

  await upsertCatalogTable(supabase, 'products', productRows);
  await upsertCatalogTable(supabase, 'stones', stoneRows);
  await upsertCatalogTable(supabase, 'sinks', sinkRows);
  await upsertCatalogTable(supabase, 'finishes', finishRows);

  console.log('Catalogo padrao preparado para a empresa configurada.');
  console.log(`Produtos: ${productRows.length}`);
  console.log(`Pedras: ${stoneRows.length}`);
  console.log(`Cubas: ${sinkRows.length}`);
  console.log(`Acabamentos: ${finishRows.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
