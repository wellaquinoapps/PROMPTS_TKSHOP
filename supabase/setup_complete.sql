-- ==============================================================================
-- SETUP COMPLETO COM SISTEMA DE APROVAÇÃO (PENDING, APPROVED, REJECTED)
-- Execute este script inteiro no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/knzdxmelubcuaepcvhej/sql/new
-- ==============================================================================

-- 1. TIPOS ENUMERADOS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type_enum') THEN
        CREATE TYPE public.media_type_enum AS ENUM ('none', 'image', 'gif', 'video');
    END IF;
END$$;

-- 2. FUNÇÃO HANDLE_UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- 3. TABELA PROFILES (COM STATUS DE APROVAÇÃO E EMAIL)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    display_name TEXT,
    role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
    status public.user_status NOT NULL DEFAULT 'pending'::public.user_status,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Garantir colunas se tabela já existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
        ALTER TABLE public.profiles ADD COLUMN status public.user_status NOT NULL DEFAULT 'pending'::public.user_status;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT UNIQUE;
    END IF;
END$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. FUNÇÕES DE AUTORIZAÇÃO (SECURITY DEFINER SEGURA)
-- Verifica se é Admin
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

-- Verifica se usuário está aprovado (ou é admin)
CREATE OR REPLACE FUNCTION public.is_approved()
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
          AND (status = 'approved'::public.user_status OR role = 'admin'::public.app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_approved() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved() TO authenticated;

-- 5. TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL NO SIGNUP (STATUS PENDING OBRIGATÓRIO)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, role, status)
    VALUES (
        NEW.id,
        lower(trim(NEW.email)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'user'::public.app_role,
        'pending'::public.user_status -- Fica aguardando aprovação do admin
    )
    ON CONFLICT (id) DO UPDATE SET
        email = lower(trim(NEW.email)),
        display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', public.profiles.display_name);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. TABELA CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. TABELA PROMPTS COM FTS
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

DROP TRIGGER IF EXISTS set_prompts_updated_at ON public.prompts;
CREATE TRIGGER set_prompts_updated_at
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_prompts_is_published ON public.prompts(is_published);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at_desc ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON public.prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_tsv ON public.prompts USING GIN(tsv);

-- 8. POLÍTICAS ROW LEVEL SECURITY (RLS) RIGOROSAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Profiles: Usuário só vê o próprio perfil; Admin vê todos para poder aprovar
DROP POLICY IF EXISTS "Profiles view policy" ON public.profiles;
CREATE POLICY "Profiles view policy"
    ON public.profiles FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_admin());

-- Usuário comum só pode atualizar seu display_name/avatar. NÃO pode aprovar a si mesmo nem mudar role.
DROP POLICY IF EXISTS "Users can update own display profile" ON public.profiles;
CREATE POLICY "Users can update own display profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (
        (
            auth.uid() = id 
            AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
            AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

-- Categories: Apenas usuários APROVADOS (ou admins) podem ler categorias
DROP POLICY IF EXISTS "Approved users can read categories" ON public.categories;
CREATE POLICY "Approved users can read categories"
    ON public.categories FOR SELECT TO authenticated
    USING (public.is_approved());

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
    ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
    ON public.categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
    ON public.categories FOR DELETE TO authenticated USING (public.is_admin());

-- Prompts: Apenas usuários APROVADOS podem ler prompts publicados. Rascunhos apenas para Admin.
DROP POLICY IF EXISTS "Approved users can read published prompts" ON public.prompts;
CREATE POLICY "Approved users can read published prompts"
    ON public.prompts FOR SELECT TO authenticated
    USING (
        (public.is_approved() AND is_published = true) OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can insert prompts" ON public.prompts;
CREATE POLICY "Admins can insert prompts"
    ON public.prompts FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update prompts" ON public.prompts;
CREATE POLICY "Admins can update prompts"
    ON public.prompts FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete prompts" ON public.prompts;
CREATE POLICY "Admins can delete prompts"
    ON public.prompts FOR DELETE TO authenticated USING (public.is_admin());

-- 9. FUNÇÃO DE BUSCA E PAGINAÇÃO (RPC PROTEGIDA PARA APROVADOS)
CREATE OR REPLACE FUNCTION public.search_prompts(
    search_query TEXT DEFAULT NULL,
    filter_category_id UUID DEFAULT NULL,
    filter_tag TEXT DEFAULT NULL,
    sort_by TEXT DEFAULT 'created_at',
    sort_order TEXT DEFAULT 'desc',
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
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    capped_limit INT := LEAST(GREATEST(page_limit, 1), 100);
BEGIN
    -- Se não estiver aprovado, não retorna nada
    IF NOT public.is_approved() THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH filtered AS (
        SELECT p.*
        FROM public.prompts p
        WHERE
            (
                search_query IS NULL OR btrim(search_query) = ''
                OR p.tsv @@ websearch_to_tsquery('portuguese', search_query)
                OR p.title ILIKE ('%' || search_query || '%')
            )
            AND (filter_category_id IS NULL OR p.category_id = filter_category_id)
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

GRANT EXECUTE ON FUNCTION public.search_prompts TO authenticated;

-- 10. PROCEDURES DE GESTÃO DE USUÁRIOS PARA ADMINS
-- Conceder admin
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
        RAISE EXCEPTION 'Usuário % não encontrado.', admin_email;
    END IF;

    INSERT INTO public.profiles (id, email, role, status, updated_at)
    VALUES (target_user_id, lower(trim(admin_email)), 'admin'::public.app_role, 'approved'::public.user_status, timezone('utc'::text, now()))
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin'::public.app_role,
        status = 'approved'::public.user_status,
        updated_at = timezone('utc'::text, now());

    RAISE NOTICE 'Admin e aprovação concedidos para %.', admin_email;
END;
$$;

-- Procedimento para aprovar usuário comum
CREATE OR REPLACE PROCEDURE public.set_user_approval_by_email(user_email TEXT, approve_status public.user_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    UPDATE public.profiles
    SET status = approve_status,
        updated_at = timezone('utc'::text, now())
    WHERE email = lower(trim(user_email));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário % não encontrado na tabela profiles.', user_email;
    END IF;

    RAISE NOTICE 'Status do usuário % alterado para %.', user_email, approve_status;
END;
$$;

-- 11. DADOS INICIAIS DE CATEGORIAS E PROMPTS
INSERT INTO public.categories (id, name, slug, description)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Imagens', 'imagens', 'Prompts para Midjourney, DALL-E, Stable Diffusion e Flux'),
    ('22222222-2222-2222-2222-222222222222', 'Marketing', 'marketing', 'Copywriting, landing pages, emails e anúncios de alta conversão'),
    ('33333333-3333-3333-3333-333333333333', 'Programação', 'programacao', 'Arquitetura de software, refatoração, testes e otimização'),
    ('44444444-4444-4444-4444-444444444444', 'Vídeos', 'videos', 'Prompts cinematográficos para Sora, Runway Gen-3, Luma e Pika')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.prompts (title, slug, description, content, category_id, tags, media_url, media_type, is_published)
VALUES 
    (
        'Retrato cinematográfico profissional em 85mm',
        'retrato-cinematografico-85mm',
        'Retrato editorial com iluminação Hasselblad e profundidade de campo f/1.4',
        '/imagine prompt: Cinematic medium closeup portrait of [PERSONAGEM], photographed on Arri Alexa with 85mm prime lens, [ILUMINACAO], in [CENARIO], ultra photorealistic texture, 35mm film grain, 8k resolution, photorealistic depth of field --v 6.0 --ar 16:9 --style raw --s 250',
        '11111111-1111-1111-1111-111111111111',
        ARRAY['Midjourney v6', 'Retratos', '8k', 'Cinematic'],
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
        'image',
        true
    ),
    (
        'Landing page SaaS de alta conversão',
        'landing-page-saas-alta-conversao',
        'Framework PAS com seções persuasivas e microcopy para CTAs',
        'Atue como copywriter sênior especialista em B2B. Crie uma landing page completa para [NICHO] estruturada no Framework PAS (Problema, Agitação, Solução) com 5 seções persuasivas, proposta de valor irresistível e microcopy para botões de CTA.',
        '22222222-2222-2222-2222-222222222222',
        ARRAY['Claude 3.5 Sonnet', 'Copywriting', 'SaaS', 'B2B'],
        NULL,
        'none',
        true
    ),
    (
        'Análise e refatoração de código limpo',
        'analise-refatoracao-codigo-limpo',
        'Aplica princípios SOLID, remove code smells e adiciona testes unitários',
        'Refatore o trecho em [LINGUAGEM] aplicando rigorosamente os princípios SOLID, Clean Code e padrões de projeto apropriados. Remova complexidade ciclomática desnecessária, comente tipos e implemente testes unitários completos cobrindo casos extremos.',
        '33333333-3333-3333-3333-333333333333',
        ARRAY['GPT-4o', 'Engenharia', 'CleanCode', 'Dev'],
        NULL,
        'none',
        true
    ),
    (
        'Vídeo promocional de produto cinematográfico',
        'video-promocional-produto',
        'Drone sweep macro hiperdetalhado em 4k a 60fps',
        'Dynamic macro drone sweep revolving around minimalist [PRODUTO] floating over dark water ripples, hyper-detailed caustics, cinematic 60fps, 4k resolution, cinematic color grading, studio lighting.',
        '44444444-4444-4444-4444-444444444444',
        ARRAY['Sora / Runway Gen-3', 'VFX', 'Cinematic', '4K'],
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
        'image',
        true
    )
ON CONFLICT (slug) DO NOTHING;
