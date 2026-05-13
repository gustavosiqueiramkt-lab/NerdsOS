-- Tabela de contratos gerados pelo módulo de Propostas
create table contratos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('spot', 'fee')),
  status text not null default 'gerado' check (status in ('gerado', 'assinado', 'cancelado')),
  signed_at timestamptz,

  -- Dados do CONTRATANTE
  razao_social text not null,
  cnpj text not null,
  endereco text not null,
  nome_representante text not null,
  rg_representante text not null,
  cpf_representante text not null,

  -- Spot: serviços selecionados como [{id, name, price}]
  servicos_contratados jsonb,
  valor_total numeric,
  forma_pagamento text check (forma_pagamento in ('integral', '30_70', '50_50')),

  -- Fee
  plano text check (plano in ('start', 'growth', 'scale')),
  fee_mensal numeric,
  taxa_ativacao numeric,
  plano_conteudo text check (plano_conteudo in ('pulse', 'flow', 'engine') or plano_conteudo is null),
  dia_vencimento integer default 5,

  -- Conversão para cliente
  converted_to_client_id uuid references clients(id)
);

alter table contratos enable row level security;

create policy "contratos_own" on contratos
  for all using (auth.uid() = user_id);
