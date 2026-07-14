-- CASTELOBRUXO — ETAPA 06: CORREIO MÁGICO
-- Cria mensagens privadas entre personagens.

create extension if not exists pgcrypto;

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  remetente_id uuid not null
    references public.perfis(id) on delete cascade,
  destinatario_id uuid not null
    references public.perfis(id) on delete cascade,
  assunto text not null,
  conteudo text not null,
  lida boolean not null default false,
  lida_em timestamptz,
  arquivada_remetente boolean not null default false,
  arquivada_destinatario boolean not null default false,
  respondendo_a uuid
    references public.mensagens(id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint mensagens_assunto_tamanho
    check (char_length(assunto) between 1 and 120),
  constraint mensagens_conteudo_tamanho
    check (char_length(conteudo) between 1 and 5000),
  constraint mensagens_destinatarios_diferentes
    check (remetente_id <> destinatario_id)
);

create index if not exists mensagens_remetente_idx
  on public.mensagens(remetente_id, criado_em desc);

create index if not exists mensagens_destinatario_idx
  on public.mensagens(destinatario_id, criado_em desc);

alter table public.mensagens enable row level security;

drop policy if exists "Participantes leem mensagens" on public.mensagens;
create policy "Participantes leem mensagens"
on public.mensagens
for select
to authenticated
using (
  auth.uid() = remetente_id
  or auth.uid() = destinatario_id
);

drop policy if exists "Destinatario marca leitura" on public.mensagens;
create policy "Destinatario marca leitura"
on public.mensagens
for update
to authenticated
using (
  auth.uid() = remetente_id
  or auth.uid() = destinatario_id
)
with check (
  auth.uid() = remetente_id
  or auth.uid() = destinatario_id
);

-- O envio ocorre exclusivamente pela função segura.
drop policy if exists "Bloquear insercao direta" on public.mensagens;

drop function if exists public.enviar_mensagem_magica(
  text,
  text,
  text,
  uuid
);

create function public.enviar_mensagem_magica(
  destinatario_usuario text,
  assunto_mensagem text,
  conteudo_mensagem text,
  mensagem_respondida uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  remetente_atual uuid := auth.uid();
  destinatario_alvo uuid;
  mensagem_nova uuid;
begin
  if remetente_atual is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select id
  into destinatario_alvo
  from public.perfis
  where lower(usuario) =
    lower(trim(leading '@' from destinatario_usuario))
  limit 1;

  if destinatario_alvo is null then
    raise exception 'Destinatário não encontrado.';
  end if;

  if destinatario_alvo = remetente_atual then
    raise exception 'Você não pode enviar uma carta para si mesmo.';
  end if;

  if char_length(trim(assunto_mensagem)) < 1 then
    raise exception 'Informe o assunto.';
  end if;

  if char_length(trim(conteudo_mensagem)) < 1 then
    raise exception 'Escreva uma mensagem.';
  end if;

  if char_length(trim(assunto_mensagem)) > 120 then
    raise exception 'O assunto pode ter no máximo 120 caracteres.';
  end if;

  if char_length(trim(conteudo_mensagem)) > 5000 then
    raise exception 'A mensagem pode ter no máximo 5000 caracteres.';
  end if;

  insert into public.mensagens (
    remetente_id,
    destinatario_id,
    assunto,
    conteudo,
    respondendo_a
  )
  values (
    remetente_atual,
    destinatario_alvo,
    trim(assunto_mensagem),
    trim(conteudo_mensagem),
    mensagem_respondida
  )
  returning id into mensagem_nova;

  return jsonb_build_object(
    'id', mensagem_nova,
    'enviada', true
  );
end;
$$;

grant execute on function public.enviar_mensagem_magica(
  text,
  text,
  text,
  uuid
) to authenticated;
