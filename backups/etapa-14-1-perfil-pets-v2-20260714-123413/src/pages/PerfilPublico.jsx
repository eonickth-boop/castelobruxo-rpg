import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/perfil-publico.css'

const configuracaoInicial = {
  bio: '',
  titulo: '',
  banner_url: '',
  perfil_visivel: true,
  mostrar_xp: true,
  mostrar_nivel: true,
  mostrar_tribo: true,
  mostrar_ano: true,
  mostrar_diario: true,
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
  if (!data) return 'Data não informada'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(data))
}

function gerarCodigoAluno(id) {
  if (!id) return 'CB-000000'
  return `CB-${id.replaceAll('-', '').slice(0, 6).toUpperCase()}`
}

const tiposDiario = {
  anotacao: '📝 Anotação',
  registro: '📸 Registro',
  descoberta: '🌿 Descoberta',
  memoria: '⭐ Memória',
  pesquisa: '🧪 Pesquisa',
  observacao: '🦉 Observação',
}

function interpretarEntrada(conteudo) {
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
    // Conteúdo antigo em texto puro continua funcionando.
  }

  return {
    texto: conteudo || '',
    tipo: 'anotacao',
  }
}

function calcularDiasDesde(data) {
  if (!data) return 0

  const inicio = new Date(data).getTime()
  const agora = Date.now()

  if (!Number.isFinite(inicio)) return 0

  return Math.max(
    0,
    Math.floor((agora - inicio) / 86400000),
  )
}

function interpretarConteudo(conteudo) {
  try {
    const dados = JSON.parse(conteudo)

    if (
      dados &&
      typeof dados === 'object' &&
      typeof dados.texto === 'string'
    ) {
      return dados.texto
    }
  } catch {
    // Conteúdo antigo em texto puro continua funcionando.
  }

  return conteudo || ''
}

export default function PerfilPublico({
  perfil,
  onVoltar,
}) {
  const [configuracao, setConfiguracao] =
    useState(configuracaoInicial)
  const [diarioPublico, setDiarioPublico] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [entradaAberta, setEntradaAberta] = useState(null)

  const [aba, setAba] = useState('meu-perfil')
  const [perfis, setPerfis] = useState([])
  const [configuracoes, setConfiguracoes] = useState([])
  const [pesquisa, setPesquisa] = useState('')
  const [triboFiltro, setTriboFiltro] = useState('todas')
  const [anoFiltro, setAnoFiltro] = useState('todos')
  const [perfilVisitado, setPerfilVisitado] = useState(null)
  const [configVisitada, setConfigVisitada] = useState(null)
  const [diarioVisitado, setDiarioVisitado] = useState([])
  const [carregandoVisita, setCarregandoVisita] =
    useState(false)

  useEffect(() => {
    carregarTudo()
  }, [perfil?.id])

  async function carregarTudo() {
    if (!perfil?.id) return

    setCarregando(true)
    setMensagem('')

    const [
      respostaConfiguracao,
      respostaDiario,
      respostaPerfis,
      respostaConfiguracoes,
    ] = await Promise.all([
      supabase
        .from('config_perfil_publico')
        .select('*')
        .eq('usuario_id', perfil.id)
        .maybeSingle(),

      supabase
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
        .eq('privado', false)
        .order('atualizado_em', { ascending: false }),

      supabase
        .from('perfis')
        .select(`
          id,
          usuario,
          nome_personagem,
          tribo,
          ano,
          nivel,
          xp,
          avatar_url,
          ativo,
          criado_em
        `)
        .eq('ativo', true)
        .order('nome_personagem', { ascending: true }),

      supabase
        .from('config_perfil_publico')
        .select('*')
        .eq('perfil_visivel', true),
    ])

    if (respostaConfiguracao.error) {
      console.error(
        'Erro ao carregar configuração pública:',
        respostaConfiguracao.error,
      )
      setMensagem(
        'Não foi possível carregar as configurações do perfil.',
      )
    }

    if (respostaDiario.error) {
      console.error(
        'Erro ao carregar diário público:',
        respostaDiario.error,
      )
    }

    if (respostaPerfis.error) {
      console.error(
        'Erro ao carregar personagens:',
        respostaPerfis.error,
      )
    }

    if (respostaConfiguracoes.error) {
      console.error(
        'Erro ao carregar perfis públicos:',
        respostaConfiguracoes.error,
      )
    }

    setConfiguracao({
      ...configuracaoInicial,
      ...(respostaConfiguracao.data ?? {}),
    })

    setDiarioPublico(respostaDiario.data ?? [])
    setPerfis(respostaPerfis.data ?? [])
    setConfiguracoes(respostaConfiguracoes.data ?? [])
    setCarregando(false)
  }

  const perfisPublicos = useMemo(() => {
    const mapaConfiguracoes = new Map(
      configuracoes.map((item) => [
        item.usuario_id,
        item,
      ]),
    )

    return perfis
      .map((item) => ({
        perfil: item,
        configuracao: mapaConfiguracoes.get(item.id),
      }))
      .filter(
        (item) =>
          item.perfil.id === perfil.id ||
          item.configuracao?.perfil_visivel === true,
      )
  }, [perfis, configuracoes, perfil.id])

  const tribosDisponiveis = useMemo(
    () =>
      [
        ...new Set(
          perfisPublicos
            .map((item) => item.perfil.tribo)
            .filter(Boolean),
        ),
      ].sort(),
    [perfisPublicos],
  )

  const anosDisponiveis = useMemo(
    () =>
      [
        ...new Set(
          perfisPublicos
            .map((item) => Number(item.perfil.ano))
            .filter(Number.isFinite),
        ),
      ].sort((a, b) => a - b),
    [perfisPublicos],
  )

  const resultados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()

    return perfisPublicos.filter((item) => {
      const correspondePesquisa =
        !termo ||
        item.perfil.nome_personagem
          ?.toLowerCase()
          .includes(termo) ||
        item.perfil.usuario
          ?.toLowerCase()
          .includes(termo) ||
        item.configuracao?.titulo
          ?.toLowerCase()
          .includes(termo)

      const correspondeTribo =
        triboFiltro === 'todas' ||
        item.perfil.tribo === triboFiltro

      const correspondeAno =
        anoFiltro === 'todos' ||
        Number(item.perfil.ano) === Number(anoFiltro)

      return (
        correspondePesquisa &&
        correspondeTribo &&
        correspondeAno
      )
    })
  }, [
    perfisPublicos,
    pesquisa,
    triboFiltro,
    anoFiltro,
  ])

  function atualizarCampo(campo, valor) {
    setConfiguracao((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }))
  }

  async function salvarConfiguracao(event) {
    event.preventDefault()

    setSalvando(true)
    setMensagem('')

    const dados = {
      usuario_id: perfil.id,
      bio: configuracao.bio.trim(),
      titulo: configuracao.titulo.trim(),
      banner_url: configuracao.banner_url.trim(),
      perfil_visivel: Boolean(
        configuracao.perfil_visivel,
      ),
      mostrar_xp: Boolean(configuracao.mostrar_xp),
      mostrar_nivel: Boolean(
        configuracao.mostrar_nivel,
      ),
      mostrar_tribo: Boolean(
        configuracao.mostrar_tribo,
      ),
      mostrar_ano: Boolean(
        configuracao.mostrar_ano,
      ),
      mostrar_diario: Boolean(
        configuracao.mostrar_diario,
      ),
      atualizado_em: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('config_perfil_publico')
      .upsert(dados, {
        onConflict: 'usuario_id',
      })
      .select('*')
      .single()

    if (error) {
      console.error(
        'Erro ao salvar perfil público:',
        error,
      )
      setMensagem(
        'Não foi possível salvar as configurações.',
      )
      setSalvando(false)
      return
    }

    setConfiguracao({
      ...configuracaoInicial,
      ...data,
    })

    setConfiguracoes((estadoAtual) => {
      const existe = estadoAtual.some(
        (item) => item.usuario_id === data.usuario_id,
      )

      if (existe) {
        return estadoAtual.map((item) =>
          item.usuario_id === data.usuario_id
            ? data
            : item,
        )
      }

      return [...estadoAtual, data]
    })

    setModoEdicao(false)
    setMensagem(
      'Perfil público atualizado com sucesso.',
    )
    setSalvando(false)
  }

  async function abrirPerfilVisitado(item) {
    if (item.perfil.id === perfil.id) {
      setAba('meu-perfil')
      setPerfilVisitado(null)
      return
    }

    setCarregandoVisita(true)
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
      .eq('usuario_id', item.perfil.id)
      .eq('privado', false)
      .order('atualizado_em', { ascending: false })

    if (error) {
      console.error(
        'Erro ao carregar diário visitado:',
        error,
      )
    }

    setPerfilVisitado(item.perfil)
    setConfigVisitada({
      ...configuracaoInicial,
      ...(item.configuracao ?? {}),
    })
    setDiarioVisitado(data ?? [])
    setAba('visualizar')
    setCarregandoVisita(false)
  }

  function renderizarPerfil(
    perfilExibido,
    configExibida,
    diarioExibido,
    proprio,
  ) {
    const banner = normalizarUrl(
      configExibida.banner_url,
    )
    const avatar = normalizarUrl(
      perfilExibido.avatar_url,
    )
    const nomeExibido =
      perfilExibido.nome_personagem ||
      perfilExibido.usuario

    const entradasPreparadas = diarioExibido.map(
      (entrada) => ({
        ...entrada,
        ...interpretarEntrada(entrada.conteudo),
      }),
    )

    const favoritas = entradasPreparadas.filter(
      (entrada) => entrada.favorito,
    ).length

    const diasNaEscola = calcularDiasDesde(
      perfilExibido.criado_em,
    )

    const atividadeRecente =
      entradasPreparadas.slice(0, 3)

    return (
      <>
        <section className="perfil-vivo">
          <div
            className="perfil-vivo-banner"
            style={
              banner
                ? {
                    backgroundImage: `linear-gradient(
                      rgba(10, 15, 11, 0.18),
                      rgba(10, 15, 11, 0.82)
                    ), url("${banner}")`,
                  }
                : undefined
            }
          />

          <div className="perfil-vivo-cabecalho">
            <div className="perfil-vivo-avatar">
              {avatar ? (
                <img src={avatar} alt={nomeExibido} />
              ) : (
                <span>👤</span>
              )}
            </div>

            <div className="perfil-vivo-identidade">
              <p>Personagem de Castelobruxo</p>
              <h1>{nomeExibido}</h1>
              <span>@{perfilExibido.usuario}</span>

              {configExibida.titulo && (
                <div className="perfil-vivo-titulo">
                  <small>🏅 Título atual</small>
                  <strong>
                    {configExibida.titulo}
                  </strong>
                </div>
              )}
            </div>

            {!proprio && (
              <div className="perfil-vivo-acoes">
                <button
                  type="button"
                  disabled
                  title="Disponível quando a rede social for criada"
                >
                  ☆ Seguir
                </button>

                <button
                  type="button"
                  disabled
                  title="Disponível no Correio Mágico"
                >
                  📬 Enviar Coruja
                </button>
              </div>
            )}
          </div>

          <div className="perfil-vivo-bio">
            <p>
              {configExibida.bio ||
                'Este personagem ainda não escreveu uma biografia pública.'}
            </p>
          </div>

          <div className="perfil-vivo-dados">
            {configExibida.mostrar_tribo && (
              <article>
                <small>Tribo</small>
                <strong>
                  {perfilExibido.tribo ||
                    'Não definida'}
                </strong>
              </article>
            )}

            {configExibida.mostrar_ano && (
              <article>
                <small>Ano</small>
                <strong>
                  {perfilExibido.ano || 1}º
                </strong>
              </article>
            )}

            {configExibida.mostrar_nivel && (
              <article>
                <small>Nível</small>
                <strong>
                  {perfilExibido.nivel || 1}
                </strong>
              </article>
            )}

            {configExibida.mostrar_xp && (
              <article>
                <small>XP</small>
                <strong>
                  {perfilExibido.xp || 0}
                </strong>
              </article>
            )}
          </div>

          <div className="perfil-vivo-estatisticas">
            <article>
              <small>Entradas públicas</small>
              <strong>
                {entradasPreparadas.length}
              </strong>
            </article>

            <article>
              <small>Favoritas</small>
              <strong>{favoritas}</strong>
            </article>

            <article>
              <small>Dias em Castelobruxo</small>
              <strong>{diasNaEscola}</strong>
            </article>
          </div>
        </section>

        <section className="cartao-bruxo">
          <div className="cartao-bruxo-selo">
            <span>CB</span>
          </div>

          <div>
            <p>Credencial oficial</p>
            <h2>Cartão de Bruxo</h2>

            <dl>
              <div>
                <dt>Estudante</dt>
                <dd>{nomeExibido}</dd>
              </div>

              <div>
                <dt>Código</dt>
                <dd>
                  {gerarCodigoAluno(
                    perfilExibido.id,
                  )}
                </dd>
              </div>

              <div>
                <dt>Tribo</dt>
                <dd>
                  {configExibida.mostrar_tribo
                    ? perfilExibido.tribo ||
                      'Não definida'
                    : 'Oculta'}
                </dd>
              </div>

              <div>
                <dt>Ano</dt>
                <dd>
                  {configExibida.mostrar_ano
                    ? `${perfilExibido.ano || 1}º Ano`
                    : 'Oculto'}
                </dd>
              </div>

              <div>
                <dt>Ingresso</dt>
                <dd>
                  {formatarData(
                    perfilExibido.criado_em,
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {proprio && modoEdicao && (
          <section className="perfil-publico-config">
            <div>
              <p>Personalização</p>
              <h2>Configurações do perfil</h2>
            </div>

            <form onSubmit={salvarConfiguracao}>
              <label>
                <span>Título do personagem</span>
                <input
                  type="text"
                  value={configuracao.titulo}
                  onChange={(event) =>
                    atualizarCampo(
                      'titulo',
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Guardião da Floresta"
                  disabled={salvando}
                />
              </label>

              <label>
                <span>Biografia</span>
                <textarea
                  value={configuracao.bio}
                  onChange={(event) =>
                    atualizarCampo(
                      'bio',
                      event.target.value,
                    )
                  }
                  rows={5}
                  placeholder="Conte um pouco sobre o personagem."
                  disabled={salvando}
                />
              </label>

              <label>
                <span>URL ou caminho do banner</span>
                <input
                  type="text"
                  value={configuracao.banner_url}
                  onChange={(event) =>
                    atualizarCampo(
                      'banner_url',
                      event.target.value,
                    )
                  }
                  placeholder="/assets/perfis/banner.png"
                  disabled={salvando}
                />
              </label>

              <div className="perfil-publico-opcoes">
                {[
                  ['perfil_visivel', 'Perfil visível'],
                  ['mostrar_xp', 'Mostrar XP'],
                  ['mostrar_nivel', 'Mostrar nível'],
                  ['mostrar_tribo', 'Mostrar tribo'],
                  ['mostrar_ano', 'Mostrar ano'],
                  [
                    'mostrar_diario',
                    'Mostrar diário público',
                  ],
                ].map(([campo, rotulo]) => (
                  <label key={campo}>
                    <input
                      type="checkbox"
                      checked={Boolean(
                        configuracao[campo],
                      )}
                      onChange={(event) =>
                        atualizarCampo(
                          campo,
                          event.target.checked,
                        )
                      }
                      disabled={salvando}
                    />
                    <span>{rotulo}</span>
                  </label>
                ))}
              </div>

              <footer>
                <button
                  type="button"
                  onClick={() =>
                    setModoEdicao(false)
                  }
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
                    : 'Salvar configurações'}
                </button>
              </footer>
            </form>
          </section>
        )}

        <section className="perfil-timeline">
          <div className="perfil-secao-cabecalho">
            <div>
              <p>Memórias compartilhadas</p>
              <h2>Diário público</h2>
            </div>

            <span>
              {entradasPreparadas.length}{' '}
              {entradasPreparadas.length === 1
                ? 'publicação'
                : 'publicações'}
            </span>
          </div>

          {!configExibida.mostrar_diario ? (
            <p className="perfil-publico-vazio">
              O diário público está oculto.
            </p>
          ) : entradasPreparadas.length === 0 ? (
            <p className="perfil-publico-vazio">
              Nenhuma entrada pública foi compartilhada.
            </p>
          ) : (
            <div className="perfil-timeline-lista">
              {entradasPreparadas.map((entrada) => (
                <article
                  key={entrada.id}
                  className="perfil-timeline-card"
                >
                  <div className="perfil-timeline-topo">
                    <span>
                      {tiposDiario[entrada.tipo] ||
                        tiposDiario.anotacao}
                    </span>

                    {entrada.favorito && (
                      <b>★ Favorita</b>
                    )}
                  </div>

                  <h3>{entrada.titulo}</h3>

                  {entrada.imagem_url && (
                    <img
                      src={normalizarUrl(
                        entrada.imagem_url,
                      )}
                      alt={entrada.titulo}
                    />
                  )}

                  <p>
                    {entrada.texto.length > 280
                      ? `${entrada.texto.slice(
                          0,
                          280,
                        )}...`
                      : entrada.texto}
                  </p>

                  <footer>
                    <small>
                      {entrada.categoria || 'Geral'} ·{' '}
                      {formatarData(
                        entrada.atualizado_em ||
                          entrada.criado_em,
                      )}
                    </small>

                    <button
                      type="button"
                      onClick={() =>
                        setEntradaAberta({
                          ...entrada,
                          conteudoExibido:
                            entrada.texto,
                        })
                      }
                    >
                      Ler completa
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="perfil-vitrine">
          <article>
            <span>🐾</span>
            <h3>Companheiro Mágico</h3>
            <p>
              Nenhum companheiro foi vinculado a este
              personagem.
            </p>
            <button type="button" disabled>
              Sistema de Pets em breve
            </button>
          </article>

          <article>
            <span>🏅</span>
            <h3>Conquistas</h3>
            <p>
              Nenhuma conquista foi desbloqueada ainda.
            </p>
            <div className="perfil-conquistas-vazias">
              <i>★</i>
              <i>🔒</i>
              <i>🔒</i>
            </div>
          </article>

          <article>
            <span>📜</span>
            <h3>Certificados</h3>
            <p>
              Certificados acadêmicos aparecerão nesta
              vitrine.
            </p>
            <button type="button" disabled>
              Nenhum certificado
            </button>
          </article>

          <article>
            <span>📬</span>
            <h3>Correio Mágico</h3>
            <p>
              Cartas poderão ser enviadas diretamente
              deste perfil.
            </p>
            <button type="button" disabled>
              Enviar Coruja em breve
            </button>
          </article>
        </section>

        <section className="perfil-atividade-recente">
          <div className="perfil-secao-cabecalho">
            <div>
              <p>Movimentações do personagem</p>
              <h2>Atividade recente</h2>
            </div>
          </div>

          {atividadeRecente.length === 0 ? (
            <p className="perfil-publico-vazio">
              Nenhuma atividade pública recente.
            </p>
          ) : (
            <div>
              {atividadeRecente.map((entrada) => (
                <article key={entrada.id}>
                  <span>
                    {tiposDiario[entrada.tipo] ||
                      tiposDiario.anotacao}
                  </span>
                  <div>
                    <strong>{entrada.titulo}</strong>
                    <small>
                      Nova entrada pública no diário ·{' '}
                      {formatarData(
                        entrada.atualizado_em ||
                          entrada.criado_em,
                      )}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </>
    )
  }

  if (carregando) {
    return (
      <main className="perfil-publico">
        <p className="perfil-publico-vazio">
          Carregando perfis públicos...
        </p>
      </main>
    )
  }

  return (
    <main className="perfil-publico">
      <div className="perfil-publico-topo-acoes">
        <button type="button" onClick={onVoltar}>
          ← Voltar
        </button>

        <div className="perfil-publico-abas">
          <button
            type="button"
            className={
              aba === 'meu-perfil'
                ? 'perfil-publico-aba-ativa'
                : ''
            }
            onClick={() => {
              setAba('meu-perfil')
              setPerfilVisitado(null)
            }}
          >
            Meu perfil
          </button>

          <button
            type="button"
            className={
              aba === 'explorar'
                ? 'perfil-publico-aba-ativa'
                : ''
            }
            onClick={() => {
              setAba('explorar')
              setPerfilVisitado(null)
            }}
          >
            Explorar personagens
          </button>

          {aba === 'meu-perfil' && (
            <button
              type="button"
              onClick={() =>
                setModoEdicao((estado) => !estado)
              }
            >
              {modoEdicao
                ? 'Fechar configurações'
                : '⚙ Configurar perfil'}
            </button>
          )}
        </div>
      </div>

      {mensagem && (
        <p className="perfil-publico-mensagem">
          {mensagem}
        </p>
      )}

      {aba === 'meu-perfil' &&
        renderizarPerfil(
          perfil,
          configuracao,
          diarioPublico,
          true,
        )}

      {aba === 'explorar' && (
        <section className="perfis-explorar">
          <div className="perfis-explorar-cabecalho">
            <div>
              <p>Comunidade de Castelobruxo</p>
              <h1>Explorar personagens</h1>
              <span>
                Encontre estudantes por nome, tribo ou ano.
              </span>
            </div>
          </div>

          <div className="perfis-explorar-filtros">
            <label>
              <span>Pesquisar</span>
              <input
                type="search"
                value={pesquisa}
                onChange={(event) =>
                  setPesquisa(event.target.value)
                }
                placeholder="Nome, usuário ou título"
              />
            </label>

            <label>
              <span>Tribo</span>
              <select
                value={triboFiltro}
                onChange={(event) =>
                  setTriboFiltro(event.target.value)
                }
              >
                <option value="todas">
                  Todas as tribos
                </option>
                {tribosDisponiveis.map((tribo) => (
                  <option key={tribo} value={tribo}>
                    {tribo}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Ano</span>
              <select
                value={anoFiltro}
                onChange={(event) =>
                  setAnoFiltro(event.target.value)
                }
              >
                <option value="todos">
                  Todos os anos
                </option>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}º ano
                  </option>
                ))}
              </select>
            </label>
          </div>

          {resultados.length === 0 ? (
            <p className="perfil-publico-vazio">
              Nenhum personagem foi encontrado.
            </p>
          ) : (
            <div className="perfis-explorar-grade">
              {resultados.map((item) => {
                const avatar = normalizarUrl(
                  item.perfil.avatar_url,
                )

                return (
                  <article key={item.perfil.id}>
                    <div className="perfil-lista-avatar">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={
                            item.perfil.nome_personagem ||
                            item.perfil.usuario
                          }
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>

                    <div>
                      <small>
                        @{item.perfil.usuario}
                      </small>
                      <h2>
                        {item.perfil.nome_personagem ||
                          item.perfil.usuario}
                      </h2>

                      {item.configuracao?.titulo && (
                        <strong>
                          {item.configuracao.titulo}
                        </strong>
                      )}

                      <p>
                        {item.perfil.tribo ||
                          'Sem tribo'}{' '}
                        · {item.perfil.ano || 1}º ano
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        abrirPerfilVisitado(item)
                      }
                    >
                      Ver perfil
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {aba === 'visualizar' && (
        <>
          <div className="perfil-publico-visita-voltar">
            <button
              type="button"
              onClick={() => setAba('explorar')}
            >
              ← Voltar à pesquisa
            </button>
          </div>

          {carregandoVisita ? (
            <p className="perfil-publico-vazio">
              Carregando personagem...
            </p>
          ) : perfilVisitado && configVisitada ? (
            renderizarPerfil(
              perfilVisitado,
              configVisitada,
              diarioVisitado,
              false,
            )
          ) : (
            <p className="perfil-publico-vazio">
              Não foi possível abrir este perfil.
            </p>
          )}
        </>
      )}

      {entradaAberta && (
        <div
          className="perfil-publico-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEntradaAberta(null)
            }
          }}
          role="presentation"
        >
          <section className="perfil-publico-modal">
            <header>
              <div>
                <p>
                  {entradaAberta.categoria || 'Geral'}
                </p>
                <h2>{entradaAberta.titulo}</h2>
                <span>
                  {formatarData(
                    entradaAberta.atualizado_em ||
                      entradaAberta.criado_em,
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEntradaAberta(null)}
              >
                ✕ Fechar
              </button>
            </header>

            <div>
              {entradaAberta.imagem_url && (
                <img
                  src={normalizarUrl(
                    entradaAberta.imagem_url,
                  )}
                  alt={entradaAberta.titulo}
                />
              )}

              <p>
                {entradaAberta.conteudoExibido ||
                  interpretarConteudo(
                    entradaAberta.conteudo,
                  )}
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
