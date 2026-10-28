-- Migration: 20261027000006_set_initial_admin.sql
-- Description: Procedimento seguro para atribuir a primeira role de administrador.
--
-- INSTRUÇÕES DE USO:
-- Para definir o primeiro administrador do sistema, execute este comando no
-- SQL Editor do painel Supabase ou via CLI autenticada com acesso administrativo.
-- Substitua 'seu-email-aqui@dominio.com' pelo e-mail do usuário já registrado no Supabase Auth.

CREATE OR REPLACE PROCEDURE public.grant_admin_role_by_email(admin_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = lower(trim(admin_email));

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com o e-mail % não foi encontrado no auth.users.', admin_email;
    END IF;

    -- Atualiza ou insere o perfil com a role admin
    INSERT INTO public.profiles (id, role, updated_at)
    VALUES (target_user_id, 'admin'::public.app_role, timezone('utc'::text, now()))
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin'::public.app_role,
        updated_at = timezone('utc'::text, now());

    RAISE NOTICE 'Papel de admin concedido com sucesso para o usuário % (ID: %).', admin_email, target_user_id;
END;
$$;

-- Restringe a execução do procedimento apenas à service_role / postgres
REVOKE ALL ON PROCEDURE public.grant_admin_role_by_email(TEXT) FROM PUBLIC;
REVOKE ALL ON PROCEDURE public.grant_admin_role_by_email(TEXT) FROM anon;
REVOKE ALL ON PROCEDURE public.grant_admin_role_by_email(TEXT) FROM authenticated;

-- Exemplo de execução pelo administrador no SQL Editor:
-- CALL public.grant_admin_role_by_email('admin@exemplo.com');

