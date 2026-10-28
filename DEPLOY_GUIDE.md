# Instruções de Implantação e Execução do Back-end Supabase

Este documento contém o guia completo para aplicar as migrations, configurar a segurança e conectar o front-end ao banco de dados Supabase da aplicação **Prompts TKShop**.

---

## 1. Estrutura de Arquivos Gerados

```
├── supabase/
│   ├── migrations/
│   │   ├── 20261027000001_create_profiles.sql
│   │   ├── 20261027000002_create_categories.sql
│   │   ├── 20261027000003_create_prompts.sql
│   │   ├── 20261027000004_create_storage.sql
│   │   ├── 20261027000005_search_prompts_function.sql
│   │   └── 20261027000006_set_initial_admin.sql
│   └── tests/
│       └── rls_validation_test.sql
├── src/
│   ├── types/
│   │   └── database.types.ts
│   └── services/
│       ├── supabaseClient.ts
│       └── promptService.ts
├── .env.example
└── BACKEND.md
```

---

## 2. Como Aplicar as Migrations

Você pode aplicar as migrations de duas formas:

### Opção A: Pelo Dashboard do Supabase (SQL Editor)
1. Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
2. Vá até a seção **SQL Editor**.
3. Execute sequencialmente o conteúdo dos arquivos da pasta `supabase/migrations/`:
   - `20261027000001_create_profiles.sql`
   - `20261027000002_create_categories.sql`
   - `20261027000003_create_prompts.sql`
   - `20261027000004_create_storage.sql`
   - `20261027000005_search_prompts_function.sql`
   - `20261027000006_set_initial_admin.sql`

### Opção B: Via Supabase CLI
Se tiver a CLI do Supabase vinculada ao projeto remoto:
```bash
supabase link --project-ref seu-project-ref
supabase db push
```

---

## 3. Criação do Primeiro Administrador

Como o sistema impede que usuários comuns se promovam via API ou RLS:
1. Registre o usuário inicial pelo fluxo de cadastro do Supabase Auth (e-mail e senha).
2. Abra o **SQL Editor** no Supabase e execute a procedure criada:
   ```sql
   CALL public.grant_admin_role_by_email('seu-email-admin@dominio.com');
   ```
3. A procedure atualizará a role para `admin` com segurança e privilégios restritos.

---

## 4. Testes e Validação de RLS

Para testar e validar o isolamento e políticas de autorização:
1. No **SQL Editor**, execute o arquivo `supabase/tests/rls_validation_test.sql`.
2. O script executa um bloco transacional isolado com `ROLLBACK` ao final, validando:
   - Apenas prompts publicados visíveis para usuários comuns/anônimos.
   - Proteção do `is_admin()`.
   - Busca Full Text Search e integridade referencial com categorias.

---

## 5. Integração com o Front-end (React + TypeScript)

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
2. Preencha com sua `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Utilize os serviços prontos em `src/services/promptService.ts` e a tipagem estrita de `src/types/database.types.ts`.

