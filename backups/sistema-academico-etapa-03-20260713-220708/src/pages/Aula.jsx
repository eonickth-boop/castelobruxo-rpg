import { useState } from 'react'
import { supabase } from '../services/supabase'
import Livro from './Livro'
import Atividade from './Atividade'
import '../styles/aula.css'

export default function Aula({ aula, onVoltar }) {
  const [livroAberto, setLivroAberto] = useState(null)
  const [paginasLivro, setPaginasLivro] = useState([])
  const [abrindoLivro, setAbrindoLivro] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [atividadeAberta, setAtividadeAberta] = useState(false)
  const [atividades, setAtividades] = useState([])
  const [carregandoAtividade, setCarregandoAtividade] = useState(false)

  if (!aula) {
    return (
      <main className="aula-pagina">
        <button type="button" onClick={onVoltar}>
          ← Voltar
        </button>
        <p>Aula não encontrada.</p>
      </main>
    )
  }

  async function abrirLeituraObrigatoria() {
    if (!aula.livro_id) return

    setAbrindoLivro(true)
    setMensagem('')

    const { data: livroData, error: erroLivro } = await supabase
      .from('livros')
      .select('*')
      .eq('id', aula.livro_id)
      .single()

    if (erroLivro) {
      console.error('Erro ao carregar livro:', erroLivro)
      setMensagem('Não foi possível carregar o livro desta aula.')
      setAbrindoLivro(false)
      return
    }

    let consultaPaginas = supabase
      .from('paginas_livro')
      .select('*')
      .eq('livro_id', aula.livro_id)
      .order('numero', { ascending: true })

    if (aula.pagina_inicial) {
      consultaPaginas = consultaPaginas.gte(
        'numero',
        aula.pagina_inicial,
      )
    }

    if (aula.pagina_final) {
      consultaPaginas = consultaPaginas.lte(
        'numero',
        aula.pagina_final,
      )
    }

    const { data: paginasData, error: erroPaginas } =
      await consultaPaginas

    if (erroPaginas) {
      console.error('Erro ao carregar páginas:', erroPaginas)
      setMensagem('Não foi possível carregar as páginas obrigatórias.')
      setAbrindoLivro(false)
      return
    }

    setLivroAberto(livroData)
    setPaginasLivro(paginasData ?? [])
    setAbrindoLivro(false)
  }

  async function abrirAtividade() {
    setCarregandoAtividade(true)
    setMensagem('')

    const { data, error } = await supabase
      .from('atividades')
      .select(`
        id,
        pergunta,
        alternativa_a,
        alternativa_b,
        alternativa_c,
        alternativa_d,
        ordem
      `)
      .eq('aula_id', aula.id)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      console.error('Erro ao carregar atividade:', error)
      setMensagem('Não foi possível carregar a atividade desta aula.')
      setCarregandoAtividade(false)
      return
    }

    if (!data || data.length === 0) {
      setMensagem('Esta aula ainda não possui atividade disponível.')
      setCarregandoAtividade(false)
      return
    }

    setAtividades(data)
    setAtividadeAberta(true)
    setCarregandoAtividade(false)
  }

  function fecharLivro() {
    setLivroAberto(null)
    setPaginasLivro([])
    setMensagem('')
  }

  if (atividadeAberta) {
    return (
      <Atividade
        aula={aula}
        atividades={atividades}
        onVoltar={() => {
          setAtividadeAberta(false)
          setMensagem('')
        }}
        onConcluida={() => {
          setAtividadeAberta(false)
          setMensagem('Atividade concluída. Seu XP foi atualizado.')
        }}
      />
    )
  }

  if (livroAberto) {
    return (
      <Livro
        livro={livroAberto}
        paginas={paginasLivro}
        onFechar={fecharLivro}
        paginaInicial={aula.pagina_inicial}
        modoAula
      />
    )
  }

  const intervaloPaginas = aula.pagina_inicial
    ? aula.pagina_final &&
      aula.pagina_final !== aula.pagina_inicial
      ? `${aula.pagina_inicial}–${aula.pagina_final}`
      : `${aula.pagina_inicial}`
    : null

  return (
    <main className="aula-pagina">
      <button
        type="button"
        className="aula-voltar"
        onClick={onVoltar}
      >
        ← Voltar para a disciplina
      </button>

      <header className="aula-header">
        <p>Material acadêmico</p>
        <h1>{aula.titulo}</h1>
        <span>{aula.descricao}</span>
      </header>

      <section className="aula-conteudo">
        <div className="aula-conteudo-principal">
          <p className="aula-rotulo">Conteúdo da aula</p>

          <div className="aula-texto">
            {aula.conteudo ||
              'O conteúdo desta aula ainda não foi publicado.'}
          </div>
        </div>

        <aside className="aula-informacoes">
          <article>
            <small>Recompensa</small>
            <strong>⭐ {aula.recompensa_xp ?? 0} XP</strong>
          </article>

          <article>
            <small>Leitura obrigatória</small>
            <strong>
              {intervaloPaginas
                ? `📖 Páginas ${intervaloPaginas}`
                : 'Nenhuma leitura definida'}
            </strong>
          </article>

          <article>
            <small>Atividade</small>
            <strong>Será liberada na próxima etapa</strong>
          </article>
        </aside>
      </section>

      {mensagem && (
        <p
          style={{
            marginTop: '20px',
            padding: '14px',
            textAlign: 'center',
            borderRadius: '12px',
            background: 'rgba(201,164,92,.1)',
            border: '1px solid rgba(201,164,92,.25)',
          }}
        >
          {mensagem}
        </p>
      )}

      <section className="aula-acoes">
        <button
          type="button"
          disabled={!aula.livro_id || abrindoLivro}
          onClick={abrirLeituraObrigatoria}
        >
          {!aula.livro_id
            ? 'Livro não vinculado'
            : abrindoLivro
              ? 'Abrindo livro...'
              : '📖 Abrir leitura obrigatória'}
        </button>

        <button
          type="button"
          onClick={abrirAtividade}
          disabled={carregandoAtividade}
        >
          {carregandoAtividade
            ? 'Carregando atividade...'
            : 'Responder atividade'}
        </button>
      </section>
    </main>
  )
}