import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/chat-privado.css'

function hora(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ChatPrivadoStandalone() {
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [conversas, setConversas] = useState([])
  const [mensagens, setMensagens] = useState([])
  const [selecionada, setSelecionada] = useState(null)
  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')
  const [resposta, setResposta] = useState(null)
  const [editando, setEditando] = useState(null)
  const [aviso, setAviso] = useState('')
  const fimRef = useRef(null)

  useEffect(() => { iniciar() }, [])
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens])

  useEffect(() => {
    if (!selecionada?.id) return
    const canal = supabase.channel(`chat:${selecionada.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_mensagens', filter: `conversa_id=eq.${selecionada.id}` }, () => carregarMensagens(selecionada.id))
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [selecionada?.id])

  async function iniciar() {
    const { data } = await supabase.auth.getSession()
    const s = data.session
    setSessao(s)
    if (!s?.user) return
    const { data: p } = await supabase.from('perfis').select('id,usuario,nome_personagem,avatar_url').eq('id', s.user.id).single()
    setPerfil(p)
    await carregarConversas(s.user.id)
  }

  async function carregarConversas(meuId = perfil?.id) {
    if (!meuId) return
    const { data, error } = await supabase.from('social_conversas').select(`id,usuario_a,usuario_b,atualizado_em,a:perfis!social_conversas_usuario_a_fkey(id,usuario,nome_personagem,avatar_url,tribo),b:perfis!social_conversas_usuario_b_fkey(id,usuario,nome_personagem,avatar_url,tribo),social_conversa_estado(silenciada,lida_ate,usuario_id),social_mensagens(id,conteudo,autor_id,criado_em,apagada)`).order('atualizado_em',{ascending:false})
    if (error) { setAviso('Não foi possível carregar as conversas.'); return }
    const lista = (data || []).map(c => {
      const outro = c.usuario_a === meuId ? c.b : c.a
      const estado = (c.social_conversa_estado || []).find(e => e.usuario_id === meuId)
      const ultimas = [...(c.social_mensagens || [])].sort((x,y)=>new Date(y.criado_em)-new Date(x.criado_em))
      const ultima = ultimas[0]
      const naoLidas = ultimas.filter(m => m.autor_id !== meuId && (!estado?.lida_ate || new Date(m.criado_em) > new Date(estado.lida_ate))).length
      return { ...c, outro, estado, ultima, naoLidas }
    })
    setConversas(lista)
  }

  async function carregarMensagens(conversaId) {
    const { data, error } = await supabase.from('social_mensagens').select(`*,autor:perfis!social_mensagens_autor_id_fkey(id,usuario,nome_personagem,avatar_url),resposta:social_mensagens!social_mensagens_respondendo_a_fkey(id,conteudo,autor_id)`).eq('conversa_id',conversaId).order('criado_em')
    if (error) { setAviso('Não foi possível carregar as mensagens.'); return }
    setMensagens(data || [])
    if (perfil?.id) await supabase.from('social_conversa_estado').upsert({ conversa_id: conversaId, usuario_id: perfil.id, lida_ate: new Date().toISOString() }, { onConflict:'conversa_id,usuario_id' })
    carregarConversas()
  }

  async function abrir(conversa) {
    setSelecionada(conversa); setResposta(null); setEditando(null); setAviso('')
    await carregarMensagens(conversa.id)
  }

  async function enviar(e) {
    e.preventDefault()
    const conteudo = texto.trim()
    if (!conteudo || !selecionada) return
    if (editando) {
      const { error } = await supabase.from('social_mensagens').update({ conteudo, editada:true, atualizado_em:new Date().toISOString() }).eq('id',editando.id).eq('autor_id',perfil.id)
      if (error) { setAviso(error.message); return }
    } else {
      const { error } = await supabase.rpc('social_enviar_mensagem',{ p_conversa:selecionada.id,p_conteudo:conteudo,p_resposta:resposta?.id || null })
      if (error) { setAviso(error.message || 'Não foi possível enviar.'); return }
    }
    setTexto(''); setResposta(null); setEditando(null); await carregarMensagens(selecionada.id)
  }

  async function apagar(m) {
    if (!confirm('Apagar esta mensagem?')) return
    await supabase.from('social_mensagens').update({ apagada:true, conteudo:'Mensagem apagada', atualizado_em:new Date().toISOString() }).eq('id',m.id).eq('autor_id',perfil.id)
    await carregarMensagens(selecionada.id)
  }

  async function silenciar() {
    const novo = !selecionada.estado?.silenciada
    await supabase.from('social_conversa_estado').upsert({ conversa_id:selecionada.id, usuario_id:perfil.id, silenciada:novo },{onConflict:'conversa_id,usuario_id'})
    setAviso(novo ? 'Conversa silenciada.' : 'Notificações reativadas.')
    await carregarConversas()
  }

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase()
    return conversas.filter(c => !t || `${c.outro?.nome_personagem} ${c.outro?.usuario}`.toLowerCase().includes(t))
  },[conversas,busca])

  if (!sessao) return <main className="chat-shell chat-centro"><h1>Chat privado</h1><p>Entre na sua conta para conversar.</p><button onClick={()=>location.href='/'}>Ir ao portal</button></main>

  return <main className="chat-shell">
    <header className="chat-topo"><button onClick={()=>location.href='/comunidade'}>← Comunidade</button><div><small>Checkpoint 14.2</small><h1>Conversas privadas</h1><p>Mensagens rápidas entre personagens, protegidas e em tempo real.</p></div></header>
    {aviso && <p className="chat-aviso">{aviso}</p>}
    <section className="chat-layout">
      <aside className="chat-lista"><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar conversa" />{filtradas.length===0?<p>Nenhuma conversa ainda. Inicie uma pela Comunidade.</p>:filtradas.map(c=><button key={c.id} className={selecionada?.id===c.id?'ativo':''} onClick={()=>abrir(c)}>{c.outro?.avatar_url?<img src={c.outro.avatar_url} alt=""/>:<span>{(c.outro?.nome_personagem||c.outro?.usuario||'?')[0]}</span>}<div><strong>{c.outro?.nome_personagem||c.outro?.usuario}</strong><small>{c.ultima?.apagada?'Mensagem apagada':c.ultima?.conteudo||'Conversa iniciada'}</small></div>{c.naoLidas>0&&<b>{c.naoLidas}</b>}</button>)}</aside>
      <section className="chat-conversa">
        {!selecionada?<div className="chat-vazio"><h2>Escolha uma conversa</h2><p>Abra uma amizade pela Central Social para começar.</p></div>:<>
          <header className="chat-cabecalho"><div><strong>{selecionada.outro?.nome_personagem||selecionada.outro?.usuario}</strong><small>@{selecionada.outro?.usuario} · {selecionada.outro?.tribo||'Sem tribo'}</small></div><button onClick={silenciar}>{selecionada.estado?.silenciada?'Reativar':'Silenciar'}</button></header>
          <div className="chat-mensagens">{mensagens.map(m=><article key={m.id} className={m.autor_id===perfil?.id?'minha':''}>{m.respondendo_a&&m.resposta&&<blockquote>{m.resposta.conteudo}</blockquote>}<div><p>{m.conteudo}</p><footer><time>{hora(m.criado_em)}{m.editada?' · editada':''}</time>{m.autor_id===perfil?.id&&!m.apagada&&<span><button onClick={()=>{setEditando(m);setTexto(m.conteudo)}}>Editar</button><button onClick={()=>apagar(m)}>Apagar</button></span>}{m.autor_id!==perfil?.id&&!m.apagada&&<button onClick={()=>setResposta(m)}>Responder</button>}</footer></div></article>)}<div ref={fimRef}/></div>
          {(resposta||editando)&&<div className="chat-contexto"><span>{editando?'Editando mensagem':`Respondendo: ${resposta?.conteudo}`}</span><button onClick={()=>{setResposta(null);setEditando(null);setTexto('')}}>×</button></div>}
          <form className="chat-form" onSubmit={enviar}><textarea rows={2} maxLength={3000} value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Escreva uma mensagem..."/><button>{editando?'Salvar':'Enviar'}</button></form>
        </>}
      </section>
    </section>
  </main>
}
