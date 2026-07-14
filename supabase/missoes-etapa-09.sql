-- CASTELOBRUXO — ETAPA 09: MISSÕES

create extension if not exists pgcrypto;

create table if not exists public.missoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descricao text not null,
  categoria text not null default 'Geral',
  dificuldade text not null default 'Fácil',
  icone text,
  objetivo_tipo text not null default 'manual',
  objetivo_texto text not null,
  meta integer not null default 1 check (meta > 0),
  nivel_minimo integer not null default 1 check (nivel_minimo > 0),
  ano_minimo integer not null default 1 check (ano_minimo > 0),
  tribo_requisito text,
  recompensa_xp integer not null default 0 check (recompensa_xp >= 0),
  recompensa_ipes integer not null default 0 check (recompensa_ipes >= 0),
  recompensa_item_codigo text,
  prazo_em timestamptz,
  repetivel boolean not null default false,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists public.missoes_usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references public.perfis(id) on delete cascade,
  missao_id uuid not null
    references public.missoes(id) on delete cascade,
  status text not null default 'ativa'
    check (status in ('ativa', 'concluida', 'cancelada')),
  progresso integer not null default 0 check (progresso >= 0),
  aceita_em timestamptz not null default now(),
  concluida_em timestamptz,
  recompensa_recebida boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, missao_id)
);

create index if not exists missoes_usuarios_usuario_idx
  on public.missoes_usuarios(usuario_id, status);

alter table public.missoes enable row level security;
alter table public.missoes_usuarios enable row level security;

drop policy if exists "Missões públicas para autenticados"
on public.missoes;

create policy "Missões públicas para autenticados"
on public.missoes
for select
to authenticated
using (ativo = true);

drop policy if exists "Usuário lê próprias missões"
on public.missoes_usuarios;

create policy "Usuário lê próprias missões"
on public.missoes_usuarios
for select
to authenticated
using (auth.uid() = usuario_id);

insert into public.missoes (
  codigo,
  titulo,
  descricao,
  categoria,
  dificuldade,
  icone,
  objetivo_tipo,
  objetivo_texto,
  meta,
  nivel_minimo,
  ano_minimo,
  recompensa_xp,
  recompensa_ipes,
  recompensa_item_codigo,
  ordem
)
values
  (
    'primeira-correspondencia',
    'A Carta Perdida',
    'Ajude o Correio Mágico a confirmar que as novas rotas de correspondência estão funcionando.',
    'Social',
    'Fácil',
    '✉️',
    'cartas_enviadas',
    'Envie uma carta pelo Correio Mágico.',
    1,
    1,
    1,
    20,
    10,
    null,
    10
  ),
  (
    'mochila-preparada',
    'Mochila Preparada',
    'Todo explorador deve conhecer os recursos que carrega antes de deixar a escola.',
    'Exploração',
    'Fácil',
    '🎒',
    'itens_inventario',
    'Tenha pelo menos 3 unidades de itens no inventário.',
    3,
    1,
    1,
    25,
    15,
    null,
    20
  ),
  (
    'estudo-da-floresta',
    'Sinais da Floresta',
    'Revise seus estudos antes de investigar os sinais incomuns próximos às trilhas.',
    'Acadêmico',
    'Média',
    '🌿',
    'aulas_concluidas',
    'Conclua 2 aulas.',
    2,
    1,
    1,
    40,
    20,
    null,
    30
  ),
  (
    'rede-de-mensageiros',
    'Rede de Mensageiros',
    'Fortaleça a comunicação entre os estudantes por meio do Correio Mágico.',
    'Social',
    'Média',
    '📨',
    'cartas_enviadas',
    'Envie 5 cartas.',
    5,
    2,
    2,
    60,
    30,
    null,
    40
  ),
  (
    'colecao-de-campo',
    'Coleção de Campo',
    'Reúna materiais suficientes para uma futura expedição fora dos limites principais.',
    'Exploração',
    'Difícil',
    '🧭',
    'itens_inventario',
    'Tenha pelo menos 10 unidades de itens no inventário.',
    10,
    3,
    3,
    100,
    60,
    null,
    50
  ),
  (
    'jornada-academica',
    'Jornada Acadêmica',
    'Demonstre constância e dedicação aos estudos de Castelobruxo.',
    'Acadêmico',
    'Épica',
    '📚',
    'aulas_concluidas',
    'Conclua 10 aulas.',
    10,
    4,
    4,
    180,
    100,
    null,
    60
  )
on conflict (codigo) do update set
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  categoria = excluded.categoria,
  dificuldade = excluded.dificuldade,
  icone = excluded.icone,
  objetivo_tipo = excluded.objetivo_tipo,
  objetivo_texto = excluded.objetivo_texto,
  meta = excluded.meta,
  nivel_minimo = excluded.nivel_minimo,
  ano_minimo = excluded.ano_minimo,
  recompensa_xp = excluded.recompensa_xp,
  recompensa_ipes = excluded.recompensa_ipes,
  recompensa_item_codigo = excluded.recompensa_item_codigo,
  ordem = excluded.ordem,
  ativo = true;

drop function if exists public.calcular_progresso_missao(uuid, uuid);

create function public.calcular_progresso_missao(
  usuario_alvo uuid,
  missao_alvo uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  tipo_objetivo text;
  progresso_calculado integer := 0;
begin
  select objetivo_tipo
  into tipo_objetivo
  from public.missoes
  where id = missao_alvo;

  case tipo_objetivo
    when 'cartas_enviadas' then
      if to_regclass('public.mensagens') is not null then
        select count(*)::integer
        into progresso_calculado
        from public.mensagens
        where remetente_id = usuario_alvo;
      end if;

    when 'itens_inventario' then
      if to_regclass('public.inventario') is not null then
        begin
          execute '
            select coalesce(sum(quantidade), 0)::integer
            from public.inventario
            where usuario_id = $1
          '
          into progresso_calculado
          using usuario_alvo;
        exception
          when undefined_column then
            progresso_calculado := 0;
        end;
      end if;

    when 'aulas_concluidas' then
      if to_regclass('public.progresso_aulas') is not null then
        begin
          execute '
            select count(*)::integer
            from public.progresso_aulas
            where usuario_id = $1
              and concluida = true
          '
          into progresso_calculado
          using usuario_alvo;
        exception
          when undefined_column then
            progresso_calculado := 0;
        end;
      end if;

    else
      select coalesce(progresso, 0)
      into progresso_calculado
      from public.missoes_usuarios
      where usuario_id = usuario_alvo
        and missao_id = missao_alvo;
  end case;

  return coalesce(progresso_calculado, 0);
end;
$$;

drop function if exists public.listar_missoes_usuario();

create function public.listar_missoes_usuario()
returns table (
  id uuid,
  codigo text,
  titulo text,
  descricao text,
  categoria text,
  dificuldade text,
  icone text,
  objetivo_texto text,
  meta integer,
  nivel_minimo integer,
  ano_minimo integer,
  tribo_requisito text,
  recompensa_xp integer,
  recompensa_ipes integer,
  recompensa_item_codigo text,
  prazo_em timestamptz,
  status_usuario text,
  progresso integer,
  concluida_em timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  nivel_usuario integer := 1;
  ano_usuario integer := 1;
  tribo_usuario text;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select
    coalesce(nivel, 1),
    coalesce(ano, 1),
    tribo
  into
    nivel_usuario,
    ano_usuario,
    tribo_usuario
  from public.perfis
  where public.perfis.id = usuario_atual;

  update public.missoes_usuarios mu
  set
    progresso = public.calcular_progresso_missao(
      usuario_atual,
      mu.missao_id
    ),
    atualizado_em = now()
  where mu.usuario_id = usuario_atual
    and mu.status = 'ativa';

  return query
  select
    m.id,
    m.codigo,
    m.titulo,
    m.descricao,
    m.categoria,
    m.dificuldade,
    m.icone,
    m.objetivo_texto,
    m.meta,
    m.nivel_minimo,
    m.ano_minimo,
    m.tribo_requisito,
    m.recompensa_xp,
    m.recompensa_ipes,
    m.recompensa_item_codigo,
    m.prazo_em,
    case
      when mu.status = 'concluida' then 'concluida'
      when mu.status = 'ativa' then 'ativa'
      else 'disponivel'
    end as status_usuario,
    coalesce(
      mu.progresso,
      public.calcular_progresso_missao(usuario_atual, m.id)
    ) as progresso,
    mu.concluida_em
  from public.missoes m
  left join public.missoes_usuarios mu
    on mu.missao_id = m.id
   and mu.usuario_id = usuario_atual
  where m.ativo = true
    and nivel_usuario >= m.nivel_minimo
    and ano_usuario >= m.ano_minimo
    and (
      m.tribo_requisito is null
      or lower(m.tribo_requisito) = lower(coalesce(tribo_usuario, ''))
    )
    and (
      m.prazo_em is null
      or m.prazo_em >= now()
      or mu.status = 'concluida'
    )
  order by
    case
      when mu.status = 'ativa' then 1
      when mu.status = 'concluida' then 2
      else 0
    end,
    m.ordem;
end;
$$;

grant execute on function public.listar_missoes_usuario()
to authenticated;

drop function if exists public.aceitar_missao(uuid);

create function public.aceitar_missao(
  missao_alvo uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  missao_registro public.missoes%rowtype;
  nivel_usuario integer := 1;
  ano_usuario integer := 1;
  tribo_usuario text;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
  into missao_registro
  from public.missoes
  where id = missao_alvo
    and ativo = true;

  if not found then
    raise exception 'Missão não encontrada.';
  end if;

  select
    coalesce(nivel, 1),
    coalesce(ano, 1),
    tribo
  into
    nivel_usuario,
    ano_usuario,
    tribo_usuario
  from public.perfis
  where id = usuario_atual;

  if nivel_usuario < missao_registro.nivel_minimo then
    raise exception 'Seu nível ainda não permite aceitar esta missão.';
  end if;

  if ano_usuario < missao_registro.ano_minimo then
    raise exception 'Seu ano acadêmico ainda não permite aceitar esta missão.';
  end if;

  if (
    missao_registro.tribo_requisito is not null
    and lower(missao_registro.tribo_requisito)
      <> lower(coalesce(tribo_usuario, ''))
  ) then
    raise exception 'Esta missão pertence a outra tribo.';
  end if;

  if (
    missao_registro.prazo_em is not null
    and missao_registro.prazo_em < now()
  ) then
    raise exception 'O prazo desta missão terminou.';
  end if;

  insert into public.missoes_usuarios (
    usuario_id,
    missao_id,
    status,
    progresso
  )
  values (
    usuario_atual,
    missao_alvo,
    'ativa',
    public.calcular_progresso_missao(
      usuario_atual,
      missao_alvo
    )
  )
  on conflict (usuario_id, missao_id)
  do update set
    status = case
      when public.missoes_usuarios.status = 'concluida'
        then 'concluida'
      else 'ativa'
    end,
    progresso = greatest(
      public.missoes_usuarios.progresso,
      excluded.progresso
    ),
    atualizado_em = now();

  return jsonb_build_object('aceita', true);
end;
$$;

grant execute on function public.aceitar_missao(uuid)
to authenticated;

drop function if exists public.concluir_missao(uuid);

create function public.concluir_missao(
  missao_alvo uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  missao_registro public.missoes%rowtype;
  progresso_atual integer;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
  into missao_registro
  from public.missoes
  where id = missao_alvo
    and ativo = true;

  if not found then
    raise exception 'Missão não encontrada.';
  end if;

  if not exists (
    select 1
    from public.missoes_usuarios
    where usuario_id = usuario_atual
      and missao_id = missao_alvo
      and status = 'ativa'
  ) then
    raise exception 'Esta missão não está ativa.';
  end if;

  progresso_atual :=
    public.calcular_progresso_missao(
      usuario_atual,
      missao_alvo
    );

  if progresso_atual < missao_registro.meta then
    raise exception 'O objetivo da missão ainda não foi concluído.';
  end if;

  update public.missoes_usuarios
  set
    status = 'concluida',
    progresso = progresso_atual,
    concluida_em = now(),
    recompensa_recebida = true,
    atualizado_em = now()
  where usuario_id = usuario_atual
    and missao_id = missao_alvo
    and recompensa_recebida = false;

  if not found then
    raise exception 'As recompensas desta missão já foram recebidas.';
  end if;

  if missao_registro.recompensa_xp > 0 then
    update public.perfis
    set xp = coalesce(xp, 0)
      + missao_registro.recompensa_xp
    where id = usuario_atual;
  end if;

  if missao_registro.recompensa_ipes > 0 then
    update public.carteiras
    set saldo = coalesce(saldo, 0)
      + missao_registro.recompensa_ipes
    where usuario_id = usuario_atual;
  end if;

  return jsonb_build_object(
    'concluida', true,
    'xp', missao_registro.recompensa_xp,
    'ipes', missao_registro.recompensa_ipes,
    'item_codigo', missao_registro.recompensa_item_codigo
  );
end;
$$;

grant execute on function public.concluir_missao(uuid)
to authenticated;

drop function if exists public.atualizar_progresso_missao(
  uuid,
  integer
);

create function public.atualizar_progresso_missao(
  missao_alvo uuid,
  novo_progresso integer
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

  update public.missoes_usuarios
  set
    progresso = greatest(progresso, novo_progresso),
    atualizado_em = now()
  where usuario_id = usuario_atual
    and missao_id = missao_alvo
    and status = 'ativa';

  return jsonb_build_object('atualizado', found);
end;
$$;

grant execute on function public.atualizar_progresso_missao(
  uuid,
  integer
) to authenticated;
