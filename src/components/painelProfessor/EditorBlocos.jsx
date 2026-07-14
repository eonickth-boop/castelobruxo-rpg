import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import ModalTipoBloco from './ModalTipoBloco'

const BUCKET_IMAGENS = 'aulas-imagens'

const TIPOS_IMAGEM_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024

const configuracoesTipos = {
  texto: {
    icone: '📄',
    titulo: 'Bloco de texto',
  },
  imagem: {
    icone: '🖼️',
    titulo: 'Bloco de imagem',
  },
  dica: {
    icone: '💡',
    titulo: 'Bloco de dica',
  },
  curiosidade: {
    icone: '📜',
    titulo: 'Bloco de curiosidade',
  },
  aviso: {
    icone: '⚠️',
    titulo: 'Bloco de aviso',
  },
  separador: {
    icone: '➖',
    titulo: 'Separador',
  },
}

function interpretarJson(conteudo, valoresPadrao = {}) {
  try {
    return {
      ...valoresPadrao,
      ...JSON.parse(conteudo ?? '{}'),
    }
  } catch {
    return valoresPadrao
  }
}

function interpretarImagem(conteudo) {
  return interpretarJson(conteudo, {
    url: '',
    legenda: '',
    caminho: '',
  })
}

function interpretarCaixa(conteudo) {
  return interpretarJson(conteudo, {
    titulo: '',
    texto: '',
  })
}

function criarNomeSeguro(nomeArquivo) {
  const nomeNormalizado = nomeArquivo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')

  return nomeNormalizado || 'imagem-aula'
}

function criarIdentificador() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function ordenarBlocos(blocos) {
  return [...blocos].sort(
    (blocoA, blocoB) =>
      Number(blocoA.ordem) - Number(blocoB.ordem),
  )
}

export default function EditorBlocos({ aulaId }) {
  const [blocos, setBlocos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvandoId, setSalvandoId] = useState(null)
  const [seletorAberto, setSeletorAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [blocosRecolhidos, setBlocosRecolhidos] = useState(
    new Set(),
  )

  const blocosOrdenados = useMemo(
    () => ordenarBlocos(blocos),
    [blocos],
  )

  useEffect(() => {
    carregarBlocos()
  }, [aulaId])

  async function carregarBlocos() {
    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase
      .from('aula_blocos')
      .select(`
        id,
        aula_id,
        tipo,
        conteudo,
        ordem,
        criado_em,
        atualizado_em
      `)
      .eq('aula_id', aulaId)
      .order('ordem', { ascending: true })

    if (error) {
      console.error('Erro ao carregar blocos:', error)
      setMensagem(
        'Não foi possível carregar o conteúdo da aula.',
      )
      setBlocos([])
      setCarregando(false)
      return
    }

    setBlocos(data ?? [])
    setCarregando(false)
  }

  function obterProximaOrdem() {
    if (blocos.length === 0) {
      return 1
    }

    return (
      Math.max(
        ...blocos.map(
          (bloco) => Number(bloco.ordem) || 0,
        ),
      ) + 1
    )
  }

  function atualizarConteudo(blocoId, conteudo) {
    setBlocos((blocosAtuais) =>
      blocosAtuais.map((bloco) =>
        bloco.id === blocoId
          ? { ...bloco, conteudo }
          : bloco,
      ),
    )
  }

  function atualizarCampoJson(
    blocoId,
    interpretar,
    campo,
    valor,
  ) {
    setBlocos((blocosAtuais) =>
      blocosAtuais.map((bloco) => {
        if (bloco.id !== blocoId) {
          return bloco
        }

        return {
          ...bloco,
          conteudo: JSON.stringify({
            ...interpretar(bloco.conteudo),
            [campo]: valor,
          }),
        }
      }),
    )
  }

  function alternarRecolhido(blocoId) {
    setBlocosRecolhidos((estadoAtual) => {
      const novoEstado = new Set(estadoAtual)

      if (novoEstado.has(blocoId)) {
        novoEstado.delete(blocoId)
      } else {
        novoEstado.add(blocoId)
      }

      return novoEstado
    })
  }

  function fecharSeletor() {
    if (salvandoId === 'novo') {
      return
    }

    setSeletorAberto(false)
    setMensagem('')
  }

  async function inserirBloco(tipo, conteudo, ordem) {
    const { data, error } = await supabase
      .from('aula_blocos')
      .insert({
        aula_id: aulaId,
        tipo,
        conteudo,
        ordem: ordem ?? obterProximaOrdem(),
      })
      .select(`
        id,
        aula_id,
        tipo,
        conteudo,
        ordem,
        criado_em,
        atualizado_em
      `)
      .single()

    return { data, error }
  }

  async function adicionarBloco({
    tipo,
    texto,
    titulo,
    arquivo,
    legenda,
  }) {
    setMensagem('')
    setSalvandoId('novo')

    if (tipo === 'texto') {
      const textoLimpo = texto.trim()

      if (!textoLimpo) {
        setMensagem(
          'Digite algum conteúdo antes de adicionar o bloco.',
        )
        setSalvandoId(null)
        return false
      }

      const { data, error } = await inserirBloco(
        'texto',
        textoLimpo,
      )

      return finalizarCriacao(data, error, 'texto')
    }

    if (
      tipo === 'dica' ||
      tipo === 'curiosidade' ||
      tipo === 'aviso'
    ) {
      const textoLimpo = texto.trim()

      if (!textoLimpo) {
        setMensagem(
          'Digite o conteúdo do bloco antes de adicionar.',
        )
        setSalvandoId(null)
        return false
      }

      const conteudo = JSON.stringify({
        titulo: titulo.trim(),
        texto: textoLimpo,
      })

      const { data, error } = await inserirBloco(
        tipo,
        conteudo,
      )

      return finalizarCriacao(data, error, tipo)
    }

    if (tipo === 'separador') {
      const { data, error } = await inserirBloco(
        'separador',
        '{}',
      )

      return finalizarCriacao(
        data,
        error,
        'separador',
      )
    }

    if (tipo === 'imagem') {
      const resultado = await enviarImagem({
        arquivo,
        legenda,
      })

      setSalvandoId(null)
      return resultado
    }

    setMensagem('Tipo de bloco não reconhecido.')
    setSalvandoId(null)
    return false
  }

  function finalizarCriacao(data, error, tipo) {
    if (error) {
      console.error(
        `Erro ao criar bloco ${tipo}:`,
        error,
      )
      setMensagem(
        'Não foi possível adicionar o novo bloco.',
      )
      setSalvandoId(null)
      return false
    }

    setBlocos((blocosAtuais) =>
      ordenarBlocos([...blocosAtuais, data]),
    )

    setSeletorAberto(false)
    setMensagem('Bloco adicionado com sucesso.')
    setSalvandoId(null)
    return true
  }

  async function enviarImagem({ arquivo, legenda }) {
    if (!arquivo) {
      setMensagem('Selecione uma imagem.')
      setSalvandoId(null)
      return false
    }

    if (!TIPOS_IMAGEM_PERMITIDOS.includes(arquivo.type)) {
      setMensagem(
        'Use uma imagem JPG, PNG, WEBP ou GIF.',
      )
      setSalvandoId(null)
      return false
    }

    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
      setMensagem(
        'A imagem precisa ter no máximo 5 MB.',
      )
      setSalvandoId(null)
      return false
    }

    const nomeSeguro = criarNomeSeguro(arquivo.name)
    const caminho = `${aulaId}/${criarIdentificador()}-${nomeSeguro}`

    const { error: erroUpload } = await supabase.storage
      .from(BUCKET_IMAGENS)
      .upload(caminho, arquivo, {
        cacheControl: '3600',
        upsert: false,
        contentType: arquivo.type,
      })

    if (erroUpload) {
      console.error(
        'Erro ao enviar imagem:',
        erroUpload,
      )
      setMensagem(
        'Não foi possível enviar a imagem ao Storage.',
      )
      return false
    }

    const { data: dadosUrl } = supabase.storage
      .from(BUCKET_IMAGENS)
      .getPublicUrl(caminho)

    const urlPublica = dadosUrl?.publicUrl

    if (!urlPublica) {
      await supabase.storage
        .from(BUCKET_IMAGENS)
        .remove([caminho])

      setMensagem(
        'A URL pública da imagem não pôde ser criada.',
      )
      return false
    }

    const conteudoImagem = JSON.stringify({
      url: urlPublica,
      legenda: legenda.trim(),
      caminho,
    })

    const { data, error } = await inserirBloco(
      'imagem',
      conteudoImagem,
    )

    if (error) {
      console.error(
        'Erro ao criar bloco de imagem:',
        error,
      )

      await supabase.storage
        .from(BUCKET_IMAGENS)
        .remove([caminho])

      setMensagem(
        'A imagem foi enviada, mas o bloco não pôde ser criado.',
      )
      return false
    }

    setBlocos((blocosAtuais) =>
      ordenarBlocos([...blocosAtuais, data]),
    )

    setSeletorAberto(false)
    setMensagem('Bloco de imagem adicionado.')
    return true
  }

  async function salvarBloco(bloco) {
    let conteudoParaSalvar = bloco.conteudo

    if (bloco.tipo === 'texto') {
      conteudoParaSalvar = bloco.conteudo?.trim()

      if (!conteudoParaSalvar) {
        setMensagem(
          'O bloco de texto não pode ficar vazio.',
        )
        return
      }
    }

    if (
      bloco.tipo === 'dica' ||
      bloco.tipo === 'curiosidade' ||
      bloco.tipo === 'aviso'
    ) {
      const caixa = interpretarCaixa(bloco.conteudo)

      if (!caixa.texto.trim()) {
        setMensagem(
          'O conteúdo deste bloco não pode ficar vazio.',
        )
        return
      }

      conteudoParaSalvar = JSON.stringify({
        titulo: caixa.titulo.trim(),
        texto: caixa.texto.trim(),
      })
    }

    if (bloco.tipo === 'imagem') {
      const imagem = interpretarImagem(bloco.conteudo)

      if (!imagem.url) {
        setMensagem(
          'Este bloco não possui uma imagem válida.',
        )
        return
      }

      conteudoParaSalvar = JSON.stringify({
        ...imagem,
        legenda: imagem.legenda.trim(),
      })
    }

    if (bloco.tipo === 'separador') {
      conteudoParaSalvar = '{}'
    }

    setMensagem('')
    setSalvandoId(bloco.id)

    const { data, error } = await supabase
      .from('aula_blocos')
      .update({
        conteudo: conteudoParaSalvar,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', bloco.id)
      .select(`
        id,
        aula_id,
        tipo,
        conteudo,
        ordem,
        criado_em,
        atualizado_em
      `)
      .single()

    if (error) {
      console.error('Erro ao salvar bloco:', error)
      setMensagem('Não foi possível salvar o bloco.')
      setSalvandoId(null)
      return
    }

    setBlocos((blocosAtuais) =>
      blocosAtuais.map((item) =>
        item.id === data.id ? data : item,
      ),
    )

    setMensagem('Bloco salvo com sucesso.')
    setSalvandoId(null)
  }

  async function excluirBloco(bloco) {
    const confirmou = window.confirm(
      'Deseja realmente excluir este bloco?',
    )

    if (!confirmou) {
      return
    }

    setMensagem('')
    setSalvandoId(bloco.id)

    const { error } = await supabase
      .from('aula_blocos')
      .delete()
      .eq('id', bloco.id)

    if (error) {
      console.error('Erro ao excluir bloco:', error)
      setMensagem('Não foi possível excluir o bloco.')
      setSalvandoId(null)
      return
    }

    if (bloco.tipo === 'imagem') {
      const imagem = interpretarImagem(bloco.conteudo)

      if (imagem.caminho) {
        const { error: erroImagem } =
          await supabase.storage
            .from(BUCKET_IMAGENS)
            .remove([imagem.caminho])

        if (erroImagem) {
          console.error(
            'O bloco foi excluído, mas a imagem permaneceu no Storage:',
            erroImagem,
          )
        }
      }
    }

    setBlocos((blocosAtuais) =>
      blocosAtuais.filter(
        (item) => item.id !== bloco.id,
      ),
    )

    setBlocosRecolhidos((estadoAtual) => {
      const novoEstado = new Set(estadoAtual)
      novoEstado.delete(bloco.id)
      return novoEstado
    })

    setMensagem('Bloco excluído.')
    setSalvandoId(null)

    await normalizarOrdens(
      blocosOrdenados.filter(
        (item) => item.id !== bloco.id,
      ),
    )
  }

  async function normalizarOrdens(lista) {
    const listaNormalizada = lista.map(
      (bloco, indice) => ({
        ...bloco,
        ordem: indice + 1,
      }),
    )

    setBlocos(listaNormalizada)

    const resultados = await Promise.all(
      listaNormalizada.map((bloco) =>
        supabase
          .from('aula_blocos')
          .update({ ordem: bloco.ordem })
          .eq('id', bloco.id),
      ),
    )

    const falhou = resultados.some(
      (resultado) => resultado.error,
    )

    if (falhou) {
      console.error(
        'Erro ao normalizar a ordem dos blocos:',
        resultados,
      )
      setMensagem(
        'Os blocos foram alterados, mas a ordem precisa ser recarregada.',
      )
    }
  }

  async function moverBloco(blocoId, direcao) {
    const indiceAtual = blocosOrdenados.findIndex(
      (bloco) => bloco.id === blocoId,
    )

    const indiceDestino = indiceAtual + direcao

    if (
      indiceAtual < 0 ||
      indiceDestino < 0 ||
      indiceDestino >= blocosOrdenados.length
    ) {
      return
    }

    setSalvandoId(blocoId)
    setMensagem('')

    const novaLista = [...blocosOrdenados]
    const blocoMovido = novaLista[indiceAtual]
    const blocoDestino = novaLista[indiceDestino]

    novaLista[indiceAtual] = {
      ...blocoDestino,
      ordem: blocoMovido.ordem,
    }

    novaLista[indiceDestino] = {
      ...blocoMovido,
      ordem: blocoDestino.ordem,
    }

    setBlocos(ordenarBlocos(novaLista))

    const [resultadoMovido, resultadoDestino] =
      await Promise.all([
        supabase
          .from('aula_blocos')
          .update({
            ordem: blocoDestino.ordem,
          })
          .eq('id', blocoMovido.id),
        supabase
          .from('aula_blocos')
          .update({
            ordem: blocoMovido.ordem,
          })
          .eq('id', blocoDestino.id),
      ])

    if (
      resultadoMovido.error ||
      resultadoDestino.error
    ) {
      console.error(
        'Erro ao mover bloco:',
        resultadoMovido.error,
        resultadoDestino.error,
      )
      setMensagem(
        'Não foi possível alterar a ordem do bloco.',
      )
      await carregarBlocos()
    } else {
      setMensagem('Ordem atualizada.')
    }

    setSalvandoId(null)
  }

  async function duplicarBloco(bloco) {
    setMensagem('')
    setSalvandoId(bloco.id)

    let conteudoDuplicado = bloco.conteudo

    if (bloco.tipo === 'imagem') {
      const imagem = interpretarImagem(bloco.conteudo)

      try {
        const resposta = await fetch(imagem.url)

        if (!resposta.ok) {
          throw new Error(
            'Não foi possível baixar a imagem original.',
          )
        }

        const blob = await resposta.blob()
        const extensao =
          blob.type.split('/')[1] || 'png'
        const arquivo = new File(
          [blob],
          `copia-${criarIdentificador()}.${extensao}`,
          { type: blob.type },
        )

        const caminho = `${aulaId}/${criarIdentificador()}-${criarNomeSeguro(
          arquivo.name,
        )}`

        const { error: erroUpload } =
          await supabase.storage
            .from(BUCKET_IMAGENS)
            .upload(caminho, arquivo, {
              cacheControl: '3600',
              upsert: false,
              contentType: arquivo.type,
            })

        if (erroUpload) {
          throw erroUpload
        }

        const { data: dadosUrl } = supabase.storage
          .from(BUCKET_IMAGENS)
          .getPublicUrl(caminho)

        conteudoDuplicado = JSON.stringify({
          url: dadosUrl.publicUrl,
          legenda: imagem.legenda,
          caminho,
        })
      } catch (error) {
        console.error(
          'Erro ao duplicar imagem:',
          error,
        )
        setMensagem(
          'Não foi possível duplicar a imagem.',
        )
        setSalvandoId(null)
        return
      }
    }

    const novaOrdem = obterProximaOrdem()

    const { data, error } = await inserirBloco(
      bloco.tipo,
      conteudoDuplicado,
      novaOrdem,
    )

    if (error) {
      console.error('Erro ao duplicar bloco:', error)
      setMensagem(
        'Não foi possível duplicar o bloco.',
      )
      setSalvandoId(null)
      return
    }

    setBlocos((blocosAtuais) =>
      ordenarBlocos([...blocosAtuais, data]),
    )

    setMensagem('Bloco duplicado.')
    setSalvandoId(null)
  }

  function renderizarEditorBloco(bloco) {
    if (bloco.tipo === 'imagem') {
      const imagem = interpretarImagem(bloco.conteudo)

      return (
        <div className="painel-bloco-imagem-editor">
          {imagem.url ? (
            <img
              src={imagem.url}
              alt={
                imagem.legenda ||
                'Imagem do conteúdo da aula'
              }
            />
          ) : (
            <p className="painel-bloco-imagem-invalida">
              A imagem deste bloco não pôde ser carregada.
            </p>
          )}

          <label>
            <span>Legenda da imagem</span>
            <input
              type="text"
              value={imagem.legenda}
              onChange={(event) =>
                atualizarCampoJson(
                  bloco.id,
                  interpretarImagem,
                  'legenda',
                  event.target.value,
                )
              }
              placeholder="Legenda opcional"
              disabled={salvandoId === bloco.id}
            />
          </label>
        </div>
      )
    }

    if (
      bloco.tipo === 'dica' ||
      bloco.tipo === 'curiosidade' ||
      bloco.tipo === 'aviso'
    ) {
      const caixa = interpretarCaixa(bloco.conteudo)

      return (
        <div
          className={`painel-bloco-caixa-editor painel-bloco-caixa-${bloco.tipo}`}
        >
          <label>
            <span>Título opcional</span>
            <input
              type="text"
              value={caixa.titulo}
              onChange={(event) =>
                atualizarCampoJson(
                  bloco.id,
                  interpretarCaixa,
                  'titulo',
                  event.target.value,
                )
              }
              placeholder={
                bloco.tipo === 'dica'
                  ? 'Dica do professor'
                  : bloco.tipo === 'curiosidade'
                    ? 'Curiosidade'
                    : 'Atenção'
              }
              disabled={salvandoId === bloco.id}
            />
          </label>

          <label>
            <span>Conteúdo</span>
            <textarea
              value={caixa.texto}
              onChange={(event) =>
                atualizarCampoJson(
                  bloco.id,
                  interpretarCaixa,
                  'texto',
                  event.target.value,
                )
              }
              rows={6}
              disabled={salvandoId === bloco.id}
            />
          </label>
        </div>
      )
    }

    if (bloco.tipo === 'separador') {
      return (
        <div className="painel-bloco-separador-preview">
          <span />
          <small>
            Este separador cria uma divisão visual na aula.
          </small>
        </div>
      )
    }

    return (
      <textarea
        value={bloco.conteudo ?? ''}
        onChange={(event) =>
          atualizarConteudo(
            bloco.id,
            event.target.value,
          )
        }
        rows={7}
        disabled={salvandoId === bloco.id}
      />
    )
  }

  return (
    <section className="painel-blocos-editor">
      <div className="painel-blocos-cabecalho">
        <div>
          <small>Conteúdo da aula</small>
          <h3>Blocos de conteúdo</h3>
          <p>
            Monte a aula usando textos, imagens e caixas
            especiais.
          </p>
        </div>

        <span>
          {blocos.length}{' '}
          {blocos.length === 1 ? 'bloco' : 'blocos'}
        </span>
      </div>

      {carregando ? (
        <p className="painel-professor-vazio">
          Carregando conteúdo da aula...
        </p>
      ) : (
        <>
          {blocosOrdenados.length === 0 ? (
            <p className="painel-professor-vazio">
              Esta aula ainda não possui blocos de conteúdo.
            </p>
          ) : (
            <div className="painel-blocos-lista">
              {blocosOrdenados.map((bloco, indice) => {
                const configuracao =
                  configuracoesTipos[bloco.tipo] ??
                  configuracoesTipos.texto

                const recolhido =
                  blocosRecolhidos.has(bloco.id)

                return (
                  <article
                    className={`painel-bloco-item painel-bloco-${bloco.tipo} ${
                      recolhido
                        ? 'painel-bloco-recolhido'
                        : ''
                    }`}
                    key={bloco.id}
                  >
                    <div className="painel-bloco-topo">
                      <div className="painel-bloco-identificacao">
                        <span className="painel-bloco-numero">
                          {String(indice + 1).padStart(
                            2,
                            '0',
                          )}
                        </span>

                        <span className="painel-bloco-icone">
                          {configuracao.icone}
                        </span>

                        <strong>
                          {configuracao.titulo}
                        </strong>
                      </div>

                      <div className="painel-bloco-ferramentas">
                        <button
                          type="button"
                          title="Mover para cima"
                          onClick={() =>
                            moverBloco(bloco.id, -1)
                          }
                          disabled={
                            indice === 0 ||
                            salvandoId !== null
                          }
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          title="Mover para baixo"
                          onClick={() =>
                            moverBloco(bloco.id, 1)
                          }
                          disabled={
                            indice ===
                              blocosOrdenados.length - 1 ||
                            salvandoId !== null
                          }
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          title="Duplicar"
                          onClick={() =>
                            duplicarBloco(bloco)
                          }
                          disabled={salvandoId !== null}
                        >
                          Duplicar
                        </button>

                        <button
                          type="button"
                          title={
                            recolhido
                              ? 'Expandir'
                              : 'Recolher'
                          }
                          onClick={() =>
                            alternarRecolhido(bloco.id)
                          }
                        >
                          {recolhido
                            ? 'Expandir'
                            : 'Recolher'}
                        </button>

                        <button
                          type="button"
                          className="painel-bloco-excluir"
                          onClick={() =>
                            excluirBloco(bloco)
                          }
                          disabled={salvandoId !== null}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    {!recolhido && (
                      <>
                        {renderizarEditorBloco(bloco)}

                        <div className="painel-bloco-acoes">
                          <small>
                            Ordem: {bloco.ordem}
                          </small>

                          {bloco.tipo !== 'separador' && (
                            <button
                              type="button"
                              onClick={() =>
                                salvarBloco(bloco)
                              }
                              disabled={
                                salvandoId === bloco.id
                              }
                            >
                              {salvandoId === bloco.id
                                ? 'Salvando...'
                                : 'Salvar bloco'}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          <section className="painel-adicionar-bloco">
            {!seletorAberto ? (
              <button
                type="button"
                className="painel-adicionar-bloco-botao"
                onClick={() => {
                  setSeletorAberto(true)
                  setMensagem('')
                }}
              >
                ＋ Adicionar bloco
              </button>
            ) : (
              <ModalTipoBloco
                salvando={salvandoId === 'novo'}
                onAdicionar={adicionarBloco}
                onFechar={fecharSeletor}
              />
            )}
          </section>

          {mensagem && (
            <p className="painel-blocos-mensagem">
              {mensagem}
            </p>
          )}
        </>
      )}
    </section>
  )
}
