-- CASTELOBRUXO — ETAPA 14.4.2
-- CORREÇÃO DO ANO + CERIMÔNIA DOS GUARDIÕES

drop function if exists public.concluir_criacao_personagem(
  text,
  integer,
  text,
  text,
  text,
  text,
  text
);

drop function if exists public.concluir_criacao_personagem(
  text,
  integer,
  integer,
  text,
  text,
  text,
  text
);

create function public.concluir_criacao_personagem(
  p_nome_personagem text,
  p_idade_personagem integer,
  p_ano integer,
  p_pronomes text,
  p_origem text,
  p_traco_principal text,
  p_bio text
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
    raise exception 'Sessão inválida.';
  end if;

  if length(trim(coalesce(p_nome_personagem, ''))) < 3 then
    raise exception 'Nome do personagem inválido.';
  end if;

  if p_idade_personagem < 11 or p_idade_personagem > 99 then
    raise exception 'Idade do personagem inválida.';
  end if;

  if p_ano < 1 or p_ano > 7 then
    raise exception 'Ano escolar inválido.';
  end if;

  if length(trim(coalesce(p_origem, ''))) < 2 then
    raise exception 'Origem inválida.';
  end if;

  if length(trim(coalesce(p_bio, ''))) < 20 then
    raise exception 'Apresentação muito curta.';
  end if;

  update public.perfis
  set
    nome_personagem = trim(p_nome_personagem),
    idade_personagem = p_idade_personagem,
    ano = p_ano,
    pronomes = nullif(trim(coalesce(p_pronomes, '')), ''),
    origem = trim(p_origem),
    traco_principal = trim(p_traco_principal),
    bio = trim(p_bio),
    personagem_criado = true,
    selecao_tribo_concluida = false,
    tribo = null,
    criado_personagem_em = coalesce(criado_personagem_em, now())
  where id = usuario_atual;

  if not found then
    raise exception 'Perfil não encontrado.';
  end if;

  return jsonb_build_object(
    'concluido', true,
    'personagem_criado', true,
    'selecao_tribo_concluida', false
  );
end;
$$;

grant execute on function public.concluir_criacao_personagem(
  text,
  integer,
  integer,
  text,
  text,
  text,
  text
) to authenticated;

create table if not exists public.selecao_tribo_respostas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references public.perfis(id) on delete cascade,
  pergunta_numero integer not null,
  resposta_texto text not null,
  tribo_pontuada text not null,
  criado_em timestamptz not null default now()
);

create index if not exists selecao_tribo_respostas_usuario_idx
  on public.selecao_tribo_respostas(usuario_id);

alter table public.selecao_tribo_respostas enable row level security;

drop policy if exists "Usuário lê próprias respostas de tribo"
on public.selecao_tribo_respostas;

create policy "Usuário lê próprias respostas de tribo"
on public.selecao_tribo_respostas
for select
to authenticated
using (
  usuario_id = auth.uid()
  or public.usuario_e_administrador()
);

drop function if exists public.concluir_selecao_tribo(
  text,
  jsonb,
  jsonb
);

create function public.concluir_selecao_tribo(
  p_tribo text,
  p_respostas jsonb,
  p_pontuacao jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  resposta jsonb;
begin
  if usuario_atual is null then
    raise exception 'Sessão inválida.';
  end if;

  if p_tribo not in (
    'Arayê',
    'Caorá',
    'Yandara',
    'Anayru',
    'Aratã'
  ) then
    raise exception 'Tribo inválida.';
  end if;

  if jsonb_array_length(coalesce(p_respostas, '[]'::jsonb)) < 7 then
    raise exception 'A cerimônia não foi concluída.';
  end if;

  if not exists (
    select 1
    from public.perfis
    where id = usuario_atual
      and personagem_criado = true
  ) then
    raise exception 'Crie o personagem antes da cerimônia.';
  end if;

  delete from public.selecao_tribo_respostas
  where usuario_id = usuario_atual;

  for resposta in
    select * from jsonb_array_elements(p_respostas)
  loop
    insert into public.selecao_tribo_respostas (
      usuario_id,
      pergunta_numero,
      resposta_texto,
      tribo_pontuada
    )
    values (
      usuario_atual,
      (resposta ->> 'pergunta')::integer,
      resposta ->> 'resposta',
      resposta ->> 'tribo'
    );
  end loop;

  update public.perfis
  set
    tribo = p_tribo,
    selecao_tribo_concluida = true
  where id = usuario_atual;

  return jsonb_build_object(
    'concluido', true,
    'tribo', p_tribo,
    'pontuacao', p_pontuacao
  );
end;
$$;

grant execute on function public.concluir_selecao_tribo(
  text,
  jsonb,
  jsonb
) to authenticated;
