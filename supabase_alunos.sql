-- Tabela de Gestão de Alunos
CREATE TABLE IF NOT EXISTS public.afic_alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    whatsapp TEXT,
    plano TEXT DEFAULT 'nenhum',
    status_pagamento TEXT DEFAULT 'pendente',
    valor_pago DECIMAL(10,2) DEFAULT 0,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_renovacao TIMESTAMP WITH TIME ZONE,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    notas TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.afic_alunos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Allow read alunos" ON public.afic_alunos;
CREATE POLICY "Allow read alunos" ON public.afic_alunos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert alunos" ON public.afic_alunos;
CREATE POLICY "Allow insert alunos" ON public.afic_alunos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update alunos" ON public.afic_alunos;
CREATE POLICY "Allow update alunos" ON public.afic_alunos FOR UPDATE USING (true);

-- ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.afic_alunos(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_alunos_plano ON public.afic_alunos(plano);
CREATE INDEX IF NOT EXISTS idx_alunos_email ON public.afic_alunos(email);

SELECT 'Tabela afic_alunos criada com sucesso!' as mensagem;