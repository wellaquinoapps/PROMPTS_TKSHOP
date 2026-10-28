# Prompt — Front-end da Biblioteca de Prompts

## 1. Objetivo

Atue como um desenvolvedor front-end sênior e construa uma aplicação web responsiva para organizar, visualizar, pesquisar e copiar prompts reutilizáveis.

A aplicação funcionará como uma biblioteca de prompts, na qual cada item será exibido em um card com título, descrição, mídia demonstrativa, conteúdo copiável, categoria e tags.

A interface deve ser moderna, intuitiva, rápida e adaptável a celulares, tablets e computadores.

## 2. Tecnologias obrigatórias

Utilize:

- React.
- TypeScript.
- Tailwind CSS para toda a estilização principal.
- Supabase JavaScript Client (`@supabase/supabase-js`).
- React Router para gerenciamento de rotas, caso necessário.
- Lucide React para ícones.
- React Hook Form e Zod para formulários e validações, se apropriado.

Antes de iniciar, inspecione o projeto existente. Preserve as tecnologias e funcionalidades já implementadas quando forem compatíveis com os requisitos.

Se o Tailwind CSS não estiver instalado, configure-o de acordo com a versão escolhida e com o bundler existente. Não misture configurações incompatíveis entre versões.

Não utilize Bootstrap como alternativa ao Tailwind CSS.

## 3. Identidade visual e responsividade

Crie uma interface com:

- Design moderno, limpo e profissional.
- Menu lateral no desktop, com possibilidade de recolhimento.
- Navegação adaptada para dispositivos móveis.
- Cabeçalho com pesquisa, perfil e ações principais.
- Cards com bordas suaves, espaçamento consistente e hierarquia visual clara.
- Estados visuais para hover, foco, carregamento, sucesso e erro.
- Formulários acessíveis e fáceis de utilizar.
- Layout responsivo usando as classes utilitárias do Tailwind CSS.
- Boa legibilidade e contraste.
- Componentes reutilizáveis para botões, campos, modais, cards e notificações.

Utilize classes como `grid`, `flex`, `gap-*`, `p-*`, `rounded-*`, `shadow-*`, `sm:`, `md:`, `lg:` e `xl:` conforme necessário.

Evite criar arquivos CSS tradicionais para estilos que podem ser implementados diretamente com Tailwind.

## 4. Autenticação

Implemente a tela de login integrada ao Supabase Auth.

Funcionalidades:

- Login com e-mail e senha.
- Validação dos campos.
- Mensagens de erro compreensíveis.
- Indicador de carregamento.
- Persistência e recuperação de sessão.
- Logout.
- Redirecionamento após login.
- Proteção das rotas privadas.
- Tratamento de sessão expirada.
- Recuperação de senha, se habilitada no projeto.

Não armazene senhas manualmente no banco da aplicação. Utilize o sistema de autenticação do Supabase.

A proteção das rotas no front-end melhora a experiência, mas não substitui as políticas de segurança do banco.

## 5. Biblioteca de prompts

Crie uma página principal para exibir os prompts cadastrados.

Cada card deve permitir apresentar:

- Título do prompt.
- Descrição resumida.
- Categoria.
- Tags.
- Imagem, GIF ou vídeo opcional.
- Data de criação ou atualização, se relevante.
- Botão "Copiar prompt".
- Botão "Ver detalhes".

### Comportamento dos cards

- Organizar os cards em uma grade responsiva.
- Manter altura e espaçamento visual consistentes.
- Permitir visualizar a mídia sem distorções.
- Exibir um espaço neutro quando não houver mídia.
- Não reproduzir vídeos com som automaticamente.
- Tratar falhas ao carregar imagens ou vídeos.
- Exibir estados de carregamento, erro e lista vazia.

## 6. Botão de copiar prompt

Este é um dos recursos principais da aplicação.

Ao clicar em "Copiar prompt", o sistema deve:

1. Copiar o conteúdo integral do prompt para a área de transferência.
2. Exibir uma confirmação visual, como "Copiado com sucesso!".
3. Evitar copiar apenas a descrição ou o título.
4. Tratar falhas da Clipboard API.
5. Oferecer uma alternativa acessível para selecionar e copiar o conteúdo manualmente quando necessário.

O conteúdo copiado deve corresponder exatamente ao campo `content` do prompt, sem incluir título, tags, identificadores ou metadados.

Implemente o comportamento em um componente ou função reutilizável.

## 7. Pesquisa, filtros e ordenação

Implemente:

- Campo de pesquisa.
- Pesquisa por título e descrição.
- Pesquisa pelo conteúdo do prompt quando permitido pela consulta.
- Filtro por categoria.
- Filtro por tags.
- Ordenação por data de criação.
- Ordenação alfabética.
- Botão para limpar os filtros.

A interface deve continuar funcional em dispositivos móveis.

Utilize paginação ou carregamento progressivo quando a quantidade de registros justificar.

## 8. Página de detalhes do prompt

Ao selecionar um card, exiba uma página ou modal com:

- Título.
- Descrição completa.
- Conteúdo integral do prompt.
- Categoria.
- Tags.
- Mídia demonstrativa.
- Botão para copiar o prompt.
- Botão para voltar à biblioteca.

O conteúdo deve ser legível, com tratamento adequado de quebras de linha e textos extensos.

## 9. Painel administrativo

Crie uma área administrativa protegida para gerenciar os prompts.

Somente usuários com papel `admin` podem acessar as funcionalidades administrativas.

### Dashboard

Apresente informações úteis, como:

- Quantidade total de prompts.
- Quantidade de prompts publicados.
- Quantidade de rascunhos.
- Ação para cadastrar um novo prompt.
- Lista dos prompts recentes.

### CRUD de prompts

Implemente todas as operações:

**Create — Criar**

Formulário com:

- Título.
- Slug opcional.
- Descrição.
- Conteúdo integral do prompt.
- Categoria.
- Tags.
- Tipo de mídia.
- URL da mídia ou upload, conforme a configuração do Supabase Storage.
- Status: rascunho ou publicado.

**Read — Consultar**

- Listagem dos prompts.
- Pesquisa.
- Filtros.
- Visualização de detalhes.
- Paginação quando necessária.

**Update — Editar**

- Carregar os dados existentes.
- Permitir alterar os campos.
- Validar as informações.
- Salvar as alterações.
- Informar o resultado da operação.

**Delete — Excluir**

- Solicitar confirmação antes de excluir.
- Exibir mensagens de sucesso ou erro.
- Tratar a mídia associada conforme as regras de armazenamento.
- Evitar exclusões acidentais.

### Gestão de categorias

Se o esquema do back-end incluir categorias, permita:

- Criar categorias.
- Listar categorias.
- Editar categorias.
- Excluir categorias respeitando os vínculos existentes com prompts.

Não invente tabelas ou colunas sem confirmar o esquema real do banco.

## 10. Integração com Supabase

Centralize a conexão em um módulo próprio.

Utilize as variáveis de ambiente:

`VITE_SUPABASE_URL`

`VITE_SUPABASE_ANON_KEY`

Não exponha a chave `service_role` no front-end.

Crie uma camada de serviços para separar as consultas do Supabase dos componentes visuais.

Implemente tratamento de erros para:

- Falha de autenticação.
- Erros de rede.
- Consultas sem resultados.
- Permissões insuficientes.
- Falhas no upload.
- Falhas ao criar, editar ou excluir registros.

Respeite integralmente as políticas RLS configuradas no banco.

Não contorne erros de autorização nem desative políticas de segurança para fazer a interface funcionar.

## 11. Upload e visualização de mídias

Se o Supabase Storage estiver configurado:

- Permita upload de imagens, GIFs e vídeos.
- Valide tipos e tamanho dos arquivos no cliente.
- Exiba pré-visualização antes de salvar.
- Permita substituir uma mídia existente.
- Trate falhas no upload.
- Evite deixar arquivos órfãos quando um prompt for excluído ou tiver sua mídia substituída.

A validação no cliente não substitui a validação e as permissões do Storage.

Se o sistema utilizar URLs externas, valide o formato e ofereça uma pré-visualização segura.

## 12. Organização do código

Organize o projeto de maneira modular, por exemplo:

- `src/components/`
- `src/components/ui/`
- `src/pages/`
- `src/pages/admin/`
- `src/hooks/`
- `src/services/`
- `src/lib/`
- `src/types/`

Separe responsabilidades em componentes como:

- `PromptCard`
- `PromptGrid`
- `PromptSearch`
- `PromptFilters`
- `PromptDetails`
- `MediaPreview`
- `CopyPromptButton`
- `AdminDashboard`
- `PromptForm`
- `ConfirmDialog`

Adapte essa estrutura ao projeto real.

Evite duplicação de código, componentes excessivamente grandes e consultas ao banco espalhadas pela interface.

## 13. Segurança e acessibilidade

- Não confiar exclusivamente na ocultação de botões para controlar permissões.
- Verificar o papel do usuário por meio de uma fonte confiável.
- Manter as políticas de autorização no Supabase.
- Não armazenar credenciais em localStorage manualmente.
- Utilizar os mecanismos de sessão do Supabase.
- Implementar navegação por teclado.
- Utilizar rótulos adequados nos formulários.
- Manter foco visível.
- Exibir mensagens de erro acessíveis.
- Respeitar a preferência por movimento reduzido.

## 14. Critérios de aceite

A implementação será considerada concluída quando:

1. O login funcionar com Supabase Auth.
2. A sessão puder ser recuperada e encerrada corretamente.
3. A biblioteca exibir os prompts autorizados.
4. A pesquisa e os filtros funcionarem.
5. O botão copiar transferir o conteúdo correto.
6. A página de detalhes funcionar.
7. O CRUD administrativo funcionar de ponta a ponta.
8. Usuários comuns não conseguirem realizar operações administrativas.
9. O layout funcionar em celulares, tablets e desktops.
10. Tailwind CSS for utilizado como solução principal de estilização.
11. Erros e estados de carregamento forem tratados.
12. Nenhuma chave privilegiada estiver exposta no navegador.

## 15. Instruções de execução

Antes de implementar, apresente um plano resumido.

Em seguida:

1. Inspecione a estrutura do projeto.
2. Configure React, TypeScript e Tailwind CSS, se necessário.
3. Configure a integração com Supabase.
4. Implemente autenticação e rotas.
5. Implemente a biblioteca e os cards.
6. Implemente pesquisa, filtros e cópia.
7. Implemente o painel administrativo e o CRUD.
8. Execute os testes e corrija os problemas encontrados.

Ao finalizar, informe:

- Arquivos criados e modificados.
- Dependências instaladas.
- Variáveis de ambiente necessárias.
- Comandos para executar o projeto.
- Testes realizados.
- Funcionalidades que ainda dependem de configuração externa.

Não declare como concluída uma funcionalidade que não tenha sido implementada e verificada