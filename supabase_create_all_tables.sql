-- =========================================================================
-- AFIC COMPLETE DATABASE SETUP
-- Execute este script no Supabase SQL Editor
-- =========================================================================

-- 1. Tabela de Transações do Orçamento
CREATE TABLE IF NOT EXISTS public.budget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    month_key TEXT NOT NULL,
    description TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'fixed', 'variable')) NOT NULL,
    method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Configurações do Orçamento (percentuais)
CREATE TABLE IF NOT EXISTS public.budget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    fixed_limit_pct INTEGER DEFAULT 50,
    var_limit_pct INTEGER DEFAULT 30,
    save_limit_pct INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Perfis (usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    nickname TEXT,
    email_public TEXT,
    about TEXT,
    linkedin TEXT,
    instagram TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Comentários da Comunidade
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Likes da Comunidade
CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(topic_id, user_id)
);

-- DESATIVAR RLS PARA TESTE (MVP)
ALTER TABLE public.budget_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes DISABLE ROW LEVEL SECURITY;

-- Confirmar criação
SELECT 'Tabelas criadas com sucesso!' as mensagem;