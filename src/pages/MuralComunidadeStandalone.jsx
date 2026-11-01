import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/mural-comunidade.css'

function nome(p) { return p?.nome_personagem || p?.usuario || 'Personagem' }
function dataHora(v) { return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }
function extensao(arquivo) { return arquivo.name.split('.').pop()?.toLowerCase() || 'jpg' }

export default function MuralComunidadeStandalone() {
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [feed, setFeed] = useState([])
  const [filtro, setFiltro] = useState('comunidade')
  const [conteudo, setConteudo] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [imagemArquivo, setImagemArquivo] = useState(null)
  const [imagemPreview, setImagemPreview] = useState('')
  const [visibilidade, setVisibilidade] = useState('publica')
  const [comentarios, setComentarios] = useState({})
  const [editando, setEditando] = useState(null)
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [publicando, setPublicando] = useState(false)

  useEffect(() => { iniciar() }, [])
  useEffect(() => { if (perfil?.id) carregarFeed() }, [filtro, perfil?.id])
  useEffect(() => {
    if (!perfil?.id) return
    const canal = supabase.channel('mural-comunidade')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_publicacoes' }, carregarFeed)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_curtidas' }, carregarFeed)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_comentarios' }, carregarFeed)
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [perfil?.id, filtro])

  async function iniciar() {
    setCarregando(true)
    const { data } = await supabase.auth.getSession()
    setSessao(data.session)
    if (!data.session?.user) { setCarregando(false); return }
    const { data: p } = await supabase.from('perfis').select('id,usuario,nome_personagem,avatar_url,tribo,ano,nivel').eq('id', data.session.user.id).single()
    setPerfil(p); setCarregando(false)
  }

  async function carregarFeed() {
    const { data, error } = await supabase.rpc('social_feed_listar', { p_filtro: filtro, p_limite: 50 })
    if (error) { setAviso(error.message || 'Não foi possível carregar o mural.'); return }
    setFeed(Array.isArray(data) ? data : [])
  }

  function escolherImagem(arquivo) {
    if (!arquivo) return
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(arquivo.type)) { setAviso('Use JPG, PNG, WEBP ou GIF.'); return }
    if (arquivo.size > 8 * 1024 * 1024) { setAviso('A foto pode ter no máximo 8 MB.'); return }
    if (imagemPreview?.startsWith('blob:')) URL.revokeObjectURL(imagemPreview)
    setImagemArquivo(arquivo); setImagemPreview(URL.createObjectURL(arquivo)); setImagemUrl(''); setAviso('')
  }

  function limparImagem() {
    if (imagemPreview?.startsWith('blob:')) URL.revokeObjectURL(imagemPreview)
    setImagemArquivo(null); setImagemPreview(''); setImagemUrl('')
  }

  async function enviarFoto() {
    if (!imagemArquivo) return imagemUrl.trim() || null
    const caminho = `${perfil.id}/${Date.now()}-${crypto.randomUUID()}.${extensao(imagemArquivo)}`
    const { error } = await supabase.storage.from('social-fotos').upload(caminho, imagemArquivo, { cacheControl: '3600', upsert: false })
    if (error) throw error
    return supabase.storage.from('social-fotos').getPublicUrl(caminho).data.publicUrl
  }

  async function publicar(e) {
    e.preventDefault()
    const texto = conteudo.trim()
    if (!texto && !imagemArquivo && !imagemUrl.trim()) { setAviso('Escreva algo ou escolha uma foto.'); return }
    setPublicando(true); setAviso('')
    try {
      const foto = await enviarFoto()
      const payload = { autor_id: perfil.id, conteudo: texto || 'Foto compartilhada', imagem_url: foto, visibilidade }
      let erro
      if (editando) {
        const { error } = await supabase.from('social_publicacoes').update({ conteudo: payload.conteudo, imagem_url: payload.imagem_url, visibilidade, editada: true, atualizado_em: new Date().toISOString() }).eq('id', editando.id).eq('autor_id', perfil.id)
        erro = error
      } else {
        const { error } = await supabase.from('social_publicacoes').insert(payload)
        erro = error
      }
      if (erro) throw erro
      setConteudo(''); limparImagem(); setVisibilidade('publica'); setEditando(null); setAviso(editando ? 'Publicação atualizada.' : 'Publicação criada.')
      await carregarFeed()
    } catch (erro) { setAviso(erro.message || 'Não foi possível publicar a foto.') }
    finally { setPublicando(false) }
  }

  async function alternarCurtida(post) {
    const acao = post.curtida_por_mim ? supabase.from('social_curtidas').delete().eq('publicacao_id', post.id).eq('usuario_id', perfil.id) : supabase.from('social_curtidas').insert({ publicacao_id: post.id, usuario_id: perfil.id })
    const { error } = await acao
    if (error) { setAviso('Não foi possível atualizar a curtida.'); return }
    await carregarFeed()
  }

  async function comentar(e, post) {
    e.preventDefault(); const texto = (comentarios[post.id] || '').trim(); if (!texto) return
    const { error } = await supabase.from('social_comentarios').insert({ publicacao_id: post.id, autor_id: perfil.id, conteudo: texto })
    if (error) { setAviso(error.message || 'Não foi possível comentar.'); return }
    setComentarios((a) => ({ ...a, [post.id]: '' })); await carregarFeed()
  }

  async function removerPublicacao(post) { if (!confirm('Remover esta publicação?')) return; await supabase.from('social_publicacoes').update({ removida: true, atualizado_em: new Date().toISOString() }).eq('id', post.id).eq('autor_id', perfil.id); await carregarFeed() }
  async function removerComentario(c) { if (!confirm('Remover este comentário?')) return; await supabase.from('social_comentarios').update({ removido: true, atualizado_em: new Date().toISOString() }).eq('id', c.id).eq('autor_id', perfil.id); await carregarFeed() }
  async function denunciar(tipo, id) { const motivo = prompt('Explique o motivo da denúncia:')?.trim(); if (!motivo) return; const payload = { denunciante_id: perfil.id, motivo, publicacao_id: tipo === 'publicacao' ? id : null, comentario_id: tipo === 'comentario' ? id : null }; const { error } = await supabase.from('social_denuncias').insert(payload); setAviso(error ? 'Não foi possível enviar a denúncia.' : 'Denúncia enviada para análise.') }

  if (carregando) return <main className="mural-shell"><p>Preparando o Mural da Comunidade...</p></main>
  if (!sessao) return <main className="mural-shell mural-centro"><h1>Mural da Comunidade</h1><p>Entre na sua conta para acessar.</p><button onClick={() => { location.href = '/' }}>Ir ao portal</button></main>

  return <main className="mural-shell">
    <header className="mural-topo"><button onClick={() => { location.href = '/comunidade' }}>← Comunidade</button><div><small>Rede social</small><h1>Mural da Comunidade</h1><p>Recados, memórias e fotografias compartilhadas pelos personagens.</p></div></header>
    <nav className="mural-filtros"><button className={filtro === 'comunidade' ? 'ativo' : ''} onClick={() => setFiltro('comunidade')}>Comunidade</button><button className={filtro === 'amigos' ? 'ativo' : ''} onClick={() => setFiltro('amigos')}>Amigos</button><button className={filtro === 'tribo' ? 'ativo' : ''} onClick={() => setFiltro('tribo')}>Minha tribo</button></nav>
    {aviso && <p className="mural-aviso">{aviso}</p>}
    <section className="mural-layout">
      <aside className="mural-lateral"><article><div className="mural-avatar">{perfil?.avatar_url ? <img src={perfil.avatar_url} alt="" /> : <span>{nome(perfil)[0]}</span>}</div><h3>{nome(perfil)}</h3><p>@{perfil?.usuario}</p><small>{perfil?.tribo || 'Sem tribo'} · {perfil?.ano || 1}º ano</small></article><article><h3>Fotos</h3><p>Envie imagens diretamente do computador ou celular.</p><small>JPG, PNG, WEBP ou GIF · até 8 MB.</small></article></aside>
      <section className="mural-coluna">
        <form className="mural-publicar" onSubmit={publicar}>
          <header><strong>{editando ? 'Editar publicação' : 'Nova publicação'}</strong>{editando && <button type="button" onClick={() => { setEditando(null); setConteudo(''); limparImagem() }}>Cancelar</button>}</header>
          <textarea rows={5} maxLength={3000} value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="O que deseja compartilhar?" />
          <div className="mural-upload-foto"><label>📷 Escolher foto<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => escolherImagem(e.target.files?.[0])} /></label>{(imagemPreview || imagemUrl) && <div><img src={imagemPreview || imagemUrl} alt="Prévia" /><button type="button" onClick={limparImagem}>Remover foto</button></div>}</div>
          <footer><select value={visibilidade} onChange={(e) => setVisibilidade(e.target.value)}><option value="publica">Toda a comunidade</option><option value="amigos">Somente amigos</option><option value="tribo">Somente minha tribo</option></select><button disabled={publicando}>{publicando ? 'Publicando...' : editando ? 'Salvar alterações' : 'Publicar'}</button></footer>
        </form>
        <div className="mural-feed">{feed.length === 0 && <p className="mural-vazio">Ainda não há publicações neste filtro.</p>}{feed.map((post) => <article className="mural-post" key={post.id}><header><div className="mural-avatar pequeno">{post.autor?.avatar_url ? <img src={post.autor.avatar_url} alt="" /> : <span>{nome(post.autor)[0]}</span>}</div><div><strong>{nome(post.autor)}</strong><p>@{post.autor?.usuario} · {post.autor?.tribo || 'Sem tribo'}</p><small>{dataHora(post.criado_em)}{post.editada ? ' · editada' : ''} · {post.visibilidade}</small></div><div className="mural-post-menu">{post.autor_id === perfil.id ? <><button onClick={() => { setEditando(post); setConteudo(post.conteudo); setImagemUrl(post.imagem_url || ''); setImagemPreview(''); setImagemArquivo(null); setVisibilidade(post.visibilidade); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Editar</button><button onClick={() => removerPublicacao(post)}>Excluir</button></> : <button onClick={() => denunciar('publicacao', post.id)}>Denunciar</button>}</div></header><p className="mural-texto">{post.conteudo}</p>{post.imagem_url && <img className="mural-imagem" src={post.imagem_url} alt="Foto compartilhada" />}<div className="mural-interacoes"><button className={post.curtida_por_mim ? 'ativo' : ''} onClick={() => alternarCurtida(post)}>✦ {post.curtidas || 0}</button><span>{post.comentarios?.length || 0} comentários</span></div><div className="mural-comentarios">{(post.comentarios || []).map((c) => <article key={c.id}><div><strong>{nome(c.autor)}</strong><small>{dataHora(c.criado_em)}</small></div><p>{c.conteudo}</p><footer>{c.autor_id === perfil.id ? <button onClick={() => removerComentario(c)}>Excluir</button> : <button onClick={() => denunciar('comentario', c.id)}>Denunciar</button>}</footer></article>)}</div><form className="mural-comentar" onSubmit={(e) => comentar(e, post)}><input maxLength={1200} value={comentarios[post.id] || ''} onChange={(e) => setComentarios((a) => ({ ...a, [post.id]: e.target.value }))} placeholder="Escreva um comentário..." /><button>Comentar</button></form></article>)}</div>
      </section>
    </section>
  </main>
}
