import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/profissoes.css'

const nomesArea={geral:'Geral',escola:'Escola',tribo:'Tribo',conhecimento:'Conhecimento',natureza:'Natureza',exploracao:'Exploração',comercio:'Comércio'}
const metas=[0,100,250,500,900]
const cargos=['Aprendiz','Assistente','Especialista','Mestre','Guardião da profissão']

export default function Profissoes({perfil:perfilProp,onVoltar}){
  const [perfil,setPerfil]=useState(perfilProp||null)
  const [profissoes,setProfissoes]=useState([])
  const [reputacao,setReputacao]=useState(null)
  const [atual,setAtual]=useState(null)
  const [selecionada,setSelecionada]=useState(null)
  const [categoria,setCategoria]=useState('Todas')
  const [mensagem,setMensagem]=useState('')
  const [carregando,setCarregando]=useState(true)
  const [acao,setAcao]=useState(false)
  const [tarefas,setTarefas]=useState([])
  const [historico,setHistorico]=useState([])
  const [promocao,setPromocao]=useState(null)

  useEffect(()=>{carregar()},[])

  async function carregar(){
    setCarregando(true);setMensagem('')
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setMensagem('Entre na sua conta para acessar as profissões.');setCarregando(false);return}
    let perfilAtual=perfilProp
    if(!perfilAtual){const {data}=await supabase.from('perfis').select('*').eq('id',user.id).maybeSingle();perfilAtual=data;setPerfil(data)}
    const {data:rep,error:erroRep}=await supabase.rpc('inicializar_reputacao_usuario')
    if(erroRep)console.error(erroRep)
    const [{data:lista,error:erroLista},{data:registro,error:erroAtual},{data:hist}]=await Promise.all([
      supabase.from('profissoes').select('*').eq('ativa',true).order('ordem'),
      supabase.from('usuarios_profissoes').select('id,cargo,nivel,xp,status,data_inicio,profissao_id,profissoes(*)').eq('usuario_id',user.id).eq('status','ativo').maybeSingle(),
      supabase.from('historico_trabalhos').select('id,recompensa_ipes,recompensa_xp,reputacao_area,recompensa_reputacao,nivel_antes,nivel_depois,cargo_antes,cargo_depois,concluida_em,tarefas_profissionais(titulo)').eq('usuario_id',user.id).order('concluida_em',{ascending:false}).limit(12),
    ])
    if(erroLista)setMensagem('Não foi possível carregar as profissões.')
    if(erroAtual)console.error(erroAtual)
    setProfissoes(lista||[]);setReputacao(rep||null);setAtual(registro||null);setHistorico(hist||[])
    if(registro?.profissao_id){const {data}=await supabase.from('tarefas_profissionais').select('*').eq('profissao_id',registro.profissao_id).eq('ativa',true).order('ordem');setTarefas(data||[])}else setTarefas([])
    setCarregando(false)
  }

  function valorReputacao(p){return reputacao?.[p.reputacao_area]??0}
  function requisitos(p){return{nivel:(perfil?.nivel||1)>=p.nivel_requerido,ano:(perfil?.ano||1)>=p.ano_minimo,reputacao:valorReputacao(p)>=p.reputacao_minima}}
  async function candidatar(p){setAcao(true);setMensagem('');const{data,error}=await supabase.rpc('candidatar_profissao',{p_profissao_id:p.id});if(error)setMensagem(error.message||'Não foi possível concluir a candidatura.');else{setMensagem(`Você agora é ${data.cargo} de ${data.profissao}.`);setSelecionada(null);await carregar()}setAcao(false)}
  async function abandonar(){if(!window.confirm('Deseja realmente abandonar sua profissão atual?'))return;setAcao(true);setMensagem('');const{error}=await supabase.rpc('abandonar_profissao');if(error)setMensagem(error.message||'Não foi possível abandonar a profissão.');else{setMensagem('Profissão abandonada.');await carregar()}setAcao(false)}
  async function concluir(tarefa){setAcao(true);setMensagem('');const{data,error}=await supabase.rpc('concluir_tarefa_profissional',{p_tarefa_id:tarefa.id});if(error)setMensagem(error.message||'Não foi possível concluir o trabalho.');else{setMensagem(`Trabalho concluído: +${data.ipes} Ipês, +${data.xp} XP e +${data.reputacao} de reputação.`);if(data.promovido)setPromocao({nivel:data.nivel,cargo:data.cargo});await carregar()}setAcao(false)}

  const categorias=useMemo(()=>['Todas',...new Set(profissoes.map(p=>p.categoria))],[profissoes])
  const filtradas=categoria==='Todas'?profissoes:profissoes.filter(p=>p.categoria===categoria)
  const xpAtual=atual?.xp||0
  const nivelAtual=atual?.nivel||1
  const metaAtual=metas[nivelAtual-1]||0
  const proximaMeta=metas[nivelAtual]||metaAtual
  const progresso=nivelAtual>=5?100:Math.max(0,Math.min(100,Math.round(((xpAtual-metaAtual)/(proximaMeta-metaAtual))*100)))

  return <main className="profissoes-pagina">
    <button className="profissoes-voltar" onClick={onVoltar||(()=>location.href='/')}>← Voltar</button>
    <header className="profissoes-hero"><p>Checkpoint 17</p><h1>Profissões e Reputação</h1><span>Escolha uma carreira, trabalhe, receba recompensas e avance até Guardião da profissão.</span></header>
    <section className="reputacao-grade">{Object.entries(nomesArea).map(([chave,nome])=><article key={chave}><small>{nome}</small><strong>{reputacao?.[chave]??0}</strong></article>)}</section>

    {atual&&<>
      <section className="profissao-atual"><div><p>Profissão atual</p><h2>{atual.profissoes?.icone} {atual.profissoes?.nome}</h2><span>{atual.cargo} · Nível profissional {atual.nivel}</span><div className="carreira-xp"><div><b>{xpAtual} XP</b><small>{nivelAtual<5?`${proximaMeta-xpAtual} XP para ${cargos[nivelAtual]}`:'Nível máximo alcançado'}</small></div><i><em style={{width:`${progresso}%`}}/></i></div></div><button onClick={abandonar} disabled={acao}>Abandonar profissão</button></section>
      <section className="trabalhos-area"><header><div><p>17.3 — Trabalho e recompensas</p><h2>Tarefas profissionais</h2></div><span>Conclua tarefas dentro do limite diário.</span></header><div className="trabalhos-grade">{tarefas.map(t=><article key={t.id} className={`tarefa-${t.dificuldade}`}><small>{t.dificuldade} · nível {t.nivel_profissional_minimo}+</small><h3>{t.titulo}</h3><p>{t.descricao}</p><div className="tarefa-recompensas"><span>💰 {t.recompensa_ipes} Ipês</span><span>✦ {t.recompensa_xp} XP</span><span>★ {t.recompensa_reputacao} {nomesArea[t.reputacao_area]}</span></div><button onClick={()=>concluir(t)} disabled={acao||nivelAtual<t.nivel_profissional_minimo}>{nivelAtual<t.nivel_profissional_minimo?'Nível insuficiente':acao?'Registrando...':'Concluir trabalho'}</button></article>)}</div></section>
      <section className="carreira-area"><header><p>17.4 — Progressão de carreira</p><h2>Caminho profissional</h2></header><div className="carreira-etapas">{cargos.map((cargo,i)=><article key={cargo} className={nivelAtual>=i+1?'alcancado':''}><span>{i+1}</span><strong>{cargo}</strong><small>{metas[i]} XP</small></article>)}</div></section>
      <section className="historico-trabalhos"><header><p>Registro profissional</p><h2>Trabalhos recentes</h2></header>{historico.length===0?<p>Nenhum trabalho concluído ainda.</p>:<div>{historico.map(h=><article key={h.id}><div><strong>{h.tarefas_profissionais?.titulo||'Trabalho profissional'}</strong><small>{new Date(h.concluida_em).toLocaleString('pt-BR')}</small></div><span>+{h.recompensa_ipes} Ipês · +{h.recompensa_xp} XP · +{h.recompensa_reputacao} {nomesArea[h.reputacao_area]}</span>{h.nivel_depois>h.nivel_antes&&<em>Promoção: {h.cargo_depois}</em>}</article>)}</div>}</section>
    </>}

    {!atual&&<><nav className="profissoes-filtros">{categorias.map(c=><button key={c} className={categoria===c?'ativo':''} onClick={()=>setCategoria(c)}>{c}</button>)}</nav>{mensagem&&<p className="profissoes-mensagem">{mensagem}</p>}{carregando?<p className="profissoes-estado">Consultando vagas...</p>:<section className="profissoes-grade">{filtradas.map(p=>{const r=requisitos(p);const apto=r.nivel&&r.ano&&r.reputacao;return <article key={p.id} className="profissao-card"><div className="profissao-icone">{p.icone}</div><small>{p.categoria}</small><h2>{p.nome}</h2><p>{p.descricao}</p><div className="profissao-requisitos"><span className={r.nivel?'ok':'nao'}>{r.nivel?'✓':'×'} Nível {p.nivel_requerido}</span><span className={r.ano?'ok':'nao'}>{r.ano?'✓':'×'} {p.ano_minimo}º ano</span><span className={r.reputacao?'ok':'nao'}>{r.reputacao?'✓':'×'} {p.reputacao_minima} em {nomesArea[p.reputacao_area]}</span></div><button onClick={()=>setSelecionada(p)}>Ver profissão</button>{apto&&<em>Apto para candidatura</em>}</article>})}</section>}</>}
    {atual&&mensagem&&<p className="profissoes-mensagem">{mensagem}</p>}

    {selecionada&&<div className="profissao-modal" onClick={()=>setSelecionada(null)}><article onClick={e=>e.stopPropagation()}><button className="profissao-fechar" onClick={()=>setSelecionada(null)}>×</button><span>{selecionada.icone}</span><small>{selecionada.categoria}</small><h2>{selecionada.nome}</h2><p>{selecionada.descricao}</p><div className="profissao-modal-requisitos"><strong>Requisitos</strong><span>Nível {selecionada.nivel_requerido}</span><span>{selecionada.ano_minimo}º ano</span><span>{selecionada.reputacao_minima} de reputação em {nomesArea[selecionada.reputacao_area]}</span><span>{selecionada.vagas_totais} vagas totais</span></div><button onClick={()=>candidatar(selecionada)} disabled={acao||!Object.values(requisitos(selecionada)).every(Boolean)}>{acao?'Registrando...':'Candidatar-se'}</button></article></div>}
    {promocao&&<div className="promocao-modal" onClick={()=>setPromocao(null)}><article onClick={e=>e.stopPropagation()}><span>✦</span><p>Promoção profissional</p><h2>{promocao.cargo}</h2><strong>Nível {promocao.nivel}</strong><button onClick={()=>setPromocao(null)}>Continuar</button></article></div>}
  </main>
}
