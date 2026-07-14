import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/criar-aula.css'

const estadoInicial = {
  disciplinaId: '',
  livroId: '',
  titulo: '',
  descricao: '',
  conteudo: '',
  paginaInicial: '',
  paginaFinal: '',
  recompensaXp: '30',
  certificadoNome: '',
  ordem: '1',
}

export default function CriarAula({ onVoltar, onAulaCriada }) {
  const [formulario, setFormulario] = useState(estadoInicial)
  const [disciplinas, setDisciplinas] = useState([])
  const [livros, setLivros] = useState([])
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregandoDados(true)
    setMensagem('')

    const {
      data: { user },
      error: erroUsuario,
    } = await supabase.auth.getUser()

    if (erroUsuario || !user) {
      console.error('Erro ao identificar professor:', erroUsuario)
      setMensagem('Não foi possível identificar a conta do professor.')
      setCarregandoDados(false)
      return
    }

    const { data: disciplinasData, error: erroDisciplinas } =
      await supabase
        .from('disciplinas')
        .select(`
          id,
          nome,
          ordem,
          curso_id,
          cursos (
            id,
            nome,
            ano
          )
        `)
        .eq('professor_id', user.id)
        .eq('ativo', true)
        .order('ordem', { ascending: true })

    if (erroDisciplinas) {
      console.error('Erro ao carregar disciplinas:', erroDisciplinas)
      setMensagem('Não foi possível carregar suas disciplinas.')
      setCarregandoDados(false)
      return
    }

    const { data: livrosData, error: erroLivros } = await supabase
      .from('livros')
      .select('id, titulo, autor, categoria')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (erroLivros) {
      console.error('Erro ao carregar livros:', erroLivros)
      setMensagem('Não foi possível carregar os livros disponíveis.')
      setCarregandoDados(false)
      return
    }

    setDisciplinas(disciplinasData ?? [])
    setLivros(livrosData ?? [])

    if ((disciplinasData ?? []).length > 0) {
      setFormulario((estado) => ({
        ...estado,
        disciplinaId: disciplinasData[0].id,
      }))
    }

    setCarregandoDados(false)
  }

  const disciplinaSelecionada = useMemo(
    () =>
      disciplinas.find(
        (disciplina) => disciplina.id === formulario.disciplinaId,
      ),
    [disciplinas, formulario.disciplinaId],
  )

  function atualizarCampo(campo, valor) {
    setFormulario((estado) => ({
      ...estado,
      [campo]: valor,
    }))
  }

  function validarFormulario() {
    const titulo = formulario.titulo.trim()
    const descricao = formulario.descricao.trim()
    const conteudo = formulario.conteudo.trim()
    const xp = Number(formulario.recompensaXp)
    const ordem = Number(formulario.ordem)
    const paginaInicial = formulario.paginaInicial
      ? Number(formulario.paginaInicial)
      : null
    const paginaFinal = formulario.paginaFinal
      ? Number(formulario.paginaFinal)
      : null

    if (!formulario.disciplinaId) {
      return 'Selecione uma disciplina.'
    }

    if (!titulo) {
      return 'Informe o título da aula.'
    }

    if (!descricao) {
      return 'Informe uma descrição para a aula.'
    }

    if (!conteudo) {
      return 'Escreva o conteúdo da aula.'
    }

    if (!Number.isInteger(xp) || xp < 0) {
      return 'A recompensa de XP deve ser um número inteiro igual ou maior que zero.'
    }

    if (!Number.isInteger(ordem) || ordem <= 0) {
      return 'A ordem da aula deve ser um número inteiro maior que zero.'
    }

    if (paginaInicial !== null && paginaInicial <= 0) {
      return 'A página inicial deve ser maior que zero.'
    }

    if (paginaFinal !== null && paginaFinal <= 0) {
      return 'A página final deve ser maior que zero.'
    }

    if (
      paginaInicial !== null &&
      paginaFinal !== null &&
      paginaFinal < paginaInicial
    ) {
      return 'A página final não pode ser menor que a página inicial.'
    }

    if ((paginaInicial || paginaFinal) && !formulario.livroId) {
      return 'Selecione um livro antes de definir páginas de leitura.'
    }

    return null
  }

  async function salvarAula(ativa) {
    const erroValidacao = validarFormulario()

    if (erroValidacao) {
      setMensagem(erroValidacao)
      return
    }

    setSalvando(true)
    setMensagem('')

    const payload = {
      disciplina_id: formulario.disciplinaId,
      livro_id: formulario.livroId || null,
      titulo: formulario.titulo.trim(),
      descricao: formulario.descricao.trim(),
      conteudo: formulario.conteudo.trim(),
      pagina_inicial: formulario.paginaInicial
        ? Number(formulario.paginaInicial)
        : null,
      pagina_final: formulario.paginaFinal
        ? Number(formulario.paginaFinal)
        : null,
      recompensa_xp: Number(formulario.recompensaXp),
      certificado_nome:
        formulario.certificadoNome.trim() || null,
      ordem: Number(formulario.ordem),
      ativo: ativa,
      atualizado_em: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('aulas')
      .insert(payload)
      .select('id, titulo, ativo')
      .single()

    if (error) {
      console.error('Erro ao criar aula:', error)

      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('duplicate')
      ) {
        setMensagem(
          'Já existe uma aula com essa ordem dentro da disciplina.',
        )
      } else {
        setMensagem(
          error.message || 'Não foi possível salvar a aula.',
        )
      }

      setSalvando(false)
      return
    }

    setMensagem(
      ativa
        ? 'Aula publicada com sucesso.'
        : 'Rascunho salvo com sucesso.',
    )

    setSalvando(false)

    if (onAulaCriada) {
      onAulaCriada(data)
    }
  }

  if (carregandoDados) {
    return (
      <main className="criar-aula">
        <p>Carregando criador de aulas...</p>
      </main>
    )
  }

  return (
    <main className="criar-aula">
      <button
        type="button"
        className="criar-aula-voltar"
        onClick={onVoltar}
        disabled={salvando}
      >
        ← Voltar ao painel
      </button>

      <header className="criar-aula-hero">
        <p>Centro Acadêmico de Castelobruxo</p>
        <h1>Criar nova aula</h1>
        <span>
          Escreva, vincule materiais e publique quando estiver pronto.
        </span>
      </header>

      {disciplinas.length === 0 ? (
        <section className="criar-aula-aviso">
          Nenhuma disciplina ativa está vinculada a esta conta.
        </section>
      ) : (
        <form
          className="criar-aula-formulario"
          onSubmit={(evento) => evento.preventDefault()}
        >
          <section className="criar-aula-bloco">
            <div className="criar-aula-bloco-cabecalho">
              <p>Organização</p>
              <h2>Vínculos acadêmicos</h2>
            </div>

            <div className="criar-aula-grade">
              <label>
                <span>Disciplina</span>
                <select
                  value={formulario.disciplinaId}
                  onChange={(evento) =>
                    atualizarCampo(
                      'disciplinaId',
                      evento.target.value,
                    )
                  }
                  disabled={salvando}
                >
                  {disciplinas.map((disciplina) => {
                    const curso = Array.isArray(disciplina.cursos)
                      ? disciplina.cursos[0]
                      : disciplina.cursos

                    return (
                      <option
                        key={disciplina.id}
                        value={disciplina.id}
                      >
                        {disciplina.nome}
                        {curso?.nome ? ` — ${curso.nome}` : ''}
                      </option>
                    )
                  })}
                </select>
              </label>

              <label>
                <span>Livro vinculado</span>
                <select
                  value={formulario.livroId}
                  onChange={(evento) =>
                    atualizarCampo('livroId', evento.target.value)
                  }
                  disabled={salvando}
                >
                  <option value="">Nenhum livro</option>

                  {livros.map((livro) => (
                    <option key={livro.id} value={livro.id}>
                      {livro.titulo}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {disciplinaSelecionada && (
              <p className="criar-aula-contexto">
                Criando conteúdo para{' '}
                <strong>{disciplinaSelecionada.nome}</strong>.
              </p>
            )}
          </section>

          <section className="criar-aula-bloco">
            <div className="criar-aula-bloco-cabecalho">
              <p>Conteúdo</p>
              <h2>Informações da aula</h2>
            </div>

            <label>
              <span>Título</span>
              <input
                type="text"
                value={formulario.titulo}
                onChange={(evento) =>
                  atualizarCampo('titulo', evento.target.value)
                }
                placeholder="Ex.: Aula 02 — Os Primeiros Guardiões"
                disabled={salvando}
              />
            </label>

            <label>
              <span>Descrição</span>
              <textarea
                value={formulario.descricao}
                onChange={(evento) =>
                  atualizarCampo('descricao', evento.target.value)
                }
                placeholder="Escreva um resumo curto do objetivo desta aula."
                rows={3}
                disabled={salvando}
              />
            </label>

            <label>
              <span>Conteúdo completo</span>
              <textarea
                value={formulario.conteudo}
                onChange={(evento) =>
                  atualizarCampo('conteudo', evento.target.value)
                }
                placeholder="Escreva aqui o conteúdo que será apresentado ao aluno."
                rows={12}
                disabled={salvando}
              />
            </label>
          </section>

          <section className="criar-aula-bloco">
            <div className="criar-aula-bloco-cabecalho">
              <p>Configurações</p>
              <h2>Leitura e recompensa</h2>
            </div>

            <div className="criar-aula-grade criar-aula-grade-quatro">
              <label>
                <span>Página inicial</span>
                <input
                  type="number"
                  min="1"
                  value={formulario.paginaInicial}
                  onChange={(evento) =>
                    atualizarCampo(
                      'paginaInicial',
                      evento.target.value,
                    )
                  }
                  placeholder="1"
                  disabled={salvando}
                />
              </label>

              <label>
                <span>Página final</span>
                <input
                  type="number"
                  min="1"
                  value={formulario.paginaFinal}
                  onChange={(evento) =>
                    atualizarCampo(
                      'paginaFinal',
                      evento.target.value,
                    )
                  }
                  placeholder="2"
                  disabled={salvando}
                />
              </label>

              <label>
                <span>Recompensa de XP</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formulario.recompensaXp}
                  onChange={(evento) =>
                    atualizarCampo(
                      'recompensaXp',
                      evento.target.value,
                    )
                  }
                  disabled={salvando}
                />
              </label>

              <label>
                <span>Ordem</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formulario.ordem}
                  onChange={(evento) =>
                    atualizarCampo('ordem', evento.target.value)
                  }
                  disabled={salvando}
                />
              </label>
            </div>

            <label>
              <span>Nome do certificado futuro</span>
              <input
                type="text"
                value={formulario.certificadoNome}
                onChange={(evento) =>
                  atualizarCampo(
                    'certificadoNome',
                    evento.target.value,
                  )
                }
                placeholder="Opcional"
                disabled={salvando}
              />
            </label>
          </section>

          {mensagem && (
            <p className="criar-aula-mensagem">{mensagem}</p>
          )}

          <section className="criar-aula-acoes">
            <button
              type="button"
              onClick={() => salvarAula(false)}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar como rascunho'}
            </button>

            <button
              type="button"
              className="criar-aula-publicar"
              onClick={() => salvarAula(true)}
              disabled={salvando}
            >
              {salvando ? 'Publicando...' : 'Publicar aula'}
            </button>
          </section>
        </form>
      )}
    </main>
  )
}