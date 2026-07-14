-- CASTELOBRUXO — ETAPA 14.3: COMPANHEIROS VIVOS

alter table public.pets_usuarios
  add column if not exists humor text not null default 'curioso',
  add column if not exists ultima_interacao timestamptz;

update public.pets_usuarios
set ultima_interacao = coalesce(ultima_interacao, atualizado_em, adquirido_em, now())
where ultima_interacao is null;

alter table public.pets_usuarios
  drop constraint if exists pets_usuarios_humor_check;

alter table public.pets_usuarios
  add constraint pets_usuarios_humor_check
  check (
    humor in (
      'curioso',
      'feliz',
      'afetuoso',
      'cansado',
      'faminto',
      'triste',
      'animado',
      'sonolento'
    )
  );
