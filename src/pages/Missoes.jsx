import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/missoes.css'

function formatarData(valor) {
  if (!valor) return null

  return new Date(valor).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Missoes({ perfil, onVoltar }) {
  const [missoes, setMissoes] = useState([])
  const [filtro, setFiltro] = useState('Disponíveis')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarMissoes()
  }, [perfil?.id])

  async function carregarMissoes() {
    if (!perfil?.id) return

    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase.rpc(
      'listar_missoes_usuario',
    )

    if (error) {
      console.error('Erro ao carregar missões:', error)
      setMensagem(
        error.message || 'Não foi possível carregar as missões.',
      )
      setMissoes([])
      setCarregando(false)
      return
    }

    setMissoes(data ?? [])
    setCarregando(false)
  }

  const resumo = useMemo(() => {
    return {
      disponiveis: missoes.filter(
        (missao) => missao.status_usuario === 'disponivel',
      ).length,
      ativas: missoes.filter(
        (missao) => missao.status_usuario === 'ativa',
      ).length,
      concluidas: missoes.filter(
        (missao) => missao.status_usuario === 'concluida',
      ).length,
    }
  }, [missoes])

  const filtradas = useMemo(() => {
    const mapa = {
      Disponíveis: 'disponivel',
      Ativas: 'ativa',
      Concluídas: 'concluida',
    }

    return missoes.filter(
      (missao) => missao.status_usuario === mapa[filtro],
    )
  }, [missoes, filtro])

  async function aceitarMissao(missao) {
    setProcessando(missao.id)
    setMensagem('')

    const { error } = await supabase.rpc('aceitar_missao', {
      missao_alvo: missao.id,
    })

    if (error) {
      setMensagem(
        error.message || 'Não foi possível aceitar a missão.',
      )
      setProcessando(null)
      return
    }

    setMensagem('Missão adicionada ao seu diário.')
    setFiltro('Ativas')
    setProcessando(null)
    await carregarMissoes()
  }

  async function concluirMissao(missao) {
    setProcessando(missao.id)
    setMensagem('')

    const { error } = await supabase.rpc('concluir_missao', {
      missao_alvo: missao.id,
    })

    if (error) {
      setMensagem(
        error.message || 'A missão ainda não pode ser concluída.',
      )
      setProcessando(null)
      return
    }

    setMensagem('Missão concluída e recompensas recebidas.')
    setFiltro('Concluídas')
    setProcessando(null)
    await carregarMissoes()
  }

  return (
    <main className="missoes-pagina">
      <button
        type="button"
        className="missoes-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="missoes-hero">
        <p>Quadro de expedições</p>
        <h1>Missões</h1>
        <span>
          Jornadas disponíveis para{' '}
          <strong>
            {perfil.nome_personagem || perfil.usuario}
          </strong>
        </span>

        <div className="missoes-resumo">
          <article>
            <small>Disponíveis</small>
            <strong>{resumo.disponiveis}</strong>
          </article>

          <article>
            <small>Em andamento</small>
            <strong>{resumo.ativas}</strong>
          </article>

          <article>
            <small>Concluídas</small>
            <strong>{resumo.concluidas}</strong>
          </article>
        </div>
      </header>

      <nav className="missoes-filtros">
        {['Disponíveis', 'Ativas', 'Concluídas'].map((item) => (
          <button
            type="button"
            key={item}
            className={filtro === item ? 'ativo' : ''}
            onClick={() => setFiltro(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {mensagem && <p className="missoes-mensagem">{mensagem}</p>}

      {carregando ? (
        <p className="missoes-estado">Carregando missões...</p>
      ) : filtradas.length === 0 ? (
        <section className="missoes-vazio">
          <span>🗺️</span>
          <h2>Nenhuma missão nesta seção</h2>
          <p>Novas expedições poderão aparecer no quadro.</p>
        </section>
      ) : (
        <section className="missoes-grade">
          {filtradas.map((missao) => {
            const progresso = Number(missao.progresso || 0)
            const meta = Math.max(1, Number(missao.meta || 1))
            const percentual = Math.min(
              100,
              Math.round((progresso / meta) * 100),
            )

            return (
              <article
                key={missao.id}
                className={`missao-card dificuldade-${String(
                  missao.dificuldade,
                ).toLowerCase()}`}
              >
                <div className="missao-topo">
                  <span>{missao.icone || '🧭'}</span>

                  <div>
                    <small>{missao.categoria}</small>
                    <strong>{missao.dificuldade}</strong>
                  </div>
                </div>

                <h2>{missao.titulo}</h2>
                <p>{missao.descricao}</p>

                <div className="missao-requisitos">
                  <div>
                    <small>Nível mínimo</small>
                    <strong>{missao.nivel_minimo}</strong>
                  </div>

                  <div>
                    <small>Ano mínimo</small>
                    <strong>{missao.ano_minimo}º ano</strong>
                  </div>

                  {missao.prazo_em && (
                    <div>
                      <small>Disponível até</small>
                      <strong>
                        {formatarData(missao.prazo_em)}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="missao-objetivo">
                  <small>Objetivo</small>
                  <strong>{missao.objetivo_texto}</strong>
                </div>

                {missao.status_usuario !== 'disponivel' && (
                  <div className="missao-progresso">
                    <div>
                      <span>Progresso</span>
                      <strong>
                        {Math.min(progresso, meta)}/{meta}
                      </strong>
                    </div>

                    <div className="missao-barra">
                      <span style={{ width: `${percentual}%` }} />
                    </div>
                  </div>
                )}

                <div className="missao-recompensas">
                  <span>⭐ {missao.recompensa_xp} XP</span>
                  <span>💰 {missao.recompensa_ipes} Ipês</span>

                  {missao.recompensa_item_codigo && (
                    <span>
                      🎁 {missao.recompensa_item_codigo}
                    </span>
                  )}
                </div>

                {missao.status_usuario === 'disponivel' && (
                  <button
                    type="button"
                    disabled={processando === missao.id}
                    onClick={() => aceitarMissao(missao)}
                  >
                    {processando === missao.id
                      ? 'Aceitando...'
                      : 'Aceitar missão'}
                  </button>
                )}

                {missao.status_usuario === 'ativa' && (
                  <button
                    type="button"
                    disabled={
                      processando === missao.id ||
                      progresso < meta
                    }
                    onClick={() => concluirMissao(missao)}
                  >
                    {progresso < meta
                      ? 'Objetivo incompleto'
                      : processando === missao.id
                        ? 'Concluindo...'
                        : 'Concluir missão'}
                  </button>
                )}

                {missao.status_usuario === 'concluida' && (
                  <div className="missao-concluida">
                    ✓ Concluída em{' '}
                    {formatarData(missao.concluida_em)}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
