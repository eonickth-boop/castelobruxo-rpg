import { useMemo, useState } from 'react'
import './comunidade-v2.css'

const postsIniciais = [
  { id: 1, autor: 'Lívia Arayê', iniciais: 'LA', tempo: 'há 12 min', grupo: 'Mural geral', texto: 'Alguém mais viu as luzes azuis perto da Torre das Águas ontem à noite?', curtidas: 18, comentarios: 7 },
  { id: 2, autor: 'Caio Yandara', iniciais: 'CY', tempo: 'há 38 min', grupo: 'Clube de Exploração', texto: 'Organizei as anotações da última trilha. O mapa já está disponível no arquivo do clube.', curtidas: 31, comentarios: 12 },
  { id: 3, autor: 'Maya Anayru', iniciais: 'MA', tempo: 'há 1 h', grupo: 'Terceiro ano', texto: 'Lembrete: a entrega de Herbologia Amazônica termina hoje às 23h59.', curtidas: 22, comentarios: 4 },
]

const grupos = [
  { nome: 'Clube de Exploração', membros: 128, atividade: '9 novas mensagens' },
  { nome: 'Arquivo de Teorias', membros: 74, atividade: '3 novas publicações' },
  { nome: 'Terceiro ano', membros: 46, atividade: '12 pessoas online' },
]

const conversas = [
  { nome: 'Lívia Arayê', texto: 'Você vai para a aula hoje?', hora: '07:42', novas: 2 },
  { nome: 'Grupo da Ronda', texto: 'Caio enviou um mapa.', hora: 'Ontem', novas: 1 },
  { nome: 'Maya Anayru', texto: 'Obrigada pelas anotações!', hora: 'Ontem', novas: 0 },
]

export default function ComunidadeV2({ onVoltar }) {
  const [aba, setAba] = useState('feed')
  const [posts, setPosts] = useState(postsIniciais)
  const [texto, setTexto] = useState('')
  const [feedback, setFeedback] = useState('')

  const totalNovidades = useMemo(() => conversas.reduce((soma, item) => soma + item.novas, 0), [])

  function publicar(evento) {
    evento.preventDefault()
    const conteudo = texto.trim()
    if (!conteudo) return
    setPosts((atuais) => [{ id: Date.now(), autor: 'Nicolas', iniciais: 'N', tempo: 'agora', grupo: 'Mural geral', texto: conteudo, curtidas: 0, comentarios: 0 }, ...atuais])
    setTexto('')
    setFeedback('Publicação adicionada ao mural da demonstração.')
  }

  function curtir(id) {
    setPosts((atuais) => atuais.map((post) => post.id === id ? { ...post, curtidas: post.curtidas + 1 } : post))
  }

  return (
    <section className="comunidade-v2">
      <header className="comunidade-v2-topo">
        <div>
          <button type="button" onClick={onVoltar}>← Painel</button>
          <small>ARQUIVO SOCIAL</small>
          <h1>Comunidade</h1>
          <p>Encontre estudantes, acompanhe clubes e participe das histórias que circulam pela escola.</p>
        </div>
        <div className="comunidade-v2-resumo"><strong>342</strong><span>estudantes ativos hoje</span></div>
      </header>

      <nav className="comunidade-v2-abas" aria-label="Áreas da comunidade">
        <button className={aba === 'feed' ? 'ativa' : ''} onClick={() => setAba('feed')}>Mural</button>
        <button className={aba === 'grupos' ? 'ativa' : ''} onClick={() => setAba('grupos')}>Grupos</button>
        <button className={aba === 'mensagens' ? 'ativa' : ''} onClick={() => setAba('mensagens')}>Mensagens {totalNovidades > 0 && <span>{totalNovidades}</span>}</button>
        <button className={aba === 'clubes' ? 'ativa' : ''} onClick={() => setAba('clubes')}>Clubes</button>
      </nav>

      {feedback && <div className="comunidade-v2-feedback"><span>{feedback}</span><button onClick={() => setFeedback('')}>×</button></div>}

      {aba === 'feed' && (
        <div className="comunidade-v2-layout">
          <main>
            <form className="comunidade-v2-publicar" onSubmit={publicar}>
              <span className="comunidade-v2-avatar">N</span>
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Registre algo no mural..." maxLength={500} />
              <footer><small>{texto.length}/500</small><button type="submit">Publicar</button></footer>
            </form>

            <div className="comunidade-v2-feed">
              {posts.map((post) => (
                <article key={post.id}>
                  <header><span className="comunidade-v2-avatar">{post.iniciais}</span><div><strong>{post.autor}</strong><small>{post.grupo} · {post.tempo}</small></div><button aria-label="Mais opções">•••</button></header>
                  <p>{post.texto}</p>
                  <footer><button onClick={() => curtir(post.id)}>♡ {post.curtidas}</button><button>◌ {post.comentarios}</button><button>Compartilhar</button></footer>
                </article>
              ))}
            </div>
          </main>

          <aside>
            <section><small>EM DESTAQUE</small><h2>Festival das Águas</h2><p>Inscrições abertas para apresentações, barracas e equipes de organização.</p><button onClick={() => setFeedback('Inscrição marcada para a futura conexão com o sistema de eventos.')}>Ver evento</button></section>
            <section><small>GRUPOS ATIVOS</small>{grupos.map((grupo) => <article key={grupo.nome}><strong>{grupo.nome}</strong><span>{grupo.membros} membros</span><em>{grupo.atividade}</em></article>)}</section>
          </aside>
        </div>
      )}

      {aba === 'grupos' && <section className="comunidade-v2-grade">{grupos.map((grupo, indice) => <article key={grupo.nome}><span>0{indice + 1}</span><h2>{grupo.nome}</h2><p>{grupo.membros} membros · {grupo.atividade}</p><button onClick={() => setFeedback(`${grupo.nome} será conectado aos grupos reais depois.`)}>Abrir grupo</button></article>)}</section>}

      {aba === 'mensagens' && <section className="comunidade-v2-lista"><header><small>CAIXA DE ENTRADA</small><h2>Conversas recentes</h2></header>{conversas.map((conversa) => <button key={conversa.nome} onClick={() => setFeedback(`A conversa com ${conversa.nome} ainda é demonstrativa.`)}><span className="comunidade-v2-avatar">{conversa.nome.split(' ').map((p) => p[0]).join('').slice(0,2)}</span><div><strong>{conversa.nome}</strong><small>{conversa.texto}</small></div><time>{conversa.hora}</time>{conversa.novas > 0 && <em>{conversa.novas}</em>}</button>)}</section>}

      {aba === 'clubes' && <section className="comunidade-v2-grade"><article><span>✦</span><h2>Exploração</h2><p>Mapas, trilhas, criaturas e descobertas da floresta.</p><button>Conhecer</button></article><article><span>✧</span><h2>Artes Arcanas</h2><p>Ilustração, música, escrita e manifestações mágicas.</p><button>Conhecer</button></article><article><span>◇</span><h2>Duelo e Estratégia</h2><p>Treinos, torneios e estudo de táticas defensivas.</p><button>Conhecer</button></article></section>}
    </section>
  )
}
