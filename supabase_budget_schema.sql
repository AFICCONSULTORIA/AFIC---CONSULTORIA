-- =========================================================================
-- AFIC BUDGET TRANSACTIONS - Tabela para Orçamento 50/30/20
-- =========================================================================

-- Criar tabela de transações do orçamento
CREATE TABLE IF NOT EXISTS public.budget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    month_key TEXT NOT NULL,  -- Formato: 2026-04
    description TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'fixed', 'variable')) NOT NULL,
    method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índice para consultas por usuário e mês
CREATE INDEX IF NOT EXISTS idx_budget_transactions_user_month 
    ON public.budget_transactions (user_id, month_key);

-- Desativar RLS temporariamente (para MVP funcionar)
ALTER TABLE public.budget_transactions DISABLE ROW LEVEL SECURITY;

-- Permissão para todos verem (leitura)
-- CREATE POLICY "Budget transactions são públicas para leitura" ON public.budget_transactions FOR SELECT USING (true);

-- Permissão para usuários editarem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can manage own budget" ON public.budget_transactions;
CREATE POLICY "Users can manage own budget" ON public.budget_transactions
    FOR ALL USING (auth.uid() = user_id);