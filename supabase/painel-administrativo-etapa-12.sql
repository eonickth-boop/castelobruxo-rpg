-- CASTELOBRUXO — ETAPA 12: PAINEL ADMINISTRATIVO — NÚCLEO

create extension if not exists pgcrypto;

alter table public.perfis
  add column if not exists status_conta text not null default 'pendente',
  add column if not exists aprovado_em timestamptz,
  add column if not exists aprovado_por uuid
    references public.perfis(id) on delete set null;

alter table public.perfis
  drop constraint if exists perfis_status_conta_check;

alter table public.perfis
  add constraint perfis_status_conta_check
  check (
    status_conta in (
      'pendente',
      'aprovado',
      'rejeitado',
      'bloqueado'
    )
  );

-- Preserva contas já existentes para evitar bloqueio acidental.
update public.perfis
set
  status_conta = 'aprovado',
  aprovado_em = coalesce(aprovado_em, now())
where status_conta = 'pendente'
  and criado_em < now();

create table if not exists public.logs_administrativos (
  id uuid primary key default gen_random_uuid(),
  administrador_id uuid not null
    references public.perfis(id) on delete restrict,
  acao text not null,
  entidade text not null,
  entidade_id text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);

alter table public.logs_administrativos enable row level security;

drop policy if exists "Administradores leem logs"
on public.logs_administrativos;

create policy "Administradores leem logs"
on public.logs_administrativos
for select
to authenticated
using (
  exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and lower(cargo) in ('administrador', 'admin')
  )
);

drop function if exists public.usuario_e_administrador();

create function public.usuario_e_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and lower(coalesce(cargo, '')) in (
        'administrador',
        'admin'
      )
  );
$$;

grant execute on function public.usuario_e_administrador()
to authenticated;

drop function if exists public.obter_resumo_administrativo();

create function public.obter_resumo_administrativo()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.usuario_e_administrador() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  return jsonb_build_object(
    'usuarios_total',
      (select count(*) from public.perfis),
    'usuarios_pendentes',
      (select count(*) from public.perfis where status_conta = 'pendente'),
    'usuarios_aprovados',
      (select count(*) from public.perfis where status_conta = 'aprovado'),
    'professores_total',
      (select count(*) from public.perfis where lower(coalesce(cargo, '')) = 'professor'),
    'itens_total',
      case
        when to_regclass('public.items') is not null
          then (select count(*) from public.items)
        else 0
      end,
    'missoes_total',
      case
        when to_regclass('public.missoes') is not null
          then (select count(*) from public.missoes)
        else 0
      end,
    'eventos_total',
      case
        when to_regclass('public.eventos') is not null
          then (select count(*) from public.eventos)
        else 0
      end,
    'mensagens_total',
      case
        when to_regclass('public.mensagens') is not null
          then (select count(*) from public.mensagens)
        else 0
      end
  );
end;
$$;

grant execute on function public.obter_resumo_administrativo()
to authenticated;

drop function if exists public.listar_usuarios_administracao();

create function public.listar_usuarios_administracao()
returns table (
  id uuid,
  usuario text,
  nome_personagem text,
  cargo text,
  tribo text,
  nivel integer,
  status_conta text,
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
    p.id,
    p.usuario,
    p.nome_personagem,
    p.cargo,
    p.tribo,
    coalesce(p.nivel, 1),
    p.status_conta,
    p.criado_em
  from public.perfis p
  order by
    case when p.status_conta = 'pendente' then 0 else 1 end,
    p.criado_em desc;
end;
$$;

grant execute on function public.listar_usuarios_administracao()
to authenticated;

drop function if exists public.alterar_status_conta_administracao(
  uuid,
  text
);

create function public.alterar_status_conta_administracao(
  usuario_alvo uuid,
  novo_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  administrador_atual uuid := auth.uid();
begin
  if not public.usuario_e_administrador() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  if novo_status not in (
    'pendente',
    'aprovado',
    'rejeitado',
    'bloqueado'
  ) then
    raise exception 'Status inválido.';
  end if;

  update public.perfis
  set
    status_conta = novo_status,
    aprovado_em = case
      when novo_status = 'aprovado' then now()
      else aprovado_em
    end,
    aprovado_por = case
      when novo_status = 'aprovado' then administrador_atual
      else aprovado_por
    end
  where id = usuario_alvo;

  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  insert into public.logs_administrativos (
    administrador_id,
    acao,
    entidade,
    entidade_id,
    detalhes
  )
  values (
    administrador_atual,
    'alterar_status_conta',
    'perfil',
    usuario_alvo::text,
    jsonb_build_object('novo_status', novo_status)
  );

  return jsonb_build_object(
    'atualizado', true,
    'status', novo_status
  );
end;
$$;

grant execute on function public.alterar_status_conta_administracao(
  uuid,
  text
) to authenticated;

drop function if exists public.alterar_cargo_usuario_administracao(
  uuid,
  text
);

create function public.alterar_cargo_usuario_administracao(
  usuario_alvo uuid,
  novo_cargo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  administrador_atual uuid := auth.uid();
begin
  if not public.usuario_e_administrador() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  if novo_cargo not in (
    'aluno',
    'professor',
    'administrador'
  ) then
    raise exception 'Cargo inválido.';
  end if;

  update public.perfis
  set cargo = novo_cargo
  where id = usuario_alvo;

  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  insert into public.logs_administrativos (
    administrador_id,
    acao,
    entidade,
    entidade_id,
    detalhes
  )
  values (
    administrador_atual,
    'alterar_cargo',
    'perfil',
    usuario_alvo::text,
    jsonb_build_object('novo_cargo', novo_cargo)
  );

  return jsonb_build_object(
    'atualizado', true,
    'cargo', novo_cargo
  );
end;
$$;

grant execute on function public.alterar_cargo_usuario_administracao(
  uuid,
  text
) to authenticated;
