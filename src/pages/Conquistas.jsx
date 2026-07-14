import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/conquistas.css'

function formatarData(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleDateString('pt-BR')
}

export default function Conquistas({ perfil, onVoltar }) {
  const [conquistas, setConquistas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [filtro, setFiltro] = useState('Todas')

  useEffect(() => {
    carregarConquistas()
  }, [perfil?.id])

  async function carregarConquistas() {
    if (!perfil?.id) return

    setCarregando(true)
    setMensagem('')

    const { error: erroVerificacao } = await supabase.rpc(
      'verificar_conquistas_usuario',
      {
        usuario_alvo: perfil.id,
      },
    )

    if (erroVerificacao) {
      console.error('Erro ao verificar conquistas:', erroVerificacao)
    }

    const { data, error } = await supabase
      .from('conquistas')
      .select(`
        id,
        codigo,
        nome,
        descricao,
        categoria,
        raridade,
        icone,
        requisito_texto,
        meta,
        recompensa_xp,
        recompensa_ipes,
        ordem,
        ativo,
        conquistas_usuarios (
          id,
          usuario_id,
          progresso,
          desbloqueada,
          desbloqueada_em,
          destaque
        )
      `)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      console.error('Erro ao carregar conquistas:', error)
      setMensagem('Não foi possível carregar as conquistas.')
      setConquistas([])
      setCarregando(false)
      return
    }

    const dados = (data ?? []).map((conquista) => {
      const registro = (conquista.conquistas_usuarios ?? []).find(
        (item) => item.usuario_id === perfil.id,
      )

      return {
        ...conquista,
        registro: registro ?? null,
      }
    })

    setConquistas(dados)
    setCarregando(false)
  }

  const categorias = useMemo(() => {
    const lista = conquistas
      .map((item) => item.categoria)
      .filter(Boolean)

    return ['Todas', ...new Set(lista)]
  }, [conquistas])

  const conquistasFiltradas = useMemo(() => {
    if (filtro === 'Todas') return conquistas
    return conquistas.filter(
      (conquista) => conquista.categoria === filtro,
    )
  }, [conquistas, filtro])

  const resumo = useMemo(() => {
    const total = conquistas.length
    const desbloqueadas = conquistas.filter(
      (item) => item.registro?.desbloqueada === true,
    ).length

    const xp = conquistas.reduce(
      (totalXp, item) =>
        item.registro?.desbloqueada
          ? totalXp + Number(item.recompensa_xp || 0)
          : totalXp,
      0,
    )

    return {
      total,
      desbloqueadas,
      xp,
      percentual:
        total > 0
          ? Math.round((desbloqueadas / total) * 100)
          : 0,
    }
  }, [conquistas])

  async function destacarConquista(conquista) {
    if (!conquista.registro?.desbloqueada) return

    const { error } = await supabase.rpc(
      'destacar_conquista_usuario',
      {
        conquista_alvo: conquista.id,
      },
    )

    if (error) {
      setMensagem(
        error.message ||
          'Não foi possível destacar a conquista.',
      )
      return
    }

    setMensagem('Conquista destacada no perfil.')
    await carregarConquistas()
  }

  return (
    <main className="conquistas-pagina">
      <button
        type="button"
        className="conquistas-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="conquistas-hero">
        <p>Arquivo de méritos</p>
        <h1>Conquistas</h1>
        <span>
          Progresso de{' '}
          <strong>
            {perfil.nome_personagem || perfil.usuario}
          </strong>
        </span>

        <div className="conquistas-resumo">
          <article>
            <small>Desbloqueadas</small>
            <strong>
              {resumo.desbloqueadas}/{resumo.total}
            </strong>
          </article>

          <article>
            <small>Progresso geral</small>
            <strong>{resumo.percentual}%</strong>
          </article>

          <article>
            <small>XP recebido</small>
            <strong>{resumo.xp} XP</strong>
          </article>
        </div>

        <div className="conquistas-barra">
          <span style={{ width: `${resumo.percentual}%` }} />
        </div>
      </header>

      <section className="conquistas-filtros">
        {categorias.map((categoria) => (
          <button
            type="button"
            key={categoria}
            className={filtro === categoria ? 'ativo' : ''}
            onClick={() => setFiltro(categoria)}
          >
            {categoria}
          </button>
        ))}
      </section>

      {mensagem && (
        <p className="conquistas-mensagem">{mensagem}</p>
      )}

      {carregando ? (
        <p className="conquistas-estado">
          Carregando conquistas...
        </p>
      ) : conquistasFiltradas.length === 0 ? (
        <p className="conquistas-estado">
          Nenhuma conquista nesta categoria.
        </p>
      ) : (
        <section className="conquistas-grade">
          {conquistasFiltradas.map((conquista) => {
            const desbloqueada =
              conquista.registro?.desbloqueada === true

            const progresso = Number(
              conquista.registro?.progresso || 0,
            )

            const meta = Math.max(
              1,
              Number(conquista.meta || 1),
            )

            const percentual = Math.min(
              100,
              Math.round((progresso / meta) * 100),
            )

            return (
              <article
                key={conquista.id}
                className={`conquista-card ${
                  desbloqueada
                    ? 'conquista-desbloqueada'
                    : 'conquista-bloqueada'
                } raridade-${String(
                  conquista.raridade || 'comum',
                ).toLowerCase()}`}
              >
                <div className="conquista-icone">
                  {desbloqueada
                    ? conquista.icone || '🏅'
                    : '🔒'}
                </div>

                <div className="conquista-conteudo">
                  <div className="conquista-topo">
                    <span>{conquista.categoria}</span>
                    <small>{conquista.raridade}</small>
                  </div>

                  <h2>{conquista.nome}</h2>
                  <p>{conquista.descricao}</p>

                  <div className="conquista-requisito">
                    <small>Requisito</small>
                    <strong>{conquista.requisito_texto}</strong>
                  </div>

                  <div className="conquista-progresso">
                    <div>
                      <span>Progresso</span>
                      <strong>
                        {Math.min(progresso, meta)}/{meta}
                      </strong>
                    </div>

                    <div className="conquista-barra">
                      <span
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>

                  <div className="conquista-recompensas">
                    {Number(conquista.recompensa_xp) > 0 && (
                      <span>
                        ⭐ {conquista.recompensa_xp} XP
                      </span>
                    )}

                    {Number(conquista.recompensa_ipes) > 0 && (
                      <span>
                        💰 {conquista.recompensa_ipes} Ipês
                      </span>
                    )}
                  </div>

                  {desbloqueada && (
                    <div className="conquista-desbloqueio">
                      <span>
                        Desbloqueada em{' '}
                        {formatarData(
                          conquista.registro
                            ?.desbloqueada_em,
                        )}
                      </span>

                      <button
                        type="button"
                        className={
                          conquista.registro?.destaque
                            ? 'destacada'
                            : ''
                        }
                        onClick={() =>
                          destacarConquista(conquista)
                        }
                      >
                        {conquista.registro?.destaque
                          ? '★ Em destaque'
                          : '☆ Destacar no perfil'}
                      </button>
                    </div>
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
