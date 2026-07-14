-- CASTELOBRUXO — ETAPA 11: MAPA INTERATIVO

create extension if not exists pgcrypto;

create table if not exists public.locais_mapa (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text not null,
  categoria text not null default 'Escola',
  icone text,
  posicao_x numeric(5,2) not null default 50,
  posicao_y numeric(5,2) not null default 50,
  nivel_minimo integer not null default 1 check (nivel_minimo > 0),
  ano_minimo integer not null default 1 check (ano_minimo > 0),
  tribo_requisito text,
  destino_pagina text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint locais_mapa_posicao_x_check
    check (posicao_x between 0 and 100),
  constraint locais_mapa_posicao_y_check
    check (posicao_y between 0 and 100)
);

alter table public.locais_mapa enable row level security;

drop policy if exists "Locais visíveis para autenticados"
on public.locais_mapa;

create policy "Locais visíveis para autenticados"
on public.locais_mapa
for select
to authenticated
using (ativo = true);

insert into public.locais_mapa (
  codigo,
  nome,
  descricao,
  categoria,
  icone,
  posicao_x,
  posicao_y,
  nivel_minimo,
  ano_minimo,
  tribo_requisito,
  destino_pagina,
  ordem
)
values
  (
    'predio-principal',
    'Prédio Principal',
    'Centro administrativo e acadêmico da escola, onde ficam os principais corredores e salas.',
    'Escola',
    '🏛️',
    49,
    35,
    1,
    1,
    null,
    'inicio',
    10
  ),
  (
    'biblioteca',
    'Biblioteca',
    'Acervo de livros, registros, bestiários e documentos mágicos de Castelobruxo.',
    'Escola',
    '📚',
    29,
    26,
    1,
    1,
    null,
    'biblioteca',
    20
  ),
  (
    'banco',
    'Banco da Árvore Ancestral',
    'Instituição responsável por saldos, transferências e movimentações em Ipês.',
    'Serviços',
    '🌳',
    70,
    27,
    1,
    1,
    null,
    'banco',
    30
  ),
  (
    'mercado',
    'Mercado das Cinco Trilhas',
    'Principal ponto de comércio de itens, ingredientes, livros e artefatos.',
    'Serviços',
    '🛍️',
    76,
    51,
    1,
    1,
    null,
    'mercado',
    40
  ),
  (
    'salas-aula',
    'Salas de Aula',
    'Espaço destinado às disciplinas, atividades e acompanhamento acadêmico.',
    'Escola',
    '🎓',
    38,
    53,
    1,
    1,
    null,
    'aulas',
    50
  ),
  (
    'lago-iara',
    'Lago da Iara',
    'Um lago encantado habitado por criaturas aquáticas e protegido por antigos vínculos mágicos.',
    'Exploração',
    '🌊',
    21,
    65,
    2,
    2,
    null,
    'missoes',
    60
  ),
  (
    'floresta-encantados',
    'Floresta dos Encantados',
    'Região densa e viva onde trilhas mudam, criaturas observam e antigos segredos permanecem ocultos.',
    'Exploração',
    '🌿',
    67,
    74,
    3,
    3,
    null,
    'missoes',
    70
  ),
  (
    'gruta-cristais',
    'Gruta dos Cristais',
    'Uma formação subterrânea repleta de minerais mágicos, ecos e espíritos antigos.',
    'Exploração',
    '💎',
    87,
    78,
    4,
    4,
    null,
    'missoes',
    80
  ),
  (
    'clareira-eventos',
    'Clareira dos Eventos',
    'Área preparada para festivais, encontros, cerimônias e atividades especiais.',
    'Comunidade',
    '✨',
    52,
    79,
    1,
    1,
    null,
    'eventos',
    90
  ),
  (
    'correio-magico',
    'Torre do Correio',
    'Ponto de recebimento e envio das correspondências mágicas entre personagens.',
    'Serviços',
    '✉️',
    14,
    39,
    1,
    1,
    null,
    'correio-magico',
    100
  )
on conflict (codigo) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  categoria = excluded.categoria,
  icone = excluded.icone,
  posicao_x = excluded.posicao_x,
  posicao_y = excluded.posicao_y,
  nivel_minimo = excluded.nivel_minimo,
  ano_minimo = excluded.ano_minimo,
  tribo_requisito = excluded.tribo_requisito,
  destino_pagina = excluded.destino_pagina,
  ordem = excluded.ordem,
  ativo = true;

drop function if exists public.listar_locais_mapa_usuario();

create function public.listar_locais_mapa_usuario()
returns table (
  id uuid,
  codigo text,
  nome text,
  descricao text,
  categoria text,
  icone text,
  posicao_x numeric,
  posicao_y numeric,
  nivel_minimo integer,
  ano_minimo integer,
  tribo_requisito text,
  destino_pagina text,
  desbloqueado boolean,
  motivo_bloqueio text
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
    l.id,
    l.codigo,
    l.nome,
    l.descricao,
    l.categoria,
    l.icone,
    l.posicao_x,
    l.posicao_y,
    l.nivel_minimo,
    l.ano_minimo,
    l.tribo_requisito,
    l.destino_pagina,
    (
      nivel_usuario >= l.nivel_minimo
      and ano_usuario >= l.ano_minimo
      and (
        l.tribo_requisito is null
        or lower(l.tribo_requisito) =
          lower(coalesce(tribo_usuario, ''))
      )
    ) as desbloqueado,
    case
      when nivel_usuario < l.nivel_minimo
        then 'Requer nível ' || l.nivel_minimo
      when ano_usuario < l.ano_minimo
        then 'Requer acesso ao ' || l.ano_minimo || 'º ano'
      when (
        l.tribo_requisito is not null
        and lower(l.tribo_requisito) <>
          lower(coalesce(tribo_usuario, ''))
      )
        then 'Disponível apenas para a tribo ' || l.tribo_requisito
      else null
    end as motivo_bloqueio
  from public.locais_mapa l
  where l.ativo = true
  order by l.ordem;
end;
$$;

grant execute on function public.listar_locais_mapa_usuario()
to authenticated;
