-- Migration: 20261027000003_create_prompts.sql
-- Description: Criação da tabela prompts, tipos de mídia, relacionamentos, FTS e RLS.

-- 1. Tipo de mídia
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type_enum') THEN
        CREATE TYPE public.media_type_enum AS ENUM ('none', 'image', 'gif', 'video');
    END IF;
END$$;

-- 2. Tabela prompts
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    content TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    media_url TEXT,
    media_type public.media_type_enum NOT NULL DEFAULT 'none'::public.media_type_enum,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    tsv tsvector GENERATED ALWAYS AS (
        to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))
    ) STORED
);

-- Comentários
COMMENT ON TABLE public.prompts IS 'Biblioteca de prompts com suporte a rascunhos, mídias e categorização';

-- 3. Índices para performance em pesquisas e filtros
CREATE INDEX IF NOT EXISTS idx_prompts_is_published ON public.prompts(is_published);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at_desc ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_title ON public.prompts(title);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON public.prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_tsv ON public.prompts USING GIN(tsv);

-- 4. Trigger updated_at
DROP TRIGGER IF EXISTS set_prompts_updated_at ON public.prompts;
CREATE TRIGGER set_prompts_updated_at
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Habilitação de RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS para prompts

-- Leitura:
-- Usuários anônimos e comuns só podem visualizar prompts PUBLICADOS (is_published = true).
-- Administradores podem visualizar TODOS (publicados e rascunhos).
CREATE POLICY "Public or Users can read published prompts"
    ON public.prompts
    FOR SELECT
    TO anon, authenticated
    USING (
        is_published = true OR public.is_admin()
    );

-- Inserção:
-- Apenas administradores podem cadastrar prompts no sistema
CREATE POLICY "Admins can insert prompts"
    ON public.prompts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
    );

-- Atualização:
-- Apenas administradores podem editar prompts ou alterar estado de publicação
CREATE POLICY "Admins can update prompts"
    ON public.prompts
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Exclusão:
-- Apenas administradores podem excluir prompts
CREATE POLICY "Admins can delete prompts"
    ON public.prompts
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

