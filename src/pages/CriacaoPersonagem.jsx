import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/criacao-personagem.css'

const anos = Array.from({ length: 7 }, (_, i) => ({ valor: i + 1, rotulo: `${i + 1}º ano` }))
const qualidadesOpcoes = ['Protetor','Corajoso','Observador','Criativo','Curioso','Leal','Paciente','Estratégico','Empático','Determinado']
const defeitosOpcoes = ['Teimoso','Impulsivo','Desconfiado','Distraído','Orgulhoso','Ansioso','Competitivo','Reservado']
const capitulos = [
  ['Carta de registro','Quem atravessa os portões de Castelobruxo?'],
  ['Origem','De onde veio sua magia?'],
  ['Personalidade','O que existe por trás do nome?'],
  ['História pessoal','Quais caminhos trouxeram você até aqui?'],
  ['Afinidades mágicas','Como sua magia responde ao mundo?'],
  ['Aparência e presença','Como será lembrado pelos corredores?'],
  ['Juramento','Seu registro está pronto para ser selado.'],
]

function extensaoArquivo(arquivo) {
  const partes = arquivo.name.split('.')
  return partes.length > 1 ? partes.pop().toLowerCase() : 'jpg'
}

function Campo({ rotulo, largo = false, children, dica }) {
  return <label className={largo ? 'criacao-campo-largo' : ''}><span>{rotulo}</span>{children}{dica && <small>{dica}</small>}</label>
}

function Escolhas({ opcoes, valores, limite, onChange }) {
  function alternar(opcao) {
    if (valores.includes(opcao)) onChange(valores.filter((v) => v !== opcao))
    else if (valores.length < limite) onChange([...valores, opcao])
  }
  return <div className="criacao-escolhas">{opcoes.map((opcao) => <button type="button" key={opcao} className={valores.includes(opcao) ? 'ativo' : ''} onClick={() => alternar(opcao)}>{opcao}</button>)}</div>
}

export default function CriacaoPersonagem({ perfil, onConcluido, sair }) {
  const inicial = perfil?.criacao_rascunho || {}
  const [etapa, setEtapa] = useState(Number(inicial.etapa) || 1)
  const [dados, setDados] = useState({
    nome: inicial.nome || perfil?.nome_personagem || '', apelido: inicial.apelido || '', idade: inicial.idade || perfil?.idade_personagem || '', aniversario: inicial.aniversario || '', ano: Number(inicial.ano || perfil?.ano || 1), pronomes: inicial.pronomes || perfil?.pronomes || '', origem: inicial.origem || perfil?.origem || '', tipoCriacao: inicial.tipoCriacao || '', relacaoMagia: inicial.relacaoMagia || '', chamado: inicial.chamado || '', qualidades: Array.isArray(inicial.qualidades) ? inicial.qualidades : [], defeitos: Array.isArray(inicial.defeitos) ? inicial.defeitos : [], medo: inicial.medo || '', desejo: inicial.desejo || '', habito: inicial.habito || '', conflito: inicial.conflito || '', bio: inicial.bio || perfil?.bio || '', lembranca: inicial.lembranca || '', vinculo: inicial.vinculo || '', segredo: inicial.segredo || '', motivo: inicial.motivo || '', materiaInteresse: inicial.materiaInteresse || '', materiaTemor: inicial.materiaTemor || '', afinidadeNatureza: inicial.afinidadeNatureza || '', afinidadeCriaturas: inicial.afinidadeCriaturas || '', afinidadePocoes: inicial.afinidadePocoes || '', afinidadeExploracao: inicial.afinidadeExploracao || '', afinidadeDefesa: inicial.afinidadeDefesa || '', aparencia: inicial.aparencia || '', altura: inicial.altura || '', estilo: inicial.estilo || '', objeto: inicial.objeto || '', juramento: inicial.juramento || false,
  })
  const [avatar, setAvatar] = useState(null)
  const [banner, setBanner] = useState(null)
  const [previewAvatar, setPreviewAvatar] = useState(perfil?.avatar_url || '')
  const [previewBanner, setPreviewBanner] = useState(perfil?.banner_url || '')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const progresso = Math.round((etapa / capitulos.length) * 100)
  const tracoPrincipal = dados.qualidades[0] || 'Curioso'
  const resumo = useMemo(() => ({ nome: dados.apelido || dados.nome || 'Personagem sem nome', origem: dados.origem || 'Origem não definida', traco: tracoPrincipal, objetivo: dados.desejo || 'Desejo ainda não revelado' }), [dados, tracoPrincipal])

  function alterar(campo, valor) { setDados((atual) => ({ ...atual, [campo]: valor })); setSalvo(false) }

  async function salvarRascunho(etapaDestino = etapa) {
    if (!perfil?.id || perfil?.personagem_criado) return true

    setSalvando(true)
    setSalvo(false)

    const { error } = await supabase.rpc('salvar_rascunho_criacao', {
      p_rascunho: {
        ...dados,
        qualidades: Array.isArray(dados.qualidades) ? dados.qualidades : [],
        defeitos: Array.isArray(dados.defeitos) ? dados.defeitos : [],
        etapa: etapaDestino,
      },
    })

    setSalvando(false)

    if (error) {
      console.error('Erro ao salvar rascunho:', error)
      setMensagem(error.message || 'Não foi possível salvar sua ficha. Verifique sua conexão e tente novamente.')
      return false
    }

    setSalvo(true)
    return true
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      salvarRascunho(etapa)
    }, 900)

    return () => clearTimeout(timer)
  }, [dados, etapa, perfil?.id, perfil?.personagem_criado])

  function validar() {
    const falhas = { 1: dados.nome.trim().length < 3 || !Number.isInteger(Number(dados.idade)) || Number(dados.idade) < 11 || Number(dados.idade) > 99, 2: dados.origem.trim().length < 2 || !dados.tipoCriacao || dados.chamado.trim().length < 20, 3: dados.qualidades.length !== 3 || dados.defeitos.length !== 2 || dados.medo.trim().length < 3 || dados.desejo.trim().length < 3, 4: dados.bio.trim().length < 80 || dados.motivo.trim().length < 20, 5: !dados.materiaInteresse || !dados.materiaTemor, 6: dados.aparencia.trim().length < 20 || dados.objeto.trim().length < 2, 7: !dados.juramento }
    if (falhas[etapa]) { setMensagem('Complete os campos essenciais deste capítulo antes de continuar.'); return false }
    setMensagem(''); return true
  }

  async function avancar() {
    if (!validar()) return

    const proximaEtapa = Math.min(capitulos.length, etapa + 1)
    const salvou = await salvarRascunho(proximaEtapa)

    if (!salvou) return

    setEtapa(proximaEtapa)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function voltar() { setMensagem(''); setEtapa((e) => Math.max(1, e - 1)) }

  function selecionarArquivo(tipo, arquivo) {
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/') || arquivo.size > 5 * 1024 * 1024) { setMensagem('Use uma imagem de até 5 MB.'); return }
    const preview = URL.createObjectURL(arquivo)
    if (tipo === 'avatar') { setAvatar(arquivo); setPreviewAvatar(preview) } else { setBanner(arquivo); setPreviewBanner(preview) }
  }

  async function enviarMidia(tipo, arquivo) {
    if (!arquivo) return null
    const caminho = `${perfil.id}/${tipo}-${crypto.randomUUID()}.${extensaoArquivo(arquivo)}`
    const { error } = await supabase.storage.from('midias-perfis').upload(caminho, arquivo, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('midias-perfis').getPublicUrl(caminho)
    const { error: registroErro } = await supabase.from('midias_perfil').insert({ usuario_id: perfil.id, tipo, caminho_arquivo: caminho, url_arquivo: data.publicUrl, status: 'pendente' })
    if (registroErro) throw registroErro
    return data.publicUrl
  }

  async function concluirCriacao() {
    if (!validar()) return
    setSalvando(true); setMensagem('')
    try {
      await Promise.all([enviarMidia('avatar', avatar), enviarMidia('banner', banner)])
      const { data, error } = await supabase.rpc('concluir_criacao_personagem', { p_nome_personagem: dados.nome.trim(), p_idade_personagem: Number(dados.idade), p_ano: Number(dados.ano), p_pronomes: dados.pronomes.trim() || null, p_origem: dados.origem.trim(), p_traco_principal: tracoPrincipal, p_bio: dados.bio.trim(), p_detalhes: dados })
      if (error) throw error
      setMensagem('Registro selado. A Cerimônia dos Guardiões começará agora.')
      onConcluido?.(data)
    } catch (error) { setMensagem(error.message || 'Não foi possível concluir a criação.') } finally { setSalvando(false) }
  }

  const [titulo, subtitulo] = capitulos[etapa - 1]

  return <main className="criacao-personagem"><div className="criacao-fundo" /><section className="criacao-painel criacao-painel-imersivo">
    <header className="criacao-cabecalho"><img src="/assets/logo/castelobruxo-logo.png" alt="Castelobruxo" /><div><p>Prólogo de entrada</p><h1>Seu primeiro registro</h1><span>As páginas deste livro guardarão quem você era antes de cruzar os portões — e quem escolhe se tornar.</span></div></header>
    <div className="criacao-progresso"><div><span style={{ width: `${progresso}%` }} /></div><small>Capítulo {etapa} de {capitulos.length} · {salvando ? 'salvando...' : salvo ? 'rascunho salvo' : 'alterações pendentes'}</small></div>
    {mensagem && <p className="criacao-mensagem">{mensagem}</p>}
    <div className="criacao-corpo"><section className="criacao-conteudo"><div className="criacao-titulo-etapa"><span>{String(etapa).padStart(2,'0')}</span><div><p>{titulo}</p><h2>{subtitulo}</h2></div></div>

    {etapa === 1 && <div className="criacao-form-grade"><Campo rotulo="Nome completo"><input value={dados.nome} onChange={(e) => alterar('nome', e.target.value)} maxLength={70} /></Campo><Campo rotulo="Como deseja ser chamado"><input value={dados.apelido} onChange={(e) => alterar('apelido', e.target.value)} maxLength={40} /></Campo><Campo rotulo="Idade"><input type="number" min="11" max="99" value={dados.idade} onChange={(e) => alterar('idade', e.target.value)} /></Campo><Campo rotulo="Aniversário"><input type="date" value={dados.aniversario} onChange={(e) => alterar('aniversario', e.target.value)} /></Campo><Campo rotulo="Ano escolar"><select value={dados.ano} onChange={(e) => alterar('ano', Number(e.target.value))}>{anos.map(a => <option key={a.valor} value={a.valor}>{a.rotulo}</option>)}</select></Campo><Campo rotulo="Pronomes"><input value={dados.pronomes} onChange={(e) => alterar('pronomes', e.target.value)} placeholder="Opcional" /></Campo></div>}

    {etapa === 2 && <div className="criacao-form-grade"><Campo rotulo="Cidade, região ou comunidade"><input value={dados.origem} onChange={(e) => alterar('origem', e.target.value)} /></Campo><Campo rotulo="Como cresceu"><select value={dados.tipoCriacao} onChange={(e) => alterar('tipoCriacao', e.target.value)}><option value="">Escolha</option><option>Em uma cidade comum</option><option>Em uma comunidade mágica</option><option>Em uma região rural</option><option>Em uma família não mágica</option><option>Viajando entre lugares</option></select></Campo><Campo rotulo="Sua relação com a magia antes da escola" largo><textarea rows="4" value={dados.relacaoMagia} onChange={(e) => alterar('relacaoMagia', e.target.value)} /></Campo><Campo rotulo="Como recebeu o chamado de Castelobruxo" largo dica={`${dados.chamado.length}/500`}><textarea rows="5" maxLength="500" value={dados.chamado} onChange={(e) => alterar('chamado', e.target.value)} /></Campo></div>}

    {etapa === 3 && <div className="criacao-form-grade"><Campo rotulo="Escolha exatamente 3 qualidades" largo><Escolhas opcoes={qualidadesOpcoes} valores={dados.qualidades} limite={3} onChange={(v) => alterar('qualidades', v)} /></Campo><Campo rotulo="Escolha exatamente 2 defeitos" largo><Escolhas opcoes={defeitosOpcoes} valores={dados.defeitos} limite={2} onChange={(v) => alterar('defeitos', v)} /></Campo><Campo rotulo="Maior medo"><input value={dados.medo} onChange={(e) => alterar('medo', e.target.value)} /></Campo><Campo rotulo="Maior desejo"><input value={dados.desejo} onChange={(e) => alterar('desejo', e.target.value)} /></Campo><Campo rotulo="Hábito ou mania"><input value={dados.habito} onChange={(e) => alterar('habito', e.target.value)} /></Campo><Campo rotulo="Como reage a conflitos"><select value={dados.conflito} onChange={(e) => alterar('conflito', e.target.value)}><option value="">Escolha</option><option>Enfrenta de imediato</option><option>Observa antes de agir</option><option>Tenta negociar</option><option>Protege os outros primeiro</option><option>Evita até não poder mais</option></select></Campo></div>}

    {etapa === 4 && <div className="criacao-form-grade"><Campo rotulo="História do personagem" largo dica={`${dados.bio.length}/1200`}><textarea rows="8" maxLength="1200" value={dados.bio} onChange={(e) => alterar('bio', e.target.value)} placeholder="Conte sua infância, descobertas, perdas, sonhos e o caminho até a escola." /></Campo><Campo rotulo="Uma lembrança que nunca esqueceu"><textarea rows="4" value={dados.lembranca} onChange={(e) => alterar('lembranca', e.target.value)} /></Campo><Campo rotulo="Pessoa ou criatura importante"><textarea rows="4" value={dados.vinculo} onChange={(e) => alterar('vinculo', e.target.value)} /></Campo><Campo rotulo="Um segredo (opcional)"><textarea rows="4" value={dados.segredo} onChange={(e) => alterar('segredo', e.target.value)} /></Campo><Campo rotulo="Por que deseja estudar em Castelobruxo"><textarea rows="4" value={dados.motivo} onChange={(e) => alterar('motivo', e.target.value)} /></Campo></div>}

    {etapa === 5 && <div className="criacao-form-grade"><Campo rotulo="Matéria que mais desperta interesse"><select value={dados.materiaInteresse} onChange={(e) => alterar('materiaInteresse', e.target.value)}><option value="">Escolha</option><option>Encantamentos</option><option>Poções</option><option>Criaturas Mágicas</option><option>Defesa</option><option>Herbologia</option><option>História da Magia</option><option>Exploração Mágica</option></select></Campo><Campo rotulo="Matéria que mais intimida"><select value={dados.materiaTemor} onChange={(e) => alterar('materiaTemor', e.target.value)}><option value="">Escolha</option><option>Encantamentos</option><option>Poções</option><option>Criaturas Mágicas</option><option>Defesa</option><option>Herbologia</option><option>História da Magia</option><option>Exploração Mágica</option></select></Campo>{[['Natureza','afinidadeNatureza'],['Criaturas','afinidadeCriaturas'],['Poções','afinidadePocoes'],['Exploração','afinidadeExploracao'],['Defesa','afinidadeDefesa']].map(([nome,chave]) => <Campo key={nome} rotulo={`Quando pensa em ${nome.toLowerCase()}...`}><select value={dados[chave]} onChange={(e) => alterar(chave, e.target.value)}><option value="">Escolha</option><option>Sinto familiaridade</option><option>Tenho curiosidade</option><option>Tenho respeito e cautela</option><option>Sinto insegurança</option></select></Campo>)}</div>}

    {etapa === 6 && <><div className="criacao-form-grade"><Campo rotulo="Descrição física" largo dica={`${dados.aparencia.length}/600`}><textarea rows="5" maxLength="600" value={dados.aparencia} onChange={(e) => alterar('aparencia', e.target.value)} /></Campo><Campo rotulo="Altura aproximada"><input value={dados.altura} onChange={(e) => alterar('altura', e.target.value)} placeholder="Ex.: 1,68 m" /></Campo><Campo rotulo="Estilo de roupa"><input value={dados.estilo} onChange={(e) => alterar('estilo', e.target.value)} /></Campo><Campo rotulo="Objeto que sempre carrega" largo><input value={dados.objeto} onChange={(e) => alterar('objeto', e.target.value)} /></Campo></div><div className="criacao-midias"><article><div className="criacao-preview-avatar">{previewAvatar ? <img src={previewAvatar} alt="" /> : <span>👤</span>}</div><div><h3>Retrato</h3><p>Será enviado para aprovação.</p><label className="criacao-arquivo">Escolher imagem<input type="file" accept="image/*" onChange={(e) => selecionarArquivo('avatar', e.target.files?.[0])} /></label></div></article><article><div className="criacao-preview-banner" style={previewBanner ? { backgroundImage: `url("${previewBanner}")` } : undefined}>{!previewBanner && <span>Banner</span>}</div><div><h3>Banner público</h3><p>Também ficará pendente.</p><label className="criacao-arquivo">Escolher imagem<input type="file" accept="image/*" onChange={(e) => selecionarArquivo('banner', e.target.files?.[0])} /></label></div></article></div></>}

    {etapa === 7 && <div className="criacao-juramento"><blockquote>“Diante da floresta, dos rios, dos ventos, das chamas e das sombras, prometo aprender sem esquecer quem sou, proteger sem buscar glória e escolher com responsabilidade o tipo de magia que deixarei no mundo.”</blockquote><label><input type="checkbox" checked={dados.juramento} onChange={(e) => alterar('juramento', e.target.checked)} /><span>Eu confirmo este registro e aceito seguir para a Cerimônia dos Guardiões.</span></label><div className="criacao-resumo criacao-resumo-final"><p>Registro final</p><h3>{resumo.nome}</h3><dl><div><dt>Origem</dt><dd>{resumo.origem}</dd></div><div><dt>Traço</dt><dd>{resumo.traco}</dd></div><div><dt>Objetivo</dt><dd>{resumo.objetivo}</dd></div><div><dt>Ano</dt><dd>{dados.ano}º ano</dd></div></dl><p>{dados.bio}</p></div></div>}
    </section><aside className="criacao-ficha-viva"><small>Ficha viva</small><h3>{resumo.nome}</h3><p>{resumo.origem}</p><dl><div><dt>Traço central</dt><dd>{resumo.traco}</dd></div><div><dt>Desejo</dt><dd>{resumo.objetivo}</dd></div><div><dt>Capítulo atual</dt><dd>{titulo}</dd></div></dl><p className="criacao-frase">Cada resposta altera a forma como seu personagem será apresentado no perfil e interpretado no RPG.</p></aside></div>
    <div className="criacao-acoes"><button type="button" className="criacao-sair" onClick={sair}>Sair</button><div>{etapa > 1 && <button type="button" onClick={voltar}>Voltar</button>}{etapa < capitulos.length ? <button type="button" onClick={avancar} disabled={salvando}>{salvando ? 'Salvando...' : 'Continuar'}</button> : <button type="button" onClick={concluirCriacao} disabled={salvando}>{salvando ? 'Selando registro...' : 'Selar registro'}</button>}</div></div>
  </section></main>
}
