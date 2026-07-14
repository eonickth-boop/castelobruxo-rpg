-- CASTELOBRUXO — ETAPA 05: PERFIL DO PERSONAGEM
-- Adiciona campos visuais e atributos sem apagar dados existentes.

alter table public.perfis
  add column if not exists titulo_exibido text,
  add column if not exists biografia text,
  add column if not exists conhecimento_magico integer default 0,
  add column if not exists exploracao integer default 0,
  add column if not exists pocoes integer default 0,
  add column if not exists criaturas integer default 0,
  add column if not exists defesa integer default 0,
  add column if not exists afinidade_natureza integer default 0,
  add column if not exists traje_equipado text,
  add column if not exists acessorio_equipado text,
  add column if not exists artefato_equipado text,
  add column if not exists utensilio_equipado text;

update public.perfis
set
  titulo_exibido = coalesce(
    titulo_exibido,
    'Estudante de Castelobruxo'
  ),
  biografia = coalesce(
    biografia,
    'Este estudante ainda não escreveu sua apresentação no diário.'
  );

-- Limites simples para os atributos.
alter table public.perfis
  drop constraint if exists perfis_conhecimento_magico_check,
  add constraint perfis_conhecimento_magico_check
    check (conhecimento_magico between 0 and 100);

alter table public.perfis
  drop constraint if exists perfis_exploracao_check,
  add constraint perfis_exploracao_check
    check (exploracao between 0 and 100);

alter table public.perfis
  drop constraint if exists perfis_pocoes_check,
  add constraint perfis_pocoes_check
    check (pocoes between 0 and 100);

alter table public.perfis
  drop constraint if exists perfis_criaturas_check,
  add constraint perfis_criaturas_check
    check (criaturas between 0 and 100);

alter table public.perfis
  drop constraint if exists perfis_defesa_check,
  add constraint perfis_defesa_check
    check (defesa between 0 and 100);

alter table public.perfis
  drop constraint if exists perfis_afinidade_natureza_check,
  add constraint perfis_afinidade_natureza_check
    check (afinidade_natureza between 0 and 100);
