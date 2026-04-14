import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FinancialContext = createContext();

export const useFinancial = () => useContext(FinancialContext);

export const FinancialProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);

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

        // Fetch parallelly using Promise.all - Use limit(1) instead of maybeSingle
        const [txRes, ccRes, emRes] = await Promise.all([
          supabase.from('afic_financial_transactions').select('*').eq('user_id', uId).order('created_at', { ascending: false }),
          supabase.from('afic_credit_cards').select('*').eq('user_id', uId).order('created_at', { ascending: false }),
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
  const addTransaction = async (description, amount, category, method) => {
    if (!supabase || !userId) return;
    const payload = {
       user_id: userId,
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

  const updateEmergencyFund = async (fundData) => {
    if (!supabase || !userId) return;
    const { error } = await supabase
      .from('afic_emergency_fund')
      .upsert({ ...fundData, user_id: userId }, { onConflict: 'user_id' });
    
    if(!error) setEmergencyFund(fundData);
  };

  return (
    <FinancialContext.Provider value={{
      isLoaded,
      transactions,
      creditCards,
      emergencyFund,
      addTransaction,
      deleteTransaction,
      addCreditCard,
      updateEmergencyFund
    }}>
      {children}
    </FinancialContext.Provider>
  );
};
