-- CASTELOBRUXO — CORREÇÃO DE BANNER, PETS E CMS

alter table public.perfis
  add column if not exists banner_url text;

alter table public.config_perfil_publico
  add column if not exists banner_url text;

alter table public.pets
  add column if not exists imagem_url text,
  add column if not exists descricao text,
  add column if not exists raridade text,
  add column if not exists historia_base text,
  add column if not exists personalidade_base text,
  add column if not exists ativo boolean not null default true;

alter table public.pets_usuarios
  add column if not exists energia integer not null default 100,
  add column if not exists idade integer,
  add column if not exists personalidade text,
  add column if not exists historia text;

-- Copia foto_url para imagem_url quando a coluna antiga existir.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pets'
      and column_name = 'foto_url'
  ) then
    execute '
      update public.pets
      set imagem_url = coalesce(imagem_url, foto_url)
      where foto_url is not null
    ';
  end if;
end
$$;

-- Garante interação do tutor com os próprios pets.
alter table public.pets_usuarios enable row level security;

drop policy if exists "Tutor lê próprios pets" on public.pets_usuarios;
create policy "Tutor lê próprios pets"
on public.pets_usuarios
for select
to authenticated
using (usuario_id = auth.uid());

drop policy if exists "Tutor adota pet" on public.pets_usuarios;
create policy "Tutor adota pet"
on public.pets_usuarios
for insert
to authenticated
with check (usuario_id = auth.uid());

drop policy if exists "Tutor atualiza próprios pets" on public.pets_usuarios;
create policy "Tutor atualiza próprios pets"
on public.pets_usuarios
for update
to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

-- Banner aprovado atualiza as duas fontes usadas pelo perfil.
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

    insert into public.config_perfil_publico (
      usuario_id,
      banner_url,
      atualizado_em
    )
    values (
      registro.usuario_id,
      registro.url_arquivo,
      now()
    )
    on conflict (usuario_id)
    do update set
      banner_url = excluded.banner_url,
      atualizado_em = now();
  end if;

  return jsonb_build_object(
    'atualizado', true,
    'status', novo_status
  );
end;
$$;

grant execute on function public.moderar_midia_perfil_administracao(uuid,text)
to authenticated;

-- Corrige banners que já tinham sido aprovados.
insert into public.config_perfil_publico (
  usuario_id,
  banner_url,
  atualizado_em
)
select distinct on (m.usuario_id)
  m.usuario_id,
  m.url_arquivo,
  now()
from public.midias_perfil m
where m.tipo = 'banner'
  and m.status = 'aprovado'
order by m.usuario_id, m.moderado_em desc nulls last, m.criado_em desc
on conflict (usuario_id)
do update set
  banner_url = excluded.banner_url,
  atualizado_em = now();

update public.perfis p
set banner_url = c.banner_url
from public.config_perfil_publico c
where c.usuario_id = p.id
  and c.banner_url is not null;

-- CMS passa a listar o catálogo de pets, não um usuário inexistente em pets.
drop function if exists public.listar_pets_administracao();

create function public.listar_pets_administracao()
returns table (
  id uuid,
  nome text,
  especie text,
  descricao text,
  imagem_url text,
  raridade text,
  personalidade_base text,
  historia_base text,
  ativo boolean,
  total_adocoes bigint
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
    p.id,
    p.nome,
    p.especie,
    p.descricao,
    p.imagem_url,
    p.raridade,
    p.personalidade_base,
    p.historia_base,
    p.ativo,
    count(pu.id) as total_adocoes
  from public.pets p
  left join public.pets_usuarios pu
    on pu.pet_id = p.id
  group by
    p.id,
    p.nome,
    p.especie,
    p.descricao,
    p.imagem_url,
    p.raridade,
    p.personalidade_base,
    p.historia_base,
    p.ativo
  order by p.nome;
end;
$$;

grant execute on function public.listar_pets_administracao()
to authenticated;

drop function if exists public.salvar_pet_administracao(
  uuid,text,text,text,text,text,text,text,boolean
);

create function public.salvar_pet_administracao(
  pet_alvo uuid,
  novo_nome text,
  nova_especie text,
  nova_descricao text,
  nova_imagem_url text,
  nova_raridade text,
  nova_personalidade text,
  nova_historia text,
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
  set
    nome = nullif(trim(novo_nome), ''),
    especie = nullif(trim(nova_especie), ''),
    descricao = nullif(trim(nova_descricao), ''),
    imagem_url = nullif(trim(nova_imagem_url), ''),
    raridade = nullif(trim(nova_raridade), ''),
    personalidade_base = nullif(trim(nova_personalidade), ''),
    historia_base = nullif(trim(nova_historia), ''),
    ativo = coalesce(novo_ativo, true)
  where id = pet_alvo;

  if not found then
    raise exception 'Pet não encontrado.';
  end if;

  return jsonb_build_object('atualizado', true);
end;
$$;

grant execute on function public.salvar_pet_administracao(
  uuid,text,text,text,text,text,text,text,boolean
) to authenticated;
