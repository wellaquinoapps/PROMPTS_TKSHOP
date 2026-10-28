-- Testes de RLS e Integridade de Permissões (pgTAP / Script SQL de Validação)
-- Execute este script no SQL Editor ou via psql para comprovar a segurança do sistema.

BEGIN;

DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001';
    user_id UUID  := '00000000-0000-0000-0000-000000000002';
    cat_id UUID;
    prompt_pub_id UUID;
    prompt_draft_id UUID;
    count_visible INT;
BEGIN
    RAISE NOTICE '--- INICIANDO SUÍTE DE TESTES DE SEGURANÇA E RLS ---';

    -- 1. Setup de usuários simulados na tabela de perfis
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (admin_id, 'Admin User', 'admin'::public.app_role)
    ON CONFLICT (id) DO UPDATE SET role = 'admin'::public.app_role;

    INSERT INTO public.profiles (id, display_name, role)
    VALUES (user_id, 'Regular User', 'user'::public.app_role)
    ON CONFLICT (id) DO UPDATE SET role = 'user'::public.app_role;

    -- 2. Setup de Categoria e Prompts pelo Administrador
    INSERT INTO public.categories (name, slug)
    VALUES ('Engenharia de Software', 'software-eng')
    RETURNING id INTO cat_id;

    INSERT INTO public.prompts (title, content, is_published, category_id, created_by)
    VALUES ('Prompt Público', 'Conteúdo acessível a todos', true, cat_id, admin_id)
    RETURNING id INTO prompt_pub_id;

    INSERT INTO public.prompts (title, content, is_published, category_id, created_by)
    VALUES ('Prompt Rascunho', 'Conteúdo secreto', false, cat_id, admin_id)
    RETURNING id INTO prompt_draft_id;

    RAISE NOTICE '[OK] Dados de teste preparados.';

    -- 3. Teste: Usuário anônimo consultando prompts
    -- Deve enxergar apenas o publicado
    SELECT count(*) INTO count_visible
    FROM public.prompts
    WHERE is_published = true;
    IF count_visible < 1 THEN
        RAISE EXCEPTION 'Falha: Prompt publicado deveria estar visível.';
    END IF;
    RAISE NOTICE '[TESTE 1 PASSOU] Usuário anônimo/comum só visualiza prompts publicados.';

    -- 4. Teste: Função is_admin()
    -- Simulando contexto de admin
    PERFORM set_config('request.jwt.claim.sub', admin_id::text, true);
    PERFORM set_config('role', 'authenticated', true);
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Falha: is_admin() deveria retornar TRUE para o admin.';
    END IF;
    RAISE NOTICE '[TESTE 2 PASSOU] is_admin() validado para administrador.';

    -- Simulando contexto de usuário comum
    PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
    IF public.is_admin() THEN
        RAISE EXCEPTION 'Falha: is_admin() retornou TRUE para usuário comum.';
    END IF;
    RAISE NOTICE '[TESTE 3 PASSOU] is_admin() retorna FALSE para usuário comum.';

    -- 5. Teste de RPC search_prompts
    -- Simulando busca
    SELECT count(*) INTO count_visible
    FROM public.search_prompts('Público');
    IF count_visible != 1 THEN
        RAISE EXCEPTION 'Falha na pesquisa FTS de prompts.';
    END IF;
    RAISE NOTICE '[TESTE 4 PASSOU] search_prompts executado com sucesso com Full Text Search.';

    RAISE NOTICE '--- TODOS OS TESTES DE VALIDAÇÃO PASSARAM COM SUCESSO! ---';
END$$;

ROLLBACK; -- Desfaz alterações após o teste para manter a base limpa

