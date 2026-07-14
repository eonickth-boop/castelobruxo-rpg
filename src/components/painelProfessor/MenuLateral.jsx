const abasPainel = [
  {
    id: 'disciplinas',
    icone: '📚',
    titulo: 'Disciplinas',
    descricao: 'Aulas e organização acadêmica',
  },
  {
    id: 'livros',
    icone: '📖',
    titulo: 'Livros',
    descricao: 'Acervo e páginas',
  },
  {
    id: 'atividades',
    icone: '📝',
    titulo: 'Atividades',
    descricao: 'Questões e avaliações',
  },
  {
    id: 'alunos',
    icone: '👨‍🎓',
    titulo: 'Alunos',
    descricao: 'Progresso e desempenho',
  },
  {
    id: 'estatisticas',
    icone: '📊',
    titulo: 'Estatísticas',
    descricao: 'Visão geral acadêmica',
  },
]

export default function MenuLateral({
  abaAtual,
  onTrocarAba,
}) {
  return (
    <aside className="painel-professor-menu">
      <p>Gerenciamento</p>

      <nav>
        {abasPainel.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className={
              abaAtual === aba.id
                ? 'painel-menu-ativo'
                : ''
            }
            onClick={() => onTrocarAba(aba.id)}
          >
            <span>{aba.icone}</span>

            <div>
              <strong>{aba.titulo}</strong>
              <small>{aba.descricao}</small>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export { abasPainel }
