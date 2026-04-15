import React, { useState } from 'react';

const formatReal = (val) => {
  if (!val && val !== 0) return '';
  const v = String(val).replace(/[^\d]/g, '');
  if (!v) return '';
  const num = Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  return 'R$ ' + num;
};

const parseReal = (str) => {
  if (!str) return 0;
  return parseFloat(String(str).replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
};

const formatCurrency = (setter) => (e) => {
  let val = e.target.value;
  val = val.replace('R$', '').trim();
  const raw = val.replace(/[^\d]/g, '');
  if (!raw) { setter(''); return; }
  if (raw.length > 16) return;
  const num = Number(raw) / 100;
  if (isNaN(num)) { setter(''); return; }
  setter('R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
};

export const DebtDestroyerCalc = () => {
  const [debtAmount, setDebtAmount] = useState(formatReal(25000));
  const [interestRate, setInterestRate] = useState('3.5');
  const [monthlyPayment, setMonthlyPayment] = useState(formatReal(1200));

  let monthsToPayoff = 0;
  let totalInterest = 0;
  let isUnpayable = false;

  const D = parseReal(debtAmount);
  const i = (parseFloat(interestRate) || 0) / 100;
  const P = parseReal(monthlyPayment);

  if (D > 0 && i >= 0 && P > 0) {
    if (i === 0) {
      monthsToPayoff = Math.ceil(D / P);
    } else if (P <= D * i) {
      isUnpayable = true;
    } else {
      monthsToPayoff = Math.ceil(-Math.log(1 - (D * i) / P) / Math.log(1 + i));
      totalInterest = (monthsToPayoff * P) - D;
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl w-full text-left">
      <div className="grid grid-cols-1 md:grid-cols-5">
        
        {/* Área Esquerda (Inputs) */}
        <div className="md:col-span-3 p-8 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#0a2540] tracking-tight uppercase">Destruidor de Dívidas</h2>
            <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">Auditoria de Passivos Financeiros</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor Total da Dívida Atual (R$)</label>
              <input 
                type="text" 
                value={debtAmount}
                onChange={formatCurrency(setDebtAmount)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Taxa de Juros Mensal (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pagamento Mensal (R$)</label>
                <input 
                  type="text" 
                  value={monthlyPayment}
                  onChange={formatCurrency(setMonthlyPayment)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Área Direita (Resultados de Alto Impacto) */}
        <div className="md:col-span-2 bg-[#0a2540] p-8 flex flex-col justify-center border-t md:border-t-0 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none" />
          <h3 className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-6">Projeção Estratégica</h3>
          
          <div className="space-y-5">
            <div className={`bg-white/5 backdrop-blur-md p-5 rounded-xl border ${isUnpayable ? 'border-red-500/50' : 'border-white/10'} shadow-xl`}>
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2">Meses até a quitação</p>
              <p className={`text-5xl font-black ${isUnpayable ? 'text-red-500' : 'text-amber-500'}`}>
                {isUnpayable ? '∞' : monthsToPayoff}
              </p>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                {isUnpayable 
                  ? 'A parcela não cobre os juros. A dívida será eterna.' 
                  : `Você ficará preso por ~${(monthsToPayoff / 12).toFixed(1)} anos`}
              </p>
            </div>

            <div className="bg-red-500/10 backdrop-blur-md p-5 rounded-xl border border-red-500/20 shadow-xl">
              <p className="text-xs text-red-200/50 font-bold uppercase tracking-wider mb-2">Total de juros pagos</p>
              <p className="text-3xl font-black text-red-500">
                {isUnpayable ? '---' : `R$ ${Math.max(0, totalInterest).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <p className="text-[10px] text-red-400/60 mt-2 font-bold uppercase tracking-tight">Vazamento de Capital para o Banco</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export const FeeAuditorCalc = () => {
  const [investedAmount, setInvestedAmount] = useState(formatReal(100000));
  const [years, setYears] = useState('20');
  const [grossReturn, setGrossReturn] = useState('10');
  const [adminFee, setAdminFee] = useState('1.5');

  const P = parseReal(investedAmount);
  const n = parseFloat(years) || 0;
  const rGross = parseFloat(grossReturn) || 0;
  const rFee = parseFloat(adminFee) || 0;

  const rNet = Math.max(0, rGross - rFee);

  const FV_gross = P * Math.pow(1 + (rGross / 100), n);
  const FV_net = P * Math.pow(1 + (rNet / 100), n);

  const wealthLost = FV_gross - FV_net;
  const finalNetWealth = FV_net;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl w-full text-left mt-8">
      <div className="grid grid-cols-1 md:grid-cols-5">
        
        {/* Área Esquerda (Inputs) */}
        <div className="md:col-span-3 p-8 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#0a2540] tracking-tight uppercase">Auditoria de Custos</h2>
            <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-[0.2em]">Expondo a Ineficiência de Taxas</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Capital Inicial Investido (R$)</label>
              <input 
                type="text" 
                value={investedAmount}
                onChange={formatCurrency(setInvestedAmount)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Horizonte (Anos)</label>
              <input 
                type="number" 
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rentabilidade Anual (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={grossReturn}
                onChange={(e) => setGrossReturn(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 text-red-600">Taxa de Administração ao Ano (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={adminFee}
                onChange={(e) => setAdminFee(e.target.value)}
                className="w-full px-4 py-3 bg-red-50 border border-red-200 text-red-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Área Direita (Modo Contraste para o Choque) */}
        <div className="md:col-span-2 bg-[#0a2540] text-white p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#cda434]/5 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none" />
          <h3 className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-2">Análise de Impacto</h3>
          
          <div className="space-y-8">
            <div>
              <p className="text-sm text-gray-400 font-semibold mb-1">Perda Total para Taxas</p>
              <p className="text-4xl font-black text-red-400">R$ {wealthLost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-red-300 mt-2">Isto é dinheiro seu deixado na mesa.</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 font-semibold mb-1">Patrimônio Líquido Final (no seu bolso)</p>
              <p className="text-2xl font-bold text-emerald-400">R$ {finalNetWealth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
