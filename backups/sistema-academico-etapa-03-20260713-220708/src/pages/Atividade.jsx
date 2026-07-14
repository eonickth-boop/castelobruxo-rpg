import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/atividade.css'

export default function Atividade({
  aula,
  atividades,
  onVoltar,
  onConcluida,
}) {
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [respostas, setRespostas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    setIndiceAtual(0)
    setRespostas({})
    setResultado(null)
    setMensagem('')
  }, [aula?.id])

  const atividadeAtual = atividades[indiceAtual]

  const totalRespondidas = useMemo(
    () => Object.keys(respostas).length,
    [respostas],
  )

  const progresso =
    atividades.length > 0
      ? ((indiceAtual + 1) / atividades.length) * 100
      : 0

  function selecionarResposta(atividadeId, alternativa) {
    if (resultado) return

    setRespostas((estadoAnterior) => ({
      ...estadoAnterior,
      [atividadeId]: alternativa,
    }))
  }

  function proximaQuestao() {
    if (!atividadeAtual) return

    if (!respostas[atividadeAtual.id]) {
      setMensagem('Escolha uma alternativa antes de continuar.')
      return
    }

    setMensagem('')

    if (indiceAtual < atividades.length - 1) {
      setIndiceAtual((indice) => indice + 1)
    }
  }

  function questaoAnterior() {
    setMensagem('')

    if (indiceAtual > 0) {
      setIndiceAtual((indice) => indice - 1)
    }
  }

  async function enviarAtividade() {
    if (totalRespondidas !== atividades.length) {
      setMensagem('Responda todas as questões antes de enviar.')
      return
    }

    const confirmar = window.confirm(
      'Deseja enviar suas respostas para correção?',
    )

    if (!confirmar) return

    setEnviando(true)
    setMensagem('')

    const { data, error } = await supabase.rpc(
      'corrigir_atividade_aula',
      {
        aula_alvo: aula.id,
        respostas_aluno: respostas,
      },
    )

    if (error) {
      console.error('Erro ao corrigir atividade:', error)
      setMensagem(
        error.message || 'Não foi possível corrigir a atividade.',
      )
      setEnviando(false)
      return
    }

    setResultado(data)
    setEnviando(false)
  }

  function tentarNovamente() {
    setResultado(null)
    setRespostas({})
    setIndiceAtual(0)
    setMensagem('')
  }

  if (!aula || atividades.length === 0) {
    return (
      <main className="atividade-pagina">
        <button type="button" onClick={onVoltar}>
          ← Voltar para a aula
        </button>

        <p>Nenhuma atividade disponível.</p>
      </main>
    )
  }

  if (resultado) {
    const aprovado =
      resultado.aprovado === true || resultado.ja_concluida === true

    return (
      <main className="atividade-pagina">
        <section
          className={`atividade-resultado ${
            aprovado
              ? 'atividade-resultado-aprovado'
              : 'atividade-resultado-reprovado'
          }`}
        >
          <p className="atividade-selo">
            {aprovado ? 'Atividade concluída' : 'Nova tentativa necessária'}
          </p>

          <h1>{aula.titulo}</h1>

          <div className="resultado-nota">
            <strong>{Number(resultado.nota ?? 0).toFixed(0)}%</strong>
            <span>
              {resultado.acertos ?? 0} de{' '}
              {resultado.total_questoes ?? atividades.length} acertos
            </span>
          </div>

          <div className="resultado-xp">
            <small>Experiência recebida</small>
            <strong>⭐ +{resultado.xp_recebido ?? 0} XP</strong>
          </div>

          <p>{resultado.mensagem}</p>

          <div className="atividade-acoes-resultado">
            {aprovado ? (
              <button
                type="button"
                onClick={() => onConcluida?.(resultado)}
              >
                Continuar
              </button>
            ) : (
              <>
                <button type="button" onClick={tentarNovamente}>
                  Tentar novamente
                </button>

                <button type="button" onClick={onVoltar}>
                  Voltar para a aula
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    )
  }

  const alternativas = [
    ['a', atividadeAtual.alternativa_a],
    ['b', atividadeAtual.alternativa_b],
    ['c', atividadeAtual.alternativa_c],
    ['d', atividadeAtual.alternativa_d],
  ].filter(([, texto]) => Boolean(texto))

  return (
    <main className="atividade-pagina">
      <button
        type="button"
        className="atividade-voltar"
        onClick={onVoltar}
      >
        ← Voltar para a aula
      </button>

      <header className="atividade-header">
        <p>Atividade acadêmica</p>
        <h1>{aula.titulo}</h1>
        <span>
          Questão {indiceAtual + 1} de {atividades.length}
        </span>
      </header>

      <section className="atividade-progresso">
        <div className="atividade-progresso-cabecalho">
          <span>
            {totalRespondidas} de {atividades.length} respondidas
          </span>

          <strong>{Math.round(progresso)}%</strong>
        </div>

        <div className="atividade-barra">
          <div
            className="atividade-barra-preenchida"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </section>

      <section className="questao-card">
        <p className="questao-numero">
          Questão {indiceAtual + 1}
        </p>

        <h2>{atividadeAtual.pergunta}</h2>

        <div className="alternativas-lista">
          {alternativas.map(([letra, texto]) => {
            const selecionada =
              respostas[atividadeAtual.id] === letra

            return (
              <button
                key={letra}
                type="button"
                className={`alternativa ${
                  selecionada ? 'alternativa-selecionada' : ''
                }`}
                onClick={() =>
                  selecionarResposta(atividadeAtual.id, letra)
                }
              >
                <span>{letra.toUpperCase()}</span>
                <p>{texto}</p>
              </button>
            )
          })}
        </div>
      </section>

      {mensagem && (
        <p className="atividade-mensagem">{mensagem}</p>
      )}

      <section className="atividade-controles">
        <button
          type="button"
          onClick={questaoAnterior}
          disabled={indiceAtual === 0}
        >
          ← Anterior
        </button>

        {indiceAtual < atividades.length - 1 ? (
          <button type="button" onClick={proximaQuestao}>
            Próxima →
          </button>
        ) : (
          <button
            type="button"
            onClick={enviarAtividade}
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar respostas'}
          </button>
        )}
      </section>
    </main>
  )
}