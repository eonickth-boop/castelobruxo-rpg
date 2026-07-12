import { useEffect, useState } from 'react'
import { supabase } from './services/supabase'
import './App.css'
import CardItem from './components/CardItem'
import Notificacao from './components/Notificacao'

function App() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)

  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [pagina, setPagina] = useState('inicio')

  const [saldo, setSaldo] = useState(null)
  const [transacoes, setTransacoes] = useState([])
  const [inventario, setInventario] = useState([])
  const [itensMercado, setItensMercado] = useState([])
  

  const [destinatario, setDestinatario] = useState('')
  const [valorTransferencia, setValorTransferencia] = useState('')
  const [itemComprando, setItemComprando] = useState(null)

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getSession()
      setSessao(data.session)
    }

    verificarSessao()

    const { data } = supabase.auth.onAuthStateChange(
      (_evento, novaSessao) => {
        setSessao(novaSessao)
      },
    )

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    async function carregarPerfil() {
      if (!sessao?.user) {
        setPerfil(null)
        return
      }

      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', sessao.user.id)
        .single()

      if (error) {
        console.error(error)
        setMensagem('Não foi possível carregar o perfil.')
        return
      }

      setPerfil(data)
    }

    carregarPerfil()
  }, [sessao])

  async function entrar(evento) {
    evento.preventDefault()

    const usuarioLimpo = usuario.trim().toLowerCase()

    if (!usuarioLimpo || !senha) {
      setMensagem('Preencha o nome de usuário e a senha.')
      return
    }

    setCarregando(true)
    setMensagem('')

    const emailInterno = `${usuarioLimpo}@castelobruxo.local`

    const { error } = await supabase.auth.signInWithPassword({
      email: emailInterno,
      password: senha,
    })

    if (error) {
      setMensagem('Nome de usuário ou senha incorretos.')
    }

    setCarregando(false)
  }

  async function carregarPerfilJogador() {
    if (!sessao?.user) return

    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase
      .from('carteiras')
      .select('saldo')
      .eq('usuario_id', sessao.user.id)
      .single()

    if (error) {
      console.error(error)
      setMensagem('Não foi possível carregar o perfil completo.')
      setCarregando(false)
      return
    }

    setSaldo(data.saldo)
    setPagina('perfil')
    setCarregando(false)
  }

  async function carregarCarteira() {
    if (!sessao?.user) return

    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase
      .from('carteiras')
      .select('saldo')
      .eq('usuario_id', sessao.user.id)
      .single()

    if (error) {
      console.error(error)
      setMensagem('Não foi possível carregar o saldo.')
      setCarregando(false)
      return
    }

    setSaldo(data.saldo)
    setPagina('banco')
    setCarregando(false)
  }

  async function carregarExtrato() {
    if (!sessao?.user) return

    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase
      .from('transacoes')
      .select('id, tipo, valor, descricao, criado_em')
      .eq('usuario_id', sessao.user.id)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error(error)
      setMensagem('Não foi possível carregar o extrato.')
      setCarregando(false)
      return
    }

    setTransacoes(data ?? [])
    setPagina('extrato')
    setCarregando(false)
  }

  async function carregarInventario() {
    if (!sessao?.user) return

    setCarregando(true)
    setMensagem('')

    const { data: registros, error: erroInventario } = await supabase
      .from('inventario')
      .select(`
        id,
        quantidade,
        adquirido_em,
        itens (
          codigo
        )
      `)
      .eq('usuario_id', sessao.user.id)
      .order('adquirido_em', { ascending: false })

    if (erroInventario) {
      console.error(erroInventario)
      setMensagem('Não foi possível carregar o inventário.')
      setCarregando(false)
      return
    }

    const { data: itensOficiais, error: erroItens } = await supabase
      .from('items')
      .select('*')

    if (erroItens) {
      console.error(erroItens)
      setMensagem('Não foi possível carregar os dados dos itens.')
      setCarregando(false)
      return
    }

    const inventarioCompleto = (registros ?? [])
      .map((registro) => {
        const codigo = registro.itens?.codigo
        const itemOficial = (itensOficiais ?? []).find(
          (item) => item.id === codigo,
        )

        return {
          ...registro,
          item: itemOficial ?? null,
        }
      })
      .filter((registro) => registro.item)

    setInventario(inventarioCompleto)
    setPagina('inventario')
    setCarregando(false)
  }

  async function carregarMercado() {
    if (!sessao?.user) return

    setCarregando(true)
    setMensagem('')

    const { data: dadosCarteira, error: erroCarteira } = await supabase
      .from('carteiras')
      .select('saldo')
      .eq('usuario_id', sessao.user.id)
      .single()

    if (erroCarteira) {
      console.error(erroCarteira)
      setMensagem('Não foi possível carregar sua carteira.')
      setCarregando(false)
      return
    }

    const { data: itens, error: erroItens } = await supabase
      .from('items')
      .select('*')
      .order('nome', { ascending: true })

    console.log('Itens do mercado:', itens)
    console.log('Erro do mercado:', erroItens)

    if (erroItens) {
      console.error(erroItens)
      setMensagem(`Não foi possível carregar o mercado: ${erroItens.message}`)
      setCarregando(false)
      return
    }

    setSaldo(dadosCarteira.saldo)
    setItensMercado(itens ?? [])
    setPagina('mercado')
    setCarregando(false)
  }

  async function comprarItem(item) {
    const confirmar = window.confirm(
      `Comprar 1x ${item.nome} por ${item.preco} Ipês?`,
    )

    if (!confirmar) return

    setItemComprando(item.id)
    setMensagem('')

    const { data, error } = await supabase.rpc('comprar_item', {
      codigo_item: item.id,
      quantidade_compra: 1,
    })

    if (error) {
      console.error(error)
      setMensagem(error.message || 'Não foi possível realizar a compra.')
      setItemComprando(null)
      return
    }

    setSaldo(data.novo_saldo)
    setMensagem(
      `Compra realizada! ${data.quantidade_comprada}x ${data.item} foi adicionado ao inventário.`,
    )
    setItemComprando(null)
  }

  async function transferir(evento) {
    evento.preventDefault()

    const destinatarioLimpo = destinatario.trim().toLowerCase()
    const valorNumero = Number(valorTransferencia)

    if (!destinatarioLimpo) {
      setMensagem('Informe o nome de usuário do destinatário.')
      return
    }

    if (!Number.isInteger(valorNumero) || valorNumero <= 0) {
      setMensagem('Informe um valor inteiro maior que zero.')
      return
    }

    const confirmar = window.confirm(
      `Transferir ${valorNumero} Ipês para ${destinatarioLimpo}?`,
    )

    if (!confirmar) return

    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase.rpc('transferir_ipes', {
      destinatario_usuario: destinatarioLimpo,
      valor_transferencia: valorNumero,
    })

    if (error) {
      console.error(error)
      setMensagem(error.message || 'Não foi possível realizar a transferência.')
      setCarregando(false)
      return
    }

    setSaldo(data.novo_saldo)
    setDestinatario('')
    setValorTransferencia('')
    setMensagem(
      `${data.valor} Ipês enviados para ${data.destinatario} com sucesso!`,
    )
    setPagina('banco')
    setCarregando(false)
  }

  async function sair() {
    await supabase.auth.signOut()

    setUsuario('')
    setSenha('')
    setMensagem('')
    setPerfil(null)
    setSaldo(null)
    setTransacoes([])
    setInventario([])
    setItensMercado([])
    setDestinatario('')
    setValorTransferencia('')
    setItemComprando(null)
    setPagina('inicio')
  }

  if (sessao && !perfil) {
    return <p style={{ padding: '40px' }}>Carregando perfil...</p>
  }

  if (sessao && perfil && pagina === 'perfil') {
    const nomeExibido = perfil.nome_personagem || perfil.usuario

    return (
      <main
        style={{
          maxWidth: '760px',
          margin: '40px auto',
          padding: '24px',
        }}
      >
        <button
          onClick={() => {
            setPagina('inicio')
            setMensagem('')
          }}
        >
          Voltar
        </button>

        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
          }}
        >
          <h1
            style={{
              fontSize: '2.7rem',
              color: '#e5c16b',
              marginBottom: '8px',
            }}
          >
            Perfil do Jogador
          </h1>

          <p style={{ color: '#cfd6cf' }}>
            Registro estudantil de Castelobruxo
          </p>
        </div>

        <section
          style={{
            background:
              'linear-gradient(180deg, rgba(28,34,29,.98), rgba(17,20,18,.98))',
            border: '1px solid rgba(201,164,92,.45)',
            borderRadius: '18px',
            padding: '28px',
            boxShadow: '0 12px 30px rgba(0,0,0,.35)',
          }}
        >
          <div
            style={{
              width: '110px',
              height: '110px',
              margin: '0 auto 18px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              background: 'rgba(201,164,92,.12)',
              border: '1px solid rgba(201,164,92,.45)',
              fontSize: '2.5rem',
            }}
          >
            {perfil.avatar_url ? (
              <img
                src={perfil.avatar_url}
                alt={nomeExibido}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              '👤'
            )}
          </div>

          <h2
            style={{
              textAlign: 'center',
              color: '#f3ead2',
              marginBottom: '6px',
            }}
          >
            {nomeExibido}
          </h2>

          <p
            style={{
              textAlign: 'center',
              color: '#aab7aa',
              marginTop: 0,
              marginBottom: '28px',
            }}
          >
            @{perfil.usuario}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            {[
              ['Cargo', perfil.cargo || 'Aluno'],
              ['Tribo', perfil.tribo || 'Não definida'],
              ['Ano', perfil.ano],
              ['Nível', perfil.nivel],
              ['XP', perfil.xp],
              ['Saldo', `${saldo ?? 0} Ipês`],
            ].map(([titulo, valor]) => (
              <div
                key={titulo}
                style={{
                  background: 'rgba(35,45,37,.85)',
                  border: '1px solid rgba(255,255,255,.07)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <small style={{ color: '#aab7aa' }}>{titulo}</small>
                <div
                  style={{
                    color: '#e5c16b',
                    fontWeight: '700',
                    fontSize: '1.15rem',
                    marginTop: '7px',
                  }}
                >
                  {valor}
                </div>
              </div>
            ))}
          </div>
        </section>

       <Notificacao mensagem={mensagem} />
      </main>
    )
  }

  if (sessao && perfil && pagina === 'mercado') {
    return (
      <main
        style={{
          maxWidth: '900px',
          margin: '40px auto',
          padding: '24px',
        }}
      >
        <button
          onClick={() => {
            setPagina('inicio')
            setMensagem('')
          }}
        >
          Voltar
        </button>

        <div
  style={{
    textAlign: "center",
    marginBottom: "35px",
  }}
>
  <h1
    style={{
      fontSize: "2.7rem",
      color: "#e5c16b",
      marginBottom: "10px",
    }}
  >
    Mercado das Cinco Trilhas
  </h1>

  <p
    style={{
      color: "#d9d9d9",
      fontSize: "1.05rem",
      marginBottom: "10px",
    }}
  >
    Bem-vindo,
    <strong> {perfil.nome_personagem || perfil.usuario}</strong>
  </p>

  <div
    style={{
      display: "inline-block",
      background: "#2d362f",
      padding: "12px 28px",
      borderRadius: "999px",
      border: "1px solid #6d8f61",
      fontWeight: "bold",
      fontSize: "1.3rem",
      color: "#f0d27a",
    }}
  >
    💰 {saldo} Ipês
  </div>
</div>

       <Notificacao mensagem={mensagem} />

        {itensMercado.length === 0 ? (
          <p>
            Nenhum item foi retornado pelo Supabase. Se os 35 itens aparecem no
            Table Editor, será necessário liberar a leitura da tabela
            <strong> items</strong> nas políticas do Supabase.
          </p>
        ) : (
         <div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
  }}
>
  {itensMercado.map((item) => (
    <CardItem
      key={item.id}
      item={item}
      saldo={saldo}
      itemComprando={itemComprando}
      onComprar={comprarItem}
    />
  ))}
</div>
        )}
      </main>
    )
  }

  if (sessao && perfil && pagina === 'inventario') {
    return (
      <main
        style={{
          maxWidth: '760px',
          margin: '40px auto',
          padding: '24px',
        }}
      >
        <button
          onClick={() => {
            setPagina('inicio')
            setMensagem('')
          }}
        >
          Voltar
        </button>

        <h1>Inventário</h1>
        <p>Itens de {perfil.nome_personagem || perfil.usuario}</p>

        {inventario.length === 0 ? (
          <p>Seu inventário está vazio.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {inventario.map((registro) => (
              <CardItem
                key={registro.id}
                item={registro.item}
                quantidade={registro.quantidade}
                modoInventario={true}
              />
            ))}
          </div>
        )}

       <Notificacao mensagem={mensagem} />
      </main>
    )
  }

  if (sessao && perfil && pagina === 'transferencia') {
    return (
      <main
        style={{
          maxWidth: '560px',
          margin: '40px auto',
          padding: '24px',
        }}
      >
        <button
          onClick={() => {
            setPagina('banco')
            setMensagem('')
          }}
        >
          Voltar ao banco
        </button>

        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
          }}
        >
          <h1
            style={{
              fontSize: '2.6rem',
              color: '#e5c16b',
              marginBottom: '8px',
            }}
          >
            Transferir Ipês
          </h1>

          <p
            style={{
              color: '#cfd6cf',
              margin: 0,
            }}
          >
            Envie moedas para outro jogador
          </p>
        </div>

        <section
          style={{
            background:
              'linear-gradient(180deg, rgba(28,34,29,.98), rgba(17,20,18,.98))',
            border: '1px solid rgba(201,164,92,.45)',
            borderRadius: '18px',
            padding: '26px',
            boxShadow: '0 12px 30px rgba(0,0,0,.35)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            <small style={{ color: '#aab7aa' }}>Saldo disponível</small>

            <div
              style={{
                color: '#e5c16b',
                fontSize: '2rem',
                fontWeight: '700',
                marginTop: '8px',
              }}
            >
              💰 {saldo} Ipês
            </div>
          </div>

          <form onSubmit={transferir}>
            <label
              htmlFor="destinatario"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#d8ddda',
                fontWeight: '600',
              }}
            >
              Destinatário
            </label>

            <input
              id="destinatario"
              type="text"
              placeholder="Nome de usuário"
              value={destinatario}
              onChange={(evento) => setDestinatario(evento.target.value)}
              style={{
                width: '100%',
                padding: '13px',
                marginBottom: '18px',
              }}
            />

            <label
              htmlFor="valor-transferencia"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#d8ddda',
                fontWeight: '600',
              }}
            >
              Valor
            </label>

            <input
              id="valor-transferencia"
              type="number"
              min="1"
              step="1"
              placeholder="Quantidade de Ipês"
              value={valorTransferencia}
              onChange={(evento) =>
                setValorTransferencia(evento.target.value)
              }
              style={{
                width: '100%',
                padding: '13px',
                marginBottom: '20px',
              }}
            />

            <button
              type="submit"
              disabled={carregando}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '1.05rem',
                fontWeight: '700',
              }}
            >
              {carregando
                ? 'Transferindo...'
                : 'Confirmar transferência'}
            </button>
          </form>
        </section>

        {mensagem && (
          <p
            style={{
              marginTop: '18px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(201,164,92,.1)',
              border: '1px solid rgba(201,164,92,.25)',
              color: '#eee7d7',
            }}
          >
            {mensagem}
          </p>
        )}
      </main>
    )
  }

  if (sessao && perfil && pagina === 'extrato') {
    return (
      <main
        style={{
          maxWidth: '760px',
          margin: '40px auto',
          padding: '24px',
        }}
      >
        <button
          onClick={() => {
            setPagina('banco')
            setMensagem('')
          }}
        >
          Voltar ao banco
        </button>

        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <h1
            style={{
              fontSize: '2.6rem',
              color: '#e5c16b',
              marginBottom: '8px',
            }}
          >
            Extrato Bancário
          </h1>

          <p
            style={{
              color: '#cfd6cf',
              margin: 0,
            }}
          >
            Conta de{' '}
            <strong>{perfil.nome_personagem || perfil.usuario}</strong>
          </p>
        </div>

        {transacoes.length === 0 ? (
          <div
            style={{
              background:
                'linear-gradient(180deg, rgba(28,34,29,.98), rgba(17,20,18,.98))',
              border: '1px solid rgba(201,164,92,.35)',
              borderRadius: '16px',
              padding: '28px',
              textAlign: 'center',
              color: '#cfd6cf',
            }}
          >
            Nenhuma movimentação encontrada.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '14px',
            }}
          >
            {transacoes.map((transacao) => {
              const entrada = [
                'saldo_inicial',
                'deposito',
                'transferencia_recebida',
                'venda',
                'recompensa',
              ].includes(transacao.tipo)

              return (
                <article
                  key={transacao.id}
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(28,34,29,.98), rgba(17,20,18,.98))',
                    border: entrada
                      ? '1px solid rgba(106, 170, 113, .4)'
                      : '1px solid rgba(201,164,92,.35)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 10px 26px rgba(0,0,0,.28)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '16px',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <small
                        style={{
                          color: '#9fae9f',
                          textTransform: 'capitalize',
                        }}
                      >
                        {transacao.tipo.replaceAll('_', ' ')}
                      </small>

                      <p
                        style={{
                          margin: '7px 0 0',
                          color: '#eee7d7',
                          lineHeight: '1.5',
                        }}
                      >
                        {transacao.descricao}
                      </p>
                    </div>

                    <strong
                      style={{
                        color: entrada ? '#92d59a' : '#e5c16b',
                        fontSize: '1.25rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entrada ? '+' : '-'}
                      {transacao.valor} Ipês
                    </strong>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,.07)',
                      marginTop: '15px',
                      paddingTop: '12px',
                      color: '#8f9a90',
                      fontSize: '.9rem',
                    }}
                  >
                    {new Date(transacao.criado_em).toLocaleString('pt-BR')}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <Notificacao mensagem={mensagem} />
      </main>
    )
  }

  if (sessao && perfil && pagina === 'banco') {
    return (
      <main
        style={{
          maxWidth: '720px',
          margin: '40px auto',
          padding: '24px',
        }}
      >
        <button
          onClick={() => {
            setPagina('inicio')
            setMensagem('')
          }}
        >
          Voltar
        </button>

        <div
          style={{
            textAlign: 'center',
            marginBottom: '35px',
          }}
        >
          <h1
            style={{
              fontSize: '2.6rem',
              color: '#e5c16b',
              marginBottom: '8px',
            }}
          >
            Banco da Árvore Ancestral
          </h1>

          <p
            style={{
              color: '#cfd6cf',
              marginBottom: '25px',
            }}
          >
            Conta de{' '}
            <strong>{perfil.nome_personagem || perfil.usuario}</strong>
          </p>

          <div
            style={{
              maxWidth: '420px',
              margin: '0 auto',
              background:
                'linear-gradient(180deg, rgba(28,34,29,.98), rgba(17,20,18,.98))',
              border: '1px solid rgba(201,164,92,.45)',
              borderRadius: '18px',
              padding: '28px',
              boxShadow: '0 12px 30px rgba(0,0,0,.35)',
            }}
          >
            <small
              style={{
                color: '#aab7aa',
              }}
            >
              Saldo disponível
            </small>

            <h2
              style={{
                color: '#e5c16b',
                fontSize: '2.3rem',
                margin: '10px 0 0',
              }}
            >
              💰 {saldo} Ipês
            </h2>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={carregarExtrato}
            disabled={carregando}
            style={{
              minWidth: '220px',
              padding: '16px 24px',
              fontSize: '1.05rem',
              fontWeight: '600',
            }}
          >
            {carregando ? 'Carregando...' : 'Ver extrato'}
          </button>

          <button
            onClick={() => {
              setPagina('transferencia')
              setMensagem('')
            }}
            style={{
              minWidth: '220px',
              padding: '16px 24px',
              fontSize: '1.05rem',
              fontWeight: '600',
            }}
          >
            Transferir Ipês
          </button>
        </div>

       <Notificacao mensagem={mensagem} />
      </main>
    )
  }

  if (sessao && perfil) {
    return (
      <main
        style={{
          maxWidth: '920px',
          margin: '40px auto',
          padding: '24px',
        }}
      >
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <h1 style={{fontSize:'3rem',color:'#e5c16b',marginBottom:'8px'}}>Castelobruxo</h1>
          <p>Escola Brasileira de Magia</p>
        </div>

        <div style={{
          background:'linear-gradient(180deg, rgba(28,34,29,.98), rgba(17,20,18,.98))',
          border:'1px solid rgba(201,164,92,.45)',
          borderRadius:'18px',
          padding:'24px',
          marginBottom:'28px'
        }}>
          <h2>Bem-vindo, {perfil.nome_personagem || perfil.usuario}!</h2>

          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
            gap:'16px',
            marginTop:'20px'
          }}>
            <div><strong>Tribo</strong><br />{perfil.tribo || 'Não definida'}</div>
            <div><strong>Ano</strong><br />{perfil.ano}</div>
            <div><strong>Nível</strong><br />{perfil.nivel}</div>
            <div><strong>XP</strong><br />{perfil.xp}</div>
          </div>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',
          gap:'16px'
        }}>
          <button onClick={carregarCarteira} disabled={carregando}>{carregando?'Carregando...':'🏦 Banco'}</button>
          <button onClick={carregarMercado} disabled={carregando}>{carregando?'Carregando...':'🛒 Mercado'}</button>
          <button onClick={carregarInventario} disabled={carregando}>{carregando?'Carregando...':'🎒 Inventário'}</button>
          <button onClick={carregarPerfilJogador} disabled={carregando}>{carregando?'Carregando...':'👤 Perfil'}</button>
          <button disabled>📚 Biblioteca (Em breve)</button>
        </div>

        <div style={{textAlign:'center',marginTop:'36px'}}>
          <button onClick={sair}>Sair</button>
        </div>

        <Notificacao mensagem={mensagem} />
      </main>
    )
  }

  return (
    <main
      style={{
        maxWidth: '420px',
        margin: '60px auto',
        padding: '24px',
      }}
    >
      <h1>Castelobruxo</h1>
      <p>Acesse os sistemas do RPG.</p>

      <form onSubmit={entrar}>
        <input
          type="text"
          placeholder="Nome de usuário"
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          autoComplete="username"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '12px',
          }}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '12px',
          }}
        />

        <button type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

     <Notificacao mensagem={mensagem} />
    </main>
  )
}

export default App