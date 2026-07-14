import CardDisciplina from './CardDisciplina'

export default function ListaDisciplinas({
  disciplinas,
  aulas,
  disciplinaAbertaId,
  onAlternarDisciplina,
  onCriarAula,
  onEditarAula,
}) {
  if (disciplinas.length === 0) {
    return (
      <p className="painel-professor-vazio">
        Nenhuma disciplina foi vinculada a esta conta.
      </p>
    )
  }

  return (
    <div className="painel-professor-disciplinas">
      {disciplinas.map((disciplina) => (
        <CardDisciplina
          key={disciplina.id}
          disciplina={disciplina}
          aulas={aulas.filter(
            (aula) =>
              aula.disciplina_id === disciplina.id,
          )}
          aberta={
            disciplinaAbertaId === disciplina.id
          }
          onAlternar={() =>
            onAlternarDisciplina(
              disciplinaAbertaId === disciplina.id
                ? null
                : disciplina.id,
            )
          }
          onCriarAula={onCriarAula}
          onEditarAula={onEditarAula}
        />
      ))}
    </div>
  )
}
