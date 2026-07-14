import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/diario-personagem.css'

const categorias = [
  'geral',
  'aula',
  'missao',
  'criaturas',
  'plantas',
  'pocoes',
  'magias',
  'amigos',
  'eventos',
  'descobertas',
]

const tipos = [
  'anotacao',
  'registro',
  'descoberta',
  'memoria',
  'pesquisa',
  'observacao',
]

const humores = [
  'tranquilo',
  'feliz',
  'curioso',
  'animado',
  'preocupado',
  'misterioso',
]

const rotulosCategoria = {
  geral: 'Geral',
  aula: 'Aula',
  missao: 'Missão',
  criaturas: 'Criaturas',
  plantas: 'Plantas',
  pocoes: 'Poções',
  magias: 'Magias',
  amigos: 'Amigos',
  eventos: 'Eventos',
  descobertas: 'Descobertas',
}

const rotulosTipo = {
  anotacao: '📝 Anotação',
  registro: '📸 Registro',
  descoberta: '🌿 Descoberta',
  memoria: '⭐ Memória',
  pesquisa: '🧪 Pesquisa',
  observacao: '🦉 Observação',
}

const formularioInicial = {
  id: null,
  titulo: '',
  conteudo: '',
  categoria: 'geral',
  humor: 'tranquilo',
  imagem_url: '',
  favorito: false,
  privado: true,
  tipo: 'anotacao',
}

function formatarData(data) {
  if (!data) return 'Sem data'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(data))
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

function interpretarConteudo(conteudo) {
  try {
    const dados = JSON.parse(conteudo)

    if (
      dados &&
      typeof dados === 'object' &&
      typeof dados.texto === 'string'
    ) {
      return {
        texto: dados.texto,
        tipo: dados.tipo || 'anotacao',
      }
    }
  } catch {
    // Entradas antigas continuam funcionando como texto puro.
  }

  return {
    texto: conteudo || '',
    tipo: 'anotacao',
  }
}

function serializarConteudo(texto, tipo) {
  return JSON.stringify({
    texto,
    tipo,
  })
}

export default function DiarioPersonagem({
  perfil,
  onVoltar,
}) {
  const [entradas, setEntradas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] =
    useState('todas')
  const [somenteFavoritas, setSomenteFavoritas] =
    useState(false)
  const [entradaSelecionadaId, setEntradaSelecionadaId] =
    useState(null)
  const [editorAberto, setEditorAberto] = useState(false)
  const [formulario, setFormulario] =
    useState(formularioInicial)
  const [salvando, setSalvando] = useState(false)
  const [erroEditor, setErroEditor] = useState('')

  useEffect(() => {
    carregarEntradas()
  }, [perfil?.id])

  async function carregarEntradas() {
    if (!perfil?.id) return

    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase
      .from('diario_personagem')
      .select(`
        id,
        usuario_id,
        titulo,
        conteudo,
        categoria,
        humor,
        imagem_url,
        favorito,
        privado,
        criado_em,
        atualizado_em
      `)
      .eq('usuario_id', perfil.id)
      .order('favorito', { ascending: false })
      .order('atualizado_em', { ascending: false })

    if (error) {
      console.error(
        'Erro ao carregar o diário:',
        error,
      )
      setMensagem(
        'Não foi possível carregar o Diário do Personagem.',
      )
      setCarregando(false)
      return
    }

    setEntradas(data ?? [])

    if (
      (data ?? []).length > 0 &&
      !entradaSelecionadaId
    ) {
      setEntradaSelecionadaId(data[0].id)
    }

    setCarregando(false)
  }

  const entradasPreparadas = useMemo(
    () =>
      entradas.map((entrada) => ({
        ...entrada,
        ...interpretarConteudo(entrada.conteudo),
      })),
    [entradas],
  )

  const entradasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()

    return entradasPreparadas.filter((entrada) => {
      const correspondePesquisa =
        !termo ||
        entrada.titulo
          ?.toLowerCase()
          .includes(termo) ||
        entrada.texto
          ?.toLowerCase()
          .includes(termo) ||
        entrada.categoria
          ?.toLowerCase()
          .includes(termo)

      const correspondeCategoria =
        categoriaFiltro === 'todas' ||
        entrada.categoria === categoriaFiltro

      const correspondeFavorito =
        !somenteFavoritas || entrada.favorito

      return (
        correspondePesquisa &&
        correspondeCategoria &&
        correspondeFavorito
      )
    })
  }, [
    entradasPreparadas,
    pesquisa,
    categoriaFiltro,
    somenteFavoritas,
  ])

  const entradaSelecionada =
    entradasPreparadas.find(
      (entrada) =>
        entrada.id === entradaSelecionadaId,
    ) ??
    entradasFiltradas[0] ??
    null

  const ultimaAtualizacao =
    entradasPreparadas[0]?.atualizado_em ||
    entradasPreparadas[0]?.criado_em

  function abrirNovaEntrada() {
    setFormulario(formularioInicial)
    setErroEditor('')
    setEditorAberto(true)
  }

  function abrirEdicao(entrada) {
    setFormulario({
      id: entrada.id,
      titulo: entrada.titulo || '',
      conteudo: entrada.texto || '',
      categoria: entrada.categoria || 'geral',
      humor: entrada.humor || 'tranquilo',
      imagem_url: entrada.imagem_url || '',
      favorito: Boolean(entrada.favorito),
      privado: Boolean(entrada.privado),
      tipo: entrada.tipo || 'anotacao',
    })
    setErroEditor('')
    setEditorAberto(true)
  }

  function fecharEditor() {
    if (salvando) return

    setEditorAberto(false)
    setFormulario(formularioInicial)
    setErroEditor('')
  }

  function atualizarCampo(campo, valor) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }))
  }

  async function salvarEntrada(event) {
    event.preventDefault()

    const titulo = formulario.titulo.trim()
    const texto = formulario.conteudo.trim()

    if (!titulo) {
      setErroEditor('Digite o título da página.')
      return
    }

    if (!texto) {
      setErroEditor('Escreva o conteúdo da página.')
      return
    }

    setSalvando(true)
    setErroEditor('')

    const dados = {
      usuario_id: perfil.id,
      titulo,
      conteudo: serializarConteudo(
        texto,
        formulario.tipo,
      ),
      categoria: formulario.categoria,
      humor: formulario.humor,
      imagem_url: formulario.imagem_url.trim(),
      favorito: Boolean(formulario.favorito),
      privado: Boolean(formulario.privado),
      atualizado_em: new Date().toISOString(),
    }

    let resposta

    if (formulario.id) {
      resposta = await supabase
        .from('diario_personagem')
        .update(dados)
        .eq('id', formulario.id)
        .select('*')
        .single()
    } else {
      resposta = await supabase
        .from('diario_personagem')
        .insert(dados)
        .select('*')
        .single()
    }

    if (resposta.error) {
      console.error(
        'Erro ao salvar página:',
        resposta.error,
      )
      setErroEditor(
        'Não foi possível salvar esta página.',
      )
      setSalvando(false)
      return
    }

    setEntradas((estadoAtual) => {
      const existe = estadoAtual.some(
        (entrada) =>
          entrada.id === resposta.data.id,
      )

      if (existe) {
        return estadoAtual.map((entrada) =>
          entrada.id === resposta.data.id
            ? resposta.data
            : entrada,
        )
      }

      return [resposta.data, ...estadoAtual]
    })

    setEntradaSelecionadaId(resposta.data.id)
    setMensagem(
      formulario.id
        ? 'Página atualizada com sucesso.'
        : 'Nova página adicionada ao diário.',
    )
    setSalvando(false)
    fecharEditor()
  }

  async function alternarFavorito(entrada) {
    const novoValor = !entrada.favorito

    const { data, error } = await supabase
      .from('diario_personagem')
      .update({
        favorito: novoValor,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', entrada.id)
      .select('*')
      .single()

    if (error) {
      console.error(
        'Erro ao favoritar página:',
        error,
      )
      setMensagem(
        'Não foi possível alterar o favorito.',
      )
      return
    }

    setEntradas((estadoAtual) =>
      estadoAtual.map((item) =>
        item.id === data.id ? data : item,
      ),
    )
  }

  async function excluirEntrada(entrada) {
    const confirmou = window.confirm(
      `Deseja excluir a página "${entrada.titulo}"?`,
    )

    if (!confirmou) return

    const { error } = await supabase
      .from('diario_personagem')
      .delete()
      .eq('id', entrada.id)

    if (error) {
      console.error(
        'Erro ao excluir página:',
        error,
      )
      setMensagem(
        'Não foi possível excluir esta página.',
      )
      return
    }

    const restantes = entradas.filter(
      (item) => item.id !== entrada.id,
    )

    setEntradas(restantes)
    setEntradaSelecionadaId(
      restantes[0]?.id ?? null,
    )
    setMensagem('Página excluída.')
  }

  return (
    <main className="diario-personagem">
      <button
        type="button"
        className="diario-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="diario-hero">
        <p>Livro de memórias</p>
        <h1>
          Diário de{' '}
          {perfil.nome_personagem || perfil.usuario}
        </h1>
        <span>
          Toda magia deixa uma história.
        </span>

        <div className="diario-resumo">
          <article>
            <small>Páginas escritas</small>
            <strong>{entradas.length}</strong>
          </article>
          <article>
            <small>Favoritas</small>
            <strong>
              {
                entradas.filter(
                  (entrada) => entrada.favorito,
                ).length
              }
            </strong>
          </article>
          <article>
            <small>Última escrita</small>
            <strong className="diario-resumo-data">
              {ultimaAtualizacao
                ? formatarData(ultimaAtualizacao)
                : 'Nenhuma'}
            </strong>
          </article>
        </div>
      </header>

      {mensagem && (
        <p className="diario-mensagem">
          {mensagem}
        </p>
      )}

      <section className="diario-livro">
        <aside className="diario-indice">
          <div className="diario-indice-topo">
            <div>
              <small>Índice</small>
              <h2>Minhas páginas</h2>
            </div>

            <button
              type="button"
              onClick={abrirNovaEntrada}
            >
              ＋ Nova
            </button>
          </div>

          <label className="diario-pesquisa">
            <span>Pesquisar</span>
            <input
              type="search"
              value={pesquisa}
              onChange={(event) =>
                setPesquisa(event.target.value)
              }
              placeholder="Título ou conteúdo"
            />
          </label>

          <div className="diario-filtros">
            <select
              value={categoriaFiltro}
              onChange={(event) =>
                setCategoriaFiltro(
                  event.target.value,
                )
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
                  {rotulosCategoria[categoria]}
                </option>
              ))}
            </select>

            <label>
              <input
                type="checkbox"
                checked={somenteFavoritas}
                onChange={(event) =>
                  setSomenteFavoritas(
                    event.target.checked,
                  )
                }
              />
              <span>Somente favoritas</span>
            </label>
          </div>

          {carregando ? (
            <p className="diario-vazio">
              Carregando páginas...
            </p>
          ) : entradasFiltradas.length === 0 ? (
            <p className="diario-vazio">
              Nenhuma página encontrada.
            </p>
          ) : (
            <div className="diario-lista">
              {entradasFiltradas.map((entrada) => (
                <button
                  key={entrada.id}
                  type="button"
                  className={
                    entradaSelecionada?.id ===
                    entrada.id
                      ? 'diario-lista-item diario-lista-item-ativo'
                      : 'diario-lista-item'
                  }
                  onClick={() =>
                    setEntradaSelecionadaId(
                      entrada.id,
                    )
                  }
                >
                  <div>
                    <span>
                      {entrada.favorito
                        ? '⭐'
                        : '📄'}
                    </span>
                    <strong>{entrada.titulo}</strong>
                  </div>

                  <small>
                    {rotulosCategoria[
                      entrada.categoria
                    ] || 'Geral'}{' '}
                    ·{' '}
                    {new Date(
                      entrada.atualizado_em ||
                        entrada.criado_em,
                    ).toLocaleDateString('pt-BR')}
                  </small>
                </button>
              ))}
            </div>
          )}
        </aside>

        <article className="diario-pagina">
          {!entradaSelecionada ? (
            <div className="diario-pagina-vazia">
              <span>📖</span>
              <h2>Seu diário está esperando</h2>
              <p>
                Crie a primeira página para registrar
                uma memória, descoberta ou pesquisa.
              </p>
              <button
                type="button"
                onClick={abrirNovaEntrada}
              >
                Escrever primeira página
              </button>
            </div>
          ) : (
            <>
              <header className="diario-pagina-cabecalho">
                <div>
                  <small>
                    {rotulosTipo[
                      entradaSelecionada.tipo
                    ] || rotulosTipo.anotacao}
                  </small>
                  <h2>
                    {entradaSelecionada.titulo}
                  </h2>
                  <p>
                    {rotulosCategoria[
                      entradaSelecionada.categoria
                    ] || 'Geral'}{' '}
                    · Humor:{' '}
                    {entradaSelecionada.humor ||
                      'tranquilo'}{' '}
                    ·{' '}
                    {entradaSelecionada.privado
                      ? 'Privada'
                      : 'Pública'}
                  </p>
                </div>

                <button
                  type="button"
                  className="diario-favorito"
                  onClick={() =>
                    alternarFavorito(
                      entradaSelecionada,
                    )
                  }
                >
                  {entradaSelecionada.favorito
                    ? '★ Favorita'
                    : '☆ Favoritar'}
                </button>
              </header>

              <p className="diario-pagina-data">
                {formatarData(
                  entradaSelecionada.atualizado_em ||
                    entradaSelecionada.criado_em,
                )}
              </p>

              {entradaSelecionada.imagem_url && (
                <img
                  className="diario-pagina-imagem"
                  src={normalizarUrl(
                    entradaSelecionada.imagem_url,
                  )}
                  alt={entradaSelecionada.titulo}
                />
              )}

              <div className="diario-pagina-texto">
                {entradaSelecionada.texto}
              </div>

              <footer className="diario-pagina-acoes">
                <button
                  type="button"
                  onClick={() =>
                    abrirEdicao(
                      entradaSelecionada,
                    )
                  }
                >
                  ✏ Editar
                </button>

                <button
                  type="button"
                  className="diario-excluir"
                  onClick={() =>
                    excluirEntrada(
                      entradaSelecionada,
                    )
                  }
                >
                  🗑 Excluir
                </button>
              </footer>
            </>
          )}
        </article>
      </section>

      {editorAberto && (
        <div
          className="diario-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharEditor()
            }
          }}
          role="presentation"
        >
          <section
            className="diario-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <p>Editor do diário</p>
                <h2>
                  {formulario.id
                    ? 'Editar página'
                    : 'Nova página'}
                </h2>
                <span>
                  Registre um acontecimento da jornada.
                </span>
              </div>

              <button
                type="button"
                onClick={fecharEditor}
                disabled={salvando}
              >
                ✕ Fechar
              </button>
            </header>

            <form
              className="diario-formulario"
              onSubmit={salvarEntrada}
            >
              <label>
                <span>Título</span>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={(event) =>
                    atualizarCampo(
                      'titulo',
                      event.target.value,
                    )
                  }
                  disabled={salvando}
                />
              </label>

              <div className="diario-formulario-linha">
                <label>
                  <span>Tipo</span>
                  <select
                    value={formulario.tipo}
                    onChange={(event) =>
                      atualizarCampo(
                        'tipo',
                        event.target.value,
                      )
                    }
                    disabled={salvando}
                  >
                    {tipos.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {rotulosTipo[tipo]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Categoria</span>
                  <select
                    value={formulario.categoria}
                    onChange={(event) =>
                      atualizarCampo(
                        'categoria',
                        event.target.value,
                      )
                    }
                    disabled={salvando}
                  >
                    {categorias.map((categoria) => (
                      <option
                        key={categoria}
                        value={categoria}
                      >
                        {rotulosCategoria[categoria]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Humor</span>
                  <select
                    value={formulario.humor}
                    onChange={(event) =>
                      atualizarCampo(
                        'humor',
                        event.target.value,
                      )
                    }
                    disabled={salvando}
                  >
                    {humores.map((humor) => (
                      <option
                        key={humor}
                        value={humor}
                      >
                        {humor}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Conteúdo</span>
                <textarea
                  value={formulario.conteudo}
                  onChange={(event) =>
                    atualizarCampo(
                      'conteudo',
                      event.target.value,
                    )
                  }
                  rows={12}
                  disabled={salvando}
                />
              </label>

              <label>
                <span>URL ou caminho da imagem</span>
                <input
                  type="text"
                  value={formulario.imagem_url}
                  onChange={(event) =>
                    atualizarCampo(
                      'imagem_url',
                      event.target.value,
                    )
                  }
                  placeholder="/assets/diario/imagem.png"
                  disabled={salvando}
                />
              </label>

              {formulario.imagem_url && (
                <div className="diario-imagem-preview">
                  <img
                    src={normalizarUrl(
                      formulario.imagem_url,
                    )}
                    alt="Prévia da página"
                  />
                </div>
              )}

              <div className="diario-opcoes">
                <label>
                  <input
                    type="checkbox"
                    checked={formulario.favorito}
                    onChange={(event) =>
                      atualizarCampo(
                        'favorito',
                        event.target.checked,
                      )
                    }
                    disabled={salvando}
                  />
                  <span>Marcar como favorita</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formulario.privado}
                    onChange={(event) =>
                      atualizarCampo(
                        'privado',
                        event.target.checked,
                      )
                    }
                    disabled={salvando}
                  />
                  <span>
                    Página privada
                  </span>
                </label>
              </div>

              {erroEditor && (
                <p className="diario-editor-erro">
                  {erroEditor}
                </p>
              )}

              <footer>
                <button
                  type="button"
                  className="diario-cancelar"
                  onClick={fecharEditor}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar página'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
