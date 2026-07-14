import '../styles/local-mapa.css'

const detalhesLocais = {
  'predio-principal': {
    subtitulo: 'Centro acadêmico e administrativo',
    ambiente:
      'Corredores amplos, madeira antiga, jardins internos e símbolos das tradições mágicas brasileiras.',
    atividades: [
      'Consultar informações gerais da escola',
      'Encontrar acessos para salas e setores',
      'Acompanhar cerimônias e comunicados',
    ],
    curiosidade:
      'Alguns corredores do prédio parecem mudar de posição conforme os ciclos da escola.',
  },
  biblioteca: {
    subtitulo: 'Acervo de conhecimentos de Castelobruxo',
    ambiente:
      'Estantes altas, mesas de estudo, arquivos protegidos e livros sobre magia, criaturas e história.',
    atividades: [
      'Ler livros do acervo',
      'Consultar registros e bestiários',
      'Encontrar materiais ligados às aulas',
    ],
    curiosidade:
      'Certos livros só revelam capítulos adicionais quando o estudante cumpre requisitos acadêmicos.',
  },
  banco: {
    subtitulo: 'Banco da Árvore Ancestral',
    ambiente:
      'Um salão construído ao redor de raízes antigas, com balcões de madeira e registros protegidos.',
    atividades: [
      'Consultar saldo e extrato',
      'Transferir Ipês',
      'Acompanhar recompensas e movimentações',
    ],
    curiosidade:
      'As raízes da árvore registram cada movimentação e impedem alterações não autorizadas.',
  },
  mercado: {
    subtitulo: 'Mercado das Cinco Trilhas',
    ambiente:
      'Bancas, vitrines e corredores organizados por categorias de itens e materiais mágicos.',
    atividades: [
      'Comprar itens',
      'Ver o inventário',
      'Conhecer novas mercadorias',
    ],
    curiosidade:
      'A seleção de produtos muda de acordo com eventos, missões e períodos acadêmicos.',
  },
  'salas-aula': {
    subtitulo: 'Área acadêmica',
    ambiente:
      'Salas preparadas para estudos teóricos, práticas, pesquisas e atividades orientadas.',
    atividades: [
      'Acessar disciplinas',
      'Concluir aulas',
      'Realizar atividades acadêmicas',
    ],
    curiosidade:
      'Cada sala se adapta ao conteúdo da disciplina, sem depender de varinhas para conduzir a magia.',
  },
  'lago-iara': {
    subtitulo: 'Região aquática encantada',
    ambiente:
      'Águas profundas, vegetação flutuante, reflexos mágicos e trilhas protegidas ao redor da margem.',
    atividades: [
      'Participar de missões aquáticas',
      'Observar criaturas do lago',
      'Investigar fenômenos mágicos',
    ],
    curiosidade:
      'O lago reage à presença de visitantes e pode esconder caminhos sob a superfície.',
  },
  'floresta-encantados': {
    subtitulo: 'Área de exploração',
    ambiente:
      'Uma floresta viva, com trilhas mutáveis, clareiras escondidas e criaturas protetoras.',
    atividades: [
      'Aceitar missões de exploração',
      'Investigar sinais e segredos',
      'Participar de eventos especiais',
    ],
    curiosidade:
      'As trilhas não permanecem iguais por muito tempo e parecem avaliar as intenções de quem entra.',
  },
  'gruta-cristais': {
    subtitulo: 'Formação subterrânea',
    ambiente:
      'Galerias minerais, cristais luminosos, ecos profundos e passagens de acesso restrito.',
    atividades: [
      'Explorar áreas liberadas',
      'Investigar cristais mágicos',
      'Cumprir missões avançadas',
    ],
    curiosidade:
      'Alguns cristais guardam memórias antigas e respondem a vínculos mágicos específicos.',
  },
  'clareira-eventos': {
    subtitulo: 'Espaço comunitário',
    ambiente:
      'Uma grande clareira preparada para festivais, encontros, cerimônias e atividades coletivas.',
    atividades: [
      'Consultar eventos ativos',
      'Realizar inscrições',
      'Acompanhar programações especiais',
    ],
    curiosidade:
      'A decoração da clareira muda automaticamente para acompanhar cada evento.',
  },
  'correio-magico': {
    subtitulo: 'Torre de correspondências',
    ambiente:
      'Uma torre repleta de envelopes, selos, caixas postais e rotas mágicas de entrega.',
    atividades: [
      'Enviar cartas',
      'Ler mensagens recebidas',
      'Arquivar correspondências',
    ],
    curiosidade:
      'As cartas reconhecem apenas o destinatário correto e não revelam os e-mails internos das contas.',
  },
}

export default function LocalMapa({
  local,
  onVoltarMapa,
  onNavegar,
}) {
  if (!local) {
    return (
      <main className="local-pagina">
        <button type="button" onClick={onVoltarMapa}>
          ← Voltar ao mapa
        </button>

        <section className="local-vazio">
          <h1>Local não encontrado</h1>
          <p>Retorne ao mapa e escolha um local.</p>
        </section>
      </main>
    )
  }

  const detalhes = detalhesLocais[local.codigo] || {
    subtitulo: local.categoria,
    ambiente: local.descricao,
    atividades: [
      'Explorar o ambiente',
      'Consultar informações',
      'Acompanhar futuras atividades',
    ],
    curiosidade:
      'Novos conteúdos poderão ser adicionados pela administração.',
  }

  return (
    <main className="local-pagina">
      <div className="local-acoes-topo">
        <button type="button" onClick={onVoltarMapa}>
          ← Voltar ao mapa
        </button>

        <button
          type="button"
          onClick={() => onNavegar('inicio')}
        >
          Ir para o início
        </button>
      </div>

      <header className="local-hero">
        <span className="local-icone">
          {local.icone || '📍'}
        </span>

        <p>{local.categoria}</p>
        <h1>{local.nome}</h1>
        <strong>{detalhes.subtitulo}</strong>
      </header>

      <section className="local-conteudo">
        <article className="local-bloco local-apresentacao">
          <p className="local-rotulo">Sobre o local</p>
          <h2>Conheça este espaço</h2>
          <p>{local.descricao}</p>
          <p>{detalhes.ambiente}</p>
        </article>

        <article className="local-bloco">
          <p className="local-rotulo">Disponível aqui</p>
          <h2>O que fazer</h2>

          <div className="local-lista">
            {detalhes.atividades.map((atividade) => (
              <div key={atividade}>
                <span>❧</span>
                <strong>{atividade}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="local-bloco">
          <p className="local-rotulo">Informações de acesso</p>
          <h2>Requisitos</h2>

          <div className="local-requisitos">
            <div>
              <small>Nível mínimo</small>
              <strong>{local.nivel_minimo || 1}</strong>
            </div>

            <div>
              <small>Ano mínimo</small>
              <strong>{local.ano_minimo || 1}º ano</strong>
            </div>

            <div>
              <small>Tribo</small>
              <strong>
                {local.tribo_requisito || 'Todas'}
              </strong>
            </div>
          </div>
        </article>

        <article className="local-bloco local-curiosidade">
          <p className="local-rotulo">Registro do local</p>
          <h2>Curiosidade</h2>
          <p>{detalhes.curiosidade}</p>
        </article>
      </section>

      <section className="local-destino">
        <div>
          <p className="local-rotulo">Ação principal</p>
          <h2>Entrar no sistema ligado ao local</h2>
        </div>

        {local.destino_pagina ? (
          <button
            type="button"
            onClick={() => onNavegar(local.destino_pagina)}
          >
            Abrir {local.nome}
          </button>
        ) : (
          <button type="button" disabled>
            Conteúdo em preparação
          </button>
        )}
      </section>
    </main>
  )
}
