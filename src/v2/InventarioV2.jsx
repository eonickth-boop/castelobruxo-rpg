import { useMemo, useState } from 'react'
import './inventario-v2.css'

const itensIniciais = [
  { id: 1, nome: 'Frasco de orvalho lunar', categoria: 'Consumíveis', raridade: 'Raro', quantidade: 2, simbolo: '◒', descricao: 'Ingrediente coletado em noites de lua cheia. Usado em poções de percepção.' },
  { id: 2, nome: 'Mapa de fibra encantada', categoria: 'Exploração', raridade: 'Épico', quantidade: 1, simbolo: '⌁', descricao: 'Revela caminhos próximos quando exposto à umidade da floresta.' },
  { id: 3, nome: 'Broche da Tribo Arayê', categoria: 'Coleções', raridade: 'Comum', quantidade: 1, simbolo: '✦', descricao: 'Símbolo acadêmico concedido aos integrantes da tribo.' },
  { id: 4, nome: 'Raiz de jurema azul', categoria: 'Ingredientes', raridade: 'Incomum', quantidade: 5, simbolo: '⌘', descricao: 'Raiz aromática empregada em encantamentos de proteção e memória.' },
  { id: 5, nome: 'Caderno de campo', categoria: 'Utilitários', raridade: 'Comum', quantidade: 1, simbolo: '▤', descricao: 'Registra automaticamente observações feitas durante expedições.' },
  { id: 6, nome: 'Chave do corredor leste', categoria: 'Missões', raridade: 'Raro', quantidade: 1, simbolo: '⚿', descricao: 'Uma chave antiga, marcada com o selo do arquivo subterrâneo.' },
]

const mercado = [
  { id: 101, nome: 'Poção restauradora', preco: 180, categoria: 'Consumíveis', simbolo: '◉' },
  { id: 102, nome: 'Kit de herbologia', preco: 320, categoria: 'Utilitários', simbolo: '❧' },
  { id: 103, nome: 'Moldura Arquivo Vivo', preco: 450, categoria: 'Cosméticos', simbolo: '▧' },
]

export default function InventarioV2({ onVoltar }) {
  const [aba, setAba] = useState('inventario')
  const [categoria, setCategoria] = useState('Todos')
  const [selecionado, setSelecionado] = useState(itensIniciais[0])
  const [saldo, setSaldo] = useState(1280)
  const [mensagem, setMensagem] = useState('')

  const categorias = ['Todos', ...new Set(itensIniciais.map((item) => item.categoria))]
  const itens = useMemo(() => categoria === 'Todos' ? itensIniciais : itensIniciais.filter((item) => item.categoria === categoria), [categoria])

  function comprar(item) {
    if (saldo < item.preco) return setMensagem('Saldo insuficiente para concluir esta compra.')
    setSaldo((valor) => valor - item.preco)
    setMensagem(`${item.nome} foi adicionado ao seu inventário demonstrativo.`)
  }

  return (
    <section className="inventario-v2">
      <header className="inventario-v2-topo">
        <div><button type="button" onClick={onVoltar}>← Voltar ao painel</button><small>ARQUIVO DE BENS PESSOAIS</small><h1>Inventário e economia</h1><p>Itens, coleções, moedas e aquisições do seu personagem.</p></div>
        <article><small>SALDO ATUAL</small><strong>{saldo.toLocaleString('pt-BR')}</strong><span>Ipês</span></article>
      </header>

      <nav className="inventario-v2-abas">
        <button className={aba === 'inventario' ? 'ativo' : ''} onClick={() => setAba('inventario')}>Inventário</button>
        <button className={aba === 'mercado' ? 'ativo' : ''} onClick={() => setAba('mercado')}>Mercado</button>
        <button className={aba === 'colecoes' ? 'ativo' : ''} onClick={() => setAba('colecoes')}>Coleções</button>
        <button className={aba === 'historico' ? 'ativo' : ''} onClick={() => setAba('historico')}>Histórico</button>
      </nav>

      {mensagem && <div className="inventario-v2-mensagem" role="status"><span>{mensagem}</span><button onClick={() => setMensagem('')}>×</button></div>}

      {aba === 'inventario' && <>
        <div className="inventario-v2-filtros">
          {categorias.map((nome) => <button key={nome} className={categoria === nome ? 'ativo' : ''} onClick={() => setCategoria(nome)}>{nome}</button>)}
        </div>
        <div className="inventario-v2-grade">
          <div className="inventario-v2-itens">
            {itens.map((item) => <button key={item.id} className={selecionado.id === item.id ? 'ativo' : ''} onClick={() => setSelecionado(item)}>
              <span>{item.simbolo}</span><div><strong>{item.nome}</strong><small>{item.categoria} · {item.raridade}</small></div><em>{item.quantidade}×</em>
            </button>)}
          </div>
          <aside className="inventario-v2-detalhe">
            <span>{selecionado.simbolo}</span><small>{selecionado.raridade} · {selecionado.categoria}</small><h2>{selecionado.nome}</h2><p>{selecionado.descricao}</p>
            <dl><div><dt>Quantidade</dt><dd>{selecionado.quantidade}</dd></div><div><dt>Estado</dt><dd>Disponível</dd></div><div><dt>Registro</dt><dd>INV-{String(selecionado.id).padStart(3, '0')}</dd></div></dl>
            <div><button onClick={() => setMensagem(`${selecionado.nome} foi marcado como item principal.`)}>Equipar ou usar</button><button className="secundario" onClick={() => setMensagem('A transferência será conectada depois ao sistema de jogadores.')}>Transferir</button></div>
          </aside>
        </div>
      </>}

      {aba === 'mercado' && <section className="inventario-v2-mercado">
        <header><small>CATÁLOGO DA ESCOLA</small><h2>Itens disponíveis</h2><p>Compras demonstrativas alteram apenas o saldo desta sessão.</p></header>
        <div>{mercado.map((item) => <article key={item.id}><span>{item.simbolo}</span><small>{item.categoria}</small><h3>{item.nome}</h3><strong>{item.preco.toLocaleString('pt-BR')} Ipês</strong><button onClick={() => comprar(item)}>Comprar</button></article>)}</div>
      </section>}

      {aba === 'colecoes' && <section className="inventario-v2-colecoes"><article><strong>7/12</strong><span>Relíquias da floresta</span></article><article><strong>4/8</strong><span>Selos acadêmicos</span></article><article><strong>11/20</strong><span>Ingredientes raros</span></article></section>}

      {aba === 'historico' && <section className="inventario-v2-historico"><article><time>Hoje</time><div><strong>+ 120 Ipês</strong><span>Recompensa da missão “Ecos no Lago”</span></div></article><article><time>Ontem</time><div><strong>− 80 Ipês</strong><span>Compra de material escolar</span></div></article><article><time>24 jul.</time><div><strong>+ Item raro</strong><span>Frasco de orvalho lunar encontrado</span></div></article></section>}
    </section>
  )
}
