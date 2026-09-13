import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/painel-profissoes-admin.css'

const areas=['geral','escola','tribo','conhecimento','natureza','exploracao','comercio']

export default function PainelProfissoesAdmin(){
  const [perfil,setPerfil]=useState(null)
  const [aba,setAba]=useState('profissoes')
  const [profissoes,setProfissoes]=useState([])
  const [trabalhadores,setTrabalhadores]=useState([])
  const [busca,setBusca]=useState('')
  const [mensagem,setMensagem]=useState('')
  const [carregando,setCarregando]=useState(true)
  const [processando,setProcessando]=useState(null)
  const [ajuste,setAjuste]=useState({usuario_id:'',area:'geral',variacao:1,motivo:''})

  useEffect(()=>{carregar()},[])

  async function carregar(){
    setCarregando(true);setMensagem('')
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setMensagem('Entre na sua conta.');setCarregando(false);return}
    const {data:p}=await supabase.from('perfis').select('id,usuario,nome_personagem,cargo').eq('id',user.id).maybeSingle()
    setPerfil(p)
    const [rp,rt]=await Promise.all([supabase.rpc('admin_listar_profissoes'),supabase.rpc('admin_listar_trabalhadores')])
    if(rp.error||rt.error)setMensagem(rp.error?.message||rt.error?.message||'Não foi possível carregar o painel.')
    setProfissoes(rp.data||[]);setTrabalhadores(rt.data||[]);setCarregando(false)
  }

  async function salvarProfissao(p){
    setProcessando(p.id);setMensagem('')
    const {error}=await supabase.rpc('admin_atualizar_profissao',{p_id:p.id,p_ativa:p.ativa,p_vagas:Number(p.vagas_totais),p_nivel:Number(p.nivel_requerido),p_ano:Number(p.ano_minimo),p_area:p.reputacao_area,p_reputacao:Number(p.reputacao_minima)})
    setMensagem(error?error.message:'Profissão atualizada.');setProcessando(null);if(!error)await carregar()
  }

  function alterar(id,campo,valor){setProfissoes(lista=>lista.map(p=>p.id===id?{...p,[campo]:valor}:p))}

  async function ajustarReputacao(e){
    e.preventDefault();setProcessando('reputacao');setMensagem('')
    const {error}=await supabase.rpc('admin_ajustar_reputacao',{p_usuario:ajuste.usuario_id,p_area:ajuste.area,p_variacao:Number(ajuste.variacao),p_motivo:ajuste.motivo})
    setMensagem(error?error.message:'Reputação ajustada e registrada no histórico.');setProcessando(null)
    if(!error)setAjuste(a=>({...a,variacao:1,motivo:''}))
  }

  const listaTrabalhadores=useMemo(()=>{const t=busca.trim().toLowerCase();return t?trabalhadores.filter(x=>[x.personagem,x.usuario,x.profissao,x.cargo,x.status].join(' ').toLowerCase().includes(t)):trabalhadores},[trabalhadores,busca])
  const admin=['administrador','admin'].includes(String(perfil?.cargo||'').toLowerCase())

  if(!carregando&&!admin)return <main className="pa-pagina"><section className="pa-bloqueado"><span>🔒</span><h1>Acesso restrito</h1><p>Apenas administradores podem gerenciar profissões.</p><button onClick={()=>location.href='/'}>Voltar</button></section></main>

  return <main className="pa-pagina">
    <button className="pa-voltar" onClick={()=>location.href='/'}>← Voltar</button>
    <header className="pa-hero"><p>Checkpoint 17.6</p><h1>Gestão de Profissões</h1><span>Vagas, requisitos, trabalhadores e reputação.</span></header>
    <nav className="pa-abas"><button className={aba==='profissoes'?'ativo':''} onClick={()=>setAba('profissoes')}>Profissões</button><button className={aba==='trabalhadores'?'ativo':''} onClick={()=>setAba('trabalhadores')}>Trabalhadores</button><button className={aba==='reputacao'?'ativo':''} onClick={()=>setAba('reputacao')}>Ajustar reputação</button></nav>
    {mensagem&&<p className="pa-mensagem">{mensagem}</p>}
    {carregando?<p className="pa-estado">Carregando gestão...</p>:aba==='profissoes'?<section className="pa-grade">{profissoes.map(p=><article key={p.id}><header><div><small>{p.categoria}</small><h2>{p.nome}</h2></div><label><input type="checkbox" checked={p.ativa} onChange={e=>alterar(p.id,'ativa',e.target.checked)}/> Ativa</label></header><div className="pa-campos"><label>Vagas<input type="number" min="0" value={p.vagas_totais} onChange={e=>alterar(p.id,'vagas_totais',e.target.value)}/></label><label>Ocupadas<input disabled value={p.ocupadas}/></label><label>Nível mínimo<input type="number" min="1" value={p.nivel_requerido} onChange={e=>alterar(p.id,'nivel_requerido',e.target.value)}/></label><label>Ano mínimo<input type="number" min="1" value={p.ano_minimo} onChange={e=>alterar(p.id,'ano_minimo',e.target.value)}/></label><label>Área<select value={p.reputacao_area} onChange={e=>alterar(p.id,'reputacao_area',e.target.value)}>{areas.map(a=><option key={a} value={a}>{a}</option>)}</select></label><label>Reputação mínima<input type="number" min="0" value={p.reputacao_minima} onChange={e=>alterar(p.id,'reputacao_minima',e.target.value)}/></label></div><button disabled={processando===p.id} onClick={()=>salvarProfissao(p)}>{processando===p.id?'Salvando...':'Salvar alterações'}</button></article>)}</section>:aba==='trabalhadores'?<section className="pa-tabela-area"><input className="pa-busca" type="search" placeholder="Pesquisar trabalhador" value={busca} onChange={e=>setBusca(e.target.value)}/><div className="pa-tabela-wrap"><table><thead><tr><th>Personagem</th><th>Usuário</th><th>Profissão</th><th>Cargo</th><th>Nível</th><th>XP</th><th>Status</th></tr></thead><tbody>{listaTrabalhadores.map(t=><tr key={t.vinculo_id}><td><strong>{t.personagem}</strong></td><td>@{t.usuario}</td><td>{t.profissao}</td><td>{t.cargo}</td><td>{t.nivel}</td><td>{t.xp}</td><td>{t.status}</td></tr>)}</tbody></table></div></section>:<section className="pa-reputacao"><form onSubmit={ajustarReputacao}><label>Trabalhador<select required value={ajuste.usuario_id} onChange={e=>setAjuste({...ajuste,usuario_id:e.target.value})}><option value="">Selecione</option>{trabalhadores.filter(t=>t.status==='ativo').map(t=><option key={t.vinculo_id} value={t.usuario_id}>{t.personagem} — {t.profissao}</option>)}</select></label><label>Área<select value={ajuste.area} onChange={e=>setAjuste({...ajuste,area:e.target.value})}>{areas.map(a=><option key={a}>{a}</option>)}</select></label><label>Variação<input type="number" value={ajuste.variacao} onChange={e=>setAjuste({...ajuste,variacao:e.target.value})}/></label><label>Motivo<textarea required value={ajuste.motivo} onChange={e=>setAjuste({...ajuste,motivo:e.target.value})} placeholder="Motivo do ajuste administrativo"/></label><button disabled={processando==='reputacao'}>{processando==='reputacao'?'Registrando...':'Aplicar ajuste'}</button></form></section>}
  </main>
}
