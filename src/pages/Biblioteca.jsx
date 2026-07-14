import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import Livro from './Livro'
import '../styles/biblioteca.css'

export default function Biblioteca({ onVoltar }) {
  const [livros, setLivros] = useState([])
  const [livroSelecionado, setLivroSelecionado] = useState(null)
  const [paginas, setPaginas] = useState([])
  const [pesquisa, setPesquisa] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [carregando, setCarregando] = useState(true)
  const [livroAbrindoId, setLivroAbrindoId] = useState(null)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarLivros()
  }, [])

  async function carregarLivros() {
    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase
      .from('livros')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      console.error(error)
      setMensagem('Não foi possível carregar os livros.')
      setLivros([])
    } else {
      setLivros(data ?? [])
    }

    setCarregando(false)
  }

  async function abrirLivro(livro) {
    setLivroAbrindoId(livro.id)
    setMensagem('')

    const { data, error } = await supabase
      .from('paginas_livro')
      .select('*')
      .eq('livro_id', livro.id)
      .order('numero', { ascending: true })

    if (error) {
      console.error(error)
      setMensagem('Não foi possível abrir este livro.')
      setLivroAbrindoId(null)
      return
    }

    setPaginas(data ?? [])
    setLivroSelecionado(livro)
    setLivroAbrindoId(null)
  }

  function fecharLivro() {
    setLivroSelecionado(null)
    setPaginas([])
    setMensagem('')
  }

  const categorias = useMemo(
    () => [
      'Todos',
      ...new Set(
        livros
          .map((livro) => livro.categoria)
          .filter(Boolean),
      ),
    ],
    [livros],
  )

  const livrosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase('pt-BR')

    return livros.filter((livro) => {
      const textoLivro = [
        livro.titulo,
        livro.autor,
        livro.descricao,
        livro.categoria,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      const correspondePesquisa =
        !termo || textoLivro.includes(termo)

      const correspondeCategoria =
        categoria === 'Todos' ||
        livro.categoria === categoria

      return correspondePesquisa && correspondeCategoria
    })
  }, [livros, pesquisa, categoria])

  if (livroSelecionado) {
    return (
      <Livro
        livro={livroSelecionado}
        paginas={paginas}
        onFechar={fecharLivro}
      />
    )
  }

  return (
    <main className="biblioteca">
      <button
        type="button"
        className="biblioteca-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="biblioteca-header">
        <div className="biblioteca-emblema">📚</div>
        <p className="biblioteca-selo">
          Arquivo Central de Castelobruxo
        </p>
        <h1>Biblioteca Central</h1>
        <p>
          Explore registros, estudos e conhecimentos preservados
          por gerações de bruxos brasileiros.
        </p>
      </header>

      <section className="biblioteca-ferramentas">
        <label className="biblioteca-pesquisa">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Pesquisar por título, autor, categoria ou conteúdo..."
            value={pesquisa}
            onChange={(evento) =>
              setPesquisa(evento.target.value)
            }
          />
        </label>

        <div className="biblioteca-contador">
          <strong>{livrosFiltrados.length}</strong>
          <span>
            {livrosFiltrados.length === 1
              ? 'obra encontrada'
              : 'obras encontradas'}
          </span>
        </div>
      </section>

      <section className="categorias">
        {categorias.map((nomeCategoria) => (
          <button
            key={nomeCategoria}
            type="button"
            onClick={() => setCategoria(nomeCategoria)}
            className={
              categoria === nomeCategoria
                ? 'categoria-ativa'
                : undefined
            }
          >
            {nomeCategoria}
          </button>
        ))}
      </section>

      {mensagem && (
        <p className="biblioteca-mensagem">{mensagem}</p>
      )}

      {carregando ? (
        <section className="biblioteca-estado">
          <div className="biblioteca-carregando" />
          <p>Organizando as estantes...</p>
        </section>
      ) : livrosFiltrados.length === 0 ? (
        <section className="biblioteca-estado">
          <span>📕</span>
          <h2>Nenhum livro encontrado</h2>
          <p>Experimente outra pesquisa ou categoria.</p>
        </section>
      ) : (
        <section className="estante">
          {livrosFiltrados.map((livro) => (
            <article className="livro-card" key={livro.id}>
              <div className="livro-card-brilho" />

              <div className="capa-container">
                {livro.capa_url ? (
                  <img
                    src={livro.capa_url}
                    alt={`Capa de ${livro.titulo}`}
                    className="capa-livro"
                    loading="lazy"
                  />
                ) : (
                  <div className="capa-sem-imagem">
                    <span>❦</span>
                    <strong>{livro.titulo}</strong>
                  </div>
                )}
              </div>

              <div className="livro-card-conteudo">
                <span className="livro-categoria">
                  {livro.categoria || 'Acervo Geral'}
                </span>

                <h2>{livro.titulo}</h2>

                <p className="livro-autor">
                  por {livro.autor || 'Autor desconhecido'}
                </p>

                <p className="livro-descricao">
                  {livro.descricao ||
                    'Obra preservada no acervo de Castelobruxo.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => abrirLivro(livro)}
                disabled={livroAbrindoId !== null}
              >
                {livroAbrindoId === livro.id
                  ? 'Abrindo...'
                  : 'Abrir livro'}
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
