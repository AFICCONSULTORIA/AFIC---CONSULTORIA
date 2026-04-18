import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FinancialContext = createContext();

export const useFinancial = () => useContext(FinancialContext);

export const FinancialProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);

  // Budget limits from user settings
  const [budgetLimits, setBudgetLimits] = useState({
    fixed: 50,
    variable: 30,
    save: 20
  });
  
  // Data states
  const [transactions, setTransactions] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [emergencyFund, setEmergencyFund] = useState(null);
  
  // ─── INITIALIZATION ───
  useEffect(() => {
    async function initData() {
      try {
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        
        let uId = '00000000-0000-0000-0000-000000000000'; // fallback
        if (session?.user) {
          uId = session.user.id;
        }
        setUserId(uId);

        // Fetch budget settings
        const settingsRes = await supabase.from('budget_settings').select('*').eq('user_id', uId).limit(1);
        if (!settingsRes.error && settingsRes.data && settingsRes.data.length > 0) {
          const s = settingsRes.data[0];
          setBudgetLimits({
            fixed: s.fixed_limit_pct || 50,
            variable: s.var_limit_pct || 30,
            save: s.save_limit_pct || 20
          });
        }

        // Fetch parallelly using Promise.all - Use limit(1) instead of maybeSingle
        const [txRes, ccRes, emRes] = await Promise.all([
          supabase.from('budget_transactions').select('*').eq('user_id', uId).order('created_at', { ascending: false }),
          supabase.from('credit_cards').select('*').eq('user_id', uId).order('created_at', { ascending: false }),
          supabase.from('afic_emergency_fund').select('*').eq('user_id', uId).limit(1)
        ]);

        if (!txRes.error) setTransactions(txRes.data || []);
        if (!ccRes.error) setCreditCards(ccRes.data || []);
        
        // Handle emergency fund specifically
        if (!emRes.error && emRes.data && emRes.data.length > 0) {
          setEmergencyFund(emRes.data[0]);
        } else {
          setEmergencyFund({
             fixed_cost: 0,
             coverage_months: 6,
             current_reserve: 0,
             expected_deposit: 0
          });
        }
      } catch (err) {
        console.error("Critical Financial Load Failure:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    
    initData();
  }, []);

  // ─── ACTIONS ───
  const addTransaction = async (description, amount, category, method, monthKey) => {
    if (!supabase || !userId) return;
    const key = monthKey || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const payload = {
       user_id: userId,
       month_key: key,
       description,
       amount,
       category,
       payment_method: method
    };
    const { data: resultData, error } = await supabase.from('afic_financial_transactions').insert([payload]).select().limit(1);
    const data = resultData?.[0];
    if(!error && data) {
       setTransactions(prev => [data, ...prev]);
    }
  };

  const deleteTransaction = async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('afic_financial_transactions').delete().eq('id', id);
    if(!error) {
       setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const addCreditCard = async (bank, limit, currentBill, installments, startMonth) => {
    if (!supabase || !userId) return;
    const payload = {
       user_id: userId,
       bank_name: bank,
       credit_limit: limit,
       current_bill: currentBill,
       installments,
       start_month: startMonth
    };
    const { data: resultData, error } = await supabase.from('afic_credit_cards').insert([payload]).select().limit(1);
    const data = resultData?.[0];
    if(!error && data) {
       setCreditCards(prev => [data, ...prev]);
    }
  };

  const addCreditCardBuy = async (description, totalAmount, installments, startMonth) => {
    if (!supabase || !userId) return;
    const payload = {
       user_id: userId,
       description,
       total_amount: totalAmount,
       installments,
       start_month: startMonth
    };
    const { data: resultData, error } = await supabase.from('afic_credit_cards').insert([payload]).select().limit(1);
    const data = resultData?.[0];
    if(!error && data) {
       setCreditCards(prev => [data, ...prev]);
    }
  };

  const deleteCreditCardBuy = async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('afic_credit_cards').delete().eq('id', id);
    if(!error) {
       setCreditCards(prev => prev.filter(cc => cc.id !== id));
    }
  };

  const updateEmergencyFund = async (fixedCost, coverageMonths, currentReserve, expectedDeposit) => {
    if (!supabase || !userId) return;
    const fundData = {
      fixed_cost: parseFloat(fixedCost) || 0,
      coverage_months: parseInt(coverageMonths) || 6,
      current_reserve: parseFloat(currentReserve) || 0,
      expected_deposit: parseFloat(expectedDeposit) || 0
    };
    const { error } = await supabase
      .from('afic_emergency_fund')
      .upsert({ ...fundData, user_id: userId }, { onConflict: 'user_id' });
    
    if(!error) setEmergencyFund(fundData);
  };

  // Calcula resumo do orçamento
  const getBudgetSummary = () => {
    let incomes = 0;
    let fixed = 0;
    let varC = 0;
    
    transactions.forEach(tx => {
      if (tx.category === 'income') incomes += tx.amount;
      else if (tx.category === 'fixed') fixed += tx.amount;
      else if (tx.category === 'variable') varC += tx.amount;
    });
    
    const net = incomes - (fixed + varC);
    return { incomes, fixed, varC, net };
  };

  // Update budget limits (called when user saves new settings)
  const updateBudgetLimits = async (fixed, variable, save) => {
    if (!supabase || !userId) return;
    
    const { error } = await supabase.from('budget_settings').upsert({
      user_id: userId,
      fixed_limit_pct: fixed,
      var_limit_pct: variable,
      save_limit_pct: save
    }, { onConflict: 'user_id' });
    
    if (!error) {
      setBudgetLimits({ fixed, variable, save });
    }
  };

  // Listen for budget settings changes (realtime + custom event from vanilla JS)
  useEffect(() => {
    // Listener for Supabase realtime
    if (supabase && userId && userId !== '00000000-0000-0000-0000-000000000000') {
      const channel = supabase
        .channel('budget_settings_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'budget_settings',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          if (payload.new) {
            setBudgetLimits({
              fixed: payload.new.fixed_limit_pct || 50,
              variable: payload.new.var_limit_pct || 30,
              save: payload.new.save_limit_pct || 20
            });
          }
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, supabase]);

  // Listen for custom event from vanilla JS (instant update without page reload)
  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      const { fixed, variable, save } = e.detail;
      setBudgetLimits({ fixed, variable, save });
    };
    
    window.addEventListener('budget-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('budget-settings-updated', handleSettingsUpdate);
  }, []);

  return (
    <FinancialContext.Provider value={{
      isLoaded,
      transactions,
      creditCards,
      emergencyFund,
      budgetLimits,
      addTransaction,
      deleteTransaction,
      addCreditCard,
      addCreditCardBuy,
      deleteCreditCardBuy,
      updateEmergencyFund,
      saveEmergencyFund: updateEmergencyFund,
      getBudgetSummary,
      updateBudgetLimits
    }}>
      {children}
    </FinancialContext.Provider>
  );
};
