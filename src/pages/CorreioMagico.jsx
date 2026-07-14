import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/correio-magico.css'

function formatarData(valor) {
  if (!valor) return ''

  return new Date(valor).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function CorreioMagico({ perfil, onVoltar }) {
  const [aba, setAba] = useState('entrada')
  const [mensagens, setMensagens] = useState([])
  const [mensagemSelecionada, setMensagemSelecionada] =
    useState(null)
  const [destinatario, setDestinatario] = useState('')
  const [assunto, setAssunto] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    carregarMensagens()
  }, [])

  async function carregarMensagens() {
    setCarregando(true)
    setAviso('')

    const { data, error } = await supabase
      .from('mensagens')
      .select(`
        id,
        remetente_id,
        destinatario_id,
        assunto,
        conteudo,
        lida,
        arquivada_remetente,
        arquivada_destinatario,
        criado_em,
        respondendo_a,
        remetente:perfis!mensagens_remetente_id_fkey(
          id,
          usuario,
          nome_personagem,
          avatar_url
        ),
        destinatario:perfis!mensagens_destinatario_id_fkey(
          id,
          usuario,
          nome_personagem,
          avatar_url
        )
      `)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('Erro ao carregar correio:', error)
      setAviso('Não foi possível carregar o Correio Mágico.')
      setMensagens([])
      setCarregando(false)
      return
    }

    setMensagens(data ?? [])
    setCarregando(false)
  }

  const mensagensVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return mensagens.filter((mensagem) => {
      const recebida = mensagem.destinatario_id === perfil.id
      const enviada = mensagem.remetente_id === perfil.id

      const pertenceAba =
        aba === 'entrada'
          ? recebida && !mensagem.arquivada_destinatario
          : aba === 'enviadas'
            ? enviada && !mensagem.arquivada_remetente
            : recebida
              ? mensagem.arquivada_destinatario
              : mensagem.arquivada_remetente

      if (!pertenceAba) return false

      const outraPessoa =
        aba === 'enviadas'
          ? mensagem.destinatario
          : mensagem.remetente

      const textoBusca = [
        mensagem.assunto,
        mensagem.conteudo,
        outraPessoa?.usuario,
        outraPessoa?.nome_personagem,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return !termo || textoBusca.includes(termo)
    })
  }, [mensagens, aba, busca, perfil.id])

  const naoLidas = useMemo(
    () =>
      mensagens.filter(
        (mensagem) =>
          mensagem.destinatario_id === perfil.id &&
          mensagem.lida === false &&
          !mensagem.arquivada_destinatario,
      ).length,
    [mensagens, perfil.id],
  )

  async function abrirMensagem(mensagem) {
    setMensagemSelecionada(mensagem)
    setAviso('')

    if (
      mensagem.destinatario_id === perfil.id &&
      mensagem.lida === false
    ) {
      const { error } = await supabase
        .from('mensagens')
        .update({
          lida: true,
          lida_em: new Date().toISOString(),
        })
        .eq('id', mensagem.id)

      if (!error) {
        setMensagens((estado) =>
          estado.map((item) =>
            item.id === mensagem.id
              ? { ...item, lida: true }
              : item,
          ),
        )
        setMensagemSelecionada({
          ...mensagem,
          lida: true,
        })
      }
    }
  }

  async function enviarCarta(evento) {
    evento.preventDefault()

    const usuarioDestino = destinatario
      .trim()
      .replace(/^@/, '')
      .toLowerCase()

    if (!usuarioDestino || !assunto.trim() || !conteudo.trim()) {
      setAviso('Preencha destinatário, assunto e mensagem.')
      return
    }

    setEnviando(true)
    setAviso('')

    const { data, error } = await supabase.rpc(
      'enviar_mensagem_magica',
      {
        destinatario_usuario: usuarioDestino,
        assunto_mensagem: assunto.trim(),
        conteudo_mensagem: conteudo.trim(),
        mensagem_respondida:
          mensagemSelecionada?.id ?? null,
      },
    )

    if (error) {
      console.error('Erro ao enviar carta:', error)
      setAviso(
        error.message || 'Não foi possível enviar a carta.',
      )
      setEnviando(false)
      return
    }

    setDestinatario('')
    setAssunto('')
    setConteudo('')
    setMensagemSelecionada(null)
    setAba('enviadas')
    setAviso('Carta enviada com sucesso.')
    setEnviando(false)
    await carregarMensagens()

    if (data?.id) {
      setAviso('Carta enviada com sucesso.')
    }
  }

  function prepararResposta(mensagem) {
    const remetente = mensagem.remetente

    setDestinatario(remetente?.usuario || '')
    setAssunto(
      mensagem.assunto.startsWith('Re:')
        ? mensagem.assunto
        : `Re: ${mensagem.assunto}`,
    )
    setConteudo('')
    setAba('escrever')
    setAviso('')
  }

  async function arquivarMensagem(mensagem) {
    const recebida = mensagem.destinatario_id === perfil.id

    const atualizacao = recebida
      ? { arquivada_destinatario: true }
      : { arquivada_remetente: true }

    const { error } = await supabase
      .from('mensagens')
      .update(atualizacao)
      .eq('id', mensagem.id)

    if (error) {
      setAviso('Não foi possível arquivar a mensagem.')
      return
    }

    setMensagemSelecionada(null)
    setAviso('Mensagem arquivada.')
    await carregarMensagens()
  }

  return (
    <main className="correio-pagina">
      <button
        type="button"
        className="correio-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="correio-hero">
        <p>Correspondências de Castelobruxo</p>
        <h1>Correio Mágico</h1>
        <span>
          Cartas de{' '}
          <strong>
            {perfil.nome_personagem || perfil.usuario}
          </strong>
        </span>

        <div className="correio-contador">
          <small>Não lidas</small>
          <strong>{naoLidas}</strong>
        </div>
      </header>

      <nav className="correio-abas">
        <button
          type="button"
          className={aba === 'entrada' ? 'ativo' : ''}
          onClick={() => {
            setAba('entrada')
            setMensagemSelecionada(null)
          }}
        >
          Caixa de entrada
          {naoLidas > 0 && <span>{naoLidas}</span>}
        </button>

        <button
          type="button"
          className={aba === 'enviadas' ? 'ativo' : ''}
          onClick={() => {
            setAba('enviadas')
            setMensagemSelecionada(null)
          }}
        >
          Enviadas
        </button>

        <button
          type="button"
          className={aba === 'arquivadas' ? 'ativo' : ''}
          onClick={() => {
            setAba('arquivadas')
            setMensagemSelecionada(null)
          }}
        >
          Arquivadas
        </button>

        <button
          type="button"
          className={aba === 'escrever' ? 'ativo' : ''}
          onClick={() => {
            setAba('escrever')
            setMensagemSelecionada(null)
            setAviso('')
          }}
        >
          ✉ Nova carta
        </button>
      </nav>

      {aviso && <p className="correio-aviso">{aviso}</p>}

      {aba === 'escrever' ? (
        <section className="correio-escrever">
          <header>
            <p>Nova correspondência</p>
            <h2>Escrever carta</h2>
          </header>

          <form onSubmit={enviarCarta}>
            <label>
              <span>Destinatário</span>
              <input
                type="text"
                value={destinatario}
                onChange={(evento) =>
                  setDestinatario(evento.target.value)
                }
                placeholder="@nome_de_usuario"
                required
              />
            </label>

            <label>
              <span>Assunto</span>
              <input
                type="text"
                value={assunto}
                onChange={(evento) =>
                  setAssunto(evento.target.value)
                }
                maxLength={120}
                required
              />
            </label>

            <label>
              <span>Mensagem</span>
              <textarea
                value={conteudo}
                onChange={(evento) =>
                  setConteudo(evento.target.value)
                }
                rows={10}
                maxLength={5000}
                required
              />
            </label>

            <div className="correio-form-acoes">
              <button
                type="submit"
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar carta'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDestinatario('')
                  setAssunto('')
                  setConteudo('')
                  setMensagemSelecionada(null)
                }}
              >
                Limpar
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="correio-conteudo">
          <aside className="correio-lista">
            <input
              type="search"
              placeholder="Pesquisar cartas"
              value={busca}
              onChange={(evento) =>
                setBusca(evento.target.value)
              }
            />

            {carregando ? (
              <p className="correio-estado">
                Carregando correspondências...
              </p>
            ) : mensagensVisiveis.length === 0 ? (
              <p className="correio-estado">
                Nenhuma carta nesta seção.
              </p>
            ) : (
              mensagensVisiveis.map((mensagem) => {
                const outraPessoa =
                  aba === 'enviadas'
                    ? mensagem.destinatario
                    : mensagem.remetente

                const naoLida =
                  mensagem.destinatario_id === perfil.id &&
                  mensagem.lida === false

                return (
                  <button
                    type="button"
                    key={mensagem.id}
                    className={`correio-lista-item ${
                      naoLida ? 'nao-lida' : ''
                    } ${
                      mensagemSelecionada?.id === mensagem.id
                        ? 'selecionada'
                        : ''
                    }`}
                    onClick={() => abrirMensagem(mensagem)}
                  >
                    <div>
                      <strong>
                        {outraPessoa?.nome_personagem ||
                          outraPessoa?.usuario ||
                          'Personagem desconhecido'}
                      </strong>

                      <small>
                        @{outraPessoa?.usuario || 'desconhecido'}
                      </small>
                    </div>

                    <h3>{mensagem.assunto}</h3>
                    <p>{mensagem.conteudo}</p>
                    <time>{formatarData(mensagem.criado_em)}</time>
                  </button>
                )
              })
            )}
          </aside>

          <article className="correio-leitura">
            {!mensagemSelecionada ? (
              <div className="correio-sem-selecao">
                <span>✉</span>
                <h2>Selecione uma carta</h2>
                <p>
                  Escolha uma correspondência para abrir o envelope.
                </p>
              </div>
            ) : (
              <>
                <header>
                  <p>
                    {mensagemSelecionada.remetente_id === perfil.id
                      ? 'Carta enviada'
                      : 'Carta recebida'}
                  </p>
                  <h2>{mensagemSelecionada.assunto}</h2>
                  <span>
                    {formatarData(
                      mensagemSelecionada.criado_em,
                    )}
                  </span>
                </header>

                <div className="correio-remetente">
                  <strong>
                    {mensagemSelecionada.remetente
                      ?.nome_personagem ||
                      mensagemSelecionada.remetente?.usuario}
                  </strong>
                  <small>
                    @{mensagemSelecionada.remetente?.usuario}
                  </small>
                </div>

                <div className="correio-carta-texto">
                  {mensagemSelecionada.conteudo
                    .split('\n')
                    .map((paragrafo, indice) =>
                      paragrafo ? (
                        <p key={indice}>{paragrafo}</p>
                      ) : (
                        <br key={indice} />
                      ),
                    )}
                </div>

                <footer>
                  {mensagemSelecionada.destinatario_id ===
                    perfil.id && (
                    <button
                      type="button"
                      onClick={() =>
                        prepararResposta(
                          mensagemSelecionada,
                        )
                      }
                    >
                      Responder
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      arquivarMensagem(
                        mensagemSelecionada,
                      )
                    }
                  >
                    Arquivar
                  </button>
                </footer>
              </>
            )}
          </article>
        </section>
      )}
    </main>
  )
}
