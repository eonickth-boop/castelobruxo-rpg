import './StudentDesk.css'

const objetos = [
  {
    id: 'biblioteca',
    classe: 'desk-livros',
    titulo: 'Biblioteca Central',
    icone: '📚',
    acao: 'onBiblioteca',
  },
  {
    id: 'diario',
    classe: 'desk-diario',
    titulo: 'Diário do Personagem',
    icone: '📖',
    acao: 'onDiario',
  },
  {
    id: 'banco',
    classe: 'desk-bau',
    titulo: 'Banco da Árvore Ancestral',
    icone: '🏦',
    acao: 'onBanco',
  },
  {
    id: 'mercado',
    classe: 'desk-caneca',
    titulo: 'Mercado das Cinco Trilhas',
    icone: '🛒',
    acao: 'onMercado',
  },
  {
    id: 'inventario',
    classe: 'desk-mochila',
    titulo: 'Inventário',
    icone: '🎒',
    acao: 'onInventario',
  },
  {
    id: 'avisos',
    classe: 'desk-pergaminho',
    titulo: 'Quadro de Avisos',
    icone: '📜',
    acao: 'onAvisos',
  },
  {
    id: 'perfil',
    classe: 'desk-cristal',
    titulo: 'Perfil Público',
    icone: '🌐',
    acao: 'onPerfil',
  },
  {
    id: 'academico',
    classe: 'desk-mapa',
    titulo: 'Sistema Acadêmico',
    icone: '🎓',
    acao: 'onAcademico',
  },
]

export default function StudentDesk({
  carregando = false,
  onBanco,
  onMercado,
  onInventario,
  onBiblioteca,
  onDiario,
  onAvisos,
  onPerfil,
  onAcademico,
}) {
  const acoes = {
    onBanco,
    onMercado,
    onInventario,
    onBiblioteca,
    onDiario,
    onAvisos,
    onPerfil,
    onAcademico,
  }

  return (
    <section className="student-desk-section">
      <div className="student-desk">
        <img
          src="/assets/interface/mesa-estudante.png"
          alt="Mesa de estudos mágica do aluno de Castelobruxo"
          className="student-desk-image"
        />

        {objetos.map((objeto) => (
          <button
            key={objeto.id}
            type="button"
            className={`student-desk-hotspot ${objeto.classe}`}
            onClick={acoes[objeto.acao]}
            disabled={carregando || !acoes[objeto.acao]}
            aria-label={objeto.titulo}
          >
            <span className="student-desk-tooltip">
              <b>{objeto.icone}</b>
              {objeto.titulo}
            </span>
          </button>
        ))}

        <div className="student-desk-status">
          <span>✨ Sua mesa de estudos</span>
          <small>Clique nos objetos para explorar Castelobruxo</small>
        </div>
      </div>

      <div className="student-desk-mobile-menu">
        {objetos.map((objeto) => (
          <button
            key={objeto.id}
            type="button"
            onClick={acoes[objeto.acao]}
            disabled={carregando || !acoes[objeto.acao]}
          >
            <span>{objeto.icone}</span>
            <strong>{objeto.titulo}</strong>
          </button>
        ))}
      </div>
    </section>
  )
}
