export default function CardDisciplina({
  disciplina,
  aulas,
  aberta,
  onAlternar,
  onCriarAula,
  onEditarAula,
}) {
  const curso = Array.isArray(disciplina.cursos)
    ? disciplina.cursos[0]
    : disciplina.cursos

  return (
    <article
      className={`painel-disciplina ${
        aberta ? 'painel-disciplina-aberta' : ''
      }`}
    >
      <button
        type="button"
        className="painel-disciplina-cabecalho"
        onClick={onAlternar}
      >
        <div>
          <small>{curso?.nome || 'Curso não definido'}</small>
          <h3>{disciplina.nome}</h3>
          <p>{disciplina.descricao}</p>
        </div>

        <div className="painel-disciplina-resumo">
          <span>
            {aulas.length}{' '}
            {aulas.length === 1 ? 'aula' : 'aulas'}
          </span>
          <strong>{aberta ? '−' : '+'}</strong>
        </div>
      </button>

      {aberta && (
        <div className="painel-disciplina-conteudo">
          <div className="painel-disciplina-acoes">
            <button
              type="button"
              onClick={() => onCriarAula(disciplina.id)}
            >
              ➕ Nova aula
            </button>
          </div>

          {aulas.length === 0 ? (
            <p className="painel-professor-vazio painel-vazio-interno">
              Nenhuma aula cadastrada nesta disciplina.
            </p>
          ) : (
            <div className="painel-aulas-lista">
              {aulas.map((aula) => (
                <article
                  className="painel-aula-item"
                  key={aula.id}
                >
                  <div className="painel-aula-ordem">
                    {String(aula.ordem ?? 0).padStart(
                      2,
                      '0',
                    )}
                  </div>

                  <div className="painel-aula-dados">
                    <div className="painel-aula-topo">
                      <h4>{aula.titulo}</h4>

                      <span
                        className={
                          aula.ativo
                            ? 'painel-status-publicado'
                            : 'painel-status-rascunho'
                        }
                      >
                        {aula.ativo
                          ? 'Publicada'
                          : 'Rascunho'}
                      </span>
                    </div>

                    <p>{aula.descricao}</p>

                    <small>
                      ⭐ {aula.recompensa_xp ?? 0} XP
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditarAula(aula)}
                  >
                    Editar
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
