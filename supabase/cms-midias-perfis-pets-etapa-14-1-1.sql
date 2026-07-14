-- CASTELOBRUXO — ETAPA 14.1.1 CORRIGIDA

create extension if not exists pgcrypto;

alter table public.perfis
  add column if not exists banner_url text;

create table if not exists public.midias_perfil (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('avatar', 'banner', 'galeria')),
  caminho_arquivo text not null,
  url_arquivo text not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'rejeitado')),
  moderado_por uuid references public.perfis(id) on delete set null,
  moderado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists midias_perfil_usuario_idx
  on public.midias_perfil(usuario_id);

create index if not exists midias_perfil_status_idx
  on public.midias_perfil(status);

alter table public.midias_perfil enable row level security;

drop policy if exists "Usuário lê próprias mídias" on public.midias_perfil;
create policy "Usuário lê próprias mídias"
on public.midias_perfil
for select
to authenticated
using (
  usuario_id = auth.uid()
  or status = 'aprovado'
  or public.usuario_e_administrador()
);

drop policy if exists "Usuário envia próprias mídias" on public.midias_perfil;
create policy "Usuário envia próprias mídias"
on public.midias_perfil
for insert
to authenticated
with check (
  usuario_id = auth.uid()
  and status = 'pendente'
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'midias-perfis',
  'midias-perfis',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Usuário envia mídia própria" on storage.objects;
create policy "Usuário envia mídia própria"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'midias-perfis'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Mídias públicas podem ser lidas" on storage.objects;
create policy "Mídias públicas podem ser lidas"
on storage.objects
for select
to public
using (bucket_id = 'midias-perfis');

alter table public.pets
  add column if not exists foto_url text,
  add column if not exists especie text,
  add column if not exists descricao text,
  add column if not exists personalidade text,
  add column if not exists raridade text,
  add column if not exists idade integer,
  add column if not exists energia integer not null default 100,
  add column if not exists felicidade integer not null default 100,
  add column if not exists nivel integer not null default 1,
  add column if not exists xp integer not null default 0,
  add column if not exists ativo boolean not null default true;

drop function if exists public.listar_midias_pendentes_administracao();

create function public.listar_midias_pendentes_administracao()
returns table (
  id uuid,
  usuario_id uuid,
  usuario text,
  nome_personagem text,
  tipo text,
  url_arquivo text,
  status text,
  criado_em timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.usuario_e_administrador() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  return query
  select
    m.id,
    m.usuario_id,
    p.usuario,
    p.nome_personagem,
    m.tipo,
    m.url_arquivo,
    m.status,
    m.criado_em
  from public.midias_perfil m
  join public.perfis p on p.id = m.usuario_id
  order by
    case when m.status = 'pendente' then 0 else 1 end,
    m.criado_em desc;
end;
$$;

grant execute on function public.listar_midias_pendentes_administracao()
to authenticated;

drop function if exists public.moderar_midia_perfil_administracao(uuid,text);

create function public.moderar_midia_perfil_administracao(
  midia_alvo uuid,
  novo_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  administrador_atual uuid := auth.uid();
  registro public.midias_perfil%rowtype;
begin
  if not public.usuario_e_administrador() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  if novo_status not in ('aprovado', 'rejeitado') then
    raise exception 'Status inválido.';
  end if;

  update public.midias_perfil
  set
    status = novo_status,
    moderado_por = administrador_atual,
    moderado_em = now()
  where id = midia_alvo
  returning * into registro;

  if not found then
    raise exception 'Mídia não encontrada.';
  end if;

  if novo_status = 'aprovado' and registro.tipo = 'avatar' then
    update public.perfis
    set avatar_url = registro.url_arquivo
    where id = registro.usuario_id;
  end if;

  if novo_status = 'aprovado' and registro.tipo = 'banner' then
    update public.perfis
    set banner_url = registro.url_arquivo
    where id = registro.usuario_id;
  end if;

  return jsonb_build_object('atualizado', true, 'status', novo_status);
end;
$$;

grant execute on function public.moderar_midia_perfil_administracao(uuid,text)
to authenticated;

drop function if exists public.listar_pets_administracao();

create function public.listar_pets_administracao()
returns table (
  id uuid,
  usuario_id uuid,
  usuario text,
  nome_personagem text,
  nome text,
  especie text,
  foto_url text,
  nivel integer,
  ativo boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.usuario_e_administrador() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  return query
  select
    pet.id,
    pet.usuario_id,
    p.usuario,
    p.nome_personagem,
    pet.nome,
    pet.especie,
    pet.foto_url,
    pet.nivel,
    pet.ativo
  from public.pets pet
  join public.perfis p on p.id = pet.usuario_id
  order by pet.nome;
end;
$$;

grant execute on function public.listar_pets_administracao()
to authenticated;

drop function if exists public.alterar_status_pet_administracao(uuid,boolean);

create function public.alterar_status_pet_administracao(
  pet_alvo uuid,
  novo_ativo boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.usuario_e_administrador() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  update public.pets
  set ativo = novo_ativo
  where id = pet_alvo;

  if not found then
    raise exception 'Pet não encontrado.';
  end if;

  return jsonb_build_object('atualizado', true, 'ativo', novo_ativo);
end;
$$;

grant execute on function public.alterar_status_pet_administracao(uuid,boolean)
to authenticated;
