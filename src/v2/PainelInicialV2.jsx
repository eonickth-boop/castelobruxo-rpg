import { useMemo, useState } from 'react'
import RegistroV2 from './RegistroV2'
import './painel-inicial-v2.css'

const secoes = [
  ['inicio', 'Início'],
  ['registro', 'Meu registro'],
  ['escola', 'Vida escolar'],
  ['comunidade', 'Comunidade'],
  ['exploracao', 'Exploração'],
]

const atividades = [
  { horario: '19h30', titulo: 'Encantamentos', local: 'Torre das Águas', tipo: 'Aula' },
  { horario: '21h00', titulo: 'Ronda da Floresta', local: 'Portão Norte', tipo: 'Missão' },
  { horario: 'Amanhã', titulo: 'Herbologia Amazônica', local: 'Estufa III', tipo: 'Aula' },
]

const avisos = [
  { titulo: 'Inscrições para os clubes', texto: 'Os registros ficam abertos até sexta-feira.', selo: 'Secretaria' },
  { titulo: 'Trilha interditada', texto: 'A passagem do Rio Escuro está temporariamente fechada.', selo: 'Exploração' },
]

export default function PainelInicialV2() {
  const [secao, setSecao] = useState('inicio')
  const [menuAberto, setMenuAberto] = useState(false)
  const [aviso, setAviso] = useState('')

  const data = useMemo(
    () => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    [],
  )

  function navegar(id) {
    setSecao(id)
    setMenuAberto(false)
    if (!['inicio', 'registro'].includes(id)) setAviso(`${secoes.find(([codigo]) => codigo === id)?.[1]} será construída na próxima etapa.`)
    else setAviso('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="painel-v2">
      <button className="painel-v2-menu-mobile" type="button" onClick={() => setMenuAberto((valor) => !valor)} aria-expanded={menuAberto}>
        <span>☰</span> Menu
      </button>

      <aside className={`painel-v2-sidebar ${menuAberto ? 'aberta' : ''}`}>
        <div className="painel-v2-marca">
          <span>CB</span>
          <div><strong>Castelobruxo</strong><small>Arquivo acadêmico</small></div>
        </div>

        <nav aria-label="Navegação principal">
          {secoes.map(([id, nome]) => (
            <button key={id} type="button" className={secao === id ? 'ativo' : ''} onClick={() => navegar(id)}>{nome}</button>
          ))}
        </nav>

        <div className="painel-v2-perfil">
          <span className="painel-v2-avatar">N</span>
          <div><strong>Nicolas</strong><small>3º ano · Registro 027</small></div>
          <button type="button" aria-label="Abrir opções do perfil">•••</button>
        </div>
      </aside>

      <section className="painel-v2-conteudo">
        {secao === 'registro' ? (
          <RegistroV2 onVoltar={() => navegar('inicio')} />
        ) : (
          <>
            <header className="painel-v2-topbar">
              <div><small>REGISTRO ACADÊMICO · {data.toUpperCase()}</small><h1>Painel do estudante</h1></div>
              <div className="painel-v2-topacoes">
                <button type="button" aria-label="Pesquisar">⌕</button>
                <button type="button" aria-label="Notificações">♢<span>3</span></button>
              </div>
            </header>

            {aviso && <div className="painel-v2-aviso" role="status"><strong>Em construção</strong><span>{aviso}</span><button type="button" onClick={() => setAviso('')}>×</button></div>}

            <section className="painel-v2-hero">
              <div>
                <small>ARQUIVO DO DIA</small>
                <h2>A escola está desperta, Nicolas.</h2>
                <p>Há novas aulas, histórias e acontecimentos registrados para sua jornada de hoje.</p>
                <div className="painel-v2-acoes">
                  <button type="button" onClick={() => setAviso('Sua próxima atividade foi marcada no painel.')}>Continuar jornada</button>
                  <button type="button" className="secundario" onClick={() => navegar('registro')}>Abrir meu registro</button>
                </div>
              </div>
              <div className="painel-v2-selo"><span>CB</span><small>Fundado sob a floresta</small></div>
            </section>

            <section className="painel-v2-resumo" aria-label="Resumo do estudante">
              <article><small>PROGRESSO ACADÊMICO</small><strong>72%</strong><span>3º ano em andamento</span><div><i style={{ width: '72%' }} /></div></article>
              <article><small>MOEDA ESCOLAR</small><strong>1.280</strong><span>Ipês disponíveis</span></article>
              <article><small>REPUTAÇÃO</small><strong>Respeitado</strong><span>+18 pontos este ciclo</span></article>
              <article><small>MISSÕES</small><strong>3 ativas</strong><span>1 termina hoje</span></article>
            </section>

            <div className="painel-v2-grade">
              <section className="painel-v2-bloco painel-v2-agenda">
                <header><div><small>AGENDA</small><h3>Próximas atividades</h3></div><button type="button" onClick={() => navegar('escola')}>Ver rotina</button></header>
                <div>
                  {atividades.map((item) => (
                    <article key={`${item.horario}-${item.titulo}`}>
                      <time>{item.horario}</time>
                      <div><strong>{item.titulo}</strong><span>{item.local}</span></div>
                      <em>{item.tipo}</em>
                    </article>
                  ))}
                </div>
              </section>

              <section className="painel-v2-bloco painel-v2-avisos">
                <header><div><small>QUADRO OFICIAL</small><h3>Avisos recentes</h3></div></header>
                <div>
                  {avisos.map((item) => (
                    <article key={item.titulo}><span>{item.selo}</span><strong>{item.titulo}</strong><p>{item.texto}</p></article>
                  ))}
                </div>
              </section>
            </div>

            <section className="painel-v2-bloco painel-v2-atalhos">
              <header><div><small>ACESSO RÁPIDO</small><h3>Continue sua jornada</h3></div></header>
              <div>
                <button type="button" onClick={() => navegar('escola')}><span>01</span><strong>Aulas</strong><small>Materiais, tarefas e notas</small></button>
                <button type="button" onClick={() => navegar('comunidade')}><span>02</span><strong>Comunidade</strong><small>Posts, grupos e mensagens</small></button>
                <button type="button" onClick={() => navegar('exploracao')}><span>03</span><strong>Mapa</strong><small>Locais, trilhas e descobertas</small></button>
                <button type="button" onClick={() => setAviso('O inventário será conectado aos itens existentes depois da aprovação visual.')}><span>04</span><strong>Inventário</strong><small>Itens, moedas e coleções</small></button>
              </div>
            </section>

            <footer className="painel-v2-rodape"><span>Castelobruxo RPG · Reconstrução V2</span><a href="/studio-v2">Voltar ao Studio Visual</a></footer>
          </>
        )}
      </section>
    </main>
  )
}
