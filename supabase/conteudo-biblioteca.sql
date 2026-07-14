-- CASTELOBRUXO — CONTEÚDO INICIAL DA BIBLIOTECA
-- Execute este arquivo no SQL Editor do Supabase.
-- Ele não apaga livros existentes.

create extension if not exists pgcrypto;

do $$
declare
  livro_historia uuid;
  livro_criaturas uuid;
  livro_herbologia uuid;
  livro_feiticos uuid;
  livro_tribos uuid;
begin
  select id into livro_historia
  from livros
  where lower(titulo) = lower('História da Magia Brasileira')
  limit 1;

  if livro_historia is null then
    insert into livros (
      titulo, autor, descricao, categoria,
      capa_url, ativo, ordem
    )
    values (
      'História da Magia Brasileira',
      'Prof.ª Celina Araripe',
      'Uma introdução às tradições, comunidades e transformações da magia no território brasileiro.',
      'História',
      null,
      true,
      10
    )
    returning id into livro_historia;
  end if;

  select id into livro_criaturas
  from livros
  where lower(titulo) = lower('Bestiário Brasileiro')
  limit 1;

  if livro_criaturas is null then
    insert into livros (
      titulo, autor, descricao, categoria,
      capa_url, ativo, ordem
    )
    values (
      'Bestiário Brasileiro',
      'Amaro Jaci',
      'Registros introdutórios sobre criaturas mágicas, seus habitats e formas seguras de convivência.',
      'Criaturas',
      null,
      true,
      20
    )
    returning id into livro_criaturas;
  end if;

  select id into livro_herbologia
  from livros
  where lower(titulo) = lower('Manual de Herbologia Brasileira')
  limit 1;

  if livro_herbologia is null then
    insert into livros (
      titulo, autor, descricao, categoria,
      capa_url, ativo, ordem
    )
    values (
      'Manual de Herbologia Brasileira',
      'Yara dos Santos',
      'Fundamentos para reconhecer, coletar e preservar plantas de uso mágico.',
      'Herbologia',
      null,
      true,
      30
    )
    returning id into livro_herbologia;
  end if;

  select id into livro_feiticos
  from livros
  where lower(titulo) = lower('Fundamentos dos Encantamentos')
  limit 1;

  if livro_feiticos is null then
    insert into livros (
      titulo, autor, descricao, categoria,
      capa_url, ativo, ordem
    )
    values (
      'Fundamentos dos Encantamentos',
      'Mestre Bento Ubirajara',
      'Princípios de intenção, foco e responsabilidade na realização de encantamentos.',
      'Feitiços',
      null,
      true,
      40
    )
    returning id into livro_feiticos;
  end if;

  select id into livro_tribos
  from livros
  where lower(titulo) = lower('As Trilhas e Tribos de Castelobruxo')
  limit 1;

  if livro_tribos is null then
    insert into livros (
      titulo, autor, descricao, categoria,
      capa_url, ativo, ordem
    )
    values (
      'As Trilhas e Tribos de Castelobruxo',
      'Arquivo da Direção',
      'Um guia inicial sobre pertencimento, valores e cooperação entre as tribos da escola.',
      'Castelobruxo',
      null,
      true,
      50
    )
    returning id into livro_tribos;
  end if;

  if not exists (
    select 1 from paginas_livro where livro_id = livro_historia
  ) then
    insert into paginas_livro
      (livro_id, numero, titulo, conteudo, imagem_url)
    values
      (
        livro_historia, 1, 'Antes das Escolas',
        'Muito antes da criação das instituições mágicas, o conhecimento era transmitido em comunidades, famílias e círculos de aprendizado. Cada território desenvolveu práticas próprias, ligadas ao ambiente, à memória e à observação da natureza.',
        null
      ),
      (
        livro_historia, 2, 'A Formação de Castelobruxo',
        'Castelobruxo nasceu da união de diferentes tradições. A escola foi criada para proteger saberes, formar novas gerações e impedir que o conhecimento mágico brasileiro fosse reduzido a uma única origem.',
        null
      ),
      (
        livro_historia, 3, 'Magia e Responsabilidade',
        'A história também registra conflitos, abusos e períodos de isolamento. Por isso, a formação moderna valoriza responsabilidade, convivência e o reconhecimento de que toda ação mágica produz consequências.',
        null
      );
  end if;

  if not exists (
    select 1 from paginas_livro where livro_id = livro_criaturas
  ) then
    insert into paginas_livro
      (livro_id, numero, titulo, conteudo, imagem_url)
    values
      (
        livro_criaturas, 1, 'Observação Segura',
        'Criaturas mágicas não devem ser abordadas como objetos de estudo. Observe distância, comportamento, sinais de desconforto e condições do habitat antes de qualquer aproximação.',
        null
      ),
      (
        livro_criaturas, 2, 'O Curupira',
        'Guardião conhecido por confundir invasores e proteger os caminhos da floresta. Relatos variam entre regiões, mas todos destacam sua ligação com o equilíbrio do ambiente.',
        null
      ),
      (
        livro_criaturas, 3, 'Companheiros Mágicos',
        'Algumas espécies podem formar vínculos com estudantes. Esses vínculos exigem cuidado, rotina e respeito. A adoção nunca deve ocorrer apenas por aparência ou raridade.',
        null
      );
  end if;

  if not exists (
    select 1 from paginas_livro where livro_id = livro_herbologia
  ) then
    insert into paginas_livro
      (livro_id, numero, titulo, conteudo, imagem_url)
    values
      (
        livro_herbologia, 1, 'Coleta Consciente',
        'Nunca retire mais do que a planta consegue repor. Ferramentas limpas, identificação correta e registro do local são requisitos básicos para qualquer coleta acadêmica.',
        null
      ),
      (
        livro_herbologia, 2, 'Guaraná Encantado',
        'Suas folhas e sementes são usadas em preparos de foco e disposição. O excesso pode provocar inquietação, sonhos acelerados e dificuldade de concentração.',
        null
      ),
      (
        livro_herbologia, 3, 'Vitória-Régia Celestial',
        'Encontrada em águas de forte atividade mágica, suas pétalas são associadas a poções de percepção. Devem ser armazenadas longe de luz intensa.',
        null
      );
  end if;

  if not exists (
    select 1 from paginas_livro where livro_id = livro_feiticos
  ) then
    insert into paginas_livro
      (livro_id, numero, titulo, conteudo, imagem_url)
    values
      (
        livro_feiticos, 1, 'Intenção',
        'Todo encantamento começa antes do gesto ou da palavra. A intenção define a direção do efeito e precisa ser clara, limitada e compatível com a capacidade do praticante.',
        null
      ),
      (
        livro_feiticos, 2, 'Foco',
        'Foco não significa força bruta. Ele depende de respiração, postura e consciência do ambiente. Interrupções podem alterar ou enfraquecer o resultado.',
        null
      ),
      (
        livro_feiticos, 3, 'Limites',
        'Nunca realize encantamentos sobre outra pessoa sem consentimento, exceto em situações de emergência previstas pelas regras da escola.',
        null
      );
  end if;

  if not exists (
    select 1 from paginas_livro where livro_id = livro_tribos
  ) then
    insert into paginas_livro
      (livro_id, numero, titulo, conteudo, imagem_url)
    values
      (
        livro_tribos, 1, 'Pertencimento',
        'As tribos não determinam todo o futuro do estudante. Elas representam afinidades, caminhos de aprendizado e formas diferentes de contribuir para a comunidade.',
        null
      ),
      (
        livro_tribos, 2, 'Cooperação',
        'Rivalidades podem existir em competições e desafios, mas nunca devem justificar hostilidade. O equilíbrio da escola depende da cooperação entre todas as trilhas.',
        null
      ),
      (
        livro_tribos, 3, 'Anayru',
        'Ligada ao ar, ao movimento e à percepção, Anayru valoriza liberdade responsável, curiosidade e a capacidade de observar caminhos que outros ainda não perceberam.',
        null
      );
  end if;
end $$;
