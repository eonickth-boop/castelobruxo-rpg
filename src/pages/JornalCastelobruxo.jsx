import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/jornal-castelobruxo.css'

const categorias=['Notícias da Escola','Eventos','Entrevistas','Tribos','Exploração','Classificados','Opinião']
const vazio={titulo:'',subtitulo:'',resumo:'',conteudo:'',categoria:'Notícias da Escola',imagem_url:''}

export default function JornalCastelobruxo(){
  const [usuario,setUsuario]=useState(null),[perfil,setPerfil]=useState(null),[jornalista,setJornalista]=useState(false),[editor,setEditor]=useState(false)
  const [edicoes,setEdicoes]=useState([]),[materias,setMaterias]=useState([]),[minhas,setMinhas]=useState([]),[pendentes,setPendentes]=useState([])
  const [aba,setAba]=useState('jornal'),[selecionada,setSelecionada]=useState(null),[form,setForm]=useState(vazio),[mensagem,setMensagem]=useState(''),[carregando,setCarregando]=useState(true),[salvando,setSalvando]=useState(false)
  const [edicaoForm,setEdicaoForm]=useState({id:null,numero:1,titulo:'',subtitulo:'',descricao:'',status:'rascunho'})

  useEffect(()=>{carregar()},[])
  async function carregar(){
    setCarregando(true);setMensagem('')
    const {data:{user}}=await supabase.auth.getUser();setUsuario(user)
    let p=null,j=false,e=false
    if(user){
      const {data}=await supabase.from('perfis').select('id,usuario,nome_personagem,cargo').eq('id',user.id).maybeSingle();p=data;setPerfil(data)
      const {data:ehJ}=await supabase.rpc('usuario_e_jornalista');j=Boolean(ehJ);setJornalista(j)
      e=['administrador','admin','professor'].includes(String(data?.cargo||'').toLowerCase());setEditor(e)
    }
    const [{data:eds},{data:mats}]=await Promise.all([
      supabase.from('jornal_edicoes').select('*').in('status',['publicada','arquivada']).order('numero',{ascending:false}),
      supabase.from('jornal_materias').select('*,perfis!jornal_materias_autor_id_fkey(nome_personagem,usuario),jornal_edicoes(numero,titulo)').eq('status','publicado').order('publicado_em',{ascending:false})
    ])
    setEdicoes(eds||[]);setMaterias(mats||[])
    if(user){const {data}=await supabase.from('jornal_materias').select('*').eq('autor_id',user.id).order('criado_em',{ascending:false});setMinhas(data||[])}
    if(e){const [{data:revisao},{data:todasEdicoes}]=await Promise.all([
      supabase.from('jornal_materias').select('*,perfis!jornal_materias_autor_id_fkey(nome_personagem,usuario)').in('status',['enviado','em_revisao','aprovado']).order('criado_em'),
      supabase.from('jornal_edicoes').select('*').order('numero',{ascending:false})
    ]);setPendentes(revisao||[]);setEdicoes(todasEdicoes||eds||[])}
    setCarregando(false)
  }

  async function salvarMateria(e){e.preventDefault();if(!usuario)return;setSalvando(true);setMensagem('')
    const {data,error}=await supabase.from('jornal_materias').insert({...form,autor_id:usuario.id,status:'rascunho'}).select().single()
    if(error)setMensagem(error.message);else{setMensagem('Rascunho salvo.');setForm(vazio);setMinhas(v=>[data,...v])}
    setSalvando(false)
  }
  async function enviar(id){setSalvando(true);const {error}=await supabase.rpc('enviar_materia_jornal',{p_materia_id:id});setMensagem(error?error.message:'Matéria enviada para revisão.');await carregar();setSalvando(false)}
  async function revisar(m,status){
    const obs=status==='recusado'?window.prompt('Motivo da recusa:')||'Revisão necessária.':null
    let edicaoId=m.edicao_id||null
    if(status==='publicado'){edicaoId=window.prompt('Cole o ID da edição escolhida:')||null;if(!edicaoId)return}
    const {error}=await supabase.rpc('revisar_materia_jornal',{p_materia_id:m.id,p_status:status,p_observacao:obs,p_edicao_id:edicaoId,p_destaque:Boolean(m.destaque)})
    setMensagem(error?error.message:`Matéria ${status.replace('_',' ')}.`);await carregar()
  }
  async function salvarEdicao(e){e.preventDefault();setSalvando(true)
    const {error}=await supabase.rpc('salvar_edicao_jornal',{p_id:edicaoForm.id,p_numero:Number(edicaoForm.numero),p_titulo:edicaoForm.titulo,p_subtitulo:edicaoForm.subtitulo,p_descricao:edicaoForm.descricao,p_status:edicaoForm.status})
    setMensagem(error?error.message:'Edição salva.');if(!error)setEdicaoForm({id:null,numero:(Math.max(0,...edicoes.map(x=>x.numero))+1),titulo:'',subtitulo:'',descricao:'',status:'rascunho'});await carregar();setSalvando(false)
  }

  const destaque=materias.find(m=>m.destaque)||materias[0]
  const demais=useMemo(()=>materias.filter(m=>m.id!==destaque?.id),[materias,destaque])

  return <main className="jornal-pagina">
    <header className="jornal-cabecalho"><p>Checkpoint 18</p><h1>A Voz de Castelobruxo</h1><span>Notícias, descobertas e histórias da comunidade mágica brasileira.</span></header>
    <nav className="jornal-abas"><button className={aba==='jornal'?'ativo':''} onClick={()=>setAba('jornal')}>Jornal</button><button className={aba==='arquivo'?'ativo':''} onClick={()=>setAba('arquivo')}>Arquivo</button>{jornalista&&<button className={aba==='redacao'?'ativo':''} onClick={()=>setAba('redacao')}>Minha redação</button>}{editor&&<button className={aba==='editorial'?'ativo':''} onClick={()=>setAba('editorial')}>Painel editorial</button>}</nav>
    {mensagem&&<p className="jornal-mensagem">{mensagem}</p>}
    {carregando?<p className="jornal-estado">Preparando a edição...</p>:aba==='jornal'?<>
      {destaque?<article className="jornal-destaque" onClick={()=>setSelecionada(destaque)}><div><small>{destaque.categoria}</small><h2>{destaque.titulo}</h2><p>{destaque.resumo}</p><span>Por {destaque.perfis?.nome_personagem||destaque.perfis?.usuario}</span></div>{destaque.imagem_url&&<img src={destaque.imagem_url} alt=""/>}</article>:<p className="jornal-estado">A edição inaugural está aguardando suas primeiras matérias.</p>}
      <section className="jornal-grade">{demais.map(m=><article key={m.id} onClick={()=>setSelecionada(m)}>{m.imagem_url&&<img src={m.imagem_url} alt=""/>}<small>{m.categoria}</small><h3>{m.titulo}</h3><p>{m.resumo}</p><span>Por {m.perfis?.nome_personagem||m.perfis?.usuario}</span></article>)}</section>
    </>:aba==='arquivo'?<section className="jornal-arquivo">{edicoes.map(e=><article key={e.id}><small>Edição nº {e.numero}</small><h2>{e.titulo}</h2><p>{e.subtitulo||e.descricao}</p><span>{e.publicada_em?new Date(e.publicada_em).toLocaleDateString('pt-BR'):'Ainda não publicada'}</span></article>)}</section>
    :aba==='redacao'?<section className="jornal-redacao"><form onSubmit={salvarMateria}><h2>Escrever matéria</h2><input required placeholder="Título" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})}/><input placeholder="Subtítulo" value={form.subtitulo} onChange={e=>setForm({...form,subtitulo:e.target.value})}/><select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}>{categorias.map(c=><option key={c}>{c}</option>)}</select><textarea required placeholder="Resumo" value={form.resumo} onChange={e=>setForm({...form,resumo:e.target.value})}/><textarea required className="conteudo" placeholder="Conteúdo completo" value={form.conteudo} onChange={e=>setForm({...form,conteudo:e.target.value})}/><input placeholder="URL de imagem opcional" value={form.imagem_url} onChange={e=>setForm({...form,imagem_url:e.target.value})}/><button disabled={salvando}>{salvando?'Salvando...':'Salvar rascunho'}</button></form><div className="jornal-minhas"><h2>Minhas matérias</h2>{minhas.map(m=><article key={m.id}><div><strong>{m.titulo}</strong><small>{m.status.replace('_',' ')}</small>{m.observacao_editorial&&<p>{m.observacao_editorial}</p>}</div>{['rascunho','recusado'].includes(m.status)&&<button onClick={()=>enviar(m.id)} disabled={salvando}>Enviar</button>}</article>)}</div></section>
    :<section className="jornal-editorial"><form onSubmit={salvarEdicao}><h2>Criar edição</h2><input type="number" min="1" required value={edicaoForm.numero} onChange={e=>setEdicaoForm({...edicaoForm,numero:e.target.value})}/><input required placeholder="Título" value={edicaoForm.titulo} onChange={e=>setEdicaoForm({...edicaoForm,titulo:e.target.value})}/><input placeholder="Subtítulo" value={edicaoForm.subtitulo} onChange={e=>setEdicaoForm({...edicaoForm,subtitulo:e.target.value})}/><textarea placeholder="Descrição" value={edicaoForm.descricao} onChange={e=>setEdicaoForm({...edicaoForm,descricao:e.target.value})}/><select value={edicaoForm.status} onChange={e=>setEdicaoForm({...edicaoForm,status:e.target.value})}><option value="rascunho">Rascunho</option><option value="publicada">Publicada</option><option value="arquivada">Arquivada</option></select><button disabled={salvando}>Salvar edição</button></form><div><h2>Fila editorial</h2>{pendentes.map(m=><article key={m.id}><div><small>{m.categoria} · {m.status.replace('_',' ')}</small><h3>{m.titulo}</h3><p>{m.resumo}</p><span>Por {m.perfis?.nome_personagem||m.perfis?.usuario}</span></div><div className="jornal-acoes"><button onClick={()=>revisar(m,'em_revisao')}>Revisar</button><button onClick={()=>revisar(m,'aprovado')}>Aprovar</button><button onClick={()=>revisar(m,'publicado')}>Publicar</button><button onClick={()=>revisar(m,'recusado')}>Recusar</button></div></article>)}</div></section>}
    {selecionada&&<div className="jornal-leitor" onClick={()=>setSelecionada(null)}><article onClick={e=>e.stopPropagation()}><button onClick={()=>setSelecionada(null)}>×</button><small>{selecionada.categoria}</small><h1>{selecionada.titulo}</h1>{selecionada.subtitulo&&<h2>{selecionada.subtitulo}</h2>}<p className="autor">Por {selecionada.perfis?.nome_personagem||selecionada.perfis?.usuario}</p>{selecionada.imagem_url&&<img src={selecionada.imagem_url} alt=""/>}<div>{selecionada.conteudo.split('\n').map((p,i)=><p key={i}>{p}</p>)}</div></article></div>}
  </main>
}
