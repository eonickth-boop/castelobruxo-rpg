create or replace function public.comprar_item(
  codigo_item text,
  quantidade_compra integer default 1
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  comprador_id uuid := auth.uid();
  item_codigo text;
  item_nome text;
  item_descricao text;
  item_categoria text;
  item_raridade text;
  item_preco integer;
  item_imagem text;
  item_inventario_id uuid;
  saldo_atual integer;
  valor_total integer;
  nova_quantidade integer;
begin
  if comprador_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if quantidade_compra is null or quantidade_compra <= 0 then
    raise exception 'A quantidade deve ser maior que zero.';
  end if;

  select id, nome, descricao, categoria, raridade, preco, imagem
    into item_codigo, item_nome, item_descricao, item_categoria,
      item_raridade, item_preco, item_imagem
  from public.items
  where id = upper(trim(codigo_item)) and ativo = true;

  if item_codigo is null then
    raise exception 'Item não encontrado ou indisponível.';
  end if;

  if item_preco is null or item_preco <= 0 then
    raise exception 'Este item não está disponível para compra direta.';
  end if;

  select id into item_inventario_id
  from public.itens
  where codigo = item_codigo;

  if item_inventario_id is null then
    insert into public.itens (
      codigo, nome, descricao, categoria, raridade, preco, imagem_url, ativo
    ) values (
      item_codigo, item_nome, item_descricao, item_categoria, item_raridade,
      item_preco, item_imagem, true
    ) returning id into item_inventario_id;
  else
    update public.itens
    set nome = item_nome,
        descricao = item_descricao,
        categoria = item_categoria,
        raridade = item_raridade,
        preco = item_preco,
        imagem_url = item_imagem,
        ativo = true
    where id = item_inventario_id;
  end if;

  valor_total := item_preco * quantidade_compra;

  select saldo into saldo_atual
  from public.carteiras
  where usuario_id = comprador_id
  for update;

  if saldo_atual is null then
    raise exception 'Carteira não encontrada.';
  end if;

  if saldo_atual < valor_total then
    raise exception 'Saldo insuficiente.';
  end if;

  update public.carteiras
  set saldo = saldo - valor_total, atualizado_em = now()
  where usuario_id = comprador_id;

  insert into public.inventario (usuario_id, item_id, quantidade)
  values (comprador_id, item_inventario_id, quantidade_compra)
  on conflict (usuario_id, item_id) do update
  set quantidade = public.inventario.quantidade + excluded.quantidade
  returning quantidade into nova_quantidade;

  insert into public.transacoes (usuario_id, tipo, valor, descricao)
  values (
    comprador_id,
    'compra',
    valor_total,
    'Compra de ' || quantidade_compra || 'x ' || item_nome
  );

  return json_build_object(
    'sucesso', true,
    'item', item_nome,
    'quantidade_comprada', quantidade_compra,
    'quantidade_no_inventario', nova_quantidade,
    'valor_total', valor_total,
    'novo_saldo', saldo_atual - valor_total
  );
end;
$$;

revoke execute on function public.comprar_item(text, integer) from public, anon;
grant execute on function public.comprar_item(text, integer) to authenticated;
