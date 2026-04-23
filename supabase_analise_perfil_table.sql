-- Tabela de Respostas da Análise de Perfil
CREATE TABLE IF NOT EXISTS public.afic_analise_perfil_responses (
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
    renda_atual TEXT,
    renda_sonho TEXT,
    tier_sugerido TEXT,
    status TEXT DEFAULT 'novo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segurança
ALTER TABLE public.afic_analise_perfil_responses ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Allow insert analise_perfil" ON public.afic_analise_perfil_responses;
CREATE POLICY "Allow insert analise_perfil" ON public.afic_analise_perfil_responses 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read analise_perfil" ON public.afic_analise_perfil_responses;
CREATE POLICY "Allow read analise_perfil" ON public.afic_analise_perfil_responses 
FOR SELECT USING (true);

SELECT 'Tabela de Análise de Perfil configurada!' as mensagem;
