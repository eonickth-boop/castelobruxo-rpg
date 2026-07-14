import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'

const livroInicial = {
  id: null,
  titulo: '',
  autor: '',
  categoria: '',
  descricao: '',
  capa_url: '',
  ordem: 1,
  ativo: false,
}

const paginaInicial = {
  id: null,
  livro_id: '',
  numero: 1,
  titulo: '',
  conteudo: '',
  imagem_url: '',
}

function normalizarUrl(url) {
  if (!url) return ''

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ) {
    return url
  }

  return url.startsWith('/') ? url : `/${url}`
}

function formatarData(data) {
  if (!data) return 'Sem data'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(data))
}

function ordenarLivros(lista) {
  return [...lista].sort(
    (a, b) =>
      Number(a.ordem || 0) - Number(b.ordem || 0),
  )
}

function ordenarPaginas(lista) {
  return [...lista].sort(
    (a, b) =>
      Number(a.numero || 0) - Number(b.numero || 0),
  )
}

export default function LivrosProfessor() {
  const [livros, setLivros] = useState([])
  const [paginas, setPaginas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')

  const [pesquisa, setPesquisa] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] =
    useState('todas')
  const [statusFiltro, setStatusFiltro] =
    useState('todos')
  const [ordenacao, setOrdenacao] = useState('ordem')

  const [editorLivroAberto, setEditorLivroAberto] =
    useState(false)
  const [formularioLivro, setFormularioLivro] =
    useState(livroInicial)
  const [salvandoLivro, setSalvandoLivro] =
    useState(false)
  const [erroLivro, setErroLivro] = useState('')

  const [livroSelecionadoId, setLivroSelecionadoId] =
    useState(null)
  const [editorPaginaAberto, setEditorPaginaAberto] =
    useState(false)
  const [formularioPagina, setFormularioPagina] =
    useState(paginaInicial)
  const [salvandoPagina, setSalvandoPagina] =
    useState(false)
  const [erroPagina, setErroPagina] = useState('')

  const [previewLivroId, setPreviewLivroId] =
    useState(null)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregando(true)
    setMensagem('')

    const [respostaLivros, respostaPaginas] =
      await Promise.all([
        supabase
          .from('livros')
          .select(`
            id,
            titulo,
            autor,
            categoria,
            descricao,
            capa_url,
            ordem,
            ativo,
            criado_em,
            atualizado_em
          `)
          .order('ordem', { ascending: true }),

        supabase
          .from('paginas_livro')
          .select(`
            id,
            livro_id,
            numero,
            titulo,
            conteudo,
            imagem_url,
            criado_em
          `)
          .order('numero', { ascending: true }),
      ])

    const erros = [
      respostaLivros.error,
      respostaPaginas.error,
    ].filter(Boolean)

    if (erros.length > 0) {
      console.error('Erro ao carregar livros:', erros)
      setMensagem(
        'Alguns dados da biblioteca não puderam ser carregados.',
      )
    }

    setLivros(respostaLivros.data ?? [])
    setPaginas(respostaPaginas.data ?? [])
    setCarregando(false)
  }

  const livrosComDados = useMemo(() => {
    return livros.map((livro) => ({
      ...livro,
      paginas: ordenarPaginas(
        paginas.filter(
          (pagina) => pagina.livro_id === livro.id,
        ),
      ),
    }))
  }, [livros, paginas])

  const categorias = useMemo(
    () =>
      [
        ...new Set(
          livros
            .map((livro) => livro.categoria)
            .filter(Boolean),
        ),
      ].sort(),
    [livros],
  )

  const livrosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()

    const filtrados = livrosComDados.filter((livro) => {
      const correspondePesquisa =
        !termo ||
        livro.titulo?.toLowerCase().includes(termo) ||
        livro.autor?.toLowerCase().includes(termo) ||
        livro.categoria?.toLowerCase().includes(termo)

      const correspondeCategoria =
        categoriaFiltro === 'todas' ||
        livro.categoria === categoriaFiltro

      const correspondeStatus =
        statusFiltro === 'todos' ||
        (statusFiltro === 'publicados' && livro.ativo) ||
        (statusFiltro === 'rascunhos' && !livro.ativo)

      return (
        correspondePesquisa &&
        correspondeCategoria &&
        correspondeStatus
      )
    })

    return [...filtrados].sort((a, b) => {
      if (ordenacao === 'titulo') {
        return String(a.titulo || '').localeCompare(
          String(b.titulo || ''),
          'pt-BR',
        )
      }

      if (ordenacao === 'recentes') {
        return String(
          b.atualizado_em || b.criado_em || '',
        ).localeCompare(
          String(a.atualizado_em || a.criado_em || ''),
        )
      }

      if (ordenacao === 'paginas') {
        return b.paginas.length - a.paginas.length
      }

      return (
        Number(a.ordem || 0) - Number(b.ordem || 0)
      )
    })
  }, [
    livrosComDados,
    pesquisa,
    categoriaFiltro,
    statusFiltro,
    ordenacao,
  ])

  const resumo = useMemo(
    () => ({
      total: livros.length,
      publicados: livros.filter((livro) => livro.ativo)
        .length,
      rascunhos: livros.filter((livro) => !livro.ativo)
        .length,
      paginas: paginas.length,
      categorias: categorias.length,
    }),
    [livros, paginas.length, categorias.length],
  )

  const livroSelecionado = useMemo(
    () =>
      livrosComDados.find(
        (livro) => livro.id === livroSelecionadoId,
      ) ?? null,
    [livrosComDados, livroSelecionadoId],
  )

  const livroPreview = useMemo(
    () =>
      livrosComDados.find(
        (livro) => livro.id === previewLivroId,
      ) ?? null,
    [livrosComDados, previewLivroId],
  )

  function abrirNovoLivro() {
    const proximaOrdem =
      Math.max(
        0,
        ...livros.map(
          (livro) => Number(livro.ordem) || 0,
        ),
      ) + 1

    setFormularioLivro({
      ...livroInicial,
      ordem: proximaOrdem,
    })
    setErroLivro('')
    setEditorLivroAberto(true)
  }

  function abrirEdicaoLivro(livro) {
    setFormularioLivro({
      id: livro.id,
      titulo: livro.titulo || '',
      autor: livro.autor || '',
      categoria: livro.categoria || '',
      descricao: livro.descricao || '',
      capa_url: livro.capa_url || '',
      ordem: livro.ordem || 1,
      ativo: Boolean(livro.ativo),
    })
    setErroLivro('')
    setEditorLivroAberto(true)
  }

  function fecharEditorLivro() {
    if (salvandoLivro) return

    setEditorLivroAberto(false)
    setFormularioLivro(livroInicial)
    setErroLivro('')
  }

  function atualizarCampoLivro(campo, valor) {
    setFormularioLivro((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }))
  }

  async function salvarLivro(event) {
    event.preventDefault()

    const titulo = formularioLivro.titulo.trim()

    if (!titulo) {
      setErroLivro('Digite o título do livro.')
      return
    }

    setSalvandoLivro(true)
    setErroLivro('')

    const dados = {
      titulo,
      autor: formularioLivro.autor.trim(),
      categoria: formularioLivro.categoria.trim(),
      descricao: formularioLivro.descricao.trim(),
      capa_url: formularioLivro.capa_url.trim(),
      ordem: Number(formularioLivro.ordem) || 1,
      ativo: Boolean(formularioLivro.ativo),
      atualizado_em: new Date().toISOString(),
    }

    let resposta

    if (formularioLivro.id) {
      resposta = await supabase
        .from('livros')
        .update(dados)
        .eq('id', formularioLivro.id)
        .select(`
          id,
          titulo,
          autor,
          categoria,
          descricao,
          capa_url,
          ordem,
          ativo,
          criado_em,
          atualizado_em
        `)
        .single()
    } else {
      resposta = await supabase
        .from('livros')
        .insert(dados)
        .select(`
          id,
          titulo,
          autor,
          categoria,
          descricao,
          capa_url,
          ordem,
          ativo,
          criado_em,
          atualizado_em
        `)
        .single()
    }

    if (resposta.error) {
      console.error(
        'Erro ao salvar livro:',
        resposta.error,
      )
      setErroLivro('Não foi possível salvar o livro.')
      setSalvandoLivro(false)
      return
    }

    setLivros((estadoAtual) => {
      const existe = estadoAtual.some(
        (livro) => livro.id === resposta.data.id,
      )

      if (existe) {
        return ordenarLivros(
          estadoAtual.map((livro) =>
            livro.id === resposta.data.id
              ? resposta.data
              : livro,
          ),
        )
      }

      return ordenarLivros([
        ...estadoAtual,
        resposta.data,
      ])
    })

    setMensagem(
      formularioLivro.id
        ? 'Livro atualizado com sucesso.'
        : 'Livro criado com sucesso.',
    )
    setSalvandoLivro(false)
    fecharEditorLivro()
  }

  async function duplicarLivro(livro) {
    setMensagem('')

    const proximaOrdem =
      Math.max(
        0,
        ...livros.map(
          (item) => Number(item.ordem) || 0,
        ),
      ) + 1

    const { data: livroNovo, error } = await supabase
      .from('livros')
      .insert({
        titulo: `${livro.titulo} (cópia)`,
        autor: livro.autor,
        categoria: livro.categoria,
        descricao: livro.descricao,
        capa_url: livro.capa_url,
        ordem: proximaOrdem,
        ativo: false,
        atualizado_em: new Date().toISOString(),
      })
      .select(`
        id,
        titulo,
        autor,
        categoria,
        descricao,
        capa_url,
        ordem,
        ativo,
        criado_em,
        atualizado_em
      `)
      .single()

    if (error) {
      console.error('Erro ao duplicar livro:', error)
      setMensagem('Não foi possível duplicar o livro.')
      return
    }

    const paginasOriginais = livro.paginas || []

    if (paginasOriginais.length > 0) {
      const { data: paginasNovas, error: erroPaginas } =
        await supabase
          .from('paginas_livro')
          .insert(
            paginasOriginais.map((pagina) => ({
              livro_id: livroNovo.id,
              numero: pagina.numero,
              titulo: pagina.titulo,
              conteudo: pagina.conteudo,
              imagem_url: pagina.imagem_url,
            })),
          )
          .select(`
            id,
            livro_id,
            numero,
            titulo,
            conteudo,
            imagem_url,
            criado_em
          `)

      if (erroPaginas) {
        console.error(
          'O livro foi duplicado, mas as páginas não:',
          erroPaginas,
        )
      } else {
        setPaginas((estadoAtual) => [
          ...estadoAtual,
          ...(paginasNovas ?? []),
        ])
      }
    }

    setLivros((estadoAtual) =>
      ordenarLivros([...estadoAtual, livroNovo]),
    )
    setMensagem(
      'Livro e páginas duplicados como rascunho.',
    )
  }

  async function excluirLivro(livro) {
    const confirmou = window.confirm(
      `Deseja excluir "${livro.titulo}" e todas as suas páginas?`,
    )

    if (!confirmou) return

    setMensagem('')

    const { error: erroPaginas } = await supabase
      .from('paginas_livro')
      .delete()
      .eq('livro_id', livro.id)

    if (erroPaginas) {
      console.error(
        'Erro ao excluir páginas:',
        erroPaginas,
      )
    }

    const { error } = await supabase
      .from('livros')
      .delete()
      .eq('id', livro.id)

    if (error) {
      console.error('Erro ao excluir livro:', error)
      setMensagem('Não foi possível excluir o livro.')
      return
    }

    setLivros((estadoAtual) =>
      estadoAtual.filter(
        (item) => item.id !== livro.id,
      ),
    )
    setPaginas((estadoAtual) =>
      estadoAtual.filter(
        (pagina) => pagina.livro_id !== livro.id,
      ),
    )

    if (livroSelecionadoId === livro.id) {
      setLivroSelecionadoId(null)
    }

    setMensagem('Livro excluído.')
  }

  function abrirNovaPagina(livroId) {
    const paginasLivro = paginas.filter(
      (pagina) => pagina.livro_id === livroId,
    )

    const proximoNumero =
      Math.max(
        0,
        ...paginasLivro.map(
          (pagina) => Number(pagina.numero) || 0,
        ),
      ) + 1

    setFormularioPagina({
      ...paginaInicial,
      livro_id: livroId,
      numero: proximoNumero,
    })
    setErroPagina('')
    setEditorPaginaAberto(true)
  }

  function abrirEdicaoPagina(pagina) {
    setFormularioPagina({
      id: pagina.id,
      livro_id: pagina.livro_id,
      numero: pagina.numero || 1,
      titulo: pagina.titulo || '',
      conteudo: pagina.conteudo || '',
      imagem_url: pagina.imagem_url || '',
    })
    setErroPagina('')
    setEditorPaginaAberto(true)
  }

  function fecharEditorPagina() {
    if (salvandoPagina) return

    setEditorPaginaAberto(false)
    setFormularioPagina(paginaInicial)
    setErroPagina('')
  }

  function atualizarCampoPagina(campo, valor) {
    setFormularioPagina((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }))
  }

  async function salvarPagina(event) {
    event.preventDefault()

    if (!formularioPagina.titulo.trim()) {
      setErroPagina('Digite o título da página.')
      return
    }

    if (!formularioPagina.conteudo.trim()) {
      setErroPagina('Digite o conteúdo da página.')
      return
    }

    setSalvandoPagina(true)
    setErroPagina('')

    const dados = {
      livro_id: formularioPagina.livro_id,
      numero: Number(formularioPagina.numero) || 1,
      titulo: formularioPagina.titulo.trim(),
      conteudo: formularioPagina.conteudo.trim(),
      imagem_url: formularioPagina.imagem_url.trim(),
    }

    let resposta

    if (formularioPagina.id) {
      resposta = await supabase
        .from('paginas_livro')
        .update(dados)
        .eq('id', formularioPagina.id)
        .select(`
          id,
          livro_id,
          numero,
          titulo,
          conteudo,
          imagem_url,
          criado_em
        `)
        .single()
    } else {
      resposta = await supabase
        .from('paginas_livro')
        .insert(dados)
        .select(`
          id,
          livro_id,
          numero,
          titulo,
          conteudo,
          imagem_url,
          criado_em
        `)
        .single()
    }

    if (resposta.error) {
      console.error(
        'Erro ao salvar página:',
        resposta.error,
      )
      setErroPagina(
        'Não foi possível salvar a página.',
      )
      setSalvandoPagina(false)
      return
    }

    setPaginas((estadoAtual) => {
      const existe = estadoAtual.some(
        (pagina) => pagina.id === resposta.data.id,
      )

      if (existe) {
        return estadoAtual.map((pagina) =>
          pagina.id === resposta.data.id
            ? resposta.data
            : pagina,
        )
      }

      return [...estadoAtual, resposta.data]
    })

    setMensagem(
      formularioPagina.id
        ? 'Página atualizada com sucesso.'
        : 'Página criada com sucesso.',
    )
    setSalvandoPagina(false)
    fecharEditorPagina()
  }

  async function duplicarPagina(pagina) {
    const paginasLivro = paginas.filter(
      (item) => item.livro_id === pagina.livro_id,
    )

    const proximoNumero =
      Math.max(
        0,
        ...paginasLivro.map(
          (item) => Number(item.numero) || 0,
        ),
      ) + 1

    const { data, error } = await supabase
      .from('paginas_livro')
      .insert({
        livro_id: pagina.livro_id,
        numero: proximoNumero,
        titulo: `${pagina.titulo} (cópia)`,
        conteudo: pagina.conteudo,
        imagem_url: pagina.imagem_url,
      })
      .select(`
        id,
        livro_id,
        numero,
        titulo,
        conteudo,
        imagem_url,
        criado_em
      `)
      .single()

    if (error) {
      console.error('Erro ao duplicar página:', error)
      setMensagem('Não foi possível duplicar a página.')
      return
    }

    setPaginas((estadoAtual) => [
      ...estadoAtual,
      data,
    ])
    setMensagem('Página duplicada.')
  }

  async function excluirPagina(pagina) {
    const confirmou = window.confirm(
      `Deseja excluir a página "${pagina.titulo}"?`,
    )

    if (!confirmou) return

    const { error } = await supabase
      .from('paginas_livro')
      .delete()
      .eq('id', pagina.id)

    if (error) {
      console.error('Erro ao excluir página:', error)
      setMensagem('Não foi possível excluir a página.')
      return
    }

    setPaginas((estadoAtual) =>
      estadoAtual.filter(
        (item) => item.id !== pagina.id,
      ),
    )
    setMensagem('Página excluída.')
  }

  async function moverPagina(
    pagina,
    direcao,
    paginasLivro,
  ) {
    const ordenadas = ordenarPaginas(paginasLivro)
    const indice = ordenadas.findIndex(
      (item) => item.id === pagina.id,
    )
    const indiceDestino = indice + direcao

    if (
      indice < 0 ||
      indiceDestino < 0 ||
      indiceDestino >= ordenadas.length
    ) {
      return
    }

    const atual = ordenadas[indice]
    const destino = ordenadas[indiceDestino]

    const [respostaAtual, respostaDestino] =
      await Promise.all([
        supabase
          .from('paginas_livro')
          .update({ numero: destino.numero })
          .eq('id', atual.id),
        supabase
          .from('paginas_livro')
          .update({ numero: atual.numero })
          .eq('id', destino.id),
      ])

    if (
      respostaAtual.error ||
      respostaDestino.error
    ) {
      console.error(
        'Erro ao mover página:',
        respostaAtual.error,
        respostaDestino.error,
      )
      setMensagem(
        'Não foi possível alterar a ordem das páginas.',
      )
      return
    }

    setPaginas((estadoAtual) =>
      estadoAtual.map((item) => {
        if (item.id === atual.id) {
          return { ...item, numero: destino.numero }
        }

        if (item.id === destino.id) {
          return { ...item, numero: atual.numero }
        }

        return item
      }),
    )

    setMensagem('Ordem das páginas atualizada.')
  }

  if (carregando) {
    return (
      <p className="painel-professor-vazio">
        Carregando biblioteca...
      </p>
    )
  }

  return (
    <section className="livros-professor">
      <div className="painel-conteudo-cabecalho">
        <div>
          <p>Biblioteca acadêmica</p>
          <h2>Livros</h2>
          <span>
            Crie livros, edite páginas e visualize o
            resultado.
          </span>
        </div>

        <div className="livros-acoes-topo">
          <button type="button" onClick={carregarDados}>
            Atualizar
          </button>
          <button type="button" onClick={abrirNovoLivro}>
            ➕ Novo livro
          </button>
        </div>
      </div>

      {mensagem && (
        <p className="painel-professor-mensagem">
          {mensagem}
        </p>
      )}

      <div className="livros-resumo">
        <article>
          <small>Livros</small>
          <strong>{resumo.total}</strong>
        </article>
        <article>
          <small>Publicados</small>
          <strong>{resumo.publicados}</strong>
        </article>
        <article>
          <small>Rascunhos</small>
          <strong>{resumo.rascunhos}</strong>
        </article>
        <article>
          <small>Páginas</small>
          <strong>{resumo.paginas}</strong>
        </article>
        <article>
          <small>Categorias</small>
          <strong>{resumo.categorias}</strong>
        </article>
      </div>

      <div className="livros-filtros">
        <label>
          <span>Pesquisar</span>
          <input
            type="search"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(event.target.value)
            }
            placeholder="Título, autor ou categoria"
          />
        </label>

        <label>
          <span>Categoria</span>
          <select
            value={categoriaFiltro}
            onChange={(event) =>
              setCategoriaFiltro(event.target.value)
            }
          >
            <option value="todas">
              Todas as categorias
            </option>
            {categorias.map((categoria) => (
              <option
                key={categoria}
                value={categoria}
              >
                {categoria}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select
            value={statusFiltro}
            onChange={(event) =>
              setStatusFiltro(event.target.value)
            }
          >
            <option value="todos">Todos</option>
            <option value="publicados">
              Publicados
            </option>
            <option value="rascunhos">
              Rascunhos
            </option>
          </select>
        </label>

        <label>
          <span>Ordenar</span>
          <select
            value={ordenacao}
            onChange={(event) =>
              setOrdenacao(event.target.value)
            }
          >
            <option value="ordem">Ordem</option>
            <option value="titulo">Título</option>
            <option value="recentes">
              Mais recentes
            </option>
            <option value="paginas">
              Mais páginas
            </option>
          </select>
        </label>
      </div>

      {livrosFiltrados.length === 0 ? (
        <p className="painel-professor-vazio">
          Nenhum livro encontrado.
        </p>
      ) : (
        <div className="livros-grade">
          {livrosFiltrados.map((livro) => {
            const capa = normalizarUrl(livro.capa_url)

            return (
              <article
                className="livro-card"
                key={livro.id}
              >
                <div className="livro-card-capa">
                  {capa ? (
                    <img
                      src={capa}
                      alt={`Capa de ${livro.titulo}`}
                    />
                  ) : (
                    <div>
                      <span>📖</span>
                      <small>Sem capa</small>
                    </div>
                  )}

                  <span
                    className={
                      livro.ativo
                        ? 'painel-status-publicado'
                        : 'painel-status-rascunho'
                    }
                  >
                    {livro.ativo
                      ? 'Publicado'
                      : 'Rascunho'}
                  </span>
                </div>

                <div className="livro-card-conteudo">
                  <small>
                    {livro.categoria ||
                      'Sem categoria'}
                  </small>
                  <h3>{livro.titulo}</h3>
                  <p>
                    {livro.descricao ||
                      'Sem descrição cadastrada.'}
                  </p>

                  <div className="livro-card-meta">
                    <span>
                      Autor:{' '}
                      <strong>
                        {livro.autor || 'Não informado'}
                      </strong>
                    </span>
                    <span>
                      {livro.paginas.length}{' '}
                      {livro.paginas.length === 1
                        ? 'página'
                        : 'páginas'}
                    </span>
                    <span>
                      Atualizado:{' '}
                      {formatarData(
                        livro.atualizado_em ||
                          livro.criado_em,
                      )}
                    </span>
                  </div>
                </div>

                <div className="livro-card-acoes">
                  <button
                    type="button"
                    onClick={() =>
                      setLivroSelecionadoId(livro.id)
                    }
                  >
                    Páginas
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewLivroId(livro.id)
                    }
                  >
                    Visualizar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      abrirEdicaoLivro(livro)
                    }
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicarLivro(livro)}
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    className="livro-excluir"
                    onClick={() => excluirLivro(livro)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {livroSelecionado && (
        <div
          className="livro-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLivroSelecionadoId(null)
            }
          }}
          role="presentation"
        >
          <section className="livro-modal livro-paginas-modal">
            <header>
              <div>
                <p>Editor de páginas</p>
                <h2>{livroSelecionado.titulo}</h2>
                <span>
                  Organize, edite e duplique páginas.
                </span>
              </div>

              <div className="livro-modal-cabecalho-acoes">
                <button
                  type="button"
                  onClick={() =>
                    abrirNovaPagina(
                      livroSelecionado.id,
                    )
                  }
                >
                  ＋ Nova página
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLivroSelecionadoId(null)
                  }
                >
                  ✕ Fechar
                </button>
              </div>
            </header>

            {livroSelecionado.paginas.length === 0 ? (
              <p className="painel-professor-vazio">
                Este livro ainda não possui páginas.
              </p>
            ) : (
              <div className="livro-paginas-lista">
                {livroSelecionado.paginas.map(
                  (pagina, indice) => (
                    <article key={pagina.id}>
                      <span className="livro-pagina-numero">
                        {String(
                          pagina.numero || 0,
                        ).padStart(2, '0')}
                      </span>

                      <div>
                        <strong>{pagina.titulo}</strong>
                        <small>
                          {pagina.conteudo.slice(0, 120)}
                          {pagina.conteudo.length > 120
                            ? '...'
                            : ''}
                        </small>
                      </div>

                      <div className="livro-pagina-acoes">
                        <button
                          type="button"
                          onClick={() =>
                            moverPagina(
                              pagina,
                              -1,
                              livroSelecionado.paginas,
                            )
                          }
                          disabled={indice === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            moverPagina(
                              pagina,
                              1,
                              livroSelecionado.paginas,
                            )
                          }
                          disabled={
                            indice ===
                            livroSelecionado.paginas
                              .length -
                              1
                          }
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicaoPagina(pagina)
                          }
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            duplicarPagina(pagina)
                          }
                        >
                          Duplicar
                        </button>
                        <button
                          type="button"
                          className="livro-excluir"
                          onClick={() =>
                            excluirPagina(pagina)
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {editorLivroAberto && (
        <div
          className="livro-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharEditorLivro()
            }
          }}
          role="presentation"
        >
          <section className="livro-modal">
            <header>
              <div>
                <p>Cadastro de livro</p>
                <h2>
                  {formularioLivro.id
                    ? 'Editar livro'
                    : 'Novo livro'}
                </h2>
                <span>
                  Defina as informações gerais da obra.
                </span>
              </div>

              <button
                type="button"
                onClick={fecharEditorLivro}
                disabled={salvandoLivro}
              >
                ✕ Fechar
              </button>
            </header>

            <form
              className="livro-formulario"
              onSubmit={salvarLivro}
            >
              <label>
                <span>Título</span>
                <input
                  type="text"
                  value={formularioLivro.titulo}
                  onChange={(event) =>
                    atualizarCampoLivro(
                      'titulo',
                      event.target.value,
                    )
                  }
                  disabled={salvandoLivro}
                />
              </label>

              <div className="livro-formulario-linha">
                <label>
                  <span>Autor</span>
                  <input
                    type="text"
                    value={formularioLivro.autor}
                    onChange={(event) =>
                      atualizarCampoLivro(
                        'autor',
                        event.target.value,
                      )
                    }
                    disabled={salvandoLivro}
                  />
                </label>

                <label>
                  <span>Categoria</span>
                  <input
                    type="text"
                    value={formularioLivro.categoria}
                    onChange={(event) =>
                      atualizarCampoLivro(
                        'categoria',
                        event.target.value,
                      )
                    }
                    disabled={salvandoLivro}
                  />
                </label>
              </div>

              <label>
                <span>Descrição</span>
                <textarea
                  value={formularioLivro.descricao}
                  onChange={(event) =>
                    atualizarCampoLivro(
                      'descricao',
                      event.target.value,
                    )
                  }
                  rows={5}
                  disabled={salvandoLivro}
                />
              </label>

              <label>
                <span>URL ou caminho da capa</span>
                <input
                  type="text"
                  value={formularioLivro.capa_url}
                  onChange={(event) =>
                    atualizarCampoLivro(
                      'capa_url',
                      event.target.value,
                    )
                  }
                  placeholder="/assets/livros/capa.png"
                  disabled={salvandoLivro}
                />
              </label>

              {formularioLivro.capa_url && (
                <div className="livro-capa-preview">
                  <img
                    src={normalizarUrl(
                      formularioLivro.capa_url,
                    )}
                    alt="Prévia da capa"
                  />
                </div>
              )}

              <div className="livro-formulario-linha">
                <label>
                  <span>Ordem</span>
                  <input
                    type="number"
                    min="1"
                    value={formularioLivro.ordem}
                    onChange={(event) =>
                      atualizarCampoLivro(
                        'ordem',
                        event.target.value,
                      )
                    }
                    disabled={salvandoLivro}
                  />
                </label>

                <label>
                  <span>Status</span>
                  <select
                    value={
                      formularioLivro.ativo
                        ? 'publicado'
                        : 'rascunho'
                    }
                    onChange={(event) =>
                      atualizarCampoLivro(
                        'ativo',
                        event.target.value ===
                          'publicado',
                      )
                    }
                    disabled={salvandoLivro}
                  >
                    <option value="rascunho">
                      Rascunho
                    </option>
                    <option value="publicado">
                      Publicado
                    </option>
                  </select>
                </label>
              </div>

              {erroLivro && (
                <p className="livro-editor-erro">
                  {erroLivro}
                </p>
              )}

              <footer>
                <button
                  type="button"
                  className="painel-editor-cancelar"
                  onClick={fecharEditorLivro}
                  disabled={salvandoLivro}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoLivro}
                >
                  {salvandoLivro
                    ? 'Salvando...'
                    : 'Salvar livro'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {editorPaginaAberto && (
        <div
          className="livro-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharEditorPagina()
            }
          }}
          role="presentation"
        >
          <section className="livro-modal">
            <header>
              <div>
                <p>Editor de página</p>
                <h2>
                  {formularioPagina.id
                    ? 'Editar página'
                    : 'Nova página'}
                </h2>
                <span>
                  Altere título, conteúdo, imagem e ordem.
                </span>
              </div>

              <button
                type="button"
                onClick={fecharEditorPagina}
                disabled={salvandoPagina}
              >
                ✕ Fechar
              </button>
            </header>

            <form
              className="livro-formulario"
              onSubmit={salvarPagina}
            >
              <div className="livro-formulario-linha">
                <label>
                  <span>Número</span>
                  <input
                    type="number"
                    min="1"
                    value={formularioPagina.numero}
                    onChange={(event) =>
                      atualizarCampoPagina(
                        'numero',
                        event.target.value,
                      )
                    }
                    disabled={salvandoPagina}
                  />
                </label>

                <label>
                  <span>Título</span>
                  <input
                    type="text"
                    value={formularioPagina.titulo}
                    onChange={(event) =>
                      atualizarCampoPagina(
                        'titulo',
                        event.target.value,
                      )
                    }
                    disabled={salvandoPagina}
                  />
                </label>
              </div>

              <label>
                <span>Conteúdo</span>
                <textarea
                  value={formularioPagina.conteudo}
                  onChange={(event) =>
                    atualizarCampoPagina(
                      'conteudo',
                      event.target.value,
                    )
                  }
                  rows={12}
                  disabled={salvandoPagina}
                />
              </label>

              <label>
                <span>URL ou caminho da imagem</span>
                <input
                  type="text"
                  value={formularioPagina.imagem_url}
                  onChange={(event) =>
                    atualizarCampoPagina(
                      'imagem_url',
                      event.target.value,
                    )
                  }
                  placeholder="/assets/livros/imagem.png"
                  disabled={salvandoPagina}
                />
              </label>

              {formularioPagina.imagem_url && (
                <div className="livro-pagina-imagem-preview">
                  <img
                    src={normalizarUrl(
                      formularioPagina.imagem_url,
                    )}
                    alt="Prévia da página"
                  />
                </div>
              )}

              {erroPagina && (
                <p className="livro-editor-erro">
                  {erroPagina}
                </p>
              )}

              <footer>
                <button
                  type="button"
                  className="painel-editor-cancelar"
                  onClick={fecharEditorPagina}
                  disabled={salvandoPagina}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoPagina}
                >
                  {salvandoPagina
                    ? 'Salvando...'
                    : 'Salvar página'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {livroPreview && (
        <div
          className="livro-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewLivroId(null)
            }
          }}
          role="presentation"
        >
          <section className="livro-modal livro-preview-modal">
            <header>
              <div>
                <p>Pré-visualização</p>
                <h2>{livroPreview.titulo}</h2>
                <span>
                  Visualização interna do conteúdo do livro.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPreviewLivroId(null)}
              >
                ✕ Fechar
              </button>
            </header>

            <div className="livro-preview">
              {livroPreview.capa_url && (
                <img
                  className="livro-preview-capa"
                  src={normalizarUrl(
                    livroPreview.capa_url,
                  )}
                  alt={`Capa de ${livroPreview.titulo}`}
                />
              )}

              <div className="livro-preview-introducao">
                <small>
                  {livroPreview.categoria ||
                    'Sem categoria'}
                </small>
                <h1>{livroPreview.titulo}</h1>
                <p>
                  {livroPreview.autor ||
                    'Autor não informado'}
                </p>
                <span>
                  {livroPreview.descricao}
                </span>
              </div>

              {livroPreview.paginas.length === 0 ? (
                <p className="painel-professor-vazio">
                  Este livro ainda não possui páginas.
                </p>
              ) : (
                <div className="livro-preview-paginas">
                  {livroPreview.paginas.map((pagina) => (
                    <article key={pagina.id}>
                      <small>
                        Página {pagina.numero}
                      </small>
                      <h2>{pagina.titulo}</h2>

                      {pagina.imagem_url && (
                        <img
                          src={normalizarUrl(
                            pagina.imagem_url,
                          )}
                          alt={pagina.titulo}
                        />
                      )}

                      <p>{pagina.conteudo}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
