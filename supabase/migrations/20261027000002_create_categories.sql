-- Migration: 20261027000002_create_categories.sql
-- Description: Criação da tabela categories com slug único e regras RLS.

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários
COMMENT ON TABLE public.categories IS 'Categorias organizacionais para os prompts da biblioteca';

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Habilitação de RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para categories:
-- Leitura pública (ou usuários anônimos/autenticados para listar categorias dos prompts disponíveis)
CREATE POLICY "Categories are readable by everyone"
    ON public.categories
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Inserção: Apenas administradores
CREATE POLICY "Admins can insert categories"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Atualização: Apenas administradores
CREATE POLICY "Admins can update categories"
    ON public.categories
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Exclusão: Apenas administradores
CREATE POLICY "Admins can delete categories"
    ON public.categories
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

