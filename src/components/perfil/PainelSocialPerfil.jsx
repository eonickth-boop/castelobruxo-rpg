import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/perfil-social-integrado.css'

function nome(p) { return p?.nome_personagem || p?.usuario || 'Personagem' }
function formatar(v) { return v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '' }

export default function PainelSocialPerfil({ perfilAtual, perfilExibido, proprio }) {
  const [amizades, setAmizades] = useState([])
  const [bloqueios, setBloqueios] = useState([])
  const [presenca, setPresenca] = useState(null)
  const [publicacoes, setPublicacoes] = useState([])
  const [perfis, setPerfis] = useState([])
  const [aviso, setAviso] = useState('')

  useEffect(() => { carregar() }, [perfilAtual?.id, perfilExibido?.id])

  async function carregar() {
    if (!perfilAtual?.id || !perfilExibido?.id) return
    const [a,b,p,posts,lista] = await Promise.all([
      supabase.from('social_amizades').select('*'),
      supabase.from('social_bloqueios').select('*'),
      supabase.from('social_presenca').select('*').eq('usuario_id', perfilExibido.id).maybeSingle(),
      supabase.from('social_publicacoes').select('id,autor_id,conteudo,imagem_url,visibilidade,editada,criado_em').eq('autor_id', perfilExibido.id).eq('removida', false).order('criado_em', { ascending: false }).limit(12),
      supabase.from('perfis').select('id,usuario,nome_personagem,avatar_url').eq('ativo', true),
    ])
    setAmizades(a.data || []); setBloqueios(b.data || []); setPresenca(p.data || null); setPublicacoes(posts.data || []); setPerfis(lista.data || [])
  }

  const amizade = useMemo(() => amizades.find((a) => (a.solicitante_id === perfilAtual.id && a.destinatario_id === perfilExibido.id) || (a.solicitante_id === perfilExibido.id && a.destinatario_id === perfilAtual.id)), [amizades, perfilAtual.id, perfilExibido.id])
  const bloqueado = bloqueios.some((b) => b.bloqueador_id === perfilAtual.id && b.bloqueado_id === perfilExibido.id)
  const amigosAtual = useMemo(() => new Set(amizades.filter(a => a.status === 'aceita' && [a.solicitante_id,a.destinatario_id].includes(perfilAtual.id)).map(a => a.solicitante_id === perfilAtual.id ? a.destinatario_id : a.solicitante_id)), [amizades, perfilAtual.id])
  const amigosOutro = useMemo(() => new Set(amizades.filter(a => a.status === 'aceita' && [a.solicitante_id,a.destinatario_id].includes(perfilExibido.id)).map(a => a.solicitante_id === perfilExibido.id ? a.destinatario_id : a.solicitante_id)), [amizades, perfilExibido.id])
  const idsComuns = [...amigosAtual].filter(id => amigosOutro.has(id))
  const mapa = new Map(perfis.map(p => [p.id,p]))
  const comuns = idsComuns.map(id => mapa.get(id)).filter(Boolean).slice(0,6)
  const fotos = publicacoes.filter(p => p.imagem_url)

  async function rpc(nomeRpc, params, texto) {
    const { error } = await supabase.rpc(nomeRpc, params)
    if (error) { setAviso(error.message || 'Não foi possível concluir a ação.'); return }
    setAviso(texto); await carregar()
  }

  async function abrirChat() {
    const { data, error } = await supabase.rpc('social_obter_conversa', { p_pessoa: perfilExibido.id })
    if (error) { setAviso(error.message || 'Não foi possível abrir o chat.'); return }
    window.location.href = `/chat?conversa=${data}`
  }

  async function denunciarPerfil() {
    const motivo = prompt('Explique o motivo da denúncia:')?.trim()
    if (!motivo) return
    const { error } = await supabase.from('social_denuncias').insert({ denunciante_id: perfilAtual.id, perfil_id: perfilExibido.id, motivo })
    setAviso(error ? 'Não foi possível enviar a denúncia.' : 'Denúncia enviada para análise.')
  }

  if (proprio) return <section className="perfil-social-integrado"><header><div><small>Vida social</small><h2>Meu espaço na comunidade</h2></div><button onClick={() => { window.location.href = '/mural' }}>Nova publicação</button></header><div className="perfil-social-resumo"><article><strong>{amizades.filter(a => a.status === 'aceita' && [a.solicitante_id,a.destinatario_id].includes(perfilAtual.id)).length}</strong><span>amigos</span></article><article><strong>{publicacoes.length}</strong><span>publicações recentes</span></article><article><strong>{fotos.length}</strong><span>fotos recentes</span></article></div>{fotos.length > 0 && <div className="perfil-social-fotos">{fotos.slice(0,6).map(p => <img key={p.id} src={p.imagem_url} alt="Foto publicada" />)}</div>}</section>

  const recebido = amizade?.status === 'pendente' && amizade.destinatario_id === perfilAtual.id
  const enviado = amizade?.status === 'pendente' && amizade.solicitante_id === perfilAtual.id
  const status = presenca?.status || 'offline'

  return <section className="perfil-social-integrado">
    <header><div><small>Perfil social</small><h2>Interagir com {nome(perfilExibido)}</h2><p><span className={`perfil-presenca ${status}`} /> {status === 'invisivel' ? 'offline' : status}{presenca?.ultima_atividade && ` · visto ${formatar(presenca.ultima_atividade)}`}</p></div><div className="perfil-social-acoes">
      {!amizade && !bloqueado && <button onClick={() => rpc('social_enviar_pedido', { p_destinatario: perfilExibido.id }, 'Pedido enviado.')}>Adicionar amigo</button>}
      {recebido && <><button onClick={() => rpc('social_responder_pedido', { p_pedido: amizade.id, p_aceitar: true }, 'Amizade aceita.')}>Aceitar</button><button className="secundario" onClick={() => rpc('social_responder_pedido', { p_pedido: amizade.id, p_aceitar: false }, 'Pedido recusado.')}>Recusar</button></>}
      {enviado && <button disabled>Pedido enviado</button>}
      {amizade?.status === 'aceita' && <button onClick={abrirChat}>Abrir chat</button>}
      <button onClick={() => { window.location.href = `/?pagina=correio-magico&destinatario=${encodeURIComponent(perfilExibido.usuario)}` }}>Enviar carta</button>
      {!bloqueado ? <button className="perigo" onClick={() => rpc('social_bloquear', { p_pessoa: perfilExibido.id }, 'Personagem bloqueado.')}>Bloquear</button> : <button onClick={() => rpc('social_desbloquear', { p_pessoa: perfilExibido.id }, 'Personagem desbloqueado.')}>Desbloquear</button>}
      <button className="secundario" onClick={denunciarPerfil}>Denunciar</button>
    </div></header>
    {aviso && <p className="perfil-social-aviso">{aviso}</p>}
    <div className="perfil-social-resumo"><article><strong>{amizade?.status === 'aceita' ? 'Amigos' : amizade?.status === 'pendente' ? 'Pendente' : 'Sem vínculo'}</strong><span>relação atual</span></article><article><strong>{idsComuns.length}</strong><span>amigos em comum</span></article><article><strong>{publicacoes.length}</strong><span>publicações recentes</span></article></div>
    {comuns.length > 0 && <div className="perfil-amigos-comuns"><h3>Amigos em comum</h3><div>{comuns.map(p => <span key={p.id}>{p.avatar_url ? <img src={p.avatar_url} alt="" /> : nome(p)[0]}<small>{nome(p)}</small></span>)}</div></div>}
    {publicacoes.length > 0 && <div className="perfil-publicacoes-sociais"><header><h3>Publicações recentes</h3><button onClick={() => { window.location.href = '/mural' }}>Ver mural</button></header>{publicacoes.slice(0,6).map(p => <article key={p.id}>{p.imagem_url && <img src={p.imagem_url} alt="Foto publicada" />}<p>{p.conteudo}</p><small>{formatar(p.criado_em)} · {p.visibilidade}</small></article>)}</div>}
  </section>
}
