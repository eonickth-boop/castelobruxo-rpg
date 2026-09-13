import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/comunidade-social.css'

const TIPOS = ['colega','amigo','melhor amigo','rival','familiar','mentor','parceiro de aventuras']

function nomePessoa(pessoa) {
  return pessoa?.nome_personagem || pessoa?.usuario || 'Personagem'
}

function comLimite(promessa, milissegundos = 8000) {
  let timer
  const limite = new Promise((_, rejeitar) => {
    timer = window.setTimeout(() => rejeitar(new Error('Tempo limite excedido.')), milissegundos)
  })
  return Promise.race([promessa, limite]).finally(() => window.clearTimeout(timer))
}

export default function ComunidadeSocialStandalone() {
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [pessoas, setPessoas] = useState([])
  const [amizades, setAmizades] = useState([])
  const [bloqueios, setBloqueios] = useState([])
  const [aba, setAba] = useState('descobrir')
  const [busca, setBusca] = useState('')
  const [tribo, setTribo] = useState('todas')
  const [ano, setAno] = useState('todos')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    setMensagem('')

    try {
      const { data: dadosSessao, error: erroSessao } = await comLimite(
        supabase.auth.getSession(),
        5000,
      )

      if (erroSessao) throw erroSessao

      const novaSessao = dadosSessao?.session ?? null
      setSessao(novaSessao)

      if (!novaSessao?.user) return

      const resultados = await Promise.allSettled([
        comLimite(
          supabase
            .from('perfis')
            .select('id,usuario,nome_personagem,avatar_url,tribo,ano,nivel,cargo')
            .eq('id', novaSessao.user.id)
            .maybeSingle(),
        ),
        comLimite(
          supabase
            .from('perfis')
            .select('id,usuario,nome_personagem,avatar_url,tribo,ano,nivel,cargo')
            .eq('ativo', true)
            .neq('id', novaSessao.user.id)
            .order('nome_personagem'),
        ),
        comLimite(
          supabase
            .from('social_amizades')
            .select('*')
            .order('atualizado_em', { ascending: false }),
        ),
        comLimite(
          supabase
            .from('social_bloqueios')
            .select('*')
            .order('criado_em', { ascending: false }),
        ),
      ])

      const valor = (resultado) => resultado.status === 'fulfilled' ? resultado.value : null
      const resPerfil = valor(resultados[0])
      const resPessoas = valor(resultados[1])
      const resAmizades = valor(resultados[2])
      const resBloqueios = valor(resultados[3])

      setPerfil(resPerfil?.data ?? null)
      setPessoas(resPessoas?.data ?? [])
      setAmizades(resAmizades?.data ?? [])
      setBloqueios(resBloqueios?.data ?? [])

      const erros = [
        resPerfil?.error,
        resPessoas?.error,
        resAmizades?.error,
        resBloqueios?.error,
        ...resultados.filter((r) => r.status === 'rejected').map((r) => r.reason),
      ].filter(Boolean)

      if (erros.length) {
        console.error('Falha parcial ao carregar a Comunidade:', erros)
        setMensagem('Parte dos dados da Comunidade não pôde ser carregada. Tente atualizar a página.')
      }
    } catch (erro) {
      console.error('Falha ao abrir a Comunidade:', erro)
      setMensagem(erro?.message || 'Não foi possível abrir a Comunidade.')
    } finally {
      setCarregando(false)
    }
  }

  const bloqueadosIds = useMemo(() => new Set(bloqueios.map((b) => b.bloqueado_id)), [bloqueios])
  const mapaPessoas = useMemo(() => new Map(pessoas.map((p) => [p.id, p])), [pessoas])
  const pedidosRecebidos = amizades.filter((a) => a.destinatario_id === perfil?.id && a.status === 'pendente')
  const pedidosEnviados = amizades.filter((a) => a.solicitante_id === perfil?.id && a.status === 'pendente')
  const amizadesAceitas = amizades.filter((a) => a.status === 'aceita')

  const amigos = amizadesAceitas.map((a) => {
    const outroId = a.solicitante_id === perfil?.id ? a.destinatario_id : a.solicitante_id
    return { amizade: a, pessoa: mapaPessoas.get(outroId), classificacao: a.solicitante_id === perfil?.id ? a.classificacao_solicitante : a.classificacao_destinatario }
  }).filter((item) => item.pessoa)

  const tribos = [...new Set(pessoas.map((p) => p.tribo).filter(Boolean))].sort()
  const anos = [...new Set(pessoas.map((p) => Number(p.ano)).filter(Number.isFinite))].sort((a,b) => a-b)

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return pessoas.filter((p) => {
      if (bloqueadosIds.has(p.id)) return false
      const texto = `${p.nome_personagem || ''} ${p.usuario || ''} ${p.tribo || ''}`.toLowerCase()
      return (!termo || texto.includes(termo)) && (tribo === 'todas' || p.tribo === tribo) && (ano === 'todos' || Number(p.ano) === Number(ano))
    })
  }, [pessoas, busca, tribo, ano, bloqueadosIds])

  function estadoCom(pessoaId) {
    return amizades.find((a) => (a.solicitante_id === perfil?.id && a.destinatario_id === pessoaId) || (a.solicitante_id === pessoaId && a.destinatario_id === perfil?.id)) || null
  }

  async function acaoRpc(nome, parametros, aviso) {
    setMensagem('')
    const { error } = await supabase.rpc(nome, parametros)
    if (error) { setMensagem(error.message || 'Não foi possível concluir a ação.'); return }
    setMensagem(aviso)
    await carregar()
  }

  async function classificar(amizade, valor) {
    const campo = amizade.solicitante_id === perfil.id ? 'classificacao_solicitante' : 'classificacao_destinatario'
    const { error } = await supabase.from('social_amizades').update({ [campo]: valor || null, atualizado_em: new Date().toISOString() }).eq('id', amizade.id)
    if (error) { setMensagem('Não foi possível atualizar o vínculo.'); return }
    await carregar()
  }

  async function iniciarChat(pessoa) {
    setMensagem('')
    const { data, error } = await supabase.rpc('social_obter_ou_criar_conversa', { p_outro: pessoa.id })
    if (error) { setMensagem(error.message || 'Não foi possível iniciar a conversa.'); return }
    window.location.href = `/chat?conversa=${encodeURIComponent(data)}`
  }

  function CartaoPessoa({ pessoa }) {
    const estado = estadoCom(pessoa.id)
    const pedidoRecebido = estado?.status === 'pendente' && estado.destinatario_id === perfil.id
    return <article className="social-card">
      <div className="social-avatar">{pessoa.avatar_url ? <img src={pessoa.avatar_url} alt="" /> : <span>{nomePessoa(pessoa)[0]}</span>}</div>
      <div className="social-identidade"><h3>{nomePessoa(pessoa)}</h3><p>@{pessoa.usuario}</p><small>{pessoa.tribo || 'Sem tribo'} · {pessoa.ano || 1}º ano · nível {pessoa.nivel || 1}</small></div>
      <div className="social-card-acoes">
        {!estado && <button onClick={() => acaoRpc('social_enviar_pedido', { p_destinatario: pessoa.id }, 'Pedido de amizade enviado.')}>Adicionar</button>}
        {estado?.status === 'pendente' && !pedidoRecebido && <button disabled>Pedido enviado</button>}
        {pedidoRecebido && <><button onClick={() => acaoRpc('social_responder_pedido', { p_pedido: estado.id, p_aceitar: true }, 'Amizade aceita.')}>Aceitar</button><button className="secundario" onClick={() => acaoRpc('social_responder_pedido', { p_pedido: estado.id, p_aceitar: false }, 'Pedido recusado.')}>Recusar</button></>}
        {estado?.status === 'aceita' && <><button onClick={() => iniciarChat(pessoa)}>Conversar</button><button className="secundario" onClick={() => acaoRpc('social_desfazer_amizade', { p_pessoa: pessoa.id }, 'Amizade desfeita.')}>Desfazer amizade</button></>}
        <button className="perigo" onClick={() => acaoRpc('social_bloquear', { p_pessoa: pessoa.id }, 'Personagem bloqueado.')}>Bloquear</button>
      </div>
    </article>
  }

  if (carregando) return <main className="social-shell"><p>Preparando a Comunidade...</p></main>
  if (!sessao) return <main className="social-shell social-central"><h1>Comunidade</h1><p>Entre na sua conta para acessar.</p><button onClick={() => { window.location.href = '/' }}>Ir para o portal</button></main>
  if (!perfil) return <main className="social-shell social-central"><h1>Comunidade</h1><p>{mensagem || 'Não foi possível carregar seu perfil.'}</p><button onClick={carregar}>Tentar novamente</button><button onClick={() => { window.location.href = '/' }}>Voltar ao portal</button></main>

  return <main className="social-shell">
    <header className="social-hero"><button onClick={() => { window.location.href = '/' }}>← Portal</button><div><small>Checkpoint 14.2</small><h1>Comunidade de Castelobruxo</h1><p>Encontre personagens, crie vínculos e converse em tempo real.</p></div><aside><span>Amigos</span><strong>{amigos.length}</strong></aside></header>

    <nav className="social-abas">
      <button className={aba === 'descobrir' ? 'ativo' : ''} onClick={() => setAba('descobrir')}>Descobrir</button>
      <button className={aba === 'amigos' ? 'ativo' : ''} onClick={() => setAba('amigos')}>Amigos <span>{amigos.length}</span></button>
      <button className={aba === 'pedidos' ? 'ativo' : ''} onClick={() => setAba('pedidos')}>Pedidos <span>{pedidosRecebidos.length}</span></button>
      <button className={aba === 'bloqueados' ? 'ativo' : ''} onClick={() => setAba('bloqueados')}>Bloqueados</button>
      <button onClick={() => { window.location.href = '/chat' }}>💬 Chat privado</button>
    </nav>

    {mensagem && <p className="social-mensagem">{mensagem}</p>}

    {aba === 'descobrir' && <section className="social-conteudo"><div className="social-filtros"><input placeholder="Buscar por nome ou usuário" value={busca} onChange={(e) => setBusca(e.target.value)} /><select value={tribo} onChange={(e) => setTribo(e.target.value)}><option value="todas">Todas as tribos</option>{tribos.map((t) => <option key={t}>{t}</option>)}</select><select value={ano} onChange={(e) => setAno(e.target.value)}><option value="todos">Todos os anos</option>{anos.map((a) => <option key={a} value={a}>{a}º ano</option>)}</select></div><div className="social-grade">{resultados.map((p) => <CartaoPessoa key={p.id} pessoa={p} />)}</div>{resultados.length === 0 && <p className="social-vazio">Nenhum personagem encontrado.</p>}</section>}

    {aba === 'amigos' && <section className="social-conteudo"><div className="social-grade">{amigos.map(({ amizade, pessoa, classificacao }) => <article className="social-card" key={amizade.id}><div className="social-avatar">{pessoa.avatar_url ? <img src={pessoa.avatar_url} alt="" /> : <span>{nomePessoa(pessoa)[0]}</span>}</div><div className="social-identidade"><h3>{nomePessoa(pessoa)}</h3><p>@{pessoa.usuario}</p><small>{pessoa.tribo || 'Sem tribo'} · nível {pessoa.nivel || 1}</small><select value={classificacao || ''} onChange={(e) => classificar(amizade, e.target.value)}><option value="">Sem classificação</option>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></div><div className="social-card-acoes"><button onClick={() => iniciarChat(pessoa)}>Conversar</button><button onClick={() => { window.location.href = `/?pagina=correio-magico&destinatario=${encodeURIComponent(pessoa.usuario)}` }}>Enviar carta</button><button className="secundario" onClick={() => acaoRpc('social_desfazer_amizade', { p_pessoa: pessoa.id }, 'Amizade desfeita.')}>Desfazer amizade</button></div></article>)}</div>{amigos.length === 0 && <p className="social-vazio">Sua lista de amigos ainda está vazia.</p>}</section>}

    {aba === 'pedidos' && <section className="social-conteudo"><h2>Recebidos</h2><div className="social-grade">{pedidosRecebidos.map((p) => mapaPessoas.get(p.solicitante_id)).filter(Boolean).map((p) => <CartaoPessoa key={p.id} pessoa={p} />)}</div><h2>Enviados</h2><div className="social-grade">{pedidosEnviados.map((p) => mapaPessoas.get(p.destinatario_id)).filter(Boolean).map((p) => <CartaoPessoa key={p.id} pessoa={p} />)}</div></section>}

    {aba === 'bloqueados' && <section className="social-conteudo"><div className="social-grade">{bloqueios.map((b) => ({ bloqueio: b, pessoa: mapaPessoas.get(b.bloqueado_id) })).filter((x) => x.pessoa).map(({ bloqueio, pessoa }) => <article className="social-card" key={bloqueio.id}><div className="social-avatar">{pessoa.avatar_url ? <img src={pessoa.avatar_url} alt="" /> : <span>{nomePessoa(pessoa)[0]}</span>}</div><div className="social-identidade"><h3>{nomePessoa(pessoa)}</h3><p>@{pessoa.usuario}</p></div><div className="social-card-acoes"><button onClick={() => acaoRpc('social_desbloquear', { p_pessoa: pessoa.id }, 'Personagem desbloqueado.')}>Desbloquear</button></div></article>)}</div>{bloqueios.length === 0 && <p className="social-vazio">Nenhum personagem bloqueado.</p>}</section>}
  </main>
}
