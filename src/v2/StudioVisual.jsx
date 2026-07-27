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

      <section className="studio-componentes">
        <div className="studio-secao-titulo">
          <small>Biblioteca visual</small>
          <h2>Componentes reais da V2</h2>
          <p>Essas peças serão reutilizadas no cadastro, perfil, aulas, mercado, comunidade e painel administrativo.</p>
        </div>

        <div className="studio-componentes-grade">
          <article className="studio-componente">
            <span className="studio-etiqueta">Tipografia</span>
            <h1 className="studio-tipo-display">Arquivo de Feitiços</h1>
            <h2 className="studio-tipo-titulo">Registro acadêmico</h2>
            <p>Textos longos continuam simples e confortáveis para leitura diária, inclusive no celular.</p>
            <small>Legenda institucional · 27 JUL 2026</small>
          </article>

          <article className="studio-componente">
            <span className="studio-etiqueta">Botões e ações</span>
            <div className="studio-botoes-amostra">
              <button type="button" className="botao-primario">Salvar registro</button>
              <button type="button" className="botao-secundario">Ver detalhes</button>
              <button type="button" className="botao-texto">Cancelar</button>
              <button type="button" className="botao-perigo">Excluir</button>
            </div>
          </article>

          <article className="studio-componente">
            <span className="studio-etiqueta">Campos</span>
            <label className="campo-arquivo">
              <span>Nome do personagem</span>
              <input defaultValue="Nicolas Valença" />
              <small>Como aparecerá nos registros da escola.</small>
            </label>
            <label className="campo-arquivo">
              <span>Tribo</span>
              <select defaultValue="anayru">
                <option value="anayru">Anayru</option>
                <option value="araye">Arayê</option>
                <option value="yandara">Yandara</option>
              </select>
            </label>
          </article>

          <article className="studio-componente">
            <span className="studio-etiqueta">Estados e avisos</span>
            <div className="aviso aviso-sucesso"><strong>Registro salvo</strong><span>Suas alterações estão seguras.</span></div>
            <div className="aviso aviso-atencao"><strong>Ficha incompleta</strong><span>Há dois campos obrigatórios pendentes.</span></div>
            <div className="aviso aviso-erro"><strong>Não foi possível concluir</strong><span>Tente novamente em alguns instantes.</span></div>
          </article>

          <article className="studio-componente">
            <span className="studio-etiqueta">Tags e status</span>
            <div className="studio-tags">
              <span className="tag">3º ano</span>
              <span className="tag tag-dourada">Monitor</span>
              <span className="tag tag-verde">Online</span>
              <span className="tag tag-terra">Pendente</span>
            </div>
          </article>

          <article className="studio-componente studio-componente-card">
            <span className="studio-etiqueta">Card de conteúdo</span>
            <small>MISSÃO SEMANAL</small>
            <h3>O arquivo desaparecido</h3>
            <p>Investigue a ala antiga da biblioteca e recupere um registro selado antes da meia-noite.</p>
            <footer><span>Recompensa: 120 Ipês</span><button type="button">Abrir missão</button></footer>
          </article>
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
            <article><small>Próxima atividade</small><h3>Aula de Encantamentos</h3><p>Hoje, 19h30 · Torre das Águas</p></article>
            <article><small>Seu progresso</small><h3>Terceiro ano</h3><p>72% do ciclo acadêmico concluído</p></article>
            <article><small>Mundo vivo</small><h3>3 eventos ativos</h3><p>Uma nova trilha apareceu na floresta.</p></article>
          </div>
        </div>
      </section>

      <footer className="studio-rodape">
        <div><small>Direção oficial</small><strong>Arquivo Vivo · Equilibrado</strong></div>
        <p>Esta tela agora reúne a identidade e os componentes que servirão de base para todas as páginas da V2.</p>
      </footer>
    </main>
  )
}
