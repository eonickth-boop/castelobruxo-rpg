-- CASTELOBRUXO — ETAPA 07: CONQUISTAS

create extension if not exists pgcrypto;

create table if not exists public.conquistas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text not null,
  categoria text not null,
  raridade text not null default 'Comum',
  icone text,
  requisito_texto text not null,
  meta integer not null default 1 check (meta > 0),
  recompensa_xp integer not null default 0 check (recompensa_xp >= 0),
  recompensa_ipes integer not null default 0 check (recompensa_ipes >= 0),
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.conquistas_usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references public.perfis(id) on delete cascade,
  conquista_id uuid not null
    references public.conquistas(id) on delete cascade,
  progresso integer not null default 0 check (progresso >= 0),
  desbloqueada boolean not null default false,
  desbloqueada_em timestamptz,
  destaque boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, conquista_id)
);

create index if not exists conquistas_usuarios_usuario_idx
  on public.conquistas_usuarios(usuario_id);

alter table public.conquistas enable row level security;
alter table public.conquistas_usuarios enable row level security;

drop policy if exists "Conquistas públicas para autenticados"
on public.conquistas;

create policy "Conquistas públicas para autenticados"
on public.conquistas
for select
to authenticated
using (ativo = true);

drop policy if exists "Usuário lê próprias conquistas"
on public.conquistas_usuarios;

create policy "Usuário lê próprias conquistas"
on public.conquistas_usuarios
for select
to authenticated
using (auth.uid() = usuario_id);

drop policy if exists "Usuário atualiza destaque"
on public.conquistas_usuarios;

create policy "Usuário atualiza destaque"
on public.conquistas_usuarios
for update
to authenticated
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);

insert into public.conquistas (
  codigo,
  nome,
  descricao,
  categoria,
  raridade,
  icone,
  requisito_texto,
  meta,
  recompensa_xp,
  recompensa_ipes,
  ordem,
  ativo
)
values
  (
    'primeiros-passos',
    'Primeiros Passos',
    'O início de uma nova jornada dentro de Castelobruxo.',
    'Geral',
    'Comum',
    '🌱',
    'Possuir um perfil ativo.',
    1,
    10,
    0,
    10,
    true
  ),
  (
    'primeira-aula',
    'Estudante Iniciante',
    'Concluiu sua primeira aula acadêmica.',
    'Acadêmico',
    'Comum',
    '📘',
    'Concluir 1 aula.',
    1,
    20,
    0,
    20,
    true
  ),
  (
    'estudante-dedicado',
    'Estudante Dedicado',
    'Manteve constância nos estudos.',
    'Acadêmico',
    'Rara',
    '🎓',
    'Concluir 10 aulas.',
    10,
    80,
    20,
    30,
    true
  ),
  (
    'primeira-compra',
    'Primeira Compra',
    'Adquiriu seu primeiro item no Mercado das Cinco Trilhas.',
    'Mercado',
    'Comum',
    '🛍️',
    'Possuir ao menos 1 item no inventário.',
    1,
    15,
    0,
    40,
    true
  ),
  (
    'colecionador',
    'Colecionador',
    'Reuniu uma coleção respeitável de objetos mágicos.',
    'Mercado',
    'Rara',
    '🎒',
    'Possuir 10 unidades de itens no inventário.',
    10,
    70,
    25,
    50,
    true
  ),
  (
    'correspondente-magico',
    'Correspondente Mágico',
    'Enviou sua primeira carta pelo Correio Mágico.',
    'Social',
    'Comum',
    '✉️',
    'Enviar 1 carta.',
    1,
    15,
    0,
    60,
    true
  ),
  (
    'mensageiro-da-escola',
    'Mensageiro da Escola',
    'Manteve contato frequente com outros personagens.',
    'Social',
    'Rara',
    '📨',
    'Enviar 10 cartas.',
    10,
    60,
    20,
    70,
    true
  ),
  (
    'guardiao-de-criaturas',
    'Guardião de Criaturas',
    'Estabeleceu um vínculo com um companheiro mágico.',
    'Companheiros',
    'Rara',
    '🐾',
    'Possuir um pet ou companheiro.',
    1,
    50,
    0,
    80,
    true
  ),
  (
    'veterano-da-escola',
    'Veterano da Escola',
    'Avançou profundamente em sua formação em Castelobruxo.',
    'Geral',
    'Épica',
    '🏛️',
    'Alcançar o 5º ano ou superior.',
    5,
    120,
    50,
    90,
    true
  ),
  (
    'mestre-das-trilhas',
    'Mestre das Trilhas',
    'Demonstrou excelência em diversas áreas da vida escolar.',
    'Geral',
    'Lendária',
    '🏆',
    'Desbloquear 8 conquistas.',
    8,
    250,
    100,
    100,
    true
  )
on conflict (codigo) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  categoria = excluded.categoria,
  raridade = excluded.raridade,
  icone = excluded.icone,
  requisito_texto = excluded.requisito_texto,
  meta = excluded.meta,
  recompensa_xp = excluded.recompensa_xp,
  recompensa_ipes = excluded.recompensa_ipes,
  ordem = excluded.ordem,
  ativo = excluded.ativo;

drop function if exists public.verificar_conquistas_usuario(uuid);

create function public.verificar_conquistas_usuario(
  usuario_alvo uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  conquista_registro record;
  progresso_atual integer;
  desbloqueadas_total integer;
  ja_desbloqueada boolean;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if usuario_alvo is null then
    usuario_alvo := usuario_atual;
  end if;

  if usuario_alvo <> usuario_atual then
    raise exception 'Você só pode verificar suas próprias conquistas.';
  end if;

  for conquista_registro in
    select *
    from public.conquistas
    where ativo = true
    order by ordem
  loop
    progresso_atual := 0;

    case conquista_registro.codigo
      when 'primeiros-passos' then
        select count(*)::integer
        into progresso_atual
        from public.perfis
        where id = usuario_alvo;

      when 'primeira-aula' then
        select count(*)::integer
        into progresso_atual
        from public.progresso_aulas
        where usuario_id = usuario_alvo
          and concluida = true;

      when 'estudante-dedicado' then
        select count(*)::integer
        into progresso_atual
        from public.progresso_aulas
        where usuario_id = usuario_alvo
          and concluida = true;

      when 'primeira-compra' then
        select coalesce(sum(quantidade), 0)::integer
        into progresso_atual
        from public.inventario
        where usuario_id = usuario_alvo;

      when 'colecionador' then
        select coalesce(sum(quantidade), 0)::integer
        into progresso_atual
        from public.inventario
        where usuario_id = usuario_alvo;

      when 'correspondente-magico' then
        select count(*)::integer
        into progresso_atual
        from public.mensagens
        where remetente_id = usuario_alvo;

      when 'mensageiro-da-escola' then
        select count(*)::integer
        into progresso_atual
        from public.mensagens
        where remetente_id = usuario_alvo;

      when 'guardiao-de-criaturas' then
        if to_regclass('public.pets_usuarios') is not null then
          execute '
            select count(*)::integer
            from public.pets_usuarios
            where usuario_id = $1
          '
          into progresso_atual
          using usuario_alvo;
        elsif to_regclass('public.pets') is not null then
          begin
            execute '
              select count(*)::integer
              from public.pets
              where usuario_id = $1
            '
            into progresso_atual
            using usuario_alvo;
          exception
            when undefined_column then
              progresso_atual := 0;
          end;
        end if;

      when 'veterano-da-escola' then
        select coalesce(ano, 1)::integer
        into progresso_atual
        from public.perfis
        where id = usuario_alvo;

      when 'mestre-das-trilhas' then
        select count(*)::integer
        into desbloqueadas_total
        from public.conquistas_usuarios
        where usuario_id = usuario_alvo
          and desbloqueada = true;

        progresso_atual := coalesce(desbloqueadas_total, 0);

      else
        progresso_atual := 0;
    end case;

    insert into public.conquistas_usuarios (
      usuario_id,
      conquista_id,
      progresso,
      desbloqueada,
      desbloqueada_em,
      atualizado_em
    )
    values (
      usuario_alvo,
      conquista_registro.id,
      progresso_atual,
      progresso_atual >= conquista_registro.meta,
      case
        when progresso_atual >= conquista_registro.meta
          then now()
        else null
      end,
      now()
    )
    on conflict (usuario_id, conquista_id)
    do update set
      progresso = greatest(
        public.conquistas_usuarios.progresso,
        excluded.progresso
      ),
      desbloqueada =
        public.conquistas_usuarios.desbloqueada
        or excluded.desbloqueada,
      desbloqueada_em = coalesce(
        public.conquistas_usuarios.desbloqueada_em,
        excluded.desbloqueada_em
      ),
      atualizado_em = now();

    select desbloqueada
    into ja_desbloqueada
    from public.conquistas_usuarios
    where usuario_id = usuario_alvo
      and conquista_id = conquista_registro.id;

    if (
      ja_desbloqueada = true
      and not exists (
        select 1
        from public.transacoes
        where usuario_id = usuario_alvo
          and tipo = 'recompensa_conquista'
          and descricao =
            'Conquista: ' || conquista_registro.codigo
      )
    ) then
      if conquista_registro.recompensa_xp > 0 then
        update public.perfis
        set xp = coalesce(xp, 0)
          + conquista_registro.recompensa_xp
        where id = usuario_alvo;
      end if;

      if conquista_registro.recompensa_ipes > 0 then
        update public.carteiras
        set saldo = coalesce(saldo, 0)
          + conquista_registro.recompensa_ipes
        where usuario_id = usuario_alvo;
      end if;

      insert into public.transacoes (
        usuario_id,
        tipo,
        valor,
        descricao
      )
      values (
        usuario_alvo,
        'recompensa_conquista',
        conquista_registro.recompensa_ipes,
        'Conquista: ' || conquista_registro.codigo
      );
    end if;
  end loop;

  return jsonb_build_object(
    'verificado', true
  );
end;
$$;

grant execute on function public.verificar_conquistas_usuario(uuid)
to authenticated;

drop function if exists public.destacar_conquista_usuario(uuid);

create function public.destacar_conquista_usuario(
  conquista_alvo uuid
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
    from public.conquistas_usuarios
    where usuario_id = usuario_atual
      and conquista_id = conquista_alvo
      and desbloqueada = true
  ) then
    raise exception 'Esta conquista ainda não foi desbloqueada.';
  end if;

  update public.conquistas_usuarios
  set destaque = false
  where usuario_id = usuario_atual;

  update public.conquistas_usuarios
  set destaque = true,
      atualizado_em = now()
  where usuario_id = usuario_atual
    and conquista_id = conquista_alvo;

  return jsonb_build_object(
    'destacada', true
  );
end;
$$;

grant execute on function public.destacar_conquista_usuario(uuid)
to authenticated;
