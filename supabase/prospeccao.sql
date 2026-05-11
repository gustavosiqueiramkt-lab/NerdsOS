-- Prospecção module tables
-- Run this in Supabase SQL Editor

create table if not exists prospeccao_buscas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  termo_busca text not null,
  cidade text,
  status text not null default 'pendente'
    check (status in ('pendente', 'executando', 'concluida', 'erro')),
  total_encontrados int not null default 0,
  apify_run_id text,
  user_id uuid references auth.users(id) on delete cascade
);

create table if not exists prospeccao_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  busca_id uuid references prospeccao_buscas(id) on delete set null,
  nome_empresa text not null,
  endereco text,
  cidade text,
  segmento text,
  telefone text,
  website text,
  instagram text,
  google_maps_url text,
  google_rating numeric(3,1),
  google_reviews_count int,
  sem_website boolean not null default false,
  score_oportunidade int not null default 0,
  mensagem_enviada boolean not null default false,
  enviada_em timestamptz,
  mensagem_texto text,
  whatsapp_status text check (whatsapp_status in ('pendente','enviado','entregue','lido','respondeu')),
  convertido_para_crm boolean not null default false,
  crm_lead_id uuid references leads(id) on delete set null,
  status text not null default 'novo'
    check (status in ('novo','mensagem_enviada','respondeu','convertido','descartado'))
);

create table if not exists prospeccao_config (
  id uuid primary key default gen_random_uuid(),
  limite_diario int not null default 20,
  evolution_instance text,
  evolution_token text,
  mensagem_template text not null default 'Olá! Vi que a {empresa} ainda não tem presença digital estruturada. Ajudamos empresas como a sua a conseguir mais clientes pelo Google. Posso te mostrar um diagnóstico gratuito?',
  ativo boolean not null default true
);

-- RLS
alter table prospeccao_buscas enable row level security;
alter table prospeccao_leads enable row level security;
alter table prospeccao_config enable row level security;

create policy "auth users can manage buscas"
  on prospeccao_buscas for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth users can manage leads"
  on prospeccao_leads for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth users can manage config"
  on prospeccao_config for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Useful index for daily send count query
create index if not exists idx_prospeccao_leads_enviada_em
  on prospeccao_leads (mensagem_enviada, enviada_em);
