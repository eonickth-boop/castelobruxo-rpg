# Castelobruxo — Base de reconstrução

Esta branch cria uma base paralela e isolada para reconstruir o site sem quebrar a aplicação atual.

## Como abrir

Durante o desenvolvimento com Vite, acesse:

```text
/rebuild.html
```

## O que já existe

- entrada separada da aplicação atual;
- autenticação isolada em `AuthProvider`;
- roteamento centralizado;
- layout responsivo único;
- páginas-base para Início, Personagem, Disciplinas, Mapa, Inventário, Mercado e Comunidade;
- identidade visual inicial;
- compatibilidade com o Supabase já configurado no projeto.

## Regras da migração

1. O site atual continua funcionando durante a reconstrução.
2. Cada módulo deve ser migrado isoladamente.
3. Consultas ao Supabase não devem ficar dentro do componente principal.
4. Navegação não deve depender de dezenas de condicionais em `App.jsx`.
5. Cada módulo deve ter estados de carregamento, vazio e erro.
6. Operações financeiras devem continuar atômicas no banco.
7. Cadastro e ficha de personagem devem salvar por etapa antes de avançar.

## Ordem recomendada

1. Login e sessão.
2. Cadastro de conta.
3. Criação e aprovação de personagem.
4. Início e avisos.
5. Disciplinas e aulas.
6. Perfil.
7. Carteira, mercado e inventário.
8. Mapa.
9. Comunidade.
10. RPG por cenas e sistemas avançados.

## Próximo marco

Migrar o cadastro atual para um fluxo em etapas com rascunho persistente e recuperação automática.
