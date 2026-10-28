-- Migration: 20261027000005_search_prompts_function.sql
-- Description: RPC function para busca paginada com Full Text Search, tags e categoria.

CREATE OR REPLACE FUNCTION public.search_prompts(
    search_query TEXT DEFAULT NULL,
    filter_category_id UUID DEFAULT NULL,
    filter_tag TEXT DEFAULT NULL,
    sort_by TEXT DEFAULT 'created_at', -- 'created_at' ou 'title'
    sort_order TEXT DEFAULT 'desc',    -- 'asc' ou 'desc'
    page_limit INT DEFAULT 20,
    page_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    description TEXT,
    content TEXT,
    category_id UUID,
    tags TEXT[],
    media_url TEXT,
    media_type public.media_type_enum,
    is_published BOOLEAN,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER -- Executa com as permissões e RLS do usuário chamador
SET search_path = public, pg_temp
AS $$
DECLARE
    capped_limit INT := LEAST(GREATEST(page_limit, 1), 100); -- Trava limite entre 1 e 100 itens
BEGIN
    RETURN QUERY
    WITH filtered AS (
        SELECT p.*
        FROM public.prompts p
        WHERE
            -- Filtro de texto (título, descrição, conteúdo via FTS ou ILIKE)
            (
                search_query IS NULL OR btrim(search_query) = ''
                OR p.tsv @@ websearch_to_tsquery('portuguese', search_query)
                OR p.title ILIKE ('%' || search_query || '%')
            )
            -- Filtro de categoria
            AND (filter_category_id IS NULL OR p.category_id = filter_category_id)
            -- Filtro de tag
            AND (filter_tag IS NULL OR filter_tag = ANY(p.tags))
    ),
    counted AS (
        SELECT count(*) AS full_count FROM filtered
    )
    SELECT
        f.id,
        f.title,
        f.slug,
        f.description,
        f.content,
        f.category_id,
        f.tags,
        f.media_url,
        f.media_type,
        f.is_published,
        f.created_by,
        f.created_at,
        f.updated_at,
        c.full_count AS total_count
    FROM filtered f
    CROSS JOIN counted c
    ORDER BY
        CASE WHEN sort_by = 'title' AND sort_order = 'asc' THEN f.title END ASC,
        CASE WHEN sort_by = 'title' AND sort_order = 'desc' THEN f.title END DESC,
        CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN f.created_at END ASC,
        CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN f.created_at END DESC,
        f.created_at DESC
    LIMIT capped_limit
    OFFSET GREATEST(page_offset, 0);
END;
$$;

-- Permissões na função de busca
GRANT EXECUTE ON FUNCTION public.search_prompts TO anon, authenticated;

