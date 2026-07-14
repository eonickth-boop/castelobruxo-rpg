export default function DashboardProfessor({
  disciplinas,
  totalPublicadas,
  totalRascunhos,
  xpDisponivel,
}) {
  return (
    <header className="painel-professor-hero">
      <p>Castelobruxo</p>
      <h1>Painel do Professor</h1>

      <span>
        Gerencie suas disciplinas, aulas, livros e atividades.
      </span>

      <div className="painel-professor-resumo">
        <article>
          <small>Disciplinas</small>
          <strong>{disciplinas}</strong>
        </article>

        <article>
          <small>Aulas publicadas</small>
          <strong>{totalPublicadas}</strong>
        </article>

        <article>
          <small>Rascunhos</small>
          <strong>{totalRascunhos}</strong>
        </article>

        <article>
          <small>XP disponível</small>
          <strong>{xpDisponivel}</strong>
        </article>
      </div>
    </header>
  )
}
