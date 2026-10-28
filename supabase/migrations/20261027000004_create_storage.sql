-- Migration: 20261027000004_create_storage.sql
-- Description: Criação do bucket 'prompt-media' e políticas de RLS para upload/download de mídias.

-- 1. Criação do bucket público para leitura de mídias de prompts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'prompt-media',
    'prompt-media',
    true,
    52428800, -- Limite de 50MB
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Políticas de segurança RLS para storage.objects no bucket prompt-media

-- Leitura pública de mídias
CREATE POLICY "Public Read Access for prompt-media"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'prompt-media');

-- Upload / Inserção restrito a administradores
CREATE POLICY "Admin Upload Access for prompt-media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'prompt-media'
        AND public.is_admin()
    );

-- Atualização / Substituição restrito a administradores
CREATE POLICY "Admin Update Access for prompt-media"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'prompt-media'
        AND public.is_admin()
    )
    WITH CHECK (
        bucket_id = 'prompt-media'
        AND public.is_admin()
    );

-- Exclusão de arquivos restrito a administradores
CREATE POLICY "Admin Delete Access for prompt-media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'prompt-media'
        AND public.is_admin()
    );

