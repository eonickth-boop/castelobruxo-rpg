import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/rpg-cenas.css'

const perfilVazio = { nome_personagem: 'Personagem', usuario: 'jogador', tribo: 'Sem tribo', nivel: 1, cargo: 'aluno', avatar_url: '' }

export default function RpgCenas() {
  const parametros = useMemo(() => new URLSearchParams(window.location.search), [])
  const localInicial = parametros.get('local') || ''
  const nomeLocalInicial = parametros.get('nome') || ''
  const cenaInicialId = parametros.get('cena') || ''

  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cenas, setCenas] = useState([])
  const [convites, setConvites] = useState([])
  const [cenaAtual, setCenaAtual] = useState(null)
  const [postagens, setPostagens] = useState([])
  const [participantes, setParticipantes] = useState([])
  const [perfisCena, setPerfisCena] = useState({})
  const [participando, setParticipando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [tipo, setTipo] = useState('acao')
  const [conteudo, setConteudo] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [textoEdicao, setTextoEdicao] = useState('')
  const [formAberto, setFormAberto] = useState(parametros.get('nova') === '1')
  const [filtro, setFiltro] = useState(localInicial ? 'local' : 'abertas')
  const [usuarioConvite, setUsuarioConvite] = useState('')
  const [mensagemConvite, setMensagemConvite] = useState('')
  const [convitesCena, setConvitesCena] = useState([])
  const [novaCena, setNovaCena] = useState({
    titulo: '', descricao: '', local_nome: nomeLocalInicial,
    local_codigo: localInicial, visibilidade: 'publica', ordem_turnos: 'livre',
  })

  const cenasVisiveis = useMemo(() => cenas.filter((cena) => {
    if (filtro === 'convites') return false
    if (filtro === 'local') return localInicial && cena.local_codigo === localInicial
    if (filtro === 'historico') return cena.status === 'encerrada'
    if (filtro === 'privadas') return cena.visibilidade === 'privada' && cena.status !== 'encerrada'
    return cena.status !== 'encerrada'
  }), [cenas, filtro, localInicial])

  const participantesOrdenados = useMemo(() => participantes.map((item) => ({
    ...item,
    perfil: perfisCena[item.usuario_id] || perfilVazio,
  })), [participantes, perfisCena])

  const convitesPendentes = useMemo(() => convites.filter((convite) => convite.status === 'pendente'), [convites])

  useEffect(() => { iniciar() }, [])

  useEffect(() => {
    if (!cenaAtual?.id || !sessao?.user?.id) return undefined
    const intervalo = window.setInterval(() => carregarCena(cenaAtual, sessao, false), 8000)
    return () => window.clearInterval(intervalo)
  }, [cenaAtual?.id, sessao?.user?.id])

  async function iniciar() {
    setCarregando(true)
    const { data } = await supabase.auth.getSession()
    const novaSessao = data.session
    setSessao(novaSessao)
    if (!novaSessao?.user) { setCarregando(false); return }

    const [{ data: dadosPerfil }, { data: dadosCenas, error }, { data: dadosConvites }] = await Promise.all([
      supabase.from('perfis').select('*').eq('id', novaSessao.user.id).single(),
      supabase.from('rpg_cenas').select('*').order('criado_em', { ascending: false }),
      supabase.from('rpg_convites').select('*, rpg_cenas(id,titulo,descricao,local_nome,status,visibilidade,criador_id)').eq('convidado_id', novaSessao.user.id).order('criado_em', { ascending: false }),
    ])

    setPerfil(dadosPerfil)
    if (error) setMensagem('Não foi possível carregar as cenas.')
    const lista = dadosCenas || []
    setCenas(lista)
    setConvites(dadosConvites || [])
    setCarregando(false)

    if (cenaInicialId) {
      const cena = lista.find((item) => item.id === cenaInicialId)
      if (cena) carregarCena(cena, novaSessao)
    }
  }

  async function recarregarListas() {
    const [{ data: dadosCenas }, { data: dadosConvites }] = await Promise.all([
      supabase.from('rpg_cenas').select('*').order('criado_em', { ascending: false }),
      supabase.from('rpg_convites').select('*, rpg_cenas(id,titulo,descricao,local_nome,status,visibilidade,criador_id)').eq('convidado_id', sessao.user.id).order('criado_em', { ascending: false }),
    ])
    setCenas(dadosCenas || [])
    setConvites(dadosConvites || [])
  }

  async function carregarCena(cena, sessaoFornecida = sessao, mostrarErro = true) {
    if (mostrarErro) setMensagem('')
    const usuarioId = sessaoFornecida?.user?.id
    const podeNarrar = cena.criador_id === usuarioId

    const consultas = [
      supabase.from('rpg_postagens').select('*').eq('cena_id', cena.id).order('criado_em'),
      supabase.from('rpg_participantes').select('*').eq('cena_id', cena.id).order('entrou_em'),
    ]
    if (podeNarrar) consultas.push(supabase.from('rpg_convites').select('*').eq('cena_id', cena.id).order('criado_em', { ascending: false }))

    const resultados = await Promise.all(consultas)
    const posts = resultados[0].data
    const listaParticipantes = resultados[1].data
    if (resultados[0].error || resultados[1].error) {
      if (mostrarErro) setMensagem('Você não tem acesso a esta cena ou ela não pôde ser atualizada.')
      return
    }

    const listaConvites = podeNarrar ? (resultados[2]?.data || []) : []
    const ids = [...new Set([
      ...(listaParticipantes || []).map((item) => item.usuario_id),
      ...(posts || []).map((item) => item.autor_id),
      ...listaConvites.map((item) => item.convidado_id),
    ])]
    let mapaPerfis = {}
    if (ids.length) {
      const { data: perfis } = await supabase.from('perfis')
        .select('id, usuario, nome_personagem, avatar_url, cargo, tribo, nivel')
        .in('id', ids)
      mapaPerfis = Object.fromEntries((perfis || []).map((item) => [item.id, item]))
    }

    setCenaAtual(cena)
    setPostagens(posts || [])
    setParticipantes(listaParticipantes || [])
    setConvitesCena(listaConvites)
    setPerfisCena(mapaPerfis)
    setParticipando((listaParticipantes || []).some((item) => item.usuario_id === usuarioId))
    window.history.replaceState({}, '', `/rpg?cena=${cena.id}`)
  }

  async function criarCena(evento) {
    evento.preventDefault()
    setMensagem('')
    const { data, error } = await supabase.from('rpg_cenas').insert({
      ...novaCena,
      local_nome: novaCena.local_nome.trim() || 'Castelobruxo',
      local_codigo: novaCena.local_codigo || null,
      criador_id: sessao.user.id,
    }).select().single()
    if (error) { setMensagem(error.message || 'Não foi possível criar a cena.'); return }
    setCenas((atuais) => [data, ...atuais])
    setNovaCena({ titulo: '', descricao: '', local_nome: nomeLocalInicial, local_codigo: localInicial, visibilidade: 'publica', ordem_turnos: 'livre' })
    setFormAberto(false)
    carregarCena(data)
  }

  async function entrarNaCena() {
    const { error } = await supabase.from('rpg_participantes').insert({ cena_id: cenaAtual.id, usuario_id: sessao.user.id, papel: cenaAtual.criador_id === sessao.user.id ? 'narrador' : 'jogador' })
    if (error && error.code !== '23505') { setMensagem(error.message || 'Não foi possível entrar na cena.'); return }
    await carregarCena(cenaAtual)
  }

  async function sairDaCena() {
    if (!window.confirm('Deseja sair desta cena?')) return
    const { error } = await supabase.from('rpg_participantes').delete().eq('cena_id', cenaAtual.id).eq('usuario_id', sessao.user.id)
    if (error) { setMensagem(error.message || 'Não foi possível sair da cena.'); return }
    voltarLista()
    await recarregarListas()
  }

  async function enviarConvite(evento) {
    evento.preventDefault()
    const usuario = usuarioConvite.trim().toLowerCase()
    if (!usuario) return
    const { error } = await supabase.rpc('rpg_convidar_usuario', { p_cena_id: cenaAtual.id, p_usuario: usuario, p_mensagem: mensagemConvite.trim() })
    if (error) { setMensagem(error.message || 'Não foi possível enviar o convite.'); return }
    setUsuarioConvite('')
    setMensagemConvite('')
    setMensagem(`Convite enviado para @${usuario}.`)
    await carregarCena(cenaAtual)
  }

  async function responderConvite(convite, aceitar) {
    const { error } = await supabase.rpc('rpg_responder_convite', { p_convite_id: convite.id, p_aceitar: aceitar })
    if (error) { setMensagem(error.message || 'Não foi possível responder ao convite.'); return }
    await recarregarListas()
    if (aceitar) {
      const cena = cenas.find((item) => item.id === convite.cena_id) || convite.rpg_cenas
      if (cena) await carregarCena(cena)
    } else setMensagem('Convite recusado.')
  }

  async function cancelarConvite(convite) {
    if (!window.confirm('Cancelar este convite?')) return
    const { error } = await supabase.rpc('rpg_cancelar_convite', { p_convite_id: convite.id })
    if (error) { setMensagem(error.message || 'Não foi possível cancelar o convite.'); return }
    await carregarCena(cenaAtual)
  }

  async function publicar(evento) {
    evento.preventDefault()
    const texto = conteudo.trim()
    if (!texto) return
    const { data, error } = await supabase.from('rpg_postagens').insert({ cena_id: cenaAtual.id, autor_id: sessao.user.id, tipo, conteudo: texto }).select().single()
    if (error) { setMensagem(error.message || 'Não foi possível publicar.'); return }
    setPostagens((atuais) => [...atuais, data])
    setConteudo('')
  }

  async function salvarEdicao(postagem) {
    const texto = textoEdicao.trim()
    if (!texto) return
    const { data, error } = await supabase.from('rpg_postagens').update({ conteudo: texto, editado_em: new Date().toISOString() }).eq('id', postagem.id).select().single()
    if (error) { setMensagem(error.message || 'Não foi possível editar.'); return }
    setPostagens((atuais) => atuais.map((item) => item.id === data.id ? data : item))
    setEditandoId(null); setTextoEdicao('')
  }

  async function excluirPostagem(postagem) {
    if (!window.confirm('Excluir esta postagem permanentemente?')) return
    const { error } = await supabase.from('rpg_postagens').delete().eq('id', postagem.id)
    if (error) { setMensagem(error.message || 'Não foi possível excluir.'); return }
    setPostagens((atuais) => atuais.filter((item) => item.id !== postagem.id))
  }

  async function mudarStatus(status) {
    const acao = status === 'encerrada' ? 'encerrar' : status === 'pausada' ? 'pausar' : 'retomar'
    if (!window.confirm(`Deseja ${acao} esta cena?`)) return
    const { data, error } = await supabase.from('rpg_cenas').update({ status, atualizado_em: new Date().toISOString() }).eq('id', cenaAtual.id).select().single()
    if (error) { setMensagem(error.message || 'Não foi possível atualizar a cena.'); return }
    setCenaAtual(data)
    setCenas((atuais) => atuais.map((cena) => cena.id === data.id ? data : cena))
  }

  function voltarLista() {
    setCenaAtual(null); setPostagens([]); setParticipantes([]); setPerfisCena({}); setConvitesCena([])
    window.history.replaceState({}, '', localInicial ? `/rpg?local=${encodeURIComponent(localInicial)}&nome=${encodeURIComponent(nomeLocalInicial)}` : '/rpg')
  }

  function nomeDoPerfil(dados) { return dados?.nome_personagem || dados?.usuario || 'Personagem' }

  if (carregando) return <main className="rpg-shell"><p>Carregando o salão de interpretação...</p></main>
  if (!sessao) return <main className="rpg-shell rpg-centralizado"><h1>RPG Textual</h1><p>Entre na sua conta para participar das cenas.</p><button onClick={() => { window.location.href = '/' }}>Ir para o login</button></main>

  if (cenaAtual) {
    const podeNarrar = cenaAtual.criador_id === sessao.user.id
    const ultimaPostagem = postagens.at(-1)
    const ultimoPerfil = ultimaPostagem ? perfisCena[ultimaPostagem.autor_id] : null
    const convitePendente = convites.find((item) => item.cena_id === cenaAtual.id && item.status === 'pendente')
    const podeEntrar = cenaAtual.visibilidade === 'publica' || podeNarrar || convites.some((item) => item.cena_id === cenaAtual.id && item.status === 'aceito')

    return (
      <main className="rpg-shell rpg-shell-cena">
        <button className="rpg-voltar" onClick={voltarLista}>← Voltar às cenas</button>
        <header className="rpg-cabecalho-cena">
          <div><span>{cenaAtual.local_nome}</span><h1>{cenaAtual.titulo}</h1><p>{cenaAtual.descricao || 'Uma nova história está começando.'}</p></div>
          <div className="rpg-badges"><strong>{cenaAtual.status}</strong><small>{cenaAtual.visibilidade === 'privada' ? '🔒 Privada' : 'Pública'}</small><small>{cenaAtual.ordem_turnos === 'fixa' ? 'Turnos fixos' : 'Turnos livres'}</small></div>
        </header>

        {convitePendente && !participando && (
          <section className="rpg-convite-destaque"><div><small>Convite pendente</small><h2>Você foi convidado para esta cena</h2><p>{convitePendente.mensagem || 'O narrador deseja sua participação.'}</p></div><div><button onClick={() => responderConvite(convitePendente, true)}>Aceitar convite</button><button className="rpg-secundario" onClick={() => responderConvite(convitePendente, false)}>Recusar</button></div></section>
        )}

        <section className="rpg-resumo-cena"><div><small>Participantes</small><strong>{participantes.length}</strong></div><div><small>Turnos publicados</small><strong>{postagens.length}</strong></div><div><small>Último turno</small><strong>{ultimoPerfil ? nomeDoPerfil(ultimoPerfil) : 'Nenhum'}</strong></div><div><small>Acesso</small><strong>{cenaAtual.visibilidade === 'privada' ? 'Restrito' : 'Livre'}</strong></div></section>

        <div className="rpg-layout-cena">
          <section className="rpg-coluna-principal">
            <article className="rpg-ambiente"><span>Descrição do ambiente</span><p>{cenaAtual.descricao || 'O cenário ainda não recebeu uma descrição detalhada.'}</p></article>
            <section className="rpg-postagens">
              {postagens.length === 0 ? <div className="rpg-vazio">Ainda não há turnos nesta cena.</div> : postagens.map((postagem) => {
                const autor = perfisCena[postagem.autor_id] || perfilVazio
                const propria = postagem.autor_id === sessao.user.id
                return <article key={postagem.id} className={`rpg-postagem rpg-${postagem.tipo}`}><div className="rpg-postagem-avatar">{autor.avatar_url ? <img src={autor.avatar_url} alt={nomeDoPerfil(autor)} /> : <span>{nomeDoPerfil(autor).slice(0, 1).toUpperCase()}</span>}</div><div className="rpg-postagem-corpo"><header><div><strong>{nomeDoPerfil(autor)}</strong><small>{autor.tribo || 'Sem tribo'} · Nível {autor.nivel || 1} · {autor.cargo || 'aluno'}</small></div><div className="rpg-meta-turno"><span>{postagem.tipo}</span><time>{new Date(postagem.criado_em).toLocaleString('pt-BR')}</time></div></header>{editandoId === postagem.id ? <div className="rpg-edicao-inline"><textarea value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} rows={5} maxLength={5000} /><div><button onClick={() => salvarEdicao(postagem)}>Salvar</button><button className="rpg-secundario" onClick={() => setEditandoId(null)}>Cancelar</button></div></div> : <p>{postagem.conteudo}</p>}{postagem.editado_em && <small className="rpg-editado">Editado em {new Date(postagem.editado_em).toLocaleString('pt-BR')}</small>}{propria && editandoId !== postagem.id && <div className="rpg-acoes-postagem"><button onClick={() => { setEditandoId(postagem.id); setTextoEdicao(postagem.conteudo) }}>Editar</button><button onClick={() => excluirPostagem(postagem)}>Excluir</button></div>}</div></article>
              })}
            </section>

            {cenaAtual.status === 'aberta' && !participando && podeEntrar && !convitePendente && <button className="rpg-entrar" onClick={entrarNaCena}>Entrar nesta cena</button>}
            {cenaAtual.status === 'aberta' && participando && <form className="rpg-editor" onSubmit={publicar}><div><label>Tipo do turno</label><select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="acao">Ação</option><option value="fala">Fala</option><option value="pensamento">Pensamento</option>{podeNarrar && <option value="narracao">Narração</option>}</select></div><textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Descreva o turno do seu personagem..." maxLength={5000} rows={7} />{conteudo.trim() && <div className="rpg-preview"><small>Pré-visualização</small><p>{conteudo}</p></div>}<button type="submit">Publicar turno</button></form>}
            {cenaAtual.status === 'pausada' && <div className="rpg-vazio">A cena está pausada pelo narrador.</div>}
            {mensagem && <p className="rpg-mensagem">{mensagem}</p>}
          </section>

          <aside className="rpg-painel-lateral">
            <section><h2>Participantes</h2>{participantesOrdenados.length === 0 ? <p>Ninguém entrou ainda.</p> : participantesOrdenados.map((item) => <div className="rpg-participante" key={item.id}><div>{item.perfil.avatar_url ? <img src={item.perfil.avatar_url} alt={nomeDoPerfil(item.perfil)} /> : <span>{nomeDoPerfil(item.perfil).slice(0, 1).toUpperCase()}</span>}</div><p><strong>{nomeDoPerfil(item.perfil)}</strong><small>{item.papel} · {item.perfil.tribo || 'Sem tribo'}</small></p></div>)}</section>
            {participando && !podeNarrar && <button className="rpg-secundario" onClick={sairDaCena}>Sair da cena</button>}
            {podeNarrar && <><section className="rpg-convites-painel"><h2>Convidar jogador</h2><form onSubmit={enviarConvite}><input value={usuarioConvite} onChange={(e) => setUsuarioConvite(e.target.value)} placeholder="Nome de usuário" required /><textarea value={mensagemConvite} onChange={(e) => setMensagemConvite(e.target.value)} placeholder="Mensagem opcional" rows={3} maxLength={500} /><button type="submit">Enviar convite</button></form>{convitesCena.length > 0 && <div className="rpg-lista-convites">{convitesCena.map((convite) => { const convidado = perfisCena[convite.convidado_id] || perfilVazio; return <article key={convite.id}><div><strong>{nomeDoPerfil(convidado)}</strong><small>@{convidado.usuario} · {convite.status}</small></div>{convite.status === 'pendente' && <button className="rpg-secundario" onClick={() => cancelarConvite(convite)}>Cancelar</button>}</article> })}</div>}</section><section className="rpg-controles-narrador"><h2>Painel do narrador</h2>{cenaAtual.status === 'aberta' && <button onClick={() => mudarStatus('pausada')}>Pausar cena</button>}{cenaAtual.status === 'pausada' && <button onClick={() => mudarStatus('aberta')}>Retomar cena</button>}{cenaAtual.status !== 'encerrada' && <button className="rpg-encerrar" onClick={() => mudarStatus('encerrada')}>Encerrar cena</button>}</section></>}
          </aside>
        </div>
      </main>
    )
  }

  return (
    <main className="rpg-shell">
      <header className="rpg-topo"><div><span>{localInicial ? nomeLocalInicial : 'Castelobruxo'}</span><h1>{localInicial ? `Cenas em ${nomeLocalInicial}` : 'Salão de Interpretação'}</h1><p>Crie cenas, interprete seu personagem e continue a história pelo site.</p></div><div className="rpg-acoes-topo"><button onClick={() => setFormAberto((valor) => !valor)}>Nova cena</button><button className="rpg-secundario" onClick={() => { window.location.href = '/' }}>Voltar ao portal</button></div></header>
      <div className="rpg-acoes-topo rpg-filtros"><button className={filtro === 'abertas' ? '' : 'rpg-secundario'} onClick={() => setFiltro('abertas')}>Cenas abertas</button>{localInicial && <button className={filtro === 'local' ? '' : 'rpg-secundario'} onClick={() => setFiltro('local')}>Neste local</button>}<button className={filtro === 'privadas' ? '' : 'rpg-secundario'} onClick={() => setFiltro('privadas')}>Minhas privadas</button><button className={filtro === 'convites' ? '' : 'rpg-secundario'} onClick={() => setFiltro('convites')}>Convites {convitesPendentes.length > 0 && <span className="rpg-contador-convites">{convitesPendentes.length}</span>}</button><button className={filtro === 'historico' ? '' : 'rpg-secundario'} onClick={() => setFiltro('historico')}>Histórico</button></div>

      {formAberto && <form className="rpg-nova-cena" onSubmit={criarCena}><input required minLength={3} maxLength={120} placeholder="Título da cena" value={novaCena.titulo} onChange={(e) => setNovaCena({ ...novaCena, titulo: e.target.value })} /><input placeholder="Local" value={novaCena.local_nome} onChange={(e) => setNovaCena({ ...novaCena, local_nome: e.target.value, local_codigo: '' })} readOnly={Boolean(localInicial)} /><textarea placeholder="Descrição inicial e ambiente" rows={5} value={novaCena.descricao} onChange={(e) => setNovaCena({ ...novaCena, descricao: e.target.value })} /><select value={novaCena.visibilidade} onChange={(e) => setNovaCena({ ...novaCena, visibilidade: e.target.value })}><option value="publica">Pública — qualquer jogador pode entrar</option><option value="privada">Privada — somente convidados</option></select><select value={novaCena.ordem_turnos} onChange={(e) => setNovaCena({ ...novaCena, ordem_turnos: e.target.value })}><option value="livre">Turnos livres</option><option value="fixa">Ordem fixa</option></select><button type="submit">Criar e abrir cena</button></form>}

      {filtro === 'convites' ? <section className="rpg-lista-convites-recebidos">{convites.length === 0 ? <div className="rpg-vazio">Você ainda não recebeu convites.</div> : convites.map((convite) => <article key={convite.id} className={`rpg-convite-card rpg-convite-${convite.status}`}><div><span>{convite.rpg_cenas?.local_nome || 'Castelobruxo'}</span><h2>{convite.rpg_cenas?.titulo || 'Cena privada'}</h2><p>{convite.mensagem || convite.rpg_cenas?.descricao || 'Você foi convidado para participar.'}</p><small>Status: {convite.status}</small></div>{convite.status === 'pendente' ? <div><button onClick={() => responderConvite(convite, true)}>Aceitar</button><button className="rpg-secundario" onClick={() => responderConvite(convite, false)}>Recusar</button></div> : convite.status === 'aceito' && <button onClick={() => carregarCena(convite.rpg_cenas)}>Abrir cena</button>}</article>)}</section> : <section className="rpg-grade-cenas">{cenasVisiveis.length === 0 ? <div className="rpg-vazio">Nenhuma cena encontrada neste filtro.</div> : cenasVisiveis.map((cena) => <button key={cena.id} className="rpg-card-cena" onClick={() => carregarCena(cena)}><span>{cena.local_nome}</span><h2>{cena.visibilidade === 'privada' ? '🔒 ' : ''}{cena.titulo}</h2><p>{cena.descricao || 'Sem descrição.'}</p><footer><strong>{cena.status}</strong><small>{new Date(cena.criado_em).toLocaleDateString('pt-BR')}</small></footer></button>)}</section>}
      {mensagem && <p className="rpg-mensagem">{mensagem}</p>}
    </main>
  )
}
