-- CASTELOBRUXO — ETAPA 08: CERTIFICADOS

create extension if not exists pgcrypto;

create table if not exists public.certificados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references public.perfis(id) on delete cascade,
  titulo text not null,
  descricao text not null,
  categoria text not null default 'Acadêmico',
  instituicao text not null default
    'Escola de Magia e Bruxaria Castelobruxo',
  assinatura text not null default 'Direção de Castelobruxo',
  carga_horaria integer,
  codigo_verificacao text not null unique,
  origem_tipo text,
  origem_id text,
  destaque boolean not null default false,
  emitido_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  constraint certificados_carga_horaria_check
    check (carga_horaria is null or carga_horaria >= 0)
);

create index if not exists certificados_usuario_idx
  on public.certificados(usuario_id, emitido_em desc);

create unique index if not exists certificados_origem_unica_idx
  on public.certificados(usuario_id, origem_tipo, origem_id)
  where origem_tipo is not null and origem_id is not null;

alter table public.certificados enable row level security;

drop policy if exists "Usuário lê próprios certificados"
on public.certificados;

create policy "Usuário lê próprios certificados"
on public.certificados
for select
to authenticated
using (auth.uid() = usuario_id);

drop policy if exists "Usuário atualiza destaque de certificado"
on public.certificados;

create policy "Usuário atualiza destaque de certificado"
on public.certificados
for update
to authenticated
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);

drop function if exists public.gerar_codigo_certificado();

create function public.gerar_codigo_certificado()
returns text
language sql
volatile
as $$
  select upper(
    'CB-' ||
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
  );
$$;

drop function if exists public.verificar_certificados_usuario(uuid);

create function public.verificar_certificados_usuario(
  usuario_alvo uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  perfil_existe boolean;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if usuario_alvo is null then
    usuario_alvo := usuario_atual;
  end if;

  if usuario_alvo <> usuario_atual then
    raise exception 'Você só pode verificar seus próprios certificados.';
  end if;

  select exists(
    select 1
    from public.perfis
    where id = usuario_alvo
  )
  into perfil_existe;

  if perfil_existe then
    insert into public.certificados (
      usuario_id,
      titulo,
      descricao,
      categoria,
      codigo_verificacao,
      origem_tipo,
      origem_id
    )
    values (
      usuario_alvo,
      'Matrícula Oficial em Castelobruxo',
      'Concluiu o processo de matrícula e passou a integrar oficialmente a comunidade estudantil de Castelobruxo.',
      'Institucional',
      public.gerar_codigo_certificado(),
      'sistema',
      'matricula-oficial'
    )
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'verificado', true
  );
end;
$$;

grant execute on function public.verificar_certificados_usuario(uuid)
to authenticated;

drop function if exists public.destacar_certificado_usuario(uuid);

create function public.destacar_certificado_usuario(
  certificado_alvo uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not exists (
    select 1
    from public.certificados
    where id = certificado_alvo
      and usuario_id = usuario_atual
  ) then
    raise exception 'Certificado não encontrado.';
  end if;

  update public.certificados
  set destaque = false
  where usuario_id = usuario_atual;

  update public.certificados
  set destaque = true
  where id = certificado_alvo
    and usuario_id = usuario_atual;

  return jsonb_build_object('destacado', true);
end;
$$;

grant execute on function public.destacar_certificado_usuario(uuid)
to authenticated;

drop function if exists public.emitir_certificado(
  uuid,
  text,
  text,
  text,
  integer,
  text,
  text
);

create function public.emitir_certificado(
  usuario_destino uuid,
  titulo_certificado text,
  descricao_certificado text,
  categoria_certificado text default 'Acadêmico',
  carga_horaria_certificado integer default null,
  origem_tipo_certificado text default null,
  origem_id_certificado text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  cargo_atual text;
  certificado_novo uuid;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select lower(coalesce(cargo, ''))
  into cargo_atual
  from public.perfis
  where id = usuario_atual;

  if cargo_atual not in (
    'admin',
    'administrador',
    'professor',
    'diretor',
    'diretoria'
  ) then
    raise exception 'Você não possui permissão para emitir certificados.';
  end if;

  insert into public.certificados (
    usuario_id,
    titulo,
    descricao,
    categoria,
    carga_horaria,
    codigo_verificacao,
    origem_tipo,
    origem_id
  )
  values (
    usuario_destino,
    trim(titulo_certificado),
    trim(descricao_certificado),
    coalesce(nullif(trim(categoria_certificado), ''), 'Acadêmico'),
    carga_horaria_certificado,
    public.gerar_codigo_certificado(),
    origem_tipo_certificado,
    origem_id_certificado
  )
  returning id into certificado_novo;

  return certificado_novo;
end;
$$;

grant execute on function public.emitir_certificado(
  uuid,
  text,
  text,
  text,
  integer,
  text,
  text
) to authenticated;
