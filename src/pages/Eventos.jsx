import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/eventos.css'

function formatarDataHora(valor) {
  if (!valor) return ''

  return new Date(valor).toLocaleString('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function Eventos({ perfil, onVoltar }) {
  const [eventos, setEventos] = useState([])
  const [filtro, setFiltro] = useState('Ativos')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarEventos()
  }, [perfil?.id])

  async function carregarEventos() {
    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase.rpc(
      'listar_eventos_usuario',
    )

    if (error) {
      console.error('Erro ao carregar eventos:', error)
      setMensagem(
        error.message || 'Não foi possível carregar os eventos.',
      )
      setEventos([])
      setCarregando(false)
      return
    }

    setEventos(data ?? [])
    setCarregando(false)
  }

  const resumo = useMemo(() => {
    return {
      ativos: eventos.filter(
        (evento) => evento.status_evento === 'ativo',
      ).length,
      futuros: eventos.filter(
        (evento) => evento.status_evento === 'futuro',
      ).length,
      encerrados: eventos.filter(
        (evento) => evento.status_evento === 'encerrado',
      ).length,
      inscritos: eventos.filter(
        (evento) => evento.inscrito === true,
      ).length,
    }
  }, [eventos])

  const filtrados = useMemo(() => {
    const mapa = {
      Ativos: 'ativo',
      Futuros: 'futuro',
      Encerrados: 'encerrado',
      'Minhas inscrições': 'inscrito',
    }

    if (filtro === 'Minhas inscrições') {
      return eventos.filter((evento) => evento.inscrito)
    }

    return eventos.filter(
      (evento) => evento.status_evento === mapa[filtro],
    )
  }, [eventos, filtro])

  async function inscrever(evento) {
    setProcessando(evento.id)
    setMensagem('')

    const { error } = await supabase.rpc(
      'inscrever_em_evento',
      {
        evento_alvo: evento.id,
      },
    )

    if (error) {
      setMensagem(
        error.message ||
          'Não foi possível concluir a inscrição.',
      )
      setProcessando(null)
      return
    }

    setMensagem('Inscrição realizada com sucesso.')
    setProcessando(null)
    await carregarEventos()
  }

  async function cancelarInscricao(evento) {
    setProcessando(evento.id)
    setMensagem('')

    const { error } = await supabase.rpc(
      'cancelar_inscricao_evento',
      {
        evento_alvo: evento.id,
      },
    )

    if (error) {
      setMensagem(
        error.message ||
          'Não foi possível cancelar a inscrição.',
      )
      setProcessando(null)
      return
    }

    setMensagem('Inscrição cancelada.')
    setProcessando(null)
    await carregarEventos()
  }

  return (
    <main className="eventos-pagina">
      <button
        type="button"
        className="eventos-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="eventos-hero">
        <p>Agenda especial de Castelobruxo</p>
        <h1>Eventos</h1>
        <span>
          Programação disponível para{' '}
          <strong>
            {perfil.nome_personagem || perfil.usuario}
          </strong>
        </span>

        <div className="eventos-resumo">
          <article>
            <small>Ativos</small>
            <strong>{resumo.ativos}</strong>
          </article>

          <article>
            <small>Futuros</small>
            <strong>{resumo.futuros}</strong>
          </article>

          <article>
            <small>Inscrições</small>
            <strong>{resumo.inscritos}</strong>
          </article>
        </div>
      </header>

      <nav className="eventos-filtros">
        {[
          'Ativos',
          'Futuros',
          'Encerrados',
          'Minhas inscrições',
        ].map((item) => (
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

      {mensagem && <p className="eventos-mensagem">{mensagem}</p>}

      {carregando ? (
        <p className="eventos-estado">Carregando eventos...</p>
      ) : filtrados.length === 0 ? (
        <section className="eventos-vazio">
          <span>📅</span>
          <h2>Nenhum evento nesta seção</h2>
          <p>A programação será atualizada pela administração.</p>
        </section>
      ) : (
        <section className="eventos-grade">
          {filtrados.map((evento) => {
            const lotado =
              evento.limite_participantes &&
              evento.total_inscritos >=
                evento.limite_participantes

            return (
              <article
                key={evento.id}
                className={`evento-card status-${evento.status_evento}`}
              >
                <div className="evento-topo">
                  <span>{evento.icone || '✨'}</span>

                  <div>
                    <small>{evento.categoria}</small>
                    <strong>{evento.status_evento}</strong>
                  </div>
                </div>

                <h2>{evento.titulo}</h2>
                <p>{evento.descricao}</p>

                <div className="evento-detalhes">
                  <div>
                    <small>Início</small>
                    <strong>
                      {formatarDataHora(evento.inicio_em)}
                    </strong>
                  </div>

                  <div>
                    <small>Fim</small>
                    <strong>
                      {formatarDataHora(evento.fim_em)}
                    </strong>
                  </div>

                  <div>
                    <small>Local</small>
                    <strong>{evento.local_evento}</strong>
                  </div>
                </div>

                <div className="evento-regras">
                  <small>Regras</small>
                  <strong>{evento.regras}</strong>
                </div>

                <div className="evento-requisitos">
                  <span>Nível {evento.nivel_minimo}+</span>
                  <span>{evento.ano_minimo}º ano+</span>

                  {evento.tribo_requisito && (
                    <span>Tribo {evento.tribo_requisito}</span>
                  )}
                </div>

                <div className="evento-vagas">
                  <span>
                    Participantes: {evento.total_inscritos}
                    {evento.limite_participantes
                      ? `/${evento.limite_participantes}`
                      : ''}
                  </span>

                  {lotado && <strong>Lotado</strong>}
                </div>

                <div className="evento-recompensas">
                  <span>⭐ {evento.recompensa_xp} XP</span>
                  <span>💰 {evento.recompensa_ipes} Ipês</span>
                </div>

                {evento.inscrito ? (
                  <button
                    type="button"
                    disabled={
                      processando === evento.id ||
                      evento.status_evento === 'encerrado'
                    }
                    onClick={() =>
                      cancelarInscricao(evento)
                    }
                  >
                    {processando === evento.id
                      ? 'Cancelando...'
                      : evento.status_evento === 'encerrado'
                        ? 'Participação encerrada'
                        : 'Cancelar inscrição'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      processando === evento.id ||
                      evento.status_evento === 'encerrado' ||
                      lotado
                    }
                    onClick={() => inscrever(evento)}
                  >
                    {processando === evento.id
                      ? 'Inscrevendo...'
                      : lotado
                        ? 'Evento lotado'
                        : evento.status_evento === 'encerrado'
                          ? 'Evento encerrado'
                          : 'Inscrever-se'}
                  </button>
                )}
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
