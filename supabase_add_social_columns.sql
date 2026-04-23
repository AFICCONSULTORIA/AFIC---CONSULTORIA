-- =========================================================================
-- AFIC - ADICIONAR COLUNAS DE REDES SOCIAIS AO PERFIL
-- =========================================================================

-- Adiciona colunas para Instagram e LinkedIn se elas não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' 
                   AND column_name='instagram') THEN
        ALTER TABLE public.profiles ADD COLUMN instagram TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' 
                   AND column_name='linkedin') THEN
        ALTER TABLE public.profiles ADD COLUMN linkedin TEXT;
    END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.instagram IS 'Handle do Instagram do usuário';
COMMENT ON COLUMN public.profiles.linkedin IS 'URL ou handle do LinkedIn do usuário';
