import { useEffect, useState } from 'react'
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
  const [abrindoLivro, setAbrindoLivro] = useState(false)
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
    setAbrindoLivro(true)
    setMensagem('')

    const { data, error } = await supabase
      .from('paginas_livro')
      .select('*')
      .eq('livro_id', livro.id)
      .order('numero', { ascending: true })

    if (error) {
      console.error(error)
      setMensagem('Não foi possível abrir este livro.')
      setAbrindoLivro(false)
      return
    }

    setPaginas(data ?? [])
    setLivroSelecionado(livro)
    setAbrindoLivro(false)
  }

  function fecharLivro() {
    setLivroSelecionado(null)
    setPaginas([])
    setMensagem('')
  }

  const categorias = [
    'Todos',
    ...new Set(livros.map((livro) => livro.categoria).filter(Boolean)),
  ]

  const livrosFiltrados = livros.filter((livro) => {
    const termo = pesquisa.trim().toLowerCase()

    const correspondePesquisa =
      !termo ||
      livro.titulo.toLowerCase().includes(termo) ||
      livro.autor.toLowerCase().includes(termo) ||
      livro.descricao.toLowerCase().includes(termo)

    const correspondeCategoria =
      categoria === 'Todos' || livro.categoria === categoria

    return correspondePesquisa && correspondeCategoria
  })

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
      <button type="button" onClick={onVoltar}>
        ← Voltar
      </button>

      <header className="biblioteca-header">
        <p className="biblioteca-selo">Arquivo Central de Castelobruxo</p>

        <h1>Biblioteca Central</h1>

        <p>
          Explore os registros, estudos e conhecimentos preservados pela escola.
        </p>
      </header>

      <section className="biblioteca-pesquisa">
        <input
          type="search"
          placeholder="Pesquisar por título, autor ou conteúdo..."
          value={pesquisa}
          onChange={(evento) => setPesquisa(evento.target.value)}
        />
      </section>

      <section className="categorias">
        {categorias.map((nomeCategoria) => (
          <button
            key={nomeCategoria}
            type="button"
            onClick={() => setCategoria(nomeCategoria)}
            className={
              categoria === nomeCategoria ? 'categoria-ativa' : undefined
            }
          >
            {nomeCategoria}
          </button>
        ))}
      </section>

      {mensagem && <p className="biblioteca-mensagem">{mensagem}</p>}

      {carregando ? (
        <p className="biblioteca-estado">Carregando livros...</p>
      ) : livrosFiltrados.length === 0 ? (
        <p className="biblioteca-estado">
          Nenhum livro foi encontrado.
        </p>
      ) : (
        <section className="estante">
          {livrosFiltrados.map((livro) => (
            <article className="livro-card" key={livro.id}>
              <div className="capa-container">
                {livro.capa_url ? (
                  <img
                    src={livro.capa_url}
                    alt={`Capa de ${livro.titulo}`}
                    className="capa-livro"
                  />
                ) : (
                  <div className="capa-sem-imagem">📖</div>
                )}
              </div>

              <div className="livro-card-conteudo">
                <span className="livro-categoria">
                  {livro.categoria}
                </span>

                <h2>{livro.titulo}</h2>

                <p className="livro-autor">{livro.autor}</p>

                <p className="livro-descricao">{livro.descricao}</p>
              </div>

              <button
                type="button"
                onClick={() => abrirLivro(livro)}
                disabled={abrindoLivro}
              >
                {abrindoLivro ? 'Abrindo...' : 'Abrir livro'}
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}