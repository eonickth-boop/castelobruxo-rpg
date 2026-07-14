import { useState } from 'react'
import { supabase } from '../../services/supabase'
import EditorBlocos from './EditorBlocos'

export default function EditorAula({
  aula,
  disciplinas,
  onCancelar,
  onSalvo,
}) {
  const [formulario, setFormulario] = useState(aula)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const disciplinaDaAula = disciplinas.find(
    (disciplina) =>
      disciplina.id === formulario.disciplina_id,
  )

  function atualizarCampo(campo, valor) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }))
  }

  async function salvar(event) {
    event.preventDefault()

    const tituloLimpo = formulario.titulo.trim()
    const descricaoLimpa = formulario.descricao.trim()

    if (!tituloLimpo) {
      setErro('Digite um título para a aula.')
      return
    }

    setSalvando(true)
    setErro('')

    const { data, error } = await supabase
      .from('aulas')
      .update({
        titulo: tituloLimpo,
        descricao: descricaoLimpa,
        recompensa_xp:
          Number(formulario.recompensa_xp) || 0,
        ordem: Number(formulario.ordem) || 1,
        ativo: formulario.ativo,
      })
      .eq('id', formulario.id)
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
      console.error('Erro ao atualizar aula:', error)
      setErro(
        'Não foi possível salvar as alterações da aula.',
      )
      setSalvando(false)
      return
    }

    setSalvando(false)
    onSalvo(data)
  }

  return (
    <section className="painel-editor-aula">
      <div className="painel-editor-cabecalho">
        <div>
          <p>Edição de conteúdo</p>
          <h2>Editar aula</h2>
          <span>
            {disciplinaDaAula?.nome ||
              'Disciplina não identificada'}
          </span>
        </div>

        <button
          type="button"
          className="painel-editor-fechar"
          onClick={onCancelar}
          disabled={salvando}
        >
          ✕ Fechar
        </button>
      </div>

      <form
        className="painel-editor-formulario"
        onSubmit={salvar}
      >
        <label className="painel-editor-campo">
          <span>Título da aula</span>
          <input
            type="text"
            value={formulario.titulo}
            onChange={(event) =>
              atualizarCampo('titulo', event.target.value)
            }
            placeholder="Digite o título da aula"
            disabled={salvando}
          />
        </label>

        <label className="painel-editor-campo">
          <span>Descrição</span>
          <textarea
            value={formulario.descricao}
            onChange={(event) =>
              atualizarCampo(
                'descricao',
                event.target.value,
              )
            }
            placeholder="Digite uma breve descrição"
            rows={5}
            disabled={salvando}
          />
        </label>

        <EditorBlocos aulaId={formulario.id} />

        <div className="painel-editor-linha">
          <label className="painel-editor-campo">
            <span>Ordem da aula</span>
            <input
              type="number"
              min="1"
              value={formulario.ordem}
              onChange={(event) =>
                atualizarCampo('ordem', event.target.value)
              }
              disabled={salvando}
            />
          </label>

          <label className="painel-editor-campo">
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

          <label className="painel-editor-campo">
            <span>Status</span>
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
              <option value="publicada">Publicada</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </label>
        </div>

        {erro && (
          <p className="painel-editor-erro">{erro}</p>
        )}

        <div className="painel-editor-acoes">
          <button
            type="button"
            className="painel-editor-cancelar"
            onClick={onCancelar}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button type="submit" disabled={salvando}>
            {salvando
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </section>
  )
}
