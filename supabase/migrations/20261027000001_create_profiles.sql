-- Migration: 20261027000001_create_profiles.sql
-- Description: Criação da tabela profiles, roles e triggers seguros de criação de perfil.

-- 1. Criação do tipo enumerado de roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'admin');
    END IF;
END$$;

-- 2. Tabela profiles vinculada a auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários para documentação de schema
COMMENT ON TABLE public.profiles IS 'Perfil complementar de usuários autenticados e controle de permissões';
COMMENT ON COLUMN public.profiles.role IS 'Papel do usuário no sistema: user ou admin';

-- 3. Função de verificação de admin segura (SECURITY DEFINER)
-- Evita recursão infinita no RLS e centraliza a checagem de autoridade
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'::public.app_role
    );
$$;

-- Restringe privilégios de execução
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. Função e trigger para manter updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Trigger para criação automática de perfil no signup (Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'user'::public.app_role -- Garante que qualquer cadastro comum seja estritamente 'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Habilitação de RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Segurança RLS para profiles

-- Leitura: Qualquer usuário autenticado pode ler dados básicos de perfis (para autores de prompts)
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Atualização: Usuário comum só pode atualizar seu próprio display_name/avatar. NÃO pode alterar 'role'.
-- Administrador pode atualizar qualquer perfil inclusive role.
CREATE POLICY "Users can update own display profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id OR public.is_admin()
    )
    WITH CHECK (
        (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
        OR public.is_admin()
    );

-- Inserção: Criado pelo trigger de auth. Caso seja inserido via API pelo próprio usuário:
CREATE POLICY "Users can insert their own profile with user role"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id AND (role = 'user'::public.app_role OR public.is_admin())
    );

-- Exclusão: Apenas administradores podem remover perfis diretamente (geralmente gerido pelo auth.users)
CREATE POLICY "Admins can delete profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

