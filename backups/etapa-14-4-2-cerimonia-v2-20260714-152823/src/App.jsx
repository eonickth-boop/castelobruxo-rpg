import { useEffect, useState } from 'react'
import { supabase } from './services/supabase'
import './App.css'
import CardItem from './components/CardItem'
import Notificacao from './components/Notificacao'
import Cadastro from './pages/Cadastro'
import Biblioteca from './pages/Biblioteca'
import Aulas from './pages/Aulas'
import Disciplina from './pages/Disciplina'
import Aula from './pages/Aula'
import PainelProfessor from './pages/PainelProfessor'
import CriarAula from './pages/CriarAula'
import QuadroAvisos from './pages/QuadroAvisos'
import DiarioPersonagem from './pages/DiarioPersonagem'
import PerfilPublico from './pages/PerfilPublico'
import HomeCastelobruxo from './pages/HomeCastelobruxo'
import StudentDesk from './components/studentDesk/StudentDesk'
import Pets from './pages/Pets'
import PerfilPersonagem from './pages/PerfilPersonagem'
import CorreioMagico from './pages/CorreioMagico'
import Conquistas from './pages/Conquistas'
import Mercado from './pages/Mercado'
import Inventario from './pages/Inventario'
import Certificados from './pages/Certificados'
import Missoes from './pages/Missoes'
import Eventos from './pages/Eventos'
import MapaInterativo from './pages/MapaInterativo'
import LocalMapa from './pages/LocalMapa'
import './styles/home-mapa-atalho.css'
import PainelAdministrativo from './pages/PainelAdministrativo'
import './styles/revisao-etapa-13.css'
import './styles/home-etapa-13-2-1.css'
import './styles/polimento-etapa-13-2-2.css'
import CmsConteudo from './pages/CmsConteudo'
import UploadsPerfil from './pages/UploadsPerfil'
import PetPerfil from './pages/PetPerfil'
import './styles/perfil-pets-etapa-14.css'
import CriacaoPersonagem from './pages/CriacaoPersonagem'

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
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [modoCadastro, setModoCadastro] = useState(false)
  const [disciplinaSelecionadaId, setDisciplinaSelecionadaId] = useState(null)
  const [aulaSelecionada, setAulaSelecionada] = useState(null)
  const [localMapaSelecionado, setLocalMapaSelecionado] = useState(null)
  const [petSelecionado, setPetSelecionado] = useState(null)

  useEffect(() => {
    function navegarPelaSidebar(evento) {
      const destino = evento.detail?.pagina

      if (!destino) return

      setMensagem('')

      if (destino === 'banco') {
        carregarCarteira()
        return
      }

      if (destino === 'mercado') {
        carregarMercado()
        return
      }

      if (destino === 'inventario') {
        carregarInventario()
        return
      }

      if (destino === 'perfil') {
        carregarPerfilJogador()
        return
      }

      setPagina(destino)
    }

    window.addEventListener('castelobruxo:navegar', navegarPelaSidebar)

    return () => {
      window.removeEventListener('castelobruxo:navegar', navegarPelaSidebar)
    }
  }, [sessao])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('castelobruxo:pagina-alterada', {
        detail: { pagina },
      }),
    )
  }, [pagina])


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

  async function alterarSenha(evento) {
    evento.preventDefault()
    setMensagem('')

    if (novaSenha.length < 8) {
      setMensagem('A nova senha precisa ter pelo menos 8 caracteres.')
      return
    }

    if (novaSenha !== confirmacaoSenha) {
      setMensagem('As senhas não coincidem.')
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    })

    if (error) {
      console.error(error)
      setMensagem(error.message || 'Não foi possível alterar a senha.')
      setCarregando(false)
      return
    }

    setNovaSenha('')
    setConfirmacaoSenha('')
    setMostrarAlterarSenha(false)
    setMensagem('Senha alterada com sucesso.')
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
    setMostrarAlterarSenha(false)
    setNovaSenha('')
    setConfirmacaoSenha('')
    setModoCadastro(false)
    setDisciplinaSelecionadaId(null)
    setAulaSelecionada(null)
    setPagina('inicio')
  }

  if (sessao && !perfil) {
    return <p style={{ padding: '40px' }}>Carregando perfil...</p>
  }
  if (
    sessao &&
    perfil &&
    perfil.personagem_criado !== true
  ) {
    return (
      <CriacaoPersonagem
        perfil={perfil}
        sair={sair}
        onConcluido={async () => {
          const { data, error } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', perfil.id)
            .single()

          if (error) {
            console.error(
              'Erro ao recarregar perfil após criação:',
              error,
            )
            setMensagem(
              'Personagem criado, mas o perfil não pôde ser recarregado.',
            )
            return
          }

          setPerfil(data)
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'perfil') {
    return (
      <PerfilPersonagem
        perfil={perfil}
        saldo={saldo}
        mensagem={mensagem}
        carregando={carregando}
        mostrarAlterarSenha={mostrarAlterarSenha}
        novaSenha={novaSenha}
        confirmacaoSenha={confirmacaoSenha}
        setMostrarAlterarSenha={setMostrarAlterarSenha}
        setNovaSenha={setNovaSenha}
        setConfirmacaoSenha={setConfirmacaoSenha}
        alterarSenha={alterarSenha}
        onAbrirInventario={carregarInventario}
        onAbrirPets={() => {
          setPagina('pets')
          setMensagem('')
        }}
        onAbrirDiario={() => {
          setPagina('diario-personagem')
          setMensagem('')
        }}
        onAbrirCorreio={() => {
          setPagina('correio-magico')
          setMensagem('')
        }}
        onAbrirConquistas={() => {
          setPagina('conquistas')
          setMensagem('')
        }}
        onAbrirCertificados={() => {
          setPagina('certificados')
          setMensagem('')
        }}
        onAbrirMissoes={() => {
          setPagina('missoes')
          setMensagem('')
        }}
        onAbrirEventos={() => {
          setPagina('eventos')
          setMensagem('')
        }}
        onAbrirMapa={() => {
          setPagina('mapa-interativo')
          setMensagem('')
        }}
        onAbrirUploadsPerfil={() => {
          setPagina('uploads-perfil')
          setMensagem('')
        }}        onAbrirPerfilPublico={() => {
          setPagina('perfil-publico')
          setMensagem('')
        }}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
          setMostrarAlterarSenha(false)
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'mercado') {
    return (
      <Mercado
        perfil={perfil}
        saldo={saldo}
        itens={itensMercado}
        itemComprando={itemComprando}
        mensagem={mensagem}
        onComprar={comprarItem}
        onAbrirInventario={carregarInventario}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'inventario') {
    return (
      <Inventario
        perfil={perfil}
        registros={inventario}
        mensagem={mensagem}
        onAbrirMercado={carregarMercado}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
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

  if (sessao && perfil && pagina === 'aulas') {
    return (
      <Aulas
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
        onAbrirDisciplina={(disciplinaId) => {
          setDisciplinaSelecionadaId(disciplinaId)
          setPagina('disciplina')
          setMensagem('')
        }}
      />
    )
  }

  if (
    sessao &&
    perfil &&
    pagina === 'disciplina' &&
    disciplinaSelecionadaId
  ) {
    return (
      <Disciplina
        disciplinaId={disciplinaSelecionadaId}
        onVoltar={() => {
          setPagina('aulas')
          setMensagem('')
        }}
        onAbrirAula={(aula) => {
          setAulaSelecionada(aula)
          setPagina('aula')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'aula' && aulaSelecionada) {
    return (
      <Aula
        aula={aulaSelecionada}
        onVoltar={() => {
          setPagina('disciplina')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'cms-conteudo') {
    return (
      <CmsConteudo
        perfil={perfil}
        onVoltar={() => {
          setPagina('painel-administrativo')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'uploads-perfil') {
    return (
      <UploadsPerfil
        perfil={perfil}
        onVoltar={() => {
          setPagina('perfil')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'painel-administrativo') {
    return (
      <PainelAdministrativo
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'painel-professor') {
  return (
    <PainelProfessor
      onVoltar={() => {
        setPagina('inicio')
        setMensagem('')
      }}
    />
  )
}

  if (sessao && perfil && pagina === 'pets') {
    return (
      <Pets
        perfil={perfil}
        onAbrirPet={(registro) => {
          setPetSelecionado(registro)
          setPagina('pet-perfil')
          setMensagem('')
        }}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'pet-perfil') {
    return (
      <PetPerfil
        registroInicial={petSelecionado}
        onVoltar={() => {
          setPagina('pets')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'perfil-publico') {
    return (
      <PerfilPublico
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'diario-personagem') {
    return (
      <DiarioPersonagem
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'mapa-interativo') {
    return (
      <MapaInterativo
        perfil={perfil}
        onAbrirLocal={(local) => {
          setLocalMapaSelecionado(local)
          setPagina('local-mapa')
          setMensagem('')
        }}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'local-mapa') {
    return (
      <LocalMapa
        local={localMapaSelecionado}
        onVoltarMapa={() => {
          setPagina('mapa-interativo')
          setMensagem('')
        }}
        onNavegar={(destino) => {
          setPagina(destino)
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'eventos') {
    return (
      <Eventos
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'missoes') {
    return (
      <Missoes
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'certificados') {
    return (
      <Certificados
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'conquistas') {
    return (
      <Conquistas
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'correio-magico') {
    return (
      <CorreioMagico
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }
  if (sessao && perfil && pagina === 'quadro-avisos') {
    return (
      <QuadroAvisos
        perfil={perfil}
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
    )
  }

  if (sessao && perfil && pagina === 'biblioteca') {
    return (
      <Biblioteca
        onVoltar={() => {
          setPagina('inicio')
          setMensagem('')
        }}
      />
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
  if (sessao && perfil && pagina === 'inicio') {
    return (
      <>
        <HomeCastelobruxo
          perfil={perfil}
          carregando={carregando}
          mensagem={mensagem}
          saldo={saldo}
          sair={sair}
          carregarCarteira={carregarCarteira}
          carregarMercado={carregarMercado}
          carregarInventario={carregarInventario}
          setPagina={setPagina}
          setMensagem={setMensagem}
        />

        <section className="home-mapa-atalho">
          <div>
            <p>Exploração</p>
            <h2>Mapa Interativo de Castelobruxo</h2>
            <span>
              Visite áreas da escola, serviços e regiões de exploração.
              Cada marcador abre uma página própria do local.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setPagina('mapa-interativo')
              setMensagem('')
            }}
          >
            🗺️ Abrir mapa
          </button>
        </section>
      </>
    )
  }
  if (sessao && perfil) {
    const nomeExibido = perfil.nome_personagem || perfil.usuario
    const cargoExibido = perfil.cargo
      ? perfil.cargo.charAt(0).toUpperCase() + perfil.cargo.slice(1)
      : 'Aluno'
    const triboExibida = perfil.tribo || 'Tribo não definida'
const cardsSistema = [
  {
    titulo: 'Banco da Árvore Ancestral',
    descricao: 'Consulte seu saldo, extrato e faça transferências.',
    icone: '🏦',
    acao: carregarCarteira,
    ativo: true,
  },
  {
    titulo: 'Mercado das Cinco Trilhas',
    descricao: 'Descubra itens mágicos e amplie seu inventário.',
    icone: '🛒',
    acao: carregarMercado,
    ativo: true,
  },
  {
    titulo: 'Inventário',
    descricao: 'Veja os objetos, livros e recursos que você possui.',
    icone: '🎒',
    acao: carregarInventario,
    ativo: true,
  },
  {
    titulo: 'Perfil do Jogador',
    descricao: 'Acesse seu registro estudantil e suas configurações.',
    icone: '👤',
    acao: carregarPerfilJogador,
    ativo: true,
  },
  {
    titulo: 'Sistema Acadêmico',
    descricao: 'Acesse seus cursos, disciplinas e aulas disponíveis.',
    icone: '🎓',
    acao: () => {
      setPagina('aulas')
      setMensagem('')
    },
    ativo: true,
  },
  {
    titulo: 'Biblioteca Central',
    descricao: 'Explore livros, registros e conhecimentos preservados.',
    icone: '📚',
    acao: () => {
      setPagina('biblioteca')
      setMensagem('')
    },
    ativo: true,
  },
  {
    titulo: 'Quadro de Avisos',
    descricao: 'Leia comunicados da escola, professores, eventos e tribos.',
    icone: '📜',
    acao: () => {
      setPagina('quadro-avisos')
      setMensagem('')
    },
    ativo: true,
  },
  {
    titulo: 'Diário do Personagem',
    descricao: 'Registre memórias, descobertas, pesquisas e acontecimentos.',
    icone: '📖',
    acao: () => {
      setPagina('diario-personagem')
      setMensagem('')
    },
    ativo: true,
  },
  {
    titulo: 'Perfil Público',
    descricao: 'Configure e visualize a página pública do seu personagem.',
    icone: '🌐',
    acao: () => {
      setPagina('perfil-publico')
      setMensagem('')
    },
    ativo: true,
  },

  ...(perfil.cargo === 'professor' ||
  perfil.cargo === 'administrador'
    ? [
        {
          titulo: 'Painel do Professor',
          descricao:
            'Gerencie disciplinas, aulas, livros e atividades.',
          icone: '👨‍🏫',
          acao: () => {
            setPagina('painel-professor')
            setMensagem('')
          },
          ativo: true,
        },
      ]
    : []),
]

    return (
      <main
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '32px 24px 48px',
        }}
      >
        <header
          style={{
            textAlign: 'center',
            marginBottom: '34px',
          }}
        >
          <img
            src="/assets/logo/castelobruxo-logo.png"
            alt="Brasão de Castelobruxo"
            style={{
              width: 'min(360px, 86vw)',
              maxHeight: '330px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 18px 34px rgba(0,0,0,.45))',
            }}
          />
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 280px) 1fr',
            gap: '26px',
            alignItems: 'center',
            background:
              'linear-gradient(135deg, rgba(30,39,33,.98), rgba(13,18,15,.98))',
            border: '1px solid rgba(201,164,92,.45)',
            borderRadius: '22px',
            padding: '28px',
            boxShadow: '0 20px 44px rgba(0,0,0,.38)',
            marginBottom: '34px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '170px',
                height: '170px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(201,164,92,.12)',
                border: '2px solid rgba(229,193,107,.55)',
                boxShadow: '0 0 28px rgba(229,193,107,.14)',
                fontSize: '4rem',
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
          </div>

          <div>
            <p
              style={{
                color: '#aab7aa',
                textTransform: 'uppercase',
                letterSpacing: '.13em',
                margin: '0 0 8px',
                fontSize: '.82rem',
              }}
            >
              Bem-vindo de volta
            </p>

            <h1
              style={{
                color: '#f3ead2',
                fontSize: 'clamp(2rem, 5vw, 3.3rem)',
                margin: '0 0 10px',
                lineHeight: '1.05',
              }}
            >
              {nomeExibido}
            </h1>

            <p
              style={{
                color: '#e5c16b',
                fontSize: '1.08rem',
                margin: 0,
              }}
            >
              {cargoExibido} • {triboExibida}
            </p>

            <p
              style={{
                color: '#aeb9b0',
                lineHeight: '1.65',
                margin: '18px 0 0',
                maxWidth: '620px',
              }}
            >
              Os caminhos de Castelobruxo estão abertos. Escolha um dos sistemas
              abaixo para continuar sua jornada.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              gap: '16px',
              marginBottom: '18px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p
                style={{
                  color: '#8fa091',
                  textTransform: 'uppercase',
                  letterSpacing: '.14em',
                  fontSize: '.78rem',
                  margin: '0 0 6px',
                }}
              >
                Navegação
              </p>

              <h2
                style={{
                  color: '#e5c16b',
                  margin: 0,
                  fontSize: '2rem',
                }}
              >
                Menu principal
              </h2>
            </div>
          </div>

          <StudentDesk
            carregando={carregando}
            onBanco={carregarCarteira}
            onMercado={carregarMercado}
            onInventario={carregarInventario}
            onBiblioteca={() => {
              setPagina('biblioteca')
              setMensagem('')
            }}
            onDiario={() => {
              setPagina('diario-personagem')
              setMensagem('')
            }}
            onAvisos={() => {
              setPagina('quadro-avisos')
              setMensagem('')
            }}
            onPerfil={() => {
              setPagina('perfil-publico')
              setMensagem('')
            }}
            onAcademico={() => {
              setPagina('aulas')
              setMensagem('')
            }}
            onPets={() => {
              setPagina('pets')
              setMensagem('')
            }}
            usuarioId={perfil.id}
          />
        </section>

        <section
          style={{
            background:
              'linear-gradient(180deg, rgba(28,34,29,.96), rgba(15,18,16,.96))',
            border: '1px solid rgba(201,164,92,.3)',
            borderRadius: '20px',
            padding: '26px',
            boxShadow: '0 14px 32px rgba(0,0,0,.3)',
          }}
        >
          <p
            style={{
              color: '#8fa091',
              textTransform: 'uppercase',
              letterSpacing: '.14em',
              fontSize: '.78rem',
              margin: '0 0 6px',
            }}
          >
            Mural da escola
          </p>

          <h2
            style={{
              color: '#e5c16b',
              margin: '0 0 18px',
            }}
          >
            Notícias de Castelobruxo
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '14px',
            }}
          >
            {[
              ['Período de testes', 'O sistema de Castelobruxo está em evolução.'],
              ['Biblioteca Central', 'O novo acervo será aberto em breve.'],
              ['Boas-vindas', 'Explore os sistemas e prepare-se para as aulas.'],
            ].map(([titulo, descricao]) => (
              <article
                key={titulo}
                style={{
                  background: 'rgba(35,45,37,.72)',
                  border: '1px solid rgba(255,255,255,.06)',
                  borderRadius: '14px',
                  padding: '17px',
                }}
              >
                <h3
                  style={{
                    color: '#f0d27a',
                    fontSize: '1rem',
                    margin: '0 0 8px',
                  }}
                >
                  {titulo}
                </h3>

                <p
                  style={{
                    color: '#aeb9b0',
                    lineHeight: '1.5',
                    margin: 0,
                    fontSize: '.93rem',
                  }}
                >
                  {descricao}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div
          style={{
            textAlign: 'center',
            marginTop: '32px',
          }}
        >
          <button
            type="button"
            onClick={sair}
            style={{
              minWidth: '150px',
            }}
          >
            Sair
          </button>
        </div>

        <Notificacao mensagem={mensagem} />
      </main>
    )
  }

  if (!sessao && modoCadastro) {
    return (
      <Cadastro
        onVoltar={() => {
          setModoCadastro(false)
          setMensagem('')
        }}
        onCadastroConcluido={() => {
          setModoCadastro(false)
          setMensagem('Conta criada com sucesso. Agora faça o login.')
        }}
      />
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

      <button
        type="button"
        onClick={() => {
          setModoCadastro(true)
          setMensagem('')
        }}
        style={{
          width: '100%',
          marginTop: '12px',
        }}
      >
        Criar conta
      </button>

     <Notificacao mensagem={mensagem} />
    </main>
  )
}

export default App
