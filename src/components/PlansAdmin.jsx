import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const fmtBR = (num) => {
  if (!num && num !== 0) return 'R$ 0,00';
  return 'R$ ' + Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};

const parseBR = (str) => {
  if (!str) return 0;
  const clean = String(str).replace('R$', '').replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

export const PlansAdmin = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('afic_plans')
        .select('*')
        .order('monthly_price', { ascending: true });
      
      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
      setMessage({ type: 'error', text: 'Erro ao carregar planos' });
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (planId, field, value) => {
    setPlans(plans.map(p => 
      p.id === planId ? { ...p, [field]: value } : p
    ));
  };

  const savePlan = async (plan) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase
        .from('afic_plans')
        .update({
          name: plan.name,
          description: plan.description,
          monthly_price: parseBR(plan.monthly_price),
          lifetime_price: parseBR(plan.lifetime_price),
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id);

      if (error) throw error;
      setMessage({ type: 'success', text: `Plano ${plan.name} atualizado com sucesso!` });
    } catch (err) {
      console.error('Error saving plan:', err);
      setMessage({ type: 'error', text: 'Erro ao salvar plano' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan) => {
    try {
      const { error } = await supabase
        .from('afic_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;
      setPlans(plans.map(p => 
        p.id === plan.id ? { ...p, is_active: !p.is_active } : p
      ));
      setMessage({ type: 'success', text: `Plano ${plan.is_active ? 'desativado' : 'ativado'} com sucesso!` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao alterar status do plano' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-xl animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Administrar Planos</h1>
            <p className="text-gray-500">Gerencie preços e configurações dos planos</p>
          </div>
          <a href="/" className="text-[#0a2540] hover:underline font-medium">
            ← Voltar ao App
          </a>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-xl shadow-sm border p-6 ${!plan.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <button
                  onClick={() => toggleActive(plan)}
                  className={`text-sm font-medium ${plan.is_active ? 'text-red-600' : 'text-green-600'}`}
                >
                  {plan.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Preço Mensal (R$)
                  </label>
                  <input
                    type="text"
                    value={fmtBR(plan.monthly_price).replace('R$ ', '')}
                    onChange={(e) => updatePlan(plan.id, 'monthly_price', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Preço Vitalício (R$)
                  </label>
                  <input
                    type="text"
                    value={plan.lifetime_price > 0 ? fmtBR(plan.lifetime_price).replace('R$ ', '') : '0'}
                    onChange={(e) => updatePlan(plan.id, 'lifetime_price', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => savePlan(plan)}
                disabled={saving}
                className="bg-[#0a2540] text-amber-400 px-6 py-2 rounded-lg font-bold hover:bg-blue-900 transition-all disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">Configurações Avançadas</h3>
          <p className="text-sm text-blue-700">
            Para editar as features dos planos, é necessário editar diretamente no banco de dados (Supabase).
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlansAdmin;