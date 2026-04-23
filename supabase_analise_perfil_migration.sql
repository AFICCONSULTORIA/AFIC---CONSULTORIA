-- Renomear Tabela de Respostas do Assessment para Análise de Perfil
ALTER TABLE public.afic_assessment_responses RENAME TO afic_analise_perfil_responses;

-- Atualizar Políticas de RLS
ALTER TABLE public.afic_analise_perfil_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert assessment" ON public.afic_analise_perfil_responses;
CREATE POLICY "Allow insert analise_perfil" ON public.afic_analise_perfil_responses 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read assessment" ON public.afic_analise_perfil_responses;
CREATE POLICY "Allow read analise_perfil" ON public.afic_analise_perfil_responses 
FOR SELECT USING (true);

SELECT 'Tabela renomeada e políticas atualizadas!' as mensagem;
