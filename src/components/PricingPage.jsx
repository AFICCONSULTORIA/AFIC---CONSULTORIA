import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const fmtBR = (num) => {
  if (!num && num !== 0) return 'R$ 0,00';
  return 'R$ ' + Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};

export const PricingPage = ({ currentPlan, onSelectPlan }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingType, setBillingType] = useState('monthly');

  useEffect(() => {
    loadPlans();
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
    return billingType === 'monthly' ? plan.monthly_price : plan.lifetime_price;
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
            <button
              onClick={() => setBillingType('lifetime')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                billingType === 'lifetime' 
                  ? 'bg-amber-400 text-[#0a2540]' 
                  : 'bg-transparent text-gray-400 border border-gray-600 hover:border-white'
              }`}
            >
              Vitalício {billingType === 'lifetime' && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">Economia</span>}
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
                  onClick={() => onSelectPlan(plan.id, billingType)}
                  disabled={isCurrent}
                  className={`w-full py-4 rounded-xl font-bold transition-all ${
                    isCurrent
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : plan.id === 'pro'
                        ? 'bg-amber-400 hover:bg-amber-300 text-[#0a2540]'
                        : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                  }`}
                >
                  {isCurrent ? 'Plano Atual' : price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
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