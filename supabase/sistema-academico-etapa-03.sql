-- CASTELOBRUXO — ETAPA 03: SISTEMA ACADÊMICO
-- Execute no SQL Editor do Supabase.
-- Este script não apaga cursos, disciplinas, aulas ou atividades existentes.

create extension if not exists pgcrypto;

-- Garante a tabela de progresso.
create table if not exists progresso_aulas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references aulas(id) on delete cascade,
  status text default 'em_andamento',
  nota numeric default 0,
  xp_recebido integer default 0,
  concluida boolean default false,
  concluida_em timestamptz,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  unique (usuario_id, aula_id)
);

alter table progresso_aulas enable row level security;

drop policy if exists "Aluno lê o próprio progresso" on progresso_aulas;
create policy "Aluno lê o próprio progresso"
on progresso_aulas for select
to authenticated
using (auth.uid() = usuario_id);

drop policy if exists "Aluno cria o próprio progresso" on progresso_aulas;
create policy "Aluno cria o próprio progresso"
on progresso_aulas for insert
to authenticated
with check (auth.uid() = usuario_id);

drop policy if exists "Aluno atualiza o próprio progresso" on progresso_aulas;
create policy "Aluno atualiza o próprio progresso"
on progresso_aulas for update
to authenticated
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);

-- Função segura de correção.
create or replace function corrigir_atividade_aula(
  aula_alvo uuid,
  respostas_aluno jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  total_questoes integer := 0;
  total_acertos integer := 0;
  nota_final numeric := 0;
  xp_aula integer := 0;
  xp_entregue integer := 0;
  aprovado boolean := false;
  ja_concluida boolean := false;
  atividade_registro record;
  resposta_texto text;
begin
  if usuario_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select recompensa_xp
  into xp_aula
  from aulas
  where id = aula_alvo and ativo = true;

  if not found then
    raise exception 'Aula não encontrada.';
  end if;

  select coalesce(concluida, false)
  into ja_concluida
  from progresso_aulas
  where usuario_id = usuario_atual
    and aula_id = aula_alvo;

  ja_concluida := coalesce(ja_concluida, false);

  for atividade_registro in
    select id, alternativa_correta
    from atividades
    where aula_id = aula_alvo
      and ativo = true
    order by ordem
  loop
    total_questoes := total_questoes + 1;
    resposta_texto :=
      lower(coalesce(respostas_aluno ->> atividade_registro.id::text, ''));

    if resposta_texto = lower(atividade_registro.alternativa_correta) then
      total_acertos := total_acertos + 1;
    end if;
  end loop;

  if total_questoes = 0 then
    raise exception 'Esta aula não possui atividade.';
  end if;

  nota_final :=
    round((total_acertos::numeric / total_questoes::numeric) * 100, 2);

  aprovado := nota_final >= 70;

  if aprovado and not ja_concluida then
    xp_entregue := coalesce(xp_aula, 0);
  end if;

  insert into progresso_aulas (
    usuario_id,
    aula_id,
    status,
    nota,
    xp_recebido,
    concluida,
    concluida_em,
    atualizado_em
  )
  values (
    usuario_atual,
    aula_alvo,
    case when aprovado then 'concluida' else 'reprovada' end,
    nota_final,
    xp_entregue,
    aprovado,
    case when aprovado then now() else null end,
    now()
  )
  on conflict (usuario_id, aula_id)
  do update set
    status = excluded.status,
    nota = greatest(progresso_aulas.nota, excluded.nota),
    xp_recebido = greatest(
      progresso_aulas.xp_recebido,
      excluded.xp_recebido
    ),
    concluida = progresso_aulas.concluida or excluded.concluida,
    concluida_em = coalesce(
      progresso_aulas.concluida_em,
      excluded.concluida_em
    ),
    atualizado_em = now();

  -- Atualiza XP no perfil apenas na primeira aprovação.
  if aprovado and not ja_concluida and xp_entregue > 0 then
    update perfis
    set xp = coalesce(xp, 0) + xp_entregue
    where id = usuario_atual;
  end if;

  return jsonb_build_object(
    'aprovado', aprovado,
    'ja_concluida', ja_concluida,
    'nota', nota_final,
    'acertos', total_acertos,
    'total_questoes', total_questoes,
    'xp_recebido', xp_entregue,
    'mensagem',
      case
        when aprovado and ja_concluida
          then 'Atividade revisada. O XP desta aula já havia sido recebido.'
        when aprovado
          then 'Parabéns! A aula foi concluída.'
        else 'Você precisa de pelo menos 70% para concluir a aula.'
      end
  );
end;
$$;

grant execute on function corrigir_atividade_aula(uuid, jsonb)
to authenticated;
