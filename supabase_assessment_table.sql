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

-- Desabilitar RLS temporariamente
ALTER TABLE public.afic_assessment_responses DISABLE ROW LEVEL SECURITY;

-- Dar permissão para inserir (sem autenticação necessária)
GRANT INSERT ON public.afic_assessment_responses TO anon, authenticated;

SELECT 'Tabela afic_assessment_responses criada com sucesso!' as mensagem;