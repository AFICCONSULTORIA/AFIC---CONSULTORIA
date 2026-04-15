-- =========================================================================
-- AFIC BUDGET SETTINGS - Percentuais personalizados do orçamento
-- =========================================================================

-- Tabela de configurações do orçamento por usuário
CREATE TABLE IF NOT EXISTS public.budget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    fixed_limit_pct INTEGER DEFAULT 50,     -- Percentual para gastos fixos
    var_limit_pct INTEGER DEFAULT 30,     -- Percentual para gastos variáveis
    save_limit_pct INTEGER DEFAULT 20, -- Percentual para poupança
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Desativar RLS
ALTER TABLE public.budget_settings DISABLE ROW LEVEL SECURITY;