import { useMemo, useState } from 'react'
import '../styles/central-social-app.css'

const secoes = [
  { id: 'mural', rotulo: 'Início', icone: '⌂', url: '/mural?embutido=1' },
  { id: 'comunidade', rotulo: 'Pessoas', icone: '◎', url: '/comunidade?embutido=1' },
  { id: 'chat', rotulo: 'Mensagens', icone: '◌', url: '/chat?embutido=1' },
  { id: 'servidores', rotulo: 'Grupos', icone: '▦', url: '/servidores?embutido=1' },
  { id: 'notificacoes', rotulo: 'Alertas', icone: '◇', url: '/notificacoes?embutido=1' },
  { id: 'perfil', rotulo: 'Perfil', icone: '◉', url: '/?pagina=perfil-publico&embutido=1' },
]

function prepararConteudo(frame) {
  try {
    const doc = frame.contentDocument
    if (!doc) return
    doc.documentElement.classList.add('cb-social-embutido')
    doc.body?.classList.add('cb-social-embutido')
    const style = doc.createElement('style')
    style.textContent = `
      .cb-sidebar-global,.cb-sidebar-toggle,.cb-sidebar-overlay{display:none!important}
      body{margin:0!important;padding:0!important;background:#f4f7fb!important}
      body.cb-com-sidebar{padding-left:0!important}
      main{max-width:none!important;margin:0 auto!important;min-height:100vh!important}
      @media(max-width:900px){body.cb-com-sidebar{padding-left:0!important}}
    `
    doc.head.appendChild(style)
  } catch (erro) {
    console.warn('Não foi possível ajustar a seção social embutida.', erro)
  }
}

export default function CentralSocialStandalone() {
  const [ativa, setAtiva] = useState('mural')
  const secao = useMemo(() => secoes.find((item) => item.id === ativa) ?? secoes[0], [ativa])

  return (
    <main className="cb-social-app">
      <aside className="cb-social-app-lateral">
        <button className="cb-social-marca" type="button" onClick={() => window.location.assign('/')}>
          <span>✦</span>
          <div><strong>Castelobruxo</strong><small>Central Social</small></div>
        </button>

        <nav aria-label="Navegação social">
          {secoes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={ativa === item.id ? 'ativo' : ''}
              onClick={() => setAtiva(item.id)}
            >
              <span>{item.icone}</span>
              <strong>{item.rotulo}</strong>
            </button>
          ))}
        </nav>

        <button className="cb-social-voltar" type="button" onClick={() => window.location.assign('/')}>
          ← Voltar ao portal
        </button>
      </aside>

      <section className="cb-social-app-conteudo">
        <header className="cb-social-app-topo">
          <div>
            <small>Central Social</small>
            <h1>{secao.rotulo}</h1>
          </div>
          <button type="button" onClick={() => setAtiva('notificacoes')} aria-label="Abrir notificações">◇</button>
        </header>

        <div className="cb-social-frame-wrap">
          <iframe
            key={secao.id}
            className="cb-social-frame"
            src={secao.url}
            title={secao.rotulo}
            onLoad={(evento) => prepararConteudo(evento.currentTarget)}
          />
        </div>
      </section>

      <nav className="cb-social-app-inferior" aria-label="Navegação social móvel">
        {secoes.slice(0, 5).map((item) => (
          <button
            key={item.id}
            type="button"
            className={ativa === item.id ? 'ativo' : ''}
            onClick={() => setAtiva(item.id)}
          >
            <span>{item.icone}</span>
            <small>{item.rotulo}</small>
          </button>
        ))}
      </nav>
    </main>
  )
}
