import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/quadro-avisos.css'

const categorias = {
  geral: {
    rotulo: 'Geral',
    icone: '📜',
  },
  direcao: {
    rotulo: 'Direção',
    icone: '🏛️',
  },
  professor: {
    rotulo: 'Professor',
    icone: '📚',
  },
  tribo: {
    rotulo: 'Tribo',
    icone: '🌿',
  },
  evento: {
    rotulo: 'Evento',
    icone: '🎉',
  },
  importante: {
    rotulo: 'Importante',
    icone: '⚠️',
  },
  noticia: {
    rotulo: 'Notícia',
    icone: '📰',
  },
}

function formatarData(data) {
  if (!data) {
    return 'Data não informada'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(data))
}

function normalizarUrl(url) {
  if (!url) {
    return ''
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ) {
    return url
  }

  return url.startsWith('/') ? url : `/${url}`
}

export default function QuadroAvisos({
  perfil,
  onVoltar,
}) {
  const [avisos, setAvisos] = useState([])
  const [leituras, setLeituras] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] =
    useState('todas')
  const [avisoAbertoId, setAvisoAbertoId] =
    useState(null)
  const [marcandoId, setMarcandoId] = useState(null)

  useEffect(() => {
    carregarAvisos()

    const canal = supabase
      .channel('quadro-avisos-escola')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'avisos_escola',
        },
        carregarAvisos,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [perfil?.id])

  async function carregarAvisos() {
    if (!perfil?.id) {
      return
    }

    setCarregando(true)
    setMensagem('')

    const [respostaAvisos, respostaLeituras] =
      await Promise.all([
        supabase
          .from('avisos_escola')
          .select(`
            id,
            titulo,
            conteudo,
            categoria,
            autor_id,
            autor_nome,
            imagem_url,
            publico,
            tribo_alvo,
            ano_alvo,
            destaque,
            ativo,
            publicado_em,
            criado_em,
            atualizado_em
          `)
          .eq('ativo', true)
          .order('destaque', { ascending: false })
          .order('publicado_em', { ascending: false }),

        supabase
          .from('avisos_leituras')
          .select('aviso_id, lido_em')
          .eq('usuario_id', perfil.id),
      ])

    if (respostaAvisos.error) {
      console.error(
        'Erro ao carregar avisos:',
        respostaAvisos.error,
      )
      setMensagem(
        'Não foi possível carregar o quadro de avisos.',
      )
      setCarregando(false)
      return
    }

    if (respostaLeituras.error) {
      console.error(
        'Erro ao carregar leituras:',
        respostaLeituras.error,
      )
    }

    const avisosVisiveis = (
      respostaAvisos.data ?? []
    ).filter((aviso) => {
      if (aviso.publico === 'todos') {
        return true
      }

      if (aviso.publico === 'tribo') {
        return (
          Boolean(perfil.tribo) &&
          aviso.tribo_alvo === perfil.tribo
        )
      }

      if (aviso.publico === 'ano') {
        return (
          Number(aviso.ano_alvo) ===
          Number(perfil.ano)
        )
      }

      return false
    })

    setAvisos(avisosVisiveis)
    setLeituras(respostaLeituras.data ?? [])
    setCarregando(false)
  }

  const idsLidos = useMemo(
    () =>
      new Set(
        leituras.map((leitura) => leitura.aviso_id),
      ),
    [leituras],
  )

  const avisosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()

    return avisos.filter((aviso) => {
      const correspondePesquisa =
        !termo ||
        aviso.titulo
          ?.toLowerCase()
          .includes(termo) ||
        aviso.conteudo
          ?.toLowerCase()
          .includes(termo) ||
        aviso.autor_nome
          ?.toLowerCase()
          .includes(termo)

      const correspondeCategoria =
        categoriaFiltro === 'todas' ||
        aviso.categoria === categoriaFiltro

      return (
        correspondePesquisa &&
        correspondeCategoria
      )
    })
  }, [avisos, pesquisa, categoriaFiltro])

  const naoLidos = avisos.filter(
    (aviso) => !idsLidos.has(aviso.id),
  ).length

  const avisoAberto = avisos.find(
    (aviso) => aviso.id === avisoAbertoId,
  )

  async function marcarComoLido(avisoId) {
    if (!perfil?.id || idsLidos.has(avisoId)) {
      return
    }

    setMarcandoId(avisoId)
    setMensagem('')

    const { data, error } = await supabase
      .from('avisos_leituras')
      .upsert(
        {
          aviso_id: avisoId,
          usuario_id: perfil.id,
          lido_em: new Date().toISOString(),
        },
        {
          onConflict: 'aviso_id,usuario_id',
        },
      )
      .select('aviso_id, lido_em')
      .single()

    if (error) {
      console.error(
        'Erro ao marcar aviso como lido:',
        error,
      )
      setMensagem(
        'Não foi possível marcar o aviso como lido.',
      )
      setMarcandoId(null)
      return
    }

    setLeituras((estadoAtual) => [
      ...estadoAtual.filter(
        (leitura) =>
          leitura.aviso_id !== data.aviso_id,
      ),
      data,
    ])

    setMarcandoId(null)
  }

  function abrirAviso(aviso) {
    setAvisoAbertoId(aviso.id)

    if (!idsLidos.has(aviso.id)) {
      marcarComoLido(aviso.id)
    }
  }

  return (
    <main className="quadro-avisos">
      <button
        type="button"
        className="quadro-avisos-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="quadro-avisos-hero">
        <p>Castelobruxo</p>
        <h1>Quadro de Avisos</h1>
        <span>
          Comunicados da escola, professores e tribos.
        </span>

        <div className="quadro-avisos-resumo">
          <article>
            <small>Total de avisos</small>
            <strong>{avisos.length}</strong>
          </article>

          <article>
            <small>Não lidos</small>
            <strong>{naoLidos}</strong>
          </article>

          <article>
            <small>Em destaque</small>
            <strong>
              {
                avisos.filter(
                  (aviso) => aviso.destaque,
                ).length
              }
            </strong>
          </article>
        </div>
      </header>

      {mensagem && (
        <p className="quadro-avisos-mensagem">
          {mensagem}
        </p>
      )}

      <section className="quadro-avisos-filtros">
        <label>
          <span>Pesquisar</span>
          <input
            type="search"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(event.target.value)
            }
            placeholder="Título, conteúdo ou autor"
          />
        </label>

        <label>
          <span>Categoria</span>
          <select
            value={categoriaFiltro}
            onChange={(event) =>
              setCategoriaFiltro(event.target.value)
            }
          >
            <option value="todas">
              Todas as categorias
            </option>

            {Object.entries(categorias).map(
              ([id, categoria]) => (
                <option key={id} value={id}>
                  {categoria.rotulo}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          type="button"
          onClick={carregarAvisos}
          disabled={carregando}
        >
          {carregando ? 'Atualizando...' : 'Atualizar'}
        </button>
      </section>

      {carregando ? (
        <p className="quadro-avisos-vazio">
          Carregando avisos...
        </p>
      ) : avisosFiltrados.length === 0 ? (
        <p className="quadro-avisos-vazio">
          Nenhum aviso foi encontrado.
        </p>
      ) : (
        <section className="quadro-avisos-lista">
          {avisosFiltrados.map((aviso) => {
            const categoria =
              categorias[aviso.categoria] ??
              categorias.geral

            const lido = idsLidos.has(aviso.id)
            const imagem = normalizarUrl(
              aviso.imagem_url,
            )

            return (
              <article
                key={aviso.id}
                className={`quadro-aviso-card ${
                  aviso.destaque
                    ? 'quadro-aviso-destaque'
                    : ''
                } ${
                  lido
                    ? 'quadro-aviso-lido'
                    : 'quadro-aviso-novo'
                }`}
              >
                {imagem && (
                  <img
                    src={imagem}
                    alt={aviso.titulo}
                  />
                )}

                <div className="quadro-aviso-conteudo">
                  <div className="quadro-aviso-topo">
                    <span>
                      {categoria.icone}{' '}
                      {categoria.rotulo}
                    </span>

                    <div>
                      {aviso.destaque && (
                        <b>Destaque</b>
                      )}

                      {!lido && <b>Novo</b>}
                    </div>
                  </div>

                  <h2>{aviso.titulo}</h2>

                  <p>
                    {aviso.conteudo.length > 230
                      ? `${aviso.conteudo.slice(
                          0,
                          230,
                        )}...`
                      : aviso.conteudo}
                  </p>

                  <footer>
                    <div>
                      <small>
                        {aviso.autor_nome ||
                          'Administração de Castelobruxo'}
                      </small>
                      <span>
                        {formatarData(
                          aviso.publicado_em,
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => abrirAviso(aviso)}
                    >
                      Ler aviso
                    </button>
                  </footer>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {avisoAberto && (
        <div
          className="quadro-aviso-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setAvisoAbertoId(null)
            }
          }}
          role="presentation"
        >
          <section
            className="quadro-aviso-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <p>
                  {
                    (
                      categorias[
                        avisoAberto.categoria
                      ] ?? categorias.geral
                    ).icone
                  }{' '}
                  {
                    (
                      categorias[
                        avisoAberto.categoria
                      ] ?? categorias.geral
                    ).rotulo
                  }
                </p>
                <h2>{avisoAberto.titulo}</h2>
                <span>
                  {avisoAberto.autor_nome ||
                    'Administração de Castelobruxo'}{' '}
                  ·{' '}
                  {formatarData(
                    avisoAberto.publicado_em,
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAvisoAbertoId(null)
                }
              >
                ✕ Fechar
              </button>
            </header>

            <div className="quadro-aviso-modal-corpo">
              {avisoAberto.imagem_url && (
                <img
                  src={normalizarUrl(
                    avisoAberto.imagem_url,
                  )}
                  alt={avisoAberto.titulo}
                />
              )}

              <p>{avisoAberto.conteudo}</p>

              {!idsLidos.has(avisoAberto.id) && (
                <button
                  type="button"
                  onClick={() =>
                    marcarComoLido(avisoAberto.id)
                  }
                  disabled={
                    marcandoId === avisoAberto.id
                  }
                >
                  {marcandoId === avisoAberto.id
                    ? 'Marcando...'
                    : 'Marcar como lido'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
