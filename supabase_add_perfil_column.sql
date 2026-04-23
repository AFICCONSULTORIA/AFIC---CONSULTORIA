-- =========================================================================
-- AFIC - ADICIONAR PERFIL DE INVESTIDOR ÀS RESPOSTAS
-- =========================================================================

-- Adiciona a coluna perfil_investidor se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='afic_analise_perfil_responses' 
                   AND column_name='perfil_investidor') THEN
        ALTER TABLE public.afic_analise_perfil_responses ADD COLUMN perfil_investidor TEXT;
    END IF;
END $$;

-- Comentário para auditoria
COMMENT ON COLUMN public.afic_analise_perfil_responses.perfil_investidor IS 'Perfil calculado: conservador, equilibrado ou arrojado';
