-- =========================================================================
-- AFIC PROFILE - Adicionar campos públicos ao perfil
-- =========================================================================

-- Adicionar novas colunas na tabela profiles (se não existirem)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_public TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Atualizar dados existentes com示例
-- UPDATE public.profiles SET about = 'Investidor institucional' WHERE id = 'seu-user-id';

-- Permite que qualquer usuário logado possa atualizar próprios dados
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Permite leitura pública de perfis
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);