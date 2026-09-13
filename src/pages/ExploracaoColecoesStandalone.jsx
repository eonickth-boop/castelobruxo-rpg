import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/exploracao-colecoes.css'

const categorias = ['todas','artefatos','criaturas','plantas','minerais','paginas','reliquias','fotografias','documentos','curiosidades','segredos']
const nomeRaridade = { comum:'Comum', incomum:'Incomum', raro:'Raro', epico:'Épico', lendario:'Lendário' }
const mapasOficiais = {
  interna: '/assets/decoracao-vintage/mapas/mapa-interno.png',
  externa: '/assets/decoracao-vintage/mapas/mapa-externo.png',
}

export default function ExploracaoColecoesStandalone(){
  const [sessao,setSessao]=useState(null)
  const [perfil,setPerfil]=useState(null)
  const [locais,setLocais]=useState([])
  const [visitas,setVisitas]=useState([])
  const [pontos,setPontos]=useState([])
  const [segredos,setSegredos]=useState([])
  const [descobertas,setDescobertas]=useState([])
  const [catalogo,setCatalogo]=useState([])
  const [minhasColecoes,setMinhasColecoes]=useState([])
  const [localAtual,setLocalAtual]=useState(null)
  const [itemAberto,setItemAberto]=useState(null)
  const [aba,setAba]=useState('mapa')
  const [ambienteMapa,setAmbienteMapa]=useState('interna')
  const [categoria,setCategoria]=useState('todas')
  const [busca,setBusca]=useState('')
  const [respostas,setRespostas]=useState({})
  const [aviso,setAviso]=useState('')
  const [carregando,setCarregando]=useState(true)

  useEffect(()=>{iniciar()},[])

  async function iniciar(){
    setCarregando(true)
    const {data:{session}}=await supabase.auth.getSession()
    setSessao(session)
    if(!session?.user){setCarregando(false);return}
    const {data:p}=await supabase.from('perfis').select('id,usuario,nome_personagem,tribo,ano,nivel,xp,exploracao,avatar_url,cargo').eq('id',session.user.id).single()
    setPerfil(p)
    await carregarTudo()
    setCarregando(false)
  }

  async function carregarTudo(){
    const [l,v,p,s,d,c,mc]=await Promise.all([
      supabase.from('locais_mapa').select('*').eq('ativo',true).order('ordem'),
      supabase.from('exploracao_visitas').select('*'),
      supabase.from('exploracao_pontos').select('*').eq('ativo',true).order('ordem'),
      supabase.from('exploracao_segredos').select('*').eq('ativo',true),
      supabase.from('exploracao_descobertas').select('*'),
      supabase.from('colecoes_catalogo').select('*').eq('ativo',true).order('categoria').order('ordem'),
      supabase.from('colecoes_usuarios').select('*'),
    ])
    setLocais(l.data||[]);setVisitas(v.data||[]);setPontos(p.data||[]);setSegredos(s.data||[]);setDescobertas(d.data||[]);setCatalogo(c.data||[]);setMinhasColecoes(mc.data||[])
  }

  const visitados=new Set(visitas.map(v=>v.local_id))
  const pontosDescobertos=new Set(descobertas.filter(d=>d.ponto_id).map(d=>d.ponto_id))
  const segredosDescobertos=new Set(descobertas.filter(d=>d.segredo_id).map(d=>d.segredo_id))
  const colecoesMap=new Map(minhasColecoes.map(c=>[c.colecao_id,c]))
  const percentual=locais.length?Math.round((visitados.size/locais.length)*100):0
  const percentualColecao=catalogo.length?Math.round((minhasColecoes.length/catalogo.length)*100):0
  const localPontos=localAtual?pontos.filter(p=>p.local_id===localAtual.id):[]
  const locaisDoMapa=useMemo(()=>locais.filter(local=>local.ambiente===ambienteMapa&&!local.secreto),[locais,ambienteMapa])
  const colecoesFiltradas=useMemo(()=>catalogo.filter(c=>{
    const passaCategoria=categoria==='todas'||c.categoria===categoria
    const termo=busca.trim().toLowerCase()
    return passaCategoria&&(!termo||c.nome.toLowerCase().includes(termo)||c.descricao?.toLowerCase().includes(termo))
  }),[catalogo,categoria,busca])
  const progressoCategorias=useMemo(()=>categorias.filter(c=>c!=='todas').map(c=>{
    const total=catalogo.filter(i=>i.categoria===c).length
    const obtidos=catalogo.filter(i=>i.categoria===c&&colecoesMap.has(i.id)).length
    return {categoria:c,total,obtidos,percentual:total?Math.round(obtidos/total*100):0}
  }),[catalogo,minhasColecoes])

  function requisito(local){
    if((perfil?.nivel||1)<(local.nivel_minimo||0))return `Nível ${local.nivel_minimo}`
    if((perfil?.ano||1)<(local.ano_minimo||0))return `${local.ano_minimo}º ano`
    if(local.tribo_requisito&&local.tribo_requisito.toLowerCase()!==(perfil?.tribo||'').toLowerCase())return `Tribo ${local.tribo_requisito}`
    return null
  }

  async function entrar(local){
    setAviso('')
    const {data,error}=await supabase.rpc('exploracao_acessar_local',{p_local:local.id})
    if(error){setAviso(error.message);return}
    if(!data?.liberado){setAviso(data?.motivo||'Local bloqueado.');return}
    setLocalAtual(local);setAba('local');await carregarTudo()
  }

  async function interagir(ponto){
    setAviso('')
    const resposta=respostas[ponto.id]?.trim()||null
    const {data,error}=await supabase.rpc('exploracao_interagir',{p_ponto:ponto.id,p_resposta:resposta})
    if(error){setAviso(error.message);return}
    let texto=data?.mensagem||'Exploração concluída.'
    if(data?.segredo)texto+=` Segredo revelado: ${data.segredo}.`
    if(data?.colecao)texto+=` Item registrado: ${data.colecao}.`
    setAviso(texto)
    await carregarTudo()
  }

  if(carregando)return <main className="exp-shell"><p>Preparando o mapa e o Códice...</p></main>
  if(!sessao)return <main className="exp-shell exp-centro"><h1>Exploração</h1><p>Entre na sua conta para explorar Castelobruxo.</p><button onClick={()=>location.href='/'}>Ir ao portal</button></main>

  return <main className="exp-shell">
    <header className="exp-topo"><div><small>Checkpoint 15 completo</small><h1>Exploração, segredos e coleções</h1><p>Investigue Castelobruxo, revele caminhos ocultos e complete seu Códice.</p></div><div className="exp-status-duplo"><div className="exp-status"><strong>{percentual}%</strong><span>mapa descoberto</span></div><div className="exp-status"><strong>{percentualColecao}%</strong><span>Códice completo</span></div></div></header>
    <nav className="exp-abas"><button className={aba==='mapa'?'ativo':''} onClick={()=>setAba('mapa')}>Mapa</button><button className={aba==='codice'?'ativo':''} onClick={()=>setAba('codice')}>Códice</button><button className={aba==='colecoes'?'ativo':''} onClick={()=>setAba('colecoes')}>Coleções</button>{localAtual&&<button className={aba==='local'?'ativo':''} onClick={()=>setAba('local')}>{localAtual.nome}</button>}</nav>
    {aviso&&<p className="exp-aviso">{aviso}</p>}

    {aba==='mapa'&&<>
      <nav className="exp-mapa-abas" aria-label="Escolha do mapa"><button className={ambienteMapa==='interna'?'ativo':''} onClick={()=>setAmbienteMapa('interna')}>Mapa interno</button><button className={ambienteMapa==='externa'?'ativo':''} onClick={()=>setAmbienteMapa('externa')}>Mapa externo</button></nav>
      <section className="exp-mapa-layout">
        <aside className="exp-perfil"><div className="exp-avatar">{perfil?.avatar_url?<img src={perfil.avatar_url} alt=""/>:<span>🧭</span>}</div><h3>{perfil?.nome_personagem||perfil?.usuario}</h3><p>{perfil?.tribo||'Sem tribo'} · {perfil?.ano||1}º ano</p><dl><div><dt>Exploração</dt><dd>{perfil?.exploracao||0}</dd></div><div><dt>Nível</dt><dd>{perfil?.nivel||1}</dd></div><div><dt>Locais</dt><dd>{visitados.size}/{locais.length}</dd></div><div><dt>Segredos</dt><dd>{segredosDescobertos.size}/{segredos.length}</dd></div></dl><h4>Locais deste mapa</h4><div className="exp-legenda-locais">{locaisDoMapa.map((local,indice)=><button key={local.id} onClick={()=>entrar(local)}><span>{indice+1}</span><strong>{local.nome}</strong></button>)}</div></aside>
        <section className="exp-mapa" style={{backgroundImage:`url("${mapasOficiais[ambienteMapa]}")`}} aria-label={ambienteMapa==='interna'?'Mapa interno de Castelobruxo':'Mapa externo de Castelobruxo'}>
          {locaisDoMapa.map((local,indice)=>{const bloqueio=requisito(local);const visto=visitados.has(local.id);return <button key={local.id} className={`exp-local ${bloqueio?'bloqueado':''} ${visto?'visitado':''}`} style={{left:`${local.posicao_x||50}%`,top:`${local.posicao_y||50}%`}} onClick={()=>entrar(local)} title={`${local.nome} — ${bloqueio||(visto?'Visitado':'Não explorado')}`} aria-label={local.nome}><span>{bloqueio?'🔒':indice+1}</span></button>})}
        </section>
      </section>
    </>}

    {aba==='local'&&localAtual&&<section className="exp-local-pagina">
      <header className="exp-local-hero" style={localAtual.imagem_url?{backgroundImage:`linear-gradient(90deg,rgba(6,12,8,.96),rgba(6,12,8,.35)),url("${localAtual.imagem_url}")`}:undefined}><button onClick={()=>setAba('mapa')}>← Voltar ao mapa</button><span>{localAtual.icone}</span><div><small>{localAtual.categoria}</small><h2>{localAtual.nome}</h2><p>{localAtual.descricao}</p></div></header>
      <blockquote>{localAtual.ambiente}</blockquote>
      <div className="exp-pontos"><h3>Pontos investigáveis</h3>{localPontos.length===0&&<p>Nenhum ponto foi registrado neste local ainda.</p>}{localPontos.map(p=>{const descoberto=pontosDescobertos.has(p.id);return <article key={p.id} className={descoberto?'descoberto':''}><span>{p.icone}</span><div><h4>{p.nome}</h4><p>{p.descricao}</p><small>{p.tipo} · exploração {p.requisito_exploracao} · +{p.xp_recompensa} XP</small>{p.resposta_enigma!==null&&<input value={respostas[p.id]||''} onChange={e=>setRespostas(r=>({...r,[p.id]:e.target.value}))} placeholder="Digite sua resposta ao enigma"/>}</div><button onClick={()=>interagir(p)}>{descoberto?'Revisitar pista':'Investigar'}</button></article>})}</div>
    </section>}

    {aba==='codice'&&<section className="exp-codice"><div className="exp-resumo-grade"><article><strong>{visitados.size}</strong><span>locais visitados</span></article><article><strong>{pontosDescobertos.size}</strong><span>pistas registradas</span></article><article><strong>{segredosDescobertos.size}</strong><span>segredos revelados</span></article><article><strong>{minhasColecoes.length}</strong><span>itens colecionados</span></article></div><section><h2>Locais registrados</h2><div className="exp-lista-codice">{locais.map(l=><article key={l.id} className={!visitados.has(l.id)?'oculto':''}>{visitados.has(l.id)&&l.imagem_url?<img src={l.imagem_url} alt=""/>:<span>{visitados.has(l.id)?l.icone:'?'}</span>}<div><h3>{visitados.has(l.id)?l.nome:'Entrada não descoberta'}</h3><p>{visitados.has(l.id)?l.ambiente:'Explore o mapa para revelar este registro.'}</p></div></article>)}</div></section><section><h2>Segredos</h2><div className="exp-lista-codice">{segredos.map(s=>{const aberto=segredosDescobertos.has(s.id);const item=catalogo.find(i=>i.categoria==='segredos'&&i.nome.toLowerCase().includes(s.nome.toLowerCase().replace('a voz','voz')));return <article key={s.id} className={!aberto?'oculto':''}>{aberto&&item?.imagem_url?<img src={item.imagem_url} alt=""/>:<span>{aberto?s.icone:'✦'}</span>}<div><h3>{aberto?s.nome:'Segredo desconhecido'}</h3><p>{aberto?s.descricao_revelada:s.descricao_oculta}</p><small>{aberto?nomeRaridade[s.raridade]:'Continue explorando'}</small></div></article>})}</div></section></section>}

    {aba==='colecoes'&&<section className="exp-colecoes"><header><div><small>Arquivo pessoal</small><h2>Coleções de Castelobruxo</h2><p>{minhasColecoes.length} de {catalogo.length} registros encontrados.</p></div><div className="exp-controles-colecao"><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar no Códice"/><div className="exp-categorias">{categorias.map(c=><button key={c} className={categoria===c?'ativo':''} onClick={()=>setCategoria(c)}>{c}</button>)}</div></div></header><div className="exp-grade-colecoes">{colecoesFiltradas.map(item=>{const obtida=colecoesMap.get(item.id);const oculta=item.secreto&&!obtida;return <article key={item.id} className={`${obtida?'obtida':'faltando'} ${oculta?'oculta':''}`} onClick={()=>!oculta&&setItemAberto({...item,obtida})}>{!oculta&&item.imagem_url?<img src={item.imagem_url} alt={item.nome}/>:<span>{oculta?'?':item.icone}</span>}<small>{oculta?'Item secreto':item.categoria}</small><h3>{oculta?'Registro oculto':item.nome}</h3><p>{oculta?'Descubra este item durante uma exploração.':item.descricao}</p><footer><b>{oculta?'Desconhecida':nomeRaridade[item.raridade]}</b><em>{obtida?`Obtido ×${obtida.quantidade}`:'Não encontrado'}</em></footer></article>})}</div></section>}

    {itemAberto&&<div className="exp-modal" onClick={()=>setItemAberto(null)}><article onClick={e=>e.stopPropagation()}><button onClick={()=>setItemAberto(null)}>×</button>{itemAberto.imagem_url&&<img src={itemAberto.imagem_url} alt={itemAberto.nome}/>}<small>{itemAberto.categoria} · {nomeRaridade[itemAberto.raridade]}</small><h2>{itemAberto.nome}</h2><p>{itemAberto.descricao}</p><blockquote>{itemAberto.historia}</blockquote><dl><div><dt>Origem</dt><dd>{itemAberto.local_origem||'Castelobruxo'}</dd></div><div><dt>Status</dt><dd>{itemAberto.obtida?`Encontrado ×${itemAberto.obtida.quantidade}`:'Ainda não encontrado'}</dd></div></dl></article></div>}
  </main>
}
