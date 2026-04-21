import React, { useState } from 'react';

export const FinanceiroAdmin = () => {
  const [gatewayStatus, setGatewayStatus] = useState('connected'); // 'connected' | 'disconnected'
  const [keys, setKeys] = useState({ public: 'pk_test_********************', secret: 'sk_test_********************' });
  const [taxRate, setTaxRate] = useState('0.0');

  const handleSaveConfig = (e) => {
    e.preventDefault();
    alert('Configurações financeiras sincronizadas com sucesso.');
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 flex flex-col lg:flex-row gap-8 animate-fade-in-up">
      
      {/* Esquerda: Status e Resumo */}
      <div className="lg:w-1/3 flex flex-col gap-6">
        <div className="bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Motor de Gateway</h3>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13.976 9.15c-2.172-.806-3.356-1.143-3.356-2.077 0-.806.741-1.4 1.95-1.4 1.706 0 3.012.753 3.012.753l1.1-2.476s-1.3-1.076-3.812-1.076c-2.88 0-4.996 1.637-4.996 4.316 0 3.12 3.639 3.518 5.617 4.29 2.059.805 2.075 2.195 2.075 2.195 0 1.25-1.12 1.69-2.58 1.69-1.895 0-3.66-1.076-3.66-1.076l-1.08 2.502s1.424 1.288 4.673 1.288c3.272 0 5.485-1.637 5.485-4.478 0-2.61-2.274-3.515-4.508-4.453zm8.024-4.65v15c0 2.485-2.015 4.5-4.5 4.5h-15c-2.485 0-4.5-2.015-4.5-4.5v-15c0-2.485 2.015-4.5 4.5-4.5h15c2.485 0 4.5 2.015 4.5 4.5zm-2 0c0-1.381-1.119-2.5-2.5-2.5h-15c-1.381 0-2.5 1.119-2.5 2.5v15c0 1.381 1.119 2.5 2.5 2.5h15c1.381 0 2.5-1.119 2.5-2.5v-15z"/></svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Stripe Checkout</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${gatewayStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs text-gray-500 font-medium">{gatewayStatus === 'connected' ? 'Conectado e Operacional' : 'Desconectado'}</span>
              </div>
            </div>
          </div>

          <button 
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-sm"
            onClick={() => setGatewayStatus(prev => prev === 'connected' ? 'disconnected' : 'connected')}
          >
            {gatewayStatus === 'connected' ? 'Forçar Desconexão' : 'Reconectar Gateway'}
          </button>
        </div>

        <div className="bg-gradient-to-br from-[#cda434] to-[#a38022] rounded-xl p-6 shadow-lg text-white">
          <h3 className="font-bold flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            Segurança Padrão AFIC
          </h3>
          <p className="text-sm text-yellow-50 mb-4 font-medium opacity-90">
            A infraestrutura financeira nunca deve transacionar chaves de segredo no front-end em produção real. Utilize Webhooks via Supabase Edge Functions.
          </p>
        </div>
      </div>

      {/* Direita: Formulários e Parâmetros */}
      <div className="lg:w-2/3 bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
          Parâmetros do Motor Financeiro
        </h2>

        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Chave Pública (Stripe Public Key)</label>
              <input 
                type="text" 
                value={keys.public}
                onChange={e => setKeys({...keys, public: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#051829] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#cda434] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Chave Secreta (Teste/Dev)</label>
              <input 
                type="password" 
                value={keys.secret}
                onChange={e => setKeys({...keys, secret: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#051829] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#cda434] outline-none font-mono"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Supabase Webhook URL (Checkout Listener)</label>
            <div className="flex bg-gray-50 dark:bg-[#051829] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
              <span className="bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">POST</span>
              <input 
                type="text" 
                readOnly
                value="https://[YOUR_PROJECT].supabase.co/functions/v1/stripe-webhook"
                className="w-full bg-transparent p-3 text-sm text-gray-900 dark:text-gray-300 outline-none font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Esta URL é disparada quando compras são aprovadas para liberar a classe de "Gestão de Alunos".</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Taxa Base Institucional (%)</label>
              <input 
                type="number" step="0.1" 
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#051829] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#cda434] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Moeda Padrão</label>
              <select className="w-full bg-gray-50 dark:bg-[#051829] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#cda434] outline-none">
                <option value="BRL">BRL - Real Brasileiro (R$)</option>
                <option value="USD">USD - Dólar Americano ($)</option>
              </select>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button type="submit" className="bg-[#0a2540] dark:bg-[#cda434] dark:text-[#051829] text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-900 dark:hover:bg-yellow-500 transition-colors shadow-lg shadow-[#0a2540]/20 dark:shadow-[#cda434]/20 border border-[#0a2540] dark:border-[#cda434]">
              Salvar Engine Financeira
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
