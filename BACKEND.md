# Prompt — Back-end com Supabase, PostgreSQL e RLS

## 1. Objetivo

Atue como um engenheiro de software back-end sênior, especialista em Supabase, PostgreSQL, autenticação e segurança de aplicações web.

Implemente a estrutura de dados e as regras de autorização de uma aplicação de biblioteca de prompts.

A aplicação deve oferecer:

- Login e gerenciamento de sessão.
- Usuários comuns e administradores.
- Cadastro, consulta, edição e exclusão de prompts.
- Gerenciamento de categorias e tags.
- Publicação de prompts e rascunhos.
- Armazenamento opcional de imagens, GIFs e vídeos.
- Pesquisa, filtros e paginação.
- Segurança por PostgreSQL Row Level Security (RLS).

O front-end será desenvolvido separadamente com React, TypeScript e Tailwind CSS. Portanto, este prompt deve se concentrar no Supabase, no banco de dados, nas permissões e nos serviços necessários.

## 2. Tecnologias obrigatórias

Utilize:

- Supabase Auth.
- PostgreSQL do Supabase.
- Row Level Security (RLS).
- Supabase Storage, se houver upload de mídias.
- SQL migrations versionadas.
- TypeScript para tipos compartilhados ou funções auxiliares, quando necessário.

Antes de realizar alterações, inspecione o esquema e a estrutura existentes.

Não sobrescreva tabelas ou dados existentes sem avaliar o impacto.

Não invente resultados de testes nem declare que as políticas são seguras sem validá-las.

## 3. Arquitetura de segurança

A segurança deve ser implementada no banco de dados e nos serviços autorizados, não apenas na interface.

Regras obrigatórias:

- Ativar RLS em todas as tabelas expostas pela API.
- Definir políticas separadas de leitura, inserção, atualização e exclusão.
- Utilizar privilégios SQL mínimos.
- Não desabilitar RLS para corrigir erros de consulta.
- Não utilizar `user_metadata` editável pelo usuário como fonte de autoridade administrativa.
- Impedir que usuários comuns alterem seu próprio papel.
- Nunca expor a chave `service_role` no front-end.
- Não colocar segredos privilegiados em repositórios públicos.
- Não permitir que usuários anônimos ou comuns executem operações administrativas.

O papel administrativo deve ser verificado em uma fonte confiável, como uma tabela protegida ou claims gerenciadas por um fluxo administrativo seguro.

## 4. Modelo de dados

Crie migrations SQL revisáveis e versionadas.

Ajuste o modelo ao esquema existente e confirme os relacionamentos antes de implementar.

### Tabela `profiles`

Representa os dados complementares do usuário.

Campos sugeridos:

- `id`: UUID, chave primária e referência a `auth.users(id)`.
- `display_name`: nome de exibição, opcional.
- `role`: papel do usuário, com valor padrão `user`.
- `created_at`: data de criação.
- `updated_at`: data de atualização.

Os papéis iniciais podem ser:

- `user`
- `admin`

Implemente uma restrição que impeça valores inválidos.

O usuário comum não pode promover a si mesmo ou outros usuários a administrador.

Crie ou documente um procedimento seguro para conceder o primeiro papel administrativo, executado por alguém com acesso autorizado ao projeto Supabase.

Se criar um trigger para gerar perfis a partir de novos usuários, assegure que ele não permita atribuição indevida de privilégios.

### Tabela `categories`

Representa as categorias disponíveis para organização dos prompts.

Campos sugeridos:

- `id`: UUID, chave primária.
- `name`: nome obrigatório.
- `slug`: identificador único.
- `created_at`: data de criação.

Implemente restrições de unicidade e validações apropriadas.

### Tabela `prompts`

Representa cada prompt cadastrado.

Campos sugeridos:

- `id`: UUID, chave primária.
- `title`: título obrigatório.
- `slug`: identificador textual único, opcional.
- `description`: descrição resumida.
- `content`: conteúdo integral do prompt, obrigatório.
- `category_id`: referência opcional à categoria.
- `tags`: array de textos ou estrutura equivalente.
- `media_url`: endereço da mídia, opcional.
- `media_type`: tipo da mídia.
- `is_published`: indica se o prompt está publicado.
- `created_by`: usuário responsável pela criação.
- `created_at`: data de criação.
- `updated_at`: data da última atualização.

Os valores permitidos para `media_type` devem incluir:

- `none`
- `image`
- `gif`
- `video`

Implemente restrições para campos obrigatórios, valores válidos e integridade referencial.

Evite armazenar arquivos grandes diretamente nas tabelas.

### Relacionamentos

- Um usuário pode criar vários prompts.
- Uma categoria pode estar associada a vários prompts.
- Um prompt pode possuir várias tags.
- A exclusão de uma categoria não deve causar perda acidental dos prompts vinculados.

Defina explicitamente o comportamento das chaves estrangeiras e das exclusões.

## 5. Autenticação com Supabase Auth

Utilize Supabase Auth para autenticação.

O sistema deve permitir:

- Login por e-mail e senha.
- Logout.
- Recuperação de senha, se habilitada.
- Recuperação da sessão no cliente.
- Identificação do usuário autenticado.
- Verificação do papel do usuário para operações administrativas.

Não armazene senhas em texto puro nas tabelas da aplicação.

Não implemente autenticação paralela desnecessária quando o Supabase Auth já atende à necessidade.

## 6. Políticas RLS

Crie e documente as políticas de segurança para cada tabela.

### Usuários comuns

Devem poder:

- Consultar os prompts publicados permitidos pela aplicação.
- Consultar as categorias necessárias à navegação.
- Consultar os próprios dados de perfil, respeitando as permissões estabelecidas.

Não devem poder:

- Criar prompts administrativos.
- Editar prompts de terceiros.
- Excluir prompts.
- Publicar rascunhos.
- Alterar o próprio papel.
- Modificar o papel de outros usuários.
- Acessar informações privadas de outros usuários sem necessidade legítima.

### Administradores

Podem executar as operações administrativas autorizadas:

- Criar prompts.
- Consultar prompts publicados e rascunhos.
- Editar prompts.
- Excluir prompts.
- Gerenciar categorias.
- Gerenciar conteúdo e publicação.

A autorização deve ser verificada no banco.

### Implementação das políticas

Para cada política:

1. Explique sua finalidade.
2. Defina os papéis autorizados.
3. Utilize corretamente `USING` e `WITH CHECK`.
4. Considere operações executadas diretamente pela API.
5. Verifique os privilégios SQL associados.
6. Evite políticas recursivas na tabela `profiles`.

Se utilizar funções `SECURITY DEFINER`, defina explicitamente um `search_path` seguro, restrinja a permissão de execução e revise cuidadosamente o código.

Não confunda RLS com privilégios SQL: ambos precisam estar configurados corretamente.

## 7. Supabase Storage

Se a aplicação precisar receber uploads, configure um bucket para imagens, GIFs e vídeos.

Implemente:

- Políticas de leitura adequadas à visibilidade do conteúdo.
- Upload restrito a administradores autorizados.
- Substituição de arquivos com controle de permissões.
- Exclusão de arquivos com controle de permissões.
- Limites de tamanho.
- Restrições de tipos de arquivo.
- Tratamento de falhas.
- Estratégia para remover arquivos órfãos.

Não permita uploads irrestritos.

A validação de tipo MIME informada pelo cliente não deve ser considerada suficiente para garantir a segurança do arquivo.

Defina se as mídias serão públicas ou privadas. Para conteúdo privado, avalie URLs assinadas e regras de acesso.

Não armazene arquivos binários diretamente na tabela `prompts`; armazene as referências necessárias.

Se a aplicação utilizar URLs externas, documente como validar os endereços e quais protocolos são permitidos.

## 8. Pesquisa, filtros e paginação

Prepare o banco para atender às consultas do front-end.

Implemente suporte a:

- Listagem paginada.
- Busca por título.
- Busca por descrição.
- Busca pelo conteúdo do prompt, quando apropriado.
- Filtro por categoria.
- Filtro por tags.
- Ordenação por data.
- Ordenação alfabética.
- Limite máximo de registros por consulta.

Avalie índices PostgreSQL conforme as consultas reais.

Utilize Full Text Search quando houver necessidade de busca textual mais eficiente.

Evite consultas desnecessariamente complexas e não retorne dados que o cliente não precisa.

Usuários comuns não devem receber rascunhos por meio das consultas autorizadas.

## 9. Integridade e manutenção

Implemente, quando necessário:

- Índices para campos frequentemente consultados.
- Restrições de unicidade.
- Restrições para valores válidos.
- Função ou trigger para atualizar `updated_at`.
- Regras de integridade referencial.
- Tratamento consistente de exclusões.
- Migrations versionadas.
- Procedimentos de rollback quando viáveis.

Não crie triggers desnecessários.

Garanta que as migrations possam ser revisadas e aplicadas de maneira previsível.

## 10. Integração com o front-end

O front-end utilizará React, TypeScript e Tailwind CSS.

Disponibilize um esquema de dados consistente para as operações de:

- Login.
- Consulta de perfil e papel.
- Listagem de prompts.
- Consulta de detalhes.
- Criação de prompts.
- Atualização de prompts.
- Exclusão de prompts.
- Gerenciamento de categorias.
- Upload e gerenciamento de mídias, quando habilitados.

Gere tipos TypeScript compatíveis com o esquema real do banco, preferencialmente a partir das ferramentas do Supabase.

Não crie interfaces que contradigam as colunas existentes.

O cliente deve usar somente as credenciais públicas apropriadas. Toda operação privilegiada precisa ser protegida por RLS ou executada em ambiente confiável com autenticação e autorização explícitas.

## 11. Testes obrigatórios

Crie um plano de testes com usuários de diferentes papéis.

Verifique:

1. Usuário anônimo não consegue inserir, editar ou excluir prompts.
2. Usuário comum consegue consultar somente o conteúdo autorizado.
3. Usuário comum não consegue consultar rascunhos.
4. Usuário comum não consegue alterar o próprio papel.
5. Usuário comum não consegue promover outro usuário.
6. Administrador consegue criar prompts.
7. Administrador consegue editar prompts.
8. Administrador consegue excluir prompts.
9. As categorias respeitam as permissões configuradas.
10. Chamadas diretas à API respeitam RLS.
11. Uploads e exclusões no Storage respeitam as políticas.
12. Não existem chaves privilegiadas expostas no cliente.
13. As relações entre tabelas permanecem consistentes após exclusões.

Teste as permissões diretamente, e não somente por meio da interface.

Não considere a segurança validada até que os testes relevantes tenham sido executados.

## 12. Entregáveis

Forneça:

- Migrations SQL.
- Tabelas e relacionamentos.
- Índices necessários.
- Políticas RLS documentadas.
- Configuração do Supabase Storage, se aplicável.
- Tipos TypeScript atualizados.
- Processo seguro para criação do primeiro administrador.
- Instruções de configuração das variáveis de ambiente.
- Comandos para aplicar migrations.
- Plano de testes de autorização.
- Instruções de deploy e rollback.
- Documentação das decisões técnicas e de segurança.

## 13. Forma de execução

Siga esta ordem:

1. Inspecione o projeto e o esquema atual do banco.
2. Apresente um plano resumido.
3. Identifique riscos e dependências.
4. Crie as migrations necessárias.
5. Implemente tabelas, índices e restrições.
6. Configure autenticação e políticas RLS.
7. Configure o Storage, se necessário.
8. Gere os tipos e documente a integração.
9. Execute os testes.
10. Apresente os arquivos criados, comandos e resultados reais.

Não faça alterações destrutivas sem explicar previamente o impacto.

Não desative políticas de segurança para contornar erros.

Não declare uma funcionalidade implementada ou validada sem evidências de sua execução.