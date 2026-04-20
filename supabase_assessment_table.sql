-- Tabela de Respostas do Assessment
CREATE TABLE IF NOT EXISTS public.afic_assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT,
    dinheiro1 TEXT,
    emergencia TEXT,
    trava TEXT,
    cartao TEXT,
    paciencia TEXT,
    sucesso TEXT,
    corte TEXT,
    tempo TEXT,
    tier_sugerido TEXT,
    status TEXT DEFAULT 'novo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir que a tabela existe
ALTER TABLE public.afic_assessment_responses ENABLE ROW LEVEL SECURITY;

-- Criar política permissive para insert (sem necessidade de login)
DROP POLICY IF EXISTS "Allow insert assessment" ON public.afic_assessment_responses;
CREATE POLICY "Allow insert assessment" ON public.afic_assessment_responses 
FOR INSERT WITH CHECK (true);

-- Permitir SELECT para todos
DROP POLICY IF EXISTS "Allow read assessment" ON public.afic_assessment_responses;
CREATE POLICY "Allow read assessment" ON public.afic_assessment_responses 
FOR SELECT USING (true);

SELECT 'Tabela configurada com políticas!' as mensagem;