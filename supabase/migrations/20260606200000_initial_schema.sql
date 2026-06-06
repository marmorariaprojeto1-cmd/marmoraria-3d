-- Initial database schema for Marmoraria 3D.
-- Scope: MVP Phase 2 only. No authentication policies, seeds, or real data.

create extension if not exists "pgcrypto";

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  whatsapp text,
  email text,
  city text,
  state text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('owner', 'manager', 'salesperson')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.stone_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.stones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.stone_categories(id) on delete set null,
  name text not null,
  image_url text,
  price_per_m2 numeric(12, 2) not null default 0 check (price_per_m2 >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.sinks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text,
  price numeric(12, 2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.finishes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  pricing_type text not null check (
    pricing_type in ('fixed', 'linear_meter', 'percentage')
  ),
  price numeric(12, 2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.cutouts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.drillings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  city text,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'contacted', 'negotiating', 'won', 'lost')
  ),
  total_price numeric(12, 2) not null default 0 check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  stone_id uuid references public.stones(id) on delete set null,
  sink_id uuid references public.sinks(id) on delete set null,
  finish_id uuid references public.finishes(id) on delete set null,
  width numeric(10, 2) not null check (width > 0),
  depth numeric(10, 2) not null check (depth > 0),
  thickness numeric(10, 2) not null check (thickness > 0),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  total_price numeric(12, 2) not null default 0 check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);

-- Basic indexes for tenant isolation, relationships, and common list screens.
create index companies_active_idx on public.companies(active);

create index users_company_id_idx on public.users(company_id);
create index users_role_idx on public.users(role);

create index product_categories_company_id_idx on public.product_categories(company_id);
create index products_company_id_idx on public.products(company_id);
create index products_category_id_idx on public.products(category_id);

create index stone_categories_company_id_idx on public.stone_categories(company_id);
create index stones_company_id_idx on public.stones(company_id);
create index stones_category_id_idx on public.stones(category_id);

create index sinks_company_id_idx on public.sinks(company_id);
create index finishes_company_id_idx on public.finishes(company_id);
create index cutouts_company_id_idx on public.cutouts(company_id);
create index drillings_company_id_idx on public.drillings(company_id);

create index quotes_company_id_idx on public.quotes(company_id);
create index quotes_status_idx on public.quotes(status);
create index quotes_created_at_idx on public.quotes(created_at);

create index quote_items_company_id_idx on public.quote_items(company_id);
create index quote_items_quote_id_idx on public.quote_items(quote_id);
create index quote_items_product_id_idx on public.quote_items(product_id);
create index quote_items_stone_id_idx on public.quote_items(stone_id);

create index attachments_company_id_idx on public.attachments(company_id);
create index attachments_quote_id_idx on public.attachments(quote_id);

create index activity_logs_company_id_idx on public.activity_logs(company_id);
create index activity_logs_user_id_idx on public.activity_logs(user_id);
create index activity_logs_created_at_idx on public.activity_logs(created_at);

-- RLS is enabled now. Policies will be created during authentication work.
alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.stone_categories enable row level security;
alter table public.stones enable row level security;
alter table public.sinks enable row level security;
alter table public.finishes enable row level security;
alter table public.cutouts enable row level security;
alter table public.drillings enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.attachments enable row level security;
alter table public.activity_logs enable row level security;
