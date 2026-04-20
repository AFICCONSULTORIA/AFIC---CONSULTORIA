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
    if (!subscription) return planId === 'free';
    return subscription.plan_id === planId;
  };

  // Stripe Checkout
  const createCheckoutSession = async (planId, billingType) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Faça login para assinar um plano');
        return;
      }

      // Chamar Edge Function para criar sessão Stripe
      const response = await fetch('https://sueyfodlqcviojivlxgv.supabase.co/functions/v1/stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_type: billingType
        })
      });

      const { url, error } = await response.json();
      
      if (error) {
        alert('Erro: ' + error);
        return;
      }

      // Redirecionar para Stripe
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Erro ao processar pagamento');
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