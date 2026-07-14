-- CASTELOBRUXO — CORREÇÃO DE NÍVEL E XP
-- Mantém o campo nivel sincronizado com o XP total.
-- Regra atual: cada 100 XP aumenta 1 nível.

create or replace function public.sincronizar_nivel_por_xp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.xp := greatest(coalesce(new.xp, 0), 0);
  new.nivel := greatest(1, floor(new.xp / 100.0)::integer + 1);
  return new;
end;
$$;

drop trigger if exists perfis_sincronizar_nivel_por_xp
on public.perfis;

create trigger perfis_sincronizar_nivel_por_xp
before insert or update of xp
on public.perfis
for each row
execute function public.sincronizar_nivel_por_xp();

-- Corrige todos os perfis que já possuem XP acumulado.
update public.perfis
set nivel = greatest(
  1,
  floor(coalesce(xp, 0) / 100.0)::integer + 1
);
