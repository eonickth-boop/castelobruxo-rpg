import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/profissoes.css'

const nomesArea={geral:'Geral',escola:'Escola',tribo:'Tribo',conhecimento:'Conhecimento',natureza:'Natureza',exploracao:'Exploração',comercio:'Comércio'}

export default function Profissoes({perfil,onVoltar}){
  const [profissoes,setProfissoes]=useState([])
  const [reputacao,setReputacao]=useState(null)
  const [atual,setAtual]=useState(null)
  const [selecionada,setSelecionada]=useState(null)
  const [categoria,setCategoria]=useState('Todas')
  const [mensagem,setMensagem]=useState('')
  const [carregando,setCarregando]=useState(true)
  const [acao,setAcao]=useState(false)

  useEffect(()=>{carregar()},[])

  async function carregar(){
    setCarregando(true);setMensagem('')
    const {data:rep,error:erroRep}=await supabase.rpc('inicializar_reputacao_usuario')
    if(erroRep) console.error(erroRep)
    const [{data:lista,error:erroLista},{data:registro,error:erroAtual}]=await Promise.all([
      supabase.from('profissoes').select('*').eq('ativa',true).order('ordem'),
      supabase.from('usuarios_profissoes').select('id,cargo,nivel,xp,status,data_inicio,profissoes(*)').eq('status','ativo').maybeSingle(),
    ])
    if(erroLista) setMensagem('Não foi possível carregar as profissões.')
    if(erroAtual) console.error(erroAtual)
    setProfissoes(lista||[]);setReputacao(rep||null);setAtual(registro||null)
    setCarregando(false)
  }

  function valorReputacao(p){return reputacao?.[p.reputacao_area]??0}
  function requisitos(p){
    return {
      nivel:(perfil?.nivel||1)>=p.nivel_requerido,
      ano:(perfil?.ano||1)>=p.ano_minimo,
      reputacao:valorReputacao(p)>=p.reputacao_minima,
    }
  }
  async function candidatar(p){
    setAcao(true);setMensagem('')
    const {data,error}=await supabase.rpc('candidatar_profissao',{p_profissao_id:p.id})
    if(error)setMensagem(error.message||'Não foi possível concluir a candidatura.')
    else{setMensagem(`Você agora é ${data.cargo} de ${data.profissao}.`);setSelecionada(null);await carregar()}
    setAcao(false)
  }
  async function abandonar(){
    setAcao(true);setMensagem('')
    const {error}=await supabase.rpc('abandonar_profissao')
    if(error)setMensagem(error.message||'Não foi possível abandonar a profissão.')
    else{setMensagem('Profissão abandonada.');await carregar()}
    setAcao(false)
  }

  const categorias=useMemo(()=>['Todas',...new Set(profissoes.map(p=>p.categoria))],[profissoes])
  const filtradas=categoria==='Todas'?profissoes:profissoes.filter(p=>p.categoria===categoria)

  return <main className="profissoes-pagina">
    <button className="profissoes-voltar" onClick={onVoltar}>← Voltar</button>
    <header className="profissoes-hero"><p>Checkpoint 17</p><h1>Profissões e Reputação</h1><span>Escolha uma carreira, cumpra os requisitos e construa seu reconhecimento em Castelobruxo.</span></header>

    <section className="reputacao-grade">{Object.entries(nomesArea).map(([chave,nome])=><article key={chave}><small>{nome}</small><strong>{reputacao?.[chave]??0}</strong></article>)}</section>

    {atual&&<section className="profissao-atual"><div><p>Profissão atual</p><h2>{atual.profissoes?.icone} {atual.profissoes?.nome}</h2><span>{atual.cargo} · Nível profissional {atual.nivel} · {atual.xp} XP</span></div><button onClick={abandonar} disabled={acao}>Abandonar profissão</button></section>}

    <nav className="profissoes-filtros">{categorias.map(c=><button key={c} className={categoria===c?'ativo':''} onClick={()=>setCategoria(c)}>{c}</button>)}</nav>
    {mensagem&&<p className="profissoes-mensagem">{mensagem}</p>}

    {carregando?<p className="profissoes-estado">Consultando vagas...</p>:<section className="profissoes-grade">{filtradas.map(p=>{
      const r=requisitos(p)
      const apto=r.nivel&&r.ano&&r.reputacao&&!atual
      return <article key={p.id} className="profissao-card">
        <div className="profissao-icone">{p.icone}</div><small>{p.categoria}</small><h2>{p.nome}</h2><p>{p.descricao}</p>
        <div className="profissao-requisitos">
          <span className={r.nivel?'ok':'nao'}>{r.nivel?'✓':'×'} Nível {p.nivel_requerido}</span>
          <span className={r.ano?'ok':'nao'}>{r.ano?'✓':'×'} {p.ano_minimo}º ano</span>
          <span className={r.reputacao?'ok':'nao'}>{r.reputacao?'✓':'×'} {p.reputacao_minima} em {nomesArea[p.reputacao_area]||p.reputacao_area}</span>
        </div>
        <button onClick={()=>setSelecionada(p)} disabled={Boolean(atual)}>Ver profissão</button>
        {apto&&<em>Apto para candidatura</em>}
      </article>
    })}</section>}

    {selecionada&&<div className="profissao-modal" onClick={()=>setSelecionada(null)}><article onClick={e=>e.stopPropagation()}><button className="profissao-fechar" onClick={()=>setSelecionada(null)}>×</button><span>{selecionada.icone}</span><small>{selecionada.categoria}</small><h2>{selecionada.nome}</h2><p>{selecionada.descricao}</p><div className="profissao-modal-requisitos"><strong>Requisitos</strong><span>Nível {selecionada.nivel_requerido}</span><span>{selecionada.ano_minimo}º ano</span><span>{selecionada.reputacao_minima} de reputação em {nomesArea[selecionada.reputacao_area]}</span><span>{selecionada.vagas_totais} vagas totais</span></div><button onClick={()=>candidatar(selecionada)} disabled={acao||!Object.values(requisitos(selecionada)).every(Boolean)||Boolean(atual)}>{acao?'Registrando...':'Candidatar-se'}</button></article></div>}
  </main>
}
