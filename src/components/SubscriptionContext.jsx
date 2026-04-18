import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data } = await supabase
        .from('afic_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
    }
  };

  const getUserSubscription = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('afic_subscriptions')
        .select('*, afic_plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data);
      return data;
    } catch (err) {
      console.error('Error getting subscription:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkPlanAccess = (planId) => {
    if (!subscription) return planId === 'basic';
    return subscription.plan_id === planId || 
           (subscription.plan_id === 'pro' && (planId === 'basic' || planId === 'pro')) ||
           (subscription.plan_id === 'elite');
  };

  const createCheckoutSession = async (userId, planId, billingType) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error('Plano não encontrado');

    const price = billingType === 'monthly' ? plan.monthly_price : plan.lifetime_price;
    
    // Por enquanto, criar registro de assinatura diretamente
    // (Stripe integration será adicionada depois)
    try {
      const expiresAt = billingType === 'monthly' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('afic_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          billing_type: billingType,
          status: 'active',
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;
      setSubscription(data);
      return data;
    } catch (err) {
      console.error('Error creating subscription:', err);
      throw err;
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    try {
      const { error } = await supabase
        .from('afic_subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscriptionId);

      if (error) throw error;
      setSubscription(null);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      throw err;
    }
  };

  const value = {
    subscription,
    plans,
    loading,
    getUserSubscription,
    checkPlanAccess,
    createCheckoutSession,
    cancelSubscription,
    refreshSubscription: getUserSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;