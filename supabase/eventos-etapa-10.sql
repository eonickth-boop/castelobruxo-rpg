-- CASTELOBRUXO — ETAPA 10: EVENTOS

create extension if not exists pgcrypto;

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descricao text not null,
  categoria text not null default 'Especial',
  icone text,
  regras text not null default 'Siga as orientações da organização.',
  local_evento text not null,
  inicio_em timestamptz not null,
  fim_em timestamptz not null,
  inscricoes_abrem_em timestamptz,
  inscricoes_fecham_em timestamptz,
  limite_participantes integer,
  nivel_minimo integer not null default 1 check (nivel_minimo > 0),
  ano_minimo integer not null default 1 check (ano_minimo > 0),
  tribo_requisito text,
  recompensa_xp integer not null default 0 check (recompensa_xp >= 0),
  recompensa_ipes integer not null default 0 check (recompensa_ipes >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint eventos_periodo_check check (fim_em > inicio_em),
  constraint eventos_limite_check check (
    limite_participantes is null or limite_participantes > 0
  )
);

create table if not exists public.eventos_inscricoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null
    references public.eventos(id) on delete cascade,
  usuario_id uuid not null
    references public.perfis(id) on delete cascade,
  status text not null default 'inscrito'
    check (status in ('inscrito', 'cancelado', 'participou', 'ausente')),
  inscrito_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (evento_id, usuario_id)
);

create index if not exists eventos_inicio_idx
  on public.eventos(inicio_em);

create index if not exists eventos_inscricoes_usuario_idx
  on public.eventos_inscricoes(usuario_id);

alter table public.eventos enable row level security;
alter table public.eventos_inscricoes enable row level security;

drop policy if exists "Eventos públicos para autenticados"
on public.eventos;

create policy "Eventos públicos para autenticados"
on public.eventos
for select
to authenticated
using (ativo = true);

drop policy if exists "Usuário lê próprias inscrições"
on public.eventos_inscricoes;

create policy "Usuário lê próprias inscrições"
on public.eventos_inscricoes
for select
to authenticated
using (auth.uid() = usuario_id);

insert into public.eventos (
  codigo,
  titulo,
  descricao,
  categoria,
  icone,
  regras,
  local_evento,
  inicio_em,
  fim_em,
  inscricoes_abrem_em,
  inscricoes_fecham_em,
  limite_participantes,
  nivel_minimo,
  ano_minimo,
  recompensa_xp,
  recompensa_ipes
)
values
  (
    'festival-luzes-floresta',
    'Festival das Luzes da Floresta',
    'Uma celebração noturna dedicada aos encantos luminosos da floresta e às tradições antigas da escola.',
    'Festival',
    '✨',
    'Respeite as trilhas sinalizadas e não se afaste do grupo.',
    'Clareira das Luzes',
    now() + interval '2 days',
    now() + interval '2 days 3 hours',
    now() - interval '1 day',
    now() + interval '1 day 20 hours',
    60,
    1,
    1,
    30,
    15
  ),
  (
    'feira-cinco-trilhas',
    'Feira das Cinco Trilhas',
    'Comerciantes, artesãos e estudantes se reúnem para apresentar objetos, ingredientes e descobertas.',
    'Comércio',
    '🛍️',
    'Itens negociados durante o evento devem seguir as regras oficiais do Mercado.',
    'Praça Central',
    now() + interval '7 days',
    now() + interval '7 days 5 hours',
    now(),
    now() + interval '6 days',
    100,
    1,
    1,
    25,
    20
  ),
  (
    'observacao-criaturas',
    'Observação de Criaturas Noturnas',
    'Uma atividade guiada para registrar hábitos de criaturas que surgem apenas após o anoitecer.',
    'Acadêmico',
    '🦉',
    'Silêncio durante a observação e acompanhamento obrigatório do professor.',
    'Trilha do Observatório',
    now() - interval '1 hour',
    now() + interval '2 hours',
    now() - interval '3 days',
    now() + interval '1 hour',
    25,
    2,
    2,
    45,
    20
  )
on conflict (codigo) do update set
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  categoria = excluded.categoria,
  icone = excluded.icone,
  regras = excluded.regras,
  local_evento = excluded.local_evento,
  ativo = true;

drop function if exists public.listar_eventos_usuario();

create function public.listar_eventos_usuario()
returns table (
  id uuid,
  codigo text,
  titulo text,
  descricao text,
  categoria text,
  icone text,
  regras text,
  local_evento text,
  inicio_em timestamptz,
  fim_em timestamptz,
  limite_participantes integer,
  nivel_minimo integer,
  ano_minimo integer,
  tribo_requisito text,
  recompensa_xp integer,
  recompensa_ipes integer,
  status_evento text,
  total_inscritos integer,
  inscrito boolean
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

  return query
  select
    e.id,
    e.codigo,
    e.titulo,
    e.descricao,
    e.categoria,
    e.icone,
    e.regras,
    e.local_evento,
    e.inicio_em,
    e.fim_em,
    e.limite_participantes,
    e.nivel_minimo,
    e.ano_minimo,
    e.tribo_requisito,
    e.recompensa_xp,
    e.recompensa_ipes,
    case
      when now() < e.inicio_em then 'futuro'
      when now() between e.inicio_em and e.fim_em then 'ativo'
      else 'encerrado'
    end as status_evento,
    (
      select count(*)::integer
      from public.eventos_inscricoes ei
      where ei.evento_id = e.id
        and ei.status in ('inscrito', 'participou')
    ) as total_inscritos,
    exists (
      select 1
      from public.eventos_inscricoes ei
      where ei.evento_id = e.id
        and ei.usuario_id = usuario_atual
        and ei.status in ('inscrito', 'participou')
    ) as inscrito
  from public.eventos e
  where e.ativo = true
    and nivel_usuario >= e.nivel_minimo
    and ano_usuario >= e.ano_minimo
    and (
      e.tribo_requisito is null
      or lower(e.tribo_requisito) =
        lower(coalesce(tribo_usuario, ''))
    )
  order by e.inicio_em;
end;
$$;

grant execute on function public.listar_eventos_usuario()
to authenticated;

drop function if exists public.inscrever_em_evento(uuid);

create function public.inscrever_em_evento(
  evento_alvo uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  evento_registro public.eventos%rowtype;
  total_atual integer;
  nivel_usuario integer := 1;
  ano_usuario integer := 1;
  tribo_usuario text;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
  into evento_registro
  from public.eventos
  where id = evento_alvo
    and ativo = true;

  if not found then
    raise exception 'Evento não encontrado.';
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

  if now() > evento_registro.fim_em then
    raise exception 'Este evento já foi encerrado.';
  end if;

  if (
    evento_registro.inscricoes_abrem_em is not null
    and now() < evento_registro.inscricoes_abrem_em
  ) then
    raise exception 'As inscrições ainda não foram abertas.';
  end if;

  if (
    evento_registro.inscricoes_fecham_em is not null
    and now() > evento_registro.inscricoes_fecham_em
  ) then
    raise exception 'As inscrições já foram encerradas.';
  end if;

  if nivel_usuario < evento_registro.nivel_minimo then
    raise exception 'Seu nível ainda não permite esta inscrição.';
  end if;

  if ano_usuario < evento_registro.ano_minimo then
    raise exception 'Seu ano acadêmico ainda não permite esta inscrição.';
  end if;

  if (
    evento_registro.tribo_requisito is not null
    and lower(evento_registro.tribo_requisito)
      <> lower(coalesce(tribo_usuario, ''))
  ) then
    raise exception 'Este evento pertence a outra tribo.';
  end if;

  select count(*)::integer
  into total_atual
  from public.eventos_inscricoes
  where evento_id = evento_alvo
    and status in ('inscrito', 'participou');

  if (
    evento_registro.limite_participantes is not null
    and total_atual >= evento_registro.limite_participantes
  ) then
    raise exception 'Este evento está lotado.';
  end if;

  insert into public.eventos_inscricoes (
    evento_id,
    usuario_id,
    status
  )
  values (
    evento_alvo,
    usuario_atual,
    'inscrito'
  )
  on conflict (evento_id, usuario_id)
  do update set
    status = 'inscrito',
    atualizado_em = now();

  return jsonb_build_object('inscrito', true);
end;
$$;

grant execute on function public.inscrever_em_evento(uuid)
to authenticated;

drop function if exists public.cancelar_inscricao_evento(uuid);

create function public.cancelar_inscricao_evento(
  evento_alvo uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  inicio_evento timestamptz;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select inicio_em
  into inicio_evento
  from public.eventos
  where id = evento_alvo;

  if inicio_evento is null then
    raise exception 'Evento não encontrado.';
  end if;

  if now() >= inicio_evento then
    raise exception 'Não é possível cancelar após o início do evento.';
  end if;

  update public.eventos_inscricoes
  set
    status = 'cancelado',
    atualizado_em = now()
  where evento_id = evento_alvo
    and usuario_id = usuario_atual
    and status = 'inscrito';

  if not found then
    raise exception 'Inscrição ativa não encontrada.';
  end if;

  return jsonb_build_object('cancelado', true);
end;
$$;

grant execute on function public.cancelar_inscricao_evento(uuid)
to authenticated;
