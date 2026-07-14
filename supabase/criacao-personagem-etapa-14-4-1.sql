-- CASTELOBRUXO — ETAPA 14.4.1
-- CRIAÇÃO OBRIGATÓRIA DE PERSONAGEM

alter table public.perfis
  add column if not exists personagem_criado boolean not null default false,
  add column if not exists selecao_tribo_concluida boolean not null default false,
  add column if not exists criado_personagem_em timestamptz,
  add column if not exists idade_personagem integer,
  add column if not exists pronomes text,
  add column if not exists origem text,
  add column if not exists traco_principal text,
  add column if not exists bio text;

-- Preserva personagens antigos que já possuem nome configurado.
update public.perfis
set
  personagem_criado = true,
  criado_personagem_em = coalesce(
    criado_personagem_em,
    criado_em,
    now()
  )
where personagem_criado = false
  and nullif(trim(coalesce(nome_personagem, '')), '') is not null;

drop function if exists public.concluir_criacao_personagem(
  text,
  integer,
  text,
  text,
  text,
  text,
  text
);

create function public.concluir_criacao_personagem(
  p_nome_personagem text,
  p_idade_personagem integer,
  p_ano text,
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

  if p_ano not in (
    '1º ano',
    '2º ano',
    '3º ano',
    '4º ano',
    '5º ano',
    '6º ano',
    '7º ano'
  ) then
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
    criado_personagem_em = coalesce(
      criado_personagem_em,
      now()
    )
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
  text,
  text,
  text,
  text,
  text
) to authenticated;

create or replace function public.redefinir_criacao_personagem_administracao(
  usuario_alvo uuid
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

  update public.perfis
  set
    personagem_criado = false,
    selecao_tribo_concluida = false,
    criado_personagem_em = null,
    tribo = null
  where id = usuario_alvo;

  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  return jsonb_build_object(
    'redefinido', true,
    'usuario_id', usuario_alvo
  );
end;
$$;

grant execute on function public.redefinir_criacao_personagem_administracao(
  uuid
) to authenticated;
