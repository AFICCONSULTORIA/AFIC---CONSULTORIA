import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TierContext = createContext();

export const useTier = () => useContext(TierContext);

export const TierProvider = ({ children }) => {
  const [currentTier, setCurrentTier] = useState('despertar');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Tier hierarchy for comparison
  const TIER_LEVELS = {
    'despertar': 1,
    'assinante': 2,
    'private_elite': 3
  };

  // Check if user has access to a specific tier level
  const hasAccess = (requiredTier) => {
    if (isAdmin) return true; // Admin tem acesso total
    
    // Usuário com assinatura ativa tem acesso total a todas ferramentas
    if (subscription?.status === 'active') {
      return true;
    }
    
    const userLevel = TIER_LEVELS[currentTier] || 0;
    const requiredLevel = TIER_LEVELS[requiredTier] || 0;
    return userLevel >= requiredLevel;
  };

  // Get user's tier and subscription
  const loadUserTier = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentTier('despertar');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      const adminRole = profile?.role === 'admin' || user.email === 'aficconsultoria@gmail.com';
      setIsAdmin(adminRole);

      // Get user's subscription
      const { data: sub } = await supabase
        .from('afic_subscriptions_tier')
        .select('*, afic_tiers(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (sub) {
        setSubscription(sub);
        setCurrentTier(sub.tier_id);
      } else if (adminRole) {
        // Admin tem acesso total por padrão
        setCurrentTier('private_elite');
      } else {
        // Default to despertar if no subscription
        setCurrentTier('despertar');
      }
    } catch (err) {
      console.error('Error loading tier:', err);
      setCurrentTier('despertar');
    } finally {
      setLoading(false);
    }
  };

  // Upgrade user to especific tier (for admin use)
  const upgradeUserTier = async (userId, newTier) => {
    try {
      // Tentar upsert primeiro (mais eficiente se houver PK/Unique)
      const { error: upsertError } = await supabase
        .from('afic_subscriptions_tier')
        .upsert({
          user_id: userId,
          tier_id: newTier,
          status: 'active',
          started_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      // Se falhar por erro de onConflict/relationship, tentar manual
      if (upsertError) {
        console.warn('Upsert failed, trying manual update/insert:', upsertError.message);
        
        const { data: existing } = await supabase
          .from('afic_subscriptions_tier')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          const { error: updateError } = await supabase
            .from('afic_subscriptions_tier')
            .update({
              tier_id: newTier,
              status: 'active'
            })
            .eq('user_id', userId);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('afic_subscriptions_tier')
            .insert({
              user_id: userId,
              tier_id: newTier,
              status: 'active',
              started_at: new Date().toISOString()
            });
          if (insertError) throw insertError;
        }
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error upgrading tier:', err);
      return { success: false, error: err.message || 'Erro desconhecido' };
    }
  };

  // Mark module as completed and trigger webhook event
  const markModuleCompleted = async (moduleId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update progress
      await supabase
        .from('afic_module_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,module_id' });

      // Trigger webhook event
      await supabase
        .from('afic_events')
        .insert({
          user_id: user.id,
          event_type: 'modulo_concluido',
          event_data: { module_id: moduleId }
        });

    } catch (err) {
      console.error('Error marking module completed:', err);
    }
  };

  useEffect(() => {
    loadUserTier();
  }, []);

  const value = {
    currentTier,
    subscription,
    loading,
    isAdmin,
    hasAccess,
    refreshTier: loadUserTier,
    upgradeUserTier,
    markModuleCompleted,
    tiers: {
      despertar: { name: 'Despertar', price: 'R$ 497', priceMonthly: 'Grátis' },
      assinante: { name: 'Assinante', price: 'R$ 49/mês', priceMonthly: 'R$ 49/mês' },
      private_elite: { name: 'Private Elite', price: 'High-Ticket', priceMonthly: 'Sob Consulta' }
    }
  };

  return (
    <TierContext.Provider value={value}>
      {children}
    </TierContext.Provider>
  );
};

// Blocked Content Component - Paywall Elegante
export const TierLockedContent = ({ requiredTier, title, description, children }) => {
  const { hasAccess, tiers } = useTier();
  const [showPaywall, setShowPaywall] = useState(false);

  // Redirect to plans page
  const handleUpgrade = () => {
    // Find the plans button and click it, or navigate directly
    const plansButton = document.querySelector('[data-page="plans"]') || 
                        document.querySelector('button:contains("Planos")');
    if (plansButton) {
      plansButton.click();
    } else {
      // Fallback: redirect to hash
      window.location.hash = 'plans';
      window.location.reload();
    }
  };

  if (hasAccess(requiredTier)) {
    return children;
  }

  if (showPaywall) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-[#001240] border-2 border-[#D4AF37] rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m7-5a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Conteúdo Bloqueado</h2>
          <p className="text-white/70 mb-6">
            {description || 'Este conteúdo é exclusivo para assinantes ativos. Eleve o nível da sua arquitetura de riqueza.'}
          </p>
          <button 
            onClick={handleUpgrade}
            className="w-full bg-[#D4AF37] hover:bg-[#c9a227] text-[#001240] font-bold py-3 px-6 rounded-lg transition-all"
          >
            Desbloquear Acesso
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-gradient-to-t from-[#001240] via-[#001240]/90 to-transparent pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center">
        <button 
          onClick={() => setShowPaywall(true)}
          className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37] text-[#D4AF37] font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m7-5a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
         locked
        </button>
      </div>
    </div>
  );
};

export default TierProvider;