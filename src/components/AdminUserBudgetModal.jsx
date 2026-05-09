import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AdminUserBudgetModal = ({ userId, userName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [budgetSettings, setBudgetSettings] = useState({ fixed: 50, variable: 30, save: 20 });
  const [transactions, setTransactions] = useState([]);
  const [emergencyFund, setEmergencyFund] = useState(null);
  const [creditCards, setCreditCards] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch budget settings
        const settingsRes = await supabase.from('budget_settings').select('*').eq('user_id', userId).limit(1);
        if (settingsRes.data && settingsRes.data.length > 0) {
          const s = settingsRes.data[0];
          setBudgetSettings({
            fixed: s.fixed_limit_pct || 50,
            variable: s.var_limit_pct || 30,
            save: s.save_limit_pct || 20
          });
        }

        // Fetch parallelly using Promise.all
        const [txRes, ccRes, emRes] = await Promise.all([
          supabase.from('afic_financial_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('afic_credit_cards').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('afic_emergency_fund').select('*').eq('user_id', userId).limit(1)
        ]);

        if (!txRes.error) setTransactions(txRes.data || []);
        if (!ccRes.error) setCreditCards(ccRes.data || []);
        
        if (!emRes.error && emRes.data && emRes.data.length > 0) {
          setEmergencyFund(emRes.data[0]);
        }
      } catch (err) {
        console.error("Error loading user budget data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) loadData();
  }, [userId]);

  // Calculations
  let incomes = 0;
  let fixed = 0;
  let variable = 0;
  
  transactions.forEach(tx => {
    if (tx.category === 'income') incomes += Number(tx.amount);
    else if (tx.category === 'fixed') fixed += Number(tx.amount);
    else if (tx.category === 'variable') variable += Number(tx.amount);
  });
  
  const net = incomes - (fixed + variable);
  
  const pctFixed = incomes > 0 ? Math.round((fixed / incomes) * 100) : 0;
  const pctVar = incomes > 0 ? Math.round((variable / incomes) * 100) : 0;
  const pctSave = incomes > 0 ? Math.round((net / incomes) * 100) : 0;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#0a2540] text-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-amber-400">👁️</span> Visão do Cliente: <span className="text-amber-400 font-black">{userName}</span>
            </h2>
            <p className="text-white/70 text-sm">Modo de visualização (Apenas Leitura)</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
              <p>Carregando dados financeiros...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">💰</div>
                  <h4 className="text-gray-500 text-sm font-semibold mb-1">Renda Total</h4>
                  <p className="text-2xl font-black text-emerald-600">{formatCurrency(incomes)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">🧾</div>
                  <h4 className="text-gray-500 text-sm font-semibold mb-1">Custos Fixos</h4>
                  <p className="text-2xl font-black text-red-600">{formatCurrency(fixed)}</p>
                  <p className="text-xs text-gray-400 mt-1">{pctFixed}% (Meta: {budgetSettings.fixed}%)</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">🛍️</div>
                  <h4 className="text-gray-500 text-sm font-semibold mb-1">Custos Variáveis</h4>
                  <p className="text-2xl font-black text-amber-600">{formatCurrency(variable)}</p>
                  <p className="text-xs text-gray-400 mt-1">{pctVar}% (Meta: {budgetSettings.variable}%)</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">🏦</div>
                  <h4 className="text-gray-500 text-sm font-semibold mb-1">Potencial de Poupança</h4>
                  <p className="text-2xl font-black text-blue-600">{formatCurrency(net)}</p>
                  <p className="text-xs text-gray-400 mt-1">{pctSave}% (Meta: {budgetSettings.save}%)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transações */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Últimas Transações</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">{transactions.length} registros</span>
                  </div>
                  <div className="p-0 max-h-[300px] overflow-y-auto">
                    {transactions.length > 0 ? (
                      <table className="w-full text-left text-sm">
                        <tbody>
                          {transactions.slice(0, 15).map(tx => (
                            <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-medium text-gray-800">{tx.description}</div>
                                <div className="text-xs text-gray-400 capitalize">{tx.payment_method}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 text-[10px] rounded-full font-bold ${
                                  tx.category === 'income' ? 'bg-emerald-100 text-emerald-700' :
                                  tx.category === 'fixed' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {tx.category === 'income' ? 'Renda' : tx.category === 'fixed' ? 'Fixo' : 'Variável'}
                                </span>
                              </td>
                              <td className={`p-3 text-right font-bold ${tx.category === 'income' ? 'text-emerald-600' : 'text-gray-700'}`}>
                                {tx.category === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center p-6 text-gray-400 text-sm">Nenhuma transação registrada.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Reserva de Emergência */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🛡️</span> Reserva de Emergência
                    </h3>
                    {emergencyFund ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Progresso</span>
                            <span className="font-bold text-emerald-600">
                              {Math.min(100, Math.round((emergencyFund.current_reserve / (emergencyFund.fixed_cost * emergencyFund.coverage_months)) * 100) || 0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{width: `${Math.min(100, (emergencyFund.current_reserve / (emergencyFund.fixed_cost * emergencyFund.coverage_months)) * 100) || 0}%`}}></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-gray-500 text-xs">Atual</p>
                            <p className="font-bold text-gray-800">{formatCurrency(emergencyFund.current_reserve)}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-gray-500 text-xs">Meta ({emergencyFund.coverage_months} meses)</p>
                            <p className="font-bold text-gray-800">{formatCurrency(emergencyFund.fixed_cost * emergencyFund.coverage_months)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm italic">O cliente não preencheu os dados da reserva.</p>
                    )}
                  </div>

                  {/* Cartões de Crédito */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>💳</span> Cartões e Parcelamentos
                    </h3>
                    <div className="max-h-[150px] overflow-y-auto">
                      {creditCards.length > 0 ? (
                        <div className="space-y-3">
                          {creditCards.map(cc => (
                            <div key={cc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <div>
                                <p className="font-bold text-sm text-gray-800">{cc.bank_name || cc.description}</p>
                                <p className="text-xs text-gray-500">{cc.installments}x a partir de {cc.start_month}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-600">{formatCurrency(cc.current_bill || cc.total_amount)}</p>
                                {cc.credit_limit && <p className="text-[10px] text-gray-400">Limite: {formatCurrency(cc.credit_limit)}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm italic">Nenhum cartão registrado.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
