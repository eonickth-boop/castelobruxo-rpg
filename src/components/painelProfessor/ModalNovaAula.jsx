import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'

function calcularProximaOrdem(aulas, disciplinaId) {
  const aulasDaDisciplina = aulas.filter(
    (aula) => aula.disciplina_id === disciplinaId,
  )

  if (aulasDaDisciplina.length === 0) {
    return 1
  }

  return (
    Math.max(
      ...aulasDaDisciplina.map(
        (aula) => Number(aula.ordem) || 0,
      ),
    ) + 1
  )
}

export default function ModalNovaAula({
  disciplinas,
  aulas,
  disciplinaInicialId,
  onFechar,
  onCriada,
}) {
  const disciplinaPadrao =
    disciplinaInicialId ?? disciplinas[0]?.id ?? ''

  const [formulario, setFormulario] = useState({
    titulo: '',
    descricao: '',
    disciplina_id: disciplinaPadrao,
    ordem: calcularProximaOrdem(
      aulas,
      disciplinaPadrao,
    ),
    recompensa_xp: 0,
    ativo: false,
  })

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const disciplinaSelecionada = useMemo(
    () =>
      disciplinas.find(
        (disciplina) =>
          disciplina.id === formulario.disciplina_id,
      ),
    [disciplinas, formulario.disciplina_id],
  )

  useEffect(() => {
    function fecharComEsc(event) {
      if (event.key === 'Escape' && !salvando) {
        onFechar()
      }
    }

    window.addEventListener('keydown', fecharComEsc)

    return () => {
      window.removeEventListener(
        'keydown',
        fecharComEsc,
      )
    }
  }, [onFechar, salvando])

  function atualizarCampo(campo, valor) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }))
  }

  function trocarDisciplina(disciplinaId) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      disciplina_id: disciplinaId,
      ordem: calcularProximaOrdem(
        aulas,
        disciplinaId,
      ),
    }))
  }

  async function criarAula(event) {
    event.preventDefault()

    const tituloLimpo = formulario.titulo.trim()
    const descricaoLimpa =
      formulario.descricao.trim()

    if (!tituloLimpo) {
      setErro('Digite um título para a aula.')
      return
    }

    if (!formulario.disciplina_id) {
      setErro('Selecione uma disciplina.')
      return
    }

    setSalvando(true)
    setErro('')

    const { data, error } = await supabase
      .from('aulas')
      .insert({
        titulo: tituloLimpo,
        descricao: descricaoLimpa,
        disciplina_id: formulario.disciplina_id,
        ordem: Number(formulario.ordem) || 1,
        recompensa_xp:
          Number(formulario.recompensa_xp) || 0,
        ativo: Boolean(formulario.ativo),
      })
      .select(`
        id,
        titulo,
        descricao,
        disciplina_id,
        recompensa_xp,
        ordem,
        ativo,
        criado_em,
        atualizado_em
      `)
      .single()

    if (error) {
      console.error('Erro ao criar aula:', error)

      setErro(
        'Não foi possível criar a aula. Verifique os dados e tente novamente.',
      )

      setSalvando(false)
      return
    }

    setSalvando(false)
    onCriada(data)
  }

  function clicarFundo(event) {
    if (
      event.target === event.currentTarget &&
      !salvando
    ) {
      onFechar()
    }
  }

  return (
    <div
      className="modal-nova-aula-fundo"
      onMouseDown={clicarFundo}
      role="presentation"
    >
      <section
        className="modal-nova-aula"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-nova-aula-titulo"
      >
        <header className="modal-nova-aula-cabecalho">
          <div>
            <p>Criação de conteúdo</p>
            <h2 id="modal-nova-aula-titulo">
              Nova aula
            </h2>
            <span>
              Crie a estrutura inicial e continue no
              editor de blocos.
            </span>
          </div>

          <button
            type="button"
            className="modal-nova-aula-fechar"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <form
          className="modal-nova-aula-formulario"
          onSubmit={criarAula}
        >
          <label className="modal-nova-aula-campo">
            <span>Título da aula</span>

            <input
              type="text"
              value={formulario.titulo}
              onChange={(event) =>
                atualizarCampo(
                  'titulo',
                  event.target.value,
                )
              }
              placeholder="Ex.: Introdução às Plantas Encantadas"
              autoFocus
              disabled={salvando}
            />
          </label>

          <label className="modal-nova-aula-campo">
            <span>Descrição breve</span>

            <textarea
              value={formulario.descricao}
              onChange={(event) =>
                atualizarCampo(
                  'descricao',
                  event.target.value,
                )
              }
              placeholder="Resuma o que o aluno aprenderá."
              rows={4}
              disabled={salvando}
            />
          </label>

          <label className="modal-nova-aula-campo">
            <span>Disciplina</span>

            <select
              value={formulario.disciplina_id}
              onChange={(event) =>
                trocarDisciplina(event.target.value)
              }
              disabled={salvando}
            >
              {disciplinas.map((disciplina) => {
                const curso = Array.isArray(
                  disciplina.cursos,
                )
                  ? disciplina.cursos[0]
                  : disciplina.cursos

                return (
                  <option
                    key={disciplina.id}
                    value={disciplina.id}
                  >
                    {disciplina.nome}
                    {curso?.nome
                      ? ` — ${curso.nome}`
                      : ''}
                  </option>
                )
              })}
            </select>
          </label>

          <div className="modal-nova-aula-linha">
            <label className="modal-nova-aula-campo">
              <span>Ordem</span>

              <input
                type="number"
                min="1"
                value={formulario.ordem}
                onChange={(event) =>
                  atualizarCampo(
                    'ordem',
                    event.target.value,
                  )
                }
                disabled={salvando}
              />
            </label>

            <label className="modal-nova-aula-campo">
              <span>Recompensa de XP</span>

              <input
                type="number"
                min="0"
                value={formulario.recompensa_xp}
                onChange={(event) =>
                  atualizarCampo(
                    'recompensa_xp',
                    event.target.value,
                  )
                }
                disabled={salvando}
              />
            </label>

            <label className="modal-nova-aula-campo">
              <span>Status inicial</span>

              <select
                value={
                  formulario.ativo
                    ? 'publicada'
                    : 'rascunho'
                }
                onChange={(event) =>
                  atualizarCampo(
                    'ativo',
                    event.target.value === 'publicada',
                  )
                }
                disabled={salvando}
              >
                <option value="rascunho">
                  Rascunho
                </option>
                <option value="publicada">
                  Publicada
                </option>
              </select>
            </label>
          </div>

          <div className="modal-nova-aula-resumo">
            <span>Disciplina selecionada</span>
            <strong>
              {disciplinaSelecionada?.nome ||
                'Nenhuma disciplina'}
            </strong>
            <small>
              Após criar, o editor será aberto
              automaticamente para adicionar os blocos.
            </small>
          </div>

          {erro && (
            <p className="modal-nova-aula-erro">
              {erro}
            </p>
          )}

          <footer className="modal-nova-aula-acoes">
            <button
              type="button"
              className="painel-editor-cancelar"
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
            >
              {salvando
                ? 'Criando aula...'
                : 'Criar e abrir editor'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
