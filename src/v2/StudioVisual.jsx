import './studio-visual.css'

const cores = [
  ['Verde floresta', '#15231b'],
  ['Madeira', '#5a3d2b'],
  ['Creme de papel', '#efe5cc'],
  ['Dourado envelhecido', '#b99655'],
  ['Terracota', '#9a5e49'],
]

export default function StudioVisual() {
  return (
    <main className="studio-v2 tema-arquivo">
      <header className="studio-topo">
        <div>
          <p>Castelobruxo RPG · Reconstrução V2</p>
          <h1>Arquivo Vivo</h1>
          <span>Direção oficial · intensidade equilibrada</span>
        </div>
        <span className="studio-status">Identidade aprovada</span>
      </header>

      <section className="studio-introducao">
        <div>
          <small>ETAPA 02</small>
          <h2>O sistema visual do novo Castelobruxo</h2>
          <p>Uma interface acadêmica, antiga e sofisticada, com leitura confortável, materiais discretos e magia institucional.</p>
        </div>
        <div className="studio-progresso"><span /></div>
      </section>

      <section className="studio-regra-visual">
        <article><strong>70%</strong><span>estrutura limpa e legível</span></article>
        <article><strong>20%</strong><span>materiais e texturas discretas</span></article>
        <article><strong>10%</strong><span>ornamentos mágicos e institucionais</span></article>
      </section>

      <section className="studio-paleta">
        <div>
          <small>Paleta oficial</small>
          <h2>Cores do Arquivo Vivo</h2>
        </div>
        <div className="studio-cores">
          {cores.map(([nome, cor]) => (
            <article key={nome}>
              <span style={{ background: cor }} />
              <strong>{nome}</strong>
              <small>{cor}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-preview">
        <aside className="studio-sidebar-preview">
          <div className="studio-mini-logo">C</div>
          <nav>
            <button className="ativo">Início</button>
            <button>Meu registro</button>
            <button>Vida escolar</button>
            <button>Comunidade</button>
            <button>Exploração</button>
          </nav>
          <div className="studio-selo-lateral">Arquivo 027</div>
        </aside>

        <div className="studio-pagina-preview">
          <div className="studio-ficha-topo">
            <span>REGISTRO ACADÊMICO</span>
            <span>27 · JUL · 2026</span>
          </div>

          <div className="studio-hero-preview">
            <small>Bem-vindo de volta</small>
            <h2>Nicolas, a escola está desperta.</h2>
            <p>Há novas aulas, acontecimentos e histórias esperando por você nos arquivos de hoje.</p>
            <div className="studio-acoes">
              <button type="button">Continuar jornada</button>
              <button type="button" className="secundario">Abrir registro</button>
            </div>
          </div>

          <div className="studio-cards-preview">
            <article>
              <small>Próxima atividade</small>
              <h3>Aula de Encantamentos</h3>
              <p>Hoje, 19h30 · Torre das Águas</p>
            </article>
            <article>
              <small>Seu progresso</small>
              <h3>Terceiro ano</h3>
              <p>72% do ciclo acadêmico concluído</p>
            </article>
            <article>
              <small>Mundo vivo</small>
              <h3>3 eventos ativos</h3>
              <p>Uma nova trilha apareceu na floresta.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="studio-rodape">
        <div>
          <small>Direção oficial</small>
          <strong>Arquivo Vivo · Equilibrado</strong>
        </div>
        <p>Esta tela agora mostra a base real que será usada nos próximos componentes e páginas da V2.</p>
      </footer>
    </main>
  )
}
