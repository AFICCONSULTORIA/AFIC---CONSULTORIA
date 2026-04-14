import React, { createContext, useContext, useState, useEffect } from 'react';

const FinancialContext = createContext();

export const useFinancial = () => useContext(FinancialContext);

export const FinancialProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [emergencyFund, setEmergencyFund] = useState(null);
  
  // Create a singleton instance of supabase for Financial Hub
  const getSupabase = () => {
    if (!window.supabase) return null;
    return window.supabase.createClient(
      'https://sueyfodlqcviojivlxgv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZXlmb2RscWN2aW9qaXZseGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzU4NTMsImV4cCI6MjA5MTI1MTg1M30.g40c4ko9uFKOdN2x4tvQQg-IuWx2ZB4K8_fsZpgeIDw'
    );
  };

  // ─── INITIALIZATION ───
  useEffect(() => {
    async function initData() {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      
      let uId = '00000000-0000-0000-0000-000000000000'; // fallback
      if (session?.user) {
        uId = session.user.id;
      }
      setUserId(uId);

      // Fetch parallelly using Promise.all
      const [txRes, ccRes, emRes] = await Promise.all([
        supabase.from('afic_financial_transactions').select('*').eq('user_id', uId).order('created_at', { ascending: false }),
        supabase.from('afic_credit_cards').select('*').eq('user_id', uId).order('created_at', { ascending: false }),
        supabase.from('afic_emergency_fund').select('*').eq('user_id', uId).single()
      ]);

      if (!txRes.error) setTransactions(txRes.data || []);
      if (!ccRes.error) setCreditCards(ccRes.data || []);
      
      // se nao existir reserva configurada, inicia padrao
      if (!emRes.error && emRes.data) {
        setEmergencyFund(emRes.data);
      } else {
        setEmergencyFund({
           fixed_cost: 0,
           coverage_months: 6,
           current_reserve: 0,
           expected_deposit: 0
        });
      }

      setIsLoaded(true);
    }
    
    initData();
  }, []);

  // ─── ACTIONS ───
  const addTransaction = async (description, amount, category, method) => {
    const supabase = getSupabase();
    const payload = {
       user_id: userId,
       description,
       amount,
       category,
       payment_method: method
    };
    const { data, error } = await supabase.from('afic_financial_transactions').insert([payload]).select().single();
    if(!error && data) {
       setTransactions(prev => [data, ...prev]);
    }
  };

  const deleteTransaction = async (id) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('afic_financial_transactions').delete().eq('id', id);
    if(!error) {
       setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const addCreditCardBuy = async (description, totalAmount, installments, startMonth) => {
    const supabase = getSupabase();
    const payload = {
       user_id: userId,
       description,
       total_amount: totalAmount,
       installments,
       start_month: startMonth
    };
    const { data, error } = await supabase.from('afic_credit_cards').insert([payload]).select().single();
    if(!error && data) {
       setCreditCards(prev => [data, ...prev]);
    }
  };

  const deleteCreditCardBuy = async (id) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('afic_credit_cards').delete().eq('id', id);
    if(!error) {
       setCreditCards(prev => prev.filter(cc => cc.id !== id));
    }
  };

  const saveEmergencyFund = async (fixedCost, coverage, current, deposit) => {
     const supabase = getSupabase();
     const payload = {
        user_id: userId,
        fixed_cost: fixedCost,
        coverage_months: coverage,
        current_reserve: current,
        expected_deposit: deposit
     };
     // UPSERT needs all keys logic, we will do pure update/insert or use upsert
     const { error } = await supabase.from('afic_emergency_fund').upsert(payload);
     if(!error) {
        setEmergencyFund(payload);
        alert("Configuração de Reserva Salva na AFIC!");
     }
  };

  // ─── AGGREGATORS (Helpers on the fly) ───
  const getBudgetSummary = () => {
    const incomes = transactions.filter(t => t.category === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const fixed = transactions.filter(t => t.category === 'fixed').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const varC = transactions.filter(t => t.category === 'variable').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const net = incomes - fixed - varC;
    return { incomes, fixed, varC, net };
  };

  return (
    <FinancialContext.Provider value={{
      isLoaded,
      transactions,
      creditCards,
      emergencyFund,
      addTransaction,
      deleteTransaction,
      addCreditCardBuy,
      deleteCreditCardBuy,
      saveEmergencyFund,
      getBudgetSummary
    }}>
      {children}
    </FinancialContext.Provider>
  );
};
