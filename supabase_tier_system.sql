-- =========================================================================
-- AFIC TIER SYSTEM - Nova Arquitetura de Permissões
-- Execute este script no Supabase SQL Editor
-- =========================================================================

-- 1. CRIAR TABELA DE TIERS/ROLES
CREATE TABLE IF NOT EXISTS public.afic_tiers (
    id TEXT PRIMARY KEY,  -- 'despertar', 'assinante', 'private_elite'
    name TEXT NOT NULL,
    description TEXT,
    monthly_price NUMERIC(10, 2) DEFAULT 0,
    lifetime_price NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA DE ASSINATURAS COM TIER
CREATE TABLE IF NOT EXISTS public.afic_subscriptions_tier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tier_id TEXT NOT NULL REFERENCES public.afic_tiers(id),
    status TEXT DEFAULT 'active',  -- 'active', 'canceled', 'expired', 'trial'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,  -- Para trial de 21 dias
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE MÓDULOS COM RESTRIÇÃO DE TIER
CREATE TABLE IF NOT EXISTS public.afic_modules (
    id TEXT PRIMARY KEY,  -- 'modulo_1' até 'modulo_7'
    title TEXT NOT NULL,
    description TEXT,
    tier_required TEXT DEFAULT 'despertar',  -- Tier mínimo para acesso
    order_num INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE FERRAMENTAS COM RESTRIÇÃO DE TIER
CREATE TABLE IF NOT EXISTS public.afic_tools (
    id TEXT PRIMARY KEY,  -- 'score_saude', 'calculadoras', 'rebalanceamento'
    name TEXT NOT NULL,
    description TEXT,
    tier_required TEXT DEFAULT 'despertar',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR TABELA DE PROGRESSO DE MÓDULOS
CREATE TABLE IF NOT EXISTS public.afic_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    module_id TEXT NOT NULL REFERENCES public.afic_modules(id),
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- 6. CRIAR TABELA DE EVENTOS/WEBHOOKS
CREATE TABLE IF NOT EXISTS public.afic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,  -- 'modulo_concluido', 'trial_expirado', 'subscription_upgraded'
    event_data JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. INSERIR TIERS PADRÃO
INSERT INTO public.afic_tiers (id, name, description, monthly_price, lifetime_price) VALUES
    ('despertar', 'Despertar', 'Produto de Entrada - R$ 497', 0, 497),
    ('assinante', 'Assinante', 'Recorrência AFIC Para Sempre - R$ 49/mês', 49, 0),
    ('private_elite', 'Private Elite', 'High-Ticket', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 8. INSERIR MÓDULOS COM TIER REQUIREDO
INSERT INTO public.afic_modules (id, title, description, tier_required, order_num) VALUES
    ('modulo_1', 'Módulo 1 - Fundamentos', 'Bases da riqueza', 'despertar', 1),
    ('modulo_2', 'Módulo 2 - Psicologia', 'Psicologia do investidor', 'despertar', 2),
    ('modulo_3', 'Módulo 3 - Estratégia', 'Estratégias de alocação', 'despertar', 3),
    ('modulo_4', 'Módulo 4 - Avançado', 'Estratégias avançadas', 'assinante', 4),
    ('modulo_5', 'Módulo 5 - Tático', 'Rebalanceamento tático', 'assinante', 5),
    ('modulo_6', 'Módulo 6 - Macro', 'Análise macroeconômica', 'private_elite', 6),
    ('modulo_7', 'Módulo 7 - Elite', 'Case studies exclusivos', 'private_elite', 7)
ON CONFLICT (id) DO NOTHING;

-- 9. INSERIR FERRAMENTAS COM TIER REQUIRIDO
INSERT INTO public.afic_tools (id, name, description, tier_required) VALUES
    ('score_saude', 'Score de Saúde Financeira', 'Avaliação completa do perfil','despertar'),
    ('calculadoras', 'Calculadoras Patrimoniais', 'Institucionais Avançadas', 'assinante'),
    ('rebalanceamento', 'Rebalanceamento Tático', 'Ferramenta de rebalanceamento', 'assinante')
ON CONFLICT (id) DO NOTHING;

-- 10. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_user ON public.afic_subscriptions_tier(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_status ON public.afic_subscriptions_tier(status);
CREATE INDEX IF NOT EXISTS idx_module_progress_user ON public.afic_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON public.afic_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.afic_events(event_type);

-- 11. DESABILITAR RLS PARA TESTE (depois habilitar com políticas corretas)
ALTER TABLE public.afic_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_subscriptions_tier DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_tools DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_module_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.afic_events DISABLE ROW LEVEL SECURITY;

SELECT 'Tier System criado com sucesso!' as mensagem;