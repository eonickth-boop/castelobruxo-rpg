import { useState } from 'react'
import './studio-visual.css'

const direcoes = [
  {
    id: 'arquivo-vivo',
    nome: 'Arquivo Vivo',
    subtitulo: 'Acadêmico, antigo e sofisticado',
    descricao: 'Papel artesanal, madeira escura, selos, fichas escolares e detalhes botânicos discretos.',
    classes: 'tema-arquivo',
  },
  {
    id: 'floresta-encantada',
    nome: 'Floresta Encantada',
    subtitulo: 'Imersivo, natural e misterioso',
    descricao: 'Verdes profundos, luz filtrada, pedra úmida, folhas e magia integrada à floresta brasileira.',
    classes: 'tema-floresta',
  },
  {
    id: 'academia-celeste',
    nome: 'Academia Celeste',
    subtitulo: 'Noturno, mágico e elegante',
    descricao: 'Azul noturno, dourado envelhecido, mapas celestes, brilho suave e interfaces mais limpas.',
    classes: 'tema-celeste',
  },
]

function Amostra({ direcao, ativa, onSelect }) {
  return (
    <button
      type="button"
      className={`studio-amostra ${direcao.classes} ${ativa ? 'ativa' : ''}`}
      onClick={() => onSelect(direcao.id)}
      aria-pressed={ativa}
    >
      <span className="studio-selo">CB</span>
      <span className="studio-amostra-conteudo">
        <small>Direção visual</small>
        <strong>{direcao.nome}</strong>
        <em>{direcao.subtitulo}</em>
        <span>{direcao.descricao}</span>
      </span>
      <span className="studio-selecionar">{ativa ? 'Selecionada' : 'Escolher direção'}</span>
    </button>
  )
}

export default function StudioVisual() {
  const [direcaoAtiva, setDirecaoAtiva] = useState('arquivo-vivo')
  const escolhida = direcoes.find((item) => item.id === direcaoAtiva)

  return (
    <main className={`studio-v2 ${escolhida?.classes || ''}`}>
      <header className="studio-topo">
        <div>
          <p>Castelobruxo RPG · Reconstrução V2</p>
          <h1>Studio Visual</h1>
          <span>Escolha uma base. Depois refinaremos cada parte juntos.</span>
        </div>
        <span className="studio-status">Ambiente seguro · não altera o site atual</span>
      </header>

      <section className="studio-introducao">
        <div>
          <small>ETAPA 01</small>
          <h2>Qual deve ser a sensação do novo Castelobruxo?</h2>
          <p>As três propostas usam a mesma estrutura. A escolha muda cores, materiais, ornamentos e atmosfera.</p>
        </div>
        <div className="studio-progresso"><span /></div>
      </section>

      <section className="studio-grade-direcoes">
        {direcoes.map((direcao) => (
          <Amostra
            key={direcao.id}
            direcao={direcao}
            ativa={direcao.id === direcaoAtiva}
            onSelect={setDirecaoAtiva}
          />
        ))}
      </section>

      <section className="studio-preview">
        <aside className="studio-sidebar-preview">
          <div className="studio-mini-logo">C</div>
          <nav>
            <button className="ativo">Início</button>
            <button>Perfil</button>
            <button>Vida escolar</button>
            <button>Comunidade</button>
            <button>Exploração</button>
          </nav>
        </aside>

        <div className="studio-pagina-preview">
          <div className="studio-hero-preview">
            <small>Bem-vindo de volta</small>
            <h2>Nicolas, a escola está desperta.</h2>
            <p>Há novas aulas, acontecimentos e histórias esperando por você.</p>
            <button type="button">Continuar jornada</button>
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
          <small>Direção selecionada</small>
          <strong>{escolhida?.nome}</strong>
        </div>
        <p>Esta escolha ainda é uma prévia e poderá ser misturada com elementos das outras propostas.</p>
      </footer>
    </main>
  )
}
