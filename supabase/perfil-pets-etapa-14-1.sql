alter table public.perfis add column if not exists banner_url text;
alter table public.config_perfil_publico add column if not exists banner_url text;

alter table public.pets
  add column if not exists historia_base text,
  add column if not exists personalidade_base text;

alter table public.pets_usuarios
  add column if not exists energia integer not null default 100,
  add column if not exists idade integer,
  add column if not exists personalidade text,
  add column if not exists historia text;

create table if not exists public.pets_historico (
  id uuid primary key default gen_random_uuid(),
  pet_usuario_id uuid not null references public.pets_usuarios(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null,
  descricao text not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.pets_habilidades (
  id uuid primary key default gen_random_uuid(),
  pet_usuario_id uuid not null references public.pets_usuarios(id) on delete cascade,
  nome text not null,
  descricao text,
  nivel_minimo integer not null default 1,
  desbloqueada boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.pets_historico enable row level security;
alter table public.pets_habilidades enable row level security;

drop policy if exists "Tutor lê histórico do pet" on public.pets_historico;
create policy "Tutor lê histórico do pet"
on public.pets_historico for select to authenticated
using (usuario_id = auth.uid());

drop policy if exists "Tutor registra histórico do pet" on public.pets_historico;
create policy "Tutor registra histórico do pet"
on public.pets_historico for insert to authenticated
with check (usuario_id = auth.uid());

drop policy if exists "Tutor lê habilidades do pet" on public.pets_habilidades;
create policy "Tutor lê habilidades do pet"
on public.pets_habilidades for select to authenticated
using (
  exists (
    select 1 from public.pets_usuarios pu
    where pu.id = pet_usuario_id
      and pu.usuario_id = auth.uid()
  )
);
