-- =========================================================================
-- AFIC ACADEMY - BDD INIT SCRIPT
-- =========================================================================

-- 1. Tabela: Módulos da Academia
CREATE TABLE IF NOT EXISTS public.academy_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    locked_by_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela: Aulas da Academia
CREATE TABLE IF NOT EXISTS public.academy_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration TEXT DEFAULT '00:00',
    video_url TEXT,
    pdf_url TEXT,
    is_live BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela: Progresso e Interações do Aluno
CREATE TABLE IF NOT EXISTS public.academy_user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Opcional: REFERENCES auth.users(id) se quiser amarração estrita.
    lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    rating INTEGER DEFAULT 0,
    smart_note TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, lesson_id) -- Impede que o mesmo usuário tenha dois registros na mesma aula
);

-- 4. Inserindo um Módulo Base Inaugural (Apenas para não ficar vazio)
INSERT INTO public.academy_modules (title, locked_by_default)
VALUES ('Fundamentos AFIC', false);

-- 5. Configuração de Permissões Mínimas (Desativa RLS para simplificação do MVP na Vercel no momento)
ALTER TABLE public.academy_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_user_progress DISABLE ROW LEVEL SECURITY;

-- Obs: O RLS e policies restritas podem ser ligados depois quando tivermos os Tiers na tabela de perfis.
