import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const fmtBR = (num) => {
  if (!num && num !== 0) return 'R$ 0,00';
  const val = parseFloat(num);
  if (isNaN(val)) return 'R$ 0,00';
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};

// Stripe configuration
const STRIPE_PUBLIC_KEY = 'pk_test_51TJ2vhCBYPTHESLfqo7K3PBveOrIIJoWM0teVOdvbCJSgbQP6Ywxu98VIKNCexj0a4mMNOe9fKn3bkZRIaVpKp9500bP3nQGMc';

// Stripe configuration - Payment Links from Stripe Dashboard
const STRIPE_PAYMENT_LINKS = {
  basic: 'https://buy.stripe.com/test_9B6cN40Xy6cy9AOdbWabK01',    // Básico
  pro: 'https://buy.stripe.com/test_dRmaEW8q0asObIW0paabK02',       // Profissional
  elite: 'https://buy.stripe.com/test_eVq00ifSsfN814i7RCabK03',     // Elite
};

// URL de sucesso/cancelamento
const STRIPE_SUCCESS_URL = window.location.origin + '/?payment=success';
const STRIPE_CANCEL_URL = window.location.origin + '/?payment=cancelled';

export const PricingPage = ({ currentPlan, onSelectPlan = () => {} }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingType, setBillingType] = useState('monthly');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPlans();
    // Load Stripe
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      document.head.appendChild(script);
    }
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('afic_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });
      
      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = (plan) => {
    if (!plan.features) return [];
    if (typeof plan.features === 'string') {
      try {
        return JSON.parse(plan.features);
      } catch {
        return [];
      }
    }
    return plan.features;
  };

  const getPrice = (plan) => {
    return billingType === 'monthly' 
      ? (parseFloat(plan.monthly_price) || 0) 
      : (parseFloat(plan.lifetime_price) || 0);
  };

  // Handle subscription with Stripe - Using Payment Links
  const handleSubscribe = async (plan) => {
    setProcessing(true);
    
    try {
      const price = getPrice(plan);
      if (price === 0) {
        alert('Plano gratuito selecionado! Em breve você terá acesso.');
        setProcessing(false);
        return;
      }

      // Get the payment link for this plan
      const paymentLink = STRIPE_PAYMENT_LINKS[plan.id];
      if (!paymentLink) {
        alert('Plano não encontrado. Entre em contato com o suporte.');
        setProcessing(false);
        return;
      }

      console.log('Redirecting to:', paymentLink);
      
      // Redirect to Stripe Payment Link
      window.location.href = paymentLink;
      
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a2540] flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2540] via-[#051845] to-[#001020] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Escolha seu <span className="text-amber-400">Plano</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Invista no seu futuro financeiro com as ferramentas certas
          </p>
          
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingType('monthly')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                billingType === 'monthly' 
                  ? 'bg-amber-400 text-[#0a2540]' 
                  : 'bg-transparent text-gray-400 border border-gray-600 hover:border-white'
              }`}
            >
              Mensal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const price = getPrice(plan);
            
            return (
              <div 
                key={plan.id}
                className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border ${
                  plan.id === 'pro' ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-white/20'
                }`}
              >
                {plan.id === 'pro' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-[#0a2540] px-4 py-1 rounded-full text-sm font-bold">
                    Mais Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-white">{fmtBR(price).replace('R$ ', '')}</span>
                    {billingType === 'monthly' && price > 0 && <span className="text-gray-400">/mês</span>}
                  </div>
                  {billingType === 'lifetime' && price > 0 && (
                    <p className="text-green-400 text-sm mt-1">Pagamento único</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {getPlanFeatures(plan).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || processing}
                  className={`w-full py-4 rounded-xl font-bold transition-all ${
                    isCurrent
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : plan.id === 'pro'
                        ? 'bg-amber-400 hover:bg-amber-300 text-[#0a2540]'
                        : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                  }`}
                >
                  {processing ? 'Processando...' : isCurrent ? 'Plano Atual' : price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;