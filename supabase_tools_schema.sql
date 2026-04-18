-- =========================================================================
-- AFIC FINANCIAL HUB - BDD INIT SCRIPT
-- =========================================================================

-- 1. Tabela: Transações e Orçamento (Regra 50/30/20)
CREATE TABLE IF NOT EXISTS public.afic_financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    month_key TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT CHECK (category IN ('income', 'fixed', 'variable')) NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela: Cartões de Crédito / Passivos
CREATE TABLE IF NOT EXISTS public.afic_credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    description TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    installments INTEGER NOT NULL DEFAULT 1,
    start_month TEXT NOT NULL, -- Ex: "2026-04"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela: Reserva de Emergência (Configurações 1:1 por usuário)
CREATE TABLE IF NOT EXISTS public.afic_emergency_fund (
    user_id UUID PRIMARY KEY,
    fixed_cost NUMERIC(10, 2) DEFAULT 0,
    coverage_months INTEGER DEFAULT 6,
    current_reserve NUMERIC(10, 2) DEFAULT 0,
    expected_deposit NUMERIC(10, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Configuração de Permissões Mínimas (MVP Aberto/RLS Desativado por enquanto)
ALTER TABLE public.afic_financial_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_credit_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_emergency_fund DISABLE ROW LEVEL SECURITY;

-- Obs: O RLS e policies restritas serão ligados antes de colocar o app online comercialmente!
