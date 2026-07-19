import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import Livro from './Livro'
import '../styles/biblioteca.css'

const LIMITE_CARTAO = 10
const capas = {
  Enciclopédias: ['enciclopedias', '✦'],
  Herbologia: ['herbologia', '❧'],
  História: ['historia', '☀'],
  Feitiços: ['feiticos', '✧'],
  Poções: ['pocoes', '⚗'],
  Minerais: ['minerais', '◆'],
  Exploração: ['exploracao', '⌖'],
  Literatura: ['literatura', '❦'],
  Astronomia: ['astronomia', '☾'],
  Cultura: ['cultura', '♨'],
  Criaturas: ['criaturas', '♞'],
  Castelobruxo: ['castelobruxo', '✺'],
}
const dadosCapa = categoria => capas[categoria] || ['geral', '❦']

export default function Biblioteca({ onVoltar }) {
  const [livros, setLivros] = useState([])
  const [livroSelecionado, setLivroSelecionado] = useState(null)
  const [paginas, setPaginas] = useState([])
  const [pesquisa, setPesquisa] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [carregando, setCarregando] = useState(true)
  const [livroAbrindoId, setLivroAbrindoId] = useState(null)
  const [acaoId, setAcaoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [emprestimos, setEmprestimos] = useState([])
  const [nomeEstudante, setNomeEstudante] = useState('')

  useEffect(() => { carregarTudo() }, [])

  async function carregarTudo() {
    setCarregando(true)
    setMensagem('')
    await Promise.all([carregarLivros(), carregarEmprestimos()])
    setCarregando(false)
  }

  async function carregarLivros() {
    const { data, error } = await supabase.from('livros').select('*').eq('ativo', true).order('ordem', { ascending: true })
    if (error) { console.error(error); setMensagem('Não foi possível carregar os livros.'); setLivros([]) }
    else setLivros(data ?? [])
  }

  async function carregarEmprestimos() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) { setEmprestimos([]); setNomeEstudante(''); return }
    const [{ data: perfil }, { data, error }] = await Promise.all([
      supabase.from('perfis').select('nome_personagem, usuario').eq('id', auth.user.id).maybeSingle(),
      supabase.from('biblioteca_emprestimos').select('id, livro_id, emprestado_em, devolucao_prevista, livros(titulo, autor)').is('devolvido_em', null).order('emprestado_em', { ascending: true }),
    ])
    setNomeEstudante(perfil?.nome_personagem || perfil?.usuario || 'Estudante')
    if (error) { console.error(error); setMensagem('Não foi possível carregar seu cartão da biblioteca.'); return }
    setEmprestimos(data ?? [])
  }

  async function abrirLivro(livro) {
    setLivroAbrindoId(livro.id); setMensagem('')
    const { data, error } = await supabase.from('paginas_livro').select('*').eq('livro_id', livro.id).order('numero', { ascending: true })
    if (error) { console.error(error); setMensagem('Não foi possível abrir este livro.') }
    else { setPaginas(data ?? []); setLivroSelecionado(livro) }
    setLivroAbrindoId(null)
  }

  async function emprestar(livro) {
    setAcaoId(livro.id); setMensagem('')
    const { error } = await supabase.rpc('emprestar_livro', { p_livro_id: livro.id })
    if (error) setMensagem(error.message || 'Não foi possível emprestar o livro.')
    else { setMensagem(`“${livro.titulo}” foi registrado no seu cartão por 14 dias.`); await carregarEmprestimos() }
    setAcaoId(null)
  }

  async function devolver(emprestimo) {
    setAcaoId(emprestimo.livro_id); setMensagem('')
    const { error } = await supabase.rpc('devolver_livro', { p_emprestimo_id: emprestimo.id })
    if (error) setMensagem(error.message || 'Não foi possível devolver o livro.')
    else { setMensagem('Livro devolvido. A linha foi apagada do cartão.'); await carregarEmprestimos() }
    setAcaoId(null)
  }

  const categorias = useMemo(() => ['Todos', ...new Set(livros.map(l => l.categoria).filter(Boolean))], [livros])
  const livrosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase('pt-BR')
    return livros.filter(livro => {
      const texto = [livro.titulo, livro.autor, livro.descricao, livro.categoria].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR')
      return (!termo || texto.includes(termo)) && (categoria === 'Todos' || livro.categoria === categoria)
    })
  }, [livros, pesquisa, categoria])

  const emprestimoPorLivro = useMemo(() => Object.fromEntries(emprestimos.map(item => [item.livro_id, item])), [emprestimos])
  if (livroSelecionado) return <Livro livro={livroSelecionado} paginas={paginas} onFechar={() => { setLivroSelecionado(null); setPaginas([]) }} />

  return <main className="biblioteca">
    <button type="button" className="biblioteca-voltar" onClick={onVoltar}>← Voltar</button>
    <header className="biblioteca-header"><div className="biblioteca-emblema">❦</div><p className="biblioteca-selo">Arquivo Central de Castelobruxo</p><h1>Biblioteca Ancestral</h1><p>Livros, enciclopédias, lendas e registros para leitura, pesquisa e investigação.</p></header>

    <section className="biblioteca-cartao-area">
      <div className="biblioteca-cartao" aria-label="Cartão da Biblioteca de Castelobruxo">
        <div className="biblioteca-cartao-cabecalho"><span>CASTELOBRUXO</span><strong>Cartão da Biblioteca</strong><small>Arquivo Central</small></div>
        <div className="biblioteca-cartao-titulos"><span>NOME DO ESTUDANTE</span><span>DEVOLUÇÃO</span></div>
        <div className="biblioteca-cartao-linhas">{Array.from({ length: LIMITE_CARTAO }, (_, indice) => {
          const item = emprestimos[indice]
          return <div className="biblioteca-cartao-linha" key={item?.id || indice}><span>{item ? nomeEstudante : ''}</span><time>{item ? new Date(`${item.devolucao_prevista}T12:00:00`).toLocaleDateString('pt-BR') : ''}</time></div>
        })}</div>
        <div className="biblioteca-cartao-rodape">Este cartão pertence ao acervo escolar de Castelobruxo</div>
      </div>
      <div className="biblioteca-cartao-info"><p>Seu registro de empréstimos</p><h2>Cartão da Biblioteca</h2><strong className="biblioteca-cartao-nome">{nomeEstudante || 'Estudante'}</strong><span>{emprestimos.length} de {LIMITE_CARTAO} espaços preenchidos</span><small>Ao devolver um livro, o nome e a data são apagados.</small></div>
    </section>

    <section className="biblioteca-ferramentas"><label className="biblioteca-pesquisa"><span>⌕</span><input type="search" placeholder="Pesquisar por título, autor ou categoria..." value={pesquisa} onChange={e => setPesquisa(e.target.value)} /></label><div className="biblioteca-contador"><strong>{livrosFiltrados.length}</strong><span>obras encontradas</span></div></section>
    <section className="categorias">{categorias.map(nome => <button key={nome} type="button" onClick={() => setCategoria(nome)} className={categoria === nome ? 'categoria-ativa' : undefined}>{nome}</button>)}</section>
    {mensagem && <p className="biblioteca-mensagem">{mensagem}</p>}

    {carregando ? <section className="biblioteca-estado"><div className="biblioteca-carregando" /><p>Organizando as estantes...</p></section> : <section className="estante">{livrosFiltrados.map(livro => {
      const emprestimo = emprestimoPorLivro[livro.id]
      const [classeCapa, simbolo] = dadosCapa(livro.categoria)
      return <article className="livro-card" key={livro.id}>
        <div className="capa-container">{livro.capa_url ? <img src={livro.capa_url} alt={`Capa de ${livro.titulo}`} className="capa-livro" /> : <div className={`capa-css capa-${classeCapa}`}><span className="capa-css-simbolo">{simbolo}</span><small>{livro.categoria}</small><strong>{livro.titulo}</strong><em>{livro.autor}</em></div>}</div>
        <div className="livro-card-conteudo"><span className="livro-categoria">{livro.categoria || 'Acervo Geral'}</span><h2>{livro.titulo}</h2><p className="livro-autor">por {livro.autor}</p><p className="livro-descricao">{livro.descricao}</p></div>
        <div className="livro-acoes"><button type="button" onClick={() => abrirLivro(livro)} disabled={livroAbrindoId !== null}>{livroAbrindoId === livro.id ? 'Abrindo...' : 'Ler agora'}</button>{emprestimo ? <button type="button" className="livro-devolver" onClick={() => devolver(emprestimo)} disabled={acaoId === livro.id}>Devolver</button> : <button type="button" className="livro-emprestar" onClick={() => emprestar(livro)} disabled={acaoId === livro.id || emprestimos.length >= LIMITE_CARTAO}>Emprestar por 14 dias</button>}</div>
      </article>
    })}</section>}
  </main>
}
