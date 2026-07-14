import { useMemo, useState } from 'react'
import Notificacao from '../components/Notificacao'
import '../styles/inventario.css'

function normalizarCategoria(valor = '') {
  return String(valor || 'Outros')
}

const PASTAS_ITENS = {
  ART: 'ART',
  CRI: 'CRIS',
  LIV: 'LIV',
  PLA: 'PLA',
  POT: 'POT',
  UTE: 'UTE',
  VES: 'VEST',
}

function imagemDoItem(item) {
  if (!item) return ''

  if (
    item.imagem_url ||
    item.image_url ||
    item.url_imagem
  ) {
    return (
      item.imagem_url ||
      item.image_url ||
      item.url_imagem
    )
  }

  if (!item.imagem || !item.id) return ''

  const prefixo = String(item.id).slice(0, 3)
  const pasta = PASTAS_ITENS[prefixo]

  if (!pasta) return ''

  return `/assets/${pasta}/${item.imagem}`
}

export default function Inventario({
  perfil,
  registros = [],
  mensagem,
  onAbrirMercado,
  onVoltar,
}) {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todos')

  const categorias = useMemo(() => {
    const valores = registros
      .map((registro) =>
        normalizarCategoria(
          registro.item?.categoria || registro.item?.tipo,
        ),
      )
      .filter(Boolean)

    return ['Todos', ...new Set(valores)]
  }, [registros])

  const registrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return registros.filter((registro) => {
      const item = registro.item || {}
      const categoriaItem = normalizarCategoria(
        item.categoria || item.tipo,
      )

      const correspondeCategoria =
        categoria === 'Todos' || categoriaItem === categoria

      const correspondeBusca =
        !termo ||
        String(item.nome || '').toLowerCase().includes(termo) ||
        String(item.descricao || '').toLowerCase().includes(termo)

      return correspondeCategoria && correspondeBusca
    })
  }, [registros, busca, categoria])

  const totalUnidades = useMemo(
    () =>
      registros.reduce(
        (total, registro) =>
          total + Number(registro.quantidade || 0),
        0,
      ),
    [registros],
  )

  return (
    <main className="inventario-pagina">
      <div className="inventario-topo-acoes">
        <button type="button" onClick={onVoltar}>
          ← Voltar
        </button>

        <button type="button" onClick={onAbrirMercado}>
          🛒 Ir ao mercado
        </button>
      </div>

      <header className="inventario-hero">
        <p>Bolsa pessoal</p>
        <h1>Inventário</h1>
        <span>
          Itens de{' '}
          <strong>
            {perfil?.nome_personagem || perfil?.usuario}
          </strong>
        </span>

        <div className="inventario-resumo">
          <article>
            <small>Tipos de item</small>
            <strong>{registros.length}</strong>
          </article>

          <article>
            <small>Total de unidades</small>
            <strong>{totalUnidades}</strong>
          </article>
        </div>
      </header>

      <section className="inventario-filtros">
        <label>
          <span>Pesquisar</span>
          <input
            type="search"
            placeholder="Pesquisar item"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </label>

        <label>
          <span>Categoria</span>
          <select
            value={categoria}
            onChange={(evento) => setCategoria(evento.target.value)}
          >
            {categorias.map((opcao) => (
              <option key={opcao}>{opcao}</option>
            ))}
          </select>
        </label>
      </section>

      <Notificacao mensagem={mensagem} />

      {registros.length === 0 ? (
        <section className="inventario-vazio">
          <span>🎒</span>
          <h2>Seu inventário está vazio</h2>
          <p>
            Visite o Mercado das Cinco Trilhas para adquirir seus
            primeiros itens.
          </p>
          <button type="button" onClick={onAbrirMercado}>
            Abrir mercado
          </button>
        </section>
      ) : registrosFiltrados.length === 0 ? (
        <section className="inventario-vazio">
          <h2>Nenhum item encontrado</h2>
          <p>Tente alterar a pesquisa ou categoria.</p>
        </section>
      ) : (
        <section className="inventario-grade">
          {registrosFiltrados.map((registro) => {
            const item = registro.item || {}
            const imagem = imagemDoItem(item)

            return (
              <article
                className="inventario-item"
                key={registro.id}
              >
                <div className="inventario-item-imagem">
                  {imagem ? (
                    <img src={imagem} alt={item.nome} />
                  ) : (
                    <span>✦</span>
                  )}

                  <strong>
                    ×{Number(registro.quantidade || 0)}
                  </strong>
                </div>

                <div className="inventario-item-conteudo">
                  <small>
                    {normalizarCategoria(
                      item.categoria || item.tipo,
                    )}
                  </small>
                  <h2>{item.nome}</h2>
                  <p>
                    {item.descricao ||
                      'Item mágico guardado no inventário.'}
                  </p>

                  {registro.adquirido_em && (
                    <time>
                      Adquirido em{' '}
                      {new Date(
                        registro.adquirido_em,
                      ).toLocaleDateString('pt-BR')}
                    </time>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
