-- Corrige a classificação dos alimentos legados. Os itens COM_ novos já
-- pertencem a Comidas, mas esta atualização mantém todos os códigos COM
-- consistentes e consumíveis.
update public.items
set categoria = 'Comidas',
    consumivel = true
where id like 'COM%';

update public.itens
set categoria = 'Comidas'
where codigo like 'COM%';

-- Não referencia arquivos inexistentes. As imagens reais de alimentos não
-- estavam presentes nas sete pastas fornecidas.
update public.items
set imagem = 'placeholder.webp'
where id in ('COM101', 'COM102', 'COM103', 'MAT_016');
