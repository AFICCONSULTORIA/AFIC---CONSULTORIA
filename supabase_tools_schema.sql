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

-- =========================================================================
-- SISTEMA DE PLANOS (Subscription)
-- =========================================================================

-- Tabela de Planos ( valores editáveis pelo admin )
CREATE TABLE IF NOT EXISTS public.afic_plans (
    id TEXT PRIMARY KEY, -- 'basic', 'pro', 'elite'
    name TEXT NOT NULL,
    description TEXT,
    monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    lifetime_price NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Assinaturas de usuários
CREATE TABLE IF NOT EXISTS public.afic_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.afic_plans(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active', -- active, canceled, past_due
    billing_type TEXT NOT NULL, -- 'monthly' ou 'lifetime'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- null para lifetime
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de preços editáveis (para admin alterar valores)
CREATE TABLE IF NOT EXISTS public.afic_plan_prices (
    id TEXT PRIMARY KEY,
    monthly_amount NUMERIC(10, 2) NOT NULL,
    lifetime_amount NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir preços iniciais
INSERT INTO public.afic_plan_prices (id, monthly_amount, lifetime_amount) VALUES
    ('basic', 29.90, 0),
    ('pro', 97.00, 997.00),
    ('elite', 147.00, 2997.00)
ON CONFLICT (id) DO NOTHING;

-- Inserir planos com features
INSERT INTO public.afic_plans (id, name, description, monthly_price, lifetime_price, features) VALUES
    ('basic', 'Básico', 'Acesso às ferramentas financeiras e comunidade', 29.90, 0, 
     '["Ferramentas financeiras", "Comunidade", "Dashboard básico"]'::jsonb),
    ('pro', 'Profissional', 'Plano completo com Academy e suporte', 97.00, 997.00, 
     '["Tudo do Básico", "Academy completa", "Relatórios avançados", "Suporte prioritário", "Webinars ao vivo"]'::jsonb),
    ('elite', 'Elite', 'Plano máximo com benefícios exclusivos', 147.00, 2997.00, 
     '["Tudo do PRO", "Networking com investidores", "Consultoria 1:1", "Eventos presenciais"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS nas tabelas de planos (admin pode editar, users podem ler)
ALTER TABLE public.afic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_plan_prices ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler planos e preços
CREATE POLICY "Allow read plans" ON public.afic_plans FOR SELECT USING (true);
CREATE POLICY "Allow read prices" ON public.afic_plan_prices FOR SELECT USING (true);
CREATE POLICY "Allow read subscriptions" ON public.afic_subscriptions FOR SELECT USING (true);

-- Policy: Apenas admin pode alterar (baseado em email - configurar depois)
-- Por agora, desabilitar para permitir edição
ALTER TABLE public.afic_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_plan_prices DISABLE ROW LEVEL SECURITY;
