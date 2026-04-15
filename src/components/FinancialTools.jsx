import React, { useState } from 'react';
import { useFinancial } from './FinancialContext';
import { DebtDestroyerCalc, FeeAuditorCalc } from './Calculators';

// Helper de Moeda Real
const fmtBR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'R$ 0,00';
  if (num === 0) return 'R$ 0,00';
  return 'R$ ' + Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};

const fmtInput = (val) => {
  if (!val) return '';
  const num = String(val).replace(/\D/g, '');
  if (!num) return '';
  return Number(num) / 100;
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

const formatInput = formatCurrency;

const fmtReal = (num) => {
  if (!num && num !== 0) return 'R$ 0,00';
  return 'R$ ' + Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};

const parseReal = (str) => {
  if (!str) return 0;
  const clean = String(str).replace('R$', '').replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

const BudgetTab = () => {
  const { transactions, addTransaction, deleteTransaction, getBudgetSummary, budgetLimits } = useFinancial();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('income');
  const [method, setMethod] = useState('pix');

  const { incomes, fixed, varC, net } = getBudgetSummary();
  const pctFixed = incomes > 0 ? ((fixed / incomes) * 100).toFixed(0) : 0;
  const pctVar = incomes > 0 ? ((varC / incomes) * 100).toFixed(0) : 0;

  const limitFixed = budgetLimits.fixed;
  const limitVar = budgetLimits.variable;

  const handleSubmit = (e) => {
    e.preventDefault();
    if(desc && amount) {
       addTransaction(desc, parseReal(amount), cat, method);
       setDesc('');
       setAmount('');
    }
  };

  const getBadgeCat = (cat) => {
    if(cat === 'income') return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Entrada</span>;
    if(cat === 'fixed') return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Fixo</span>;
    if(cat === 'variable') return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">Variável</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-6">
       <div>
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
           <h3 className="text-lg font-bold text-gray-900 mb-4">Novo Lançamento</h3>
           <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                 <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ex: Salário..." required/>
              </div>
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Valor (R$)</label>
                 <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={amount} onChange={formatCurrency(setAmount)} placeholder="R$ 0,00" required/>
              </div>
              <div className="flex gap-4">
                 <div className="w-1/2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
                    <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={cat} onChange={e=>setCat(e.target.value)}>
                       <option value="income">Receita (Entrada)</option>
                       <option value="fixed">Custo Fixo (Essencial)</option>
                       <option value="variable">Custo Variável (Estilo Dev.)</option>
                    </select>
                 </div>
                 <div className="w-1/2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Método</label>
                    <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={method} onChange={e=>setMethod(e.target.value)}>
                       <option value="pix">PIX / Dinheiro</option>
                       <option value="debit">Débito</option>
                       <option value="credit">Cartão</option>
                    </select>
                 </div>
              </div>
              <button type="submit" className="w-full bg-[#0a2540] hover:bg-blue-900 text-amber-500 font-bold py-3 px-4 rounded-lg transition-all shadow-md transform hover:-translate-y-0.5">Lançar Movimentação</button>
           </form>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Movimentações</h3>
            <div className="max-h-60 overflow-y-auto space-y-3">
               {transactions.length === 0 && <p className="text-sm text-gray-400">Nenhum lançamento no projeto.</p>}
               {transactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 border border-gray-50 bg-gray-50 rounded-md">
                     <div>
                        <p className="font-semibold text-gray-800 text-sm">{t.description}</p>
                        <div className="mt-1 flex gap-2">
                          {getBadgeCat(t.category)}
                          <span className="text-xs text-gray-400 uppercase">{t.payment_method}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className={`font-bold ${t.category === 'income' ? 'text-green-600' : 'text-gray-900'}`}>{fmtBR(t.amount)}</span>
                        <button onClick={() => deleteTransaction(t.id)} className="text-red-400 hover:text-red-600 font-bold" title="Deletar">✖</button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
       </div>

       <div>
          <div className="bg-[#0a2540] border border-[#cda434]/20 rounded-xl p-6 mb-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#cda434]/5 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none" />
             <p className="text-sm text-amber-500/80 font-bold mb-1 uppercase tracking-widest">Resultado Líquido</p>
             <h2 className="text-4xl font-black text-white">{fmtBR(net)}</h2>
             <p className="text-xs text-amber-500/40 mt-2 font-medium">Diferença Custo/Receita (Mês Atual)</p>
          </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Algoritmo {limitFixed}/{limitVar}/{budgetLimits.save}</h3>
            
            <div className="mb-4">
               <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-gray-700">Custos Fixos ({pctFixed}%)</span>
                  <span className="text-gray-400">Teto Ideal: {limitFixed}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div className="absolute" style={{ left: `${limitFixed}%`, width: '2px', height: '16px', backgroundColor: '#6b7280', position: 'absolute', top: '-4px' }}></div>
                  <div className={`h-3 rounded-full ${pctFixed > limitFixed ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pctFixed, 100)}%` }}></div>
               </div>
            </div>

            <div className="mb-4">
               <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-gray-700">Custos Variáveis ({pctVar}%)</span>
                  <span className="text-gray-400">Teto Ideal: {limitVar}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div className="absolute" style={{ left: `${limitVar}%`, width: '2px', height: '16px', backgroundColor: '#6b7280', position: 'absolute', top: '-4px' }}></div>
                  <div className={`h-3 rounded-full ${pctVar > limitVar ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pctVar, 100)}%` }}></div>
               </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-4 leading-relaxed font-medium bg-gray-50 p-4 border border-gray-100 rounded-lg">
               {(pctFixed > limitFixed || pctVar > limitVar) 
                 ? `Alerta: Você está vazando capital pela regra ${limitFixed}/${limitVar}/${budgetLimits.save}. Reveja suas categorias urgentes.` 
                 : "Engenharia blindada: Seus custos estão dentro da métrica de enriquecimento programado."}
            </p>
         </div>
       </div>
    </div>
  );
};

const CreditCardTab = () => {
   const { creditCards, addCreditCardBuy, deleteCreditCardBuy } = useFinancial();
   const [desc, setDesc] = useState('');
   const [val, setVal] = useState('');
   const [install, setInstall] = useState(1);
   const [month, setMonth] = useState('');
 
   const handleSubmit = (e) => {
     e.preventDefault();
     if(desc && val && month) {
        addCreditCardBuy(desc, parseReal(val), parseInt(install), month);
        setDesc(''); setVal('');
     }
   };
 
   const billThisMonth = creditCards.reduce((acc, cc) => acc + (cc.total_amount / cc.installments), 0);
 
   return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-6">
         <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Novo Puxadinho (Cartão)</h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Passivo</label>
                     <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ex: Celular..." required/>
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Valor Total Devido (R$)</label>
                     <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={val} onChange={formatInput(setVal)} placeholder="R$ 0,00" required/>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-1/2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Parcelas</label>
                        <input type="number" min="1" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={install} onChange={e=>setInstall(e.target.value)} required/>
                     </div>
                     <div className="w-1/2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mês de Ínicio</label>
                        <input type="month" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={month} onChange={e=>setMonth(e.target.value)} required/>
                     </div>
                  </div>
                   <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md transform hover:-translate-y-0.5">Assumir Dívida</button>
               </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Passivos Ativos</h3>
               <div className="space-y-3">
                  {creditCards.length === 0 && <p className="text-sm text-gray-400">Nenhum cartão parcelado.</p>}
                  {creditCards.map(cc => (
                     <div key={cc.id} className="flex justify-between items-center p-3 border border-gray-50 bg-gray-50 rounded-md">
                        <div>
                           <p className="font-semibold text-gray-800 text-sm">{cc.description} <span className="text-xs text-red-500 font-bold ml-1">({cc.installments}x)</span></p>
                           <p className="text-xs text-gray-400 mt-1">Início: <span className="font-mono text-gray-500">{cc.start_month}</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="text-right">
                              <p className="font-bold text-gray-900">{fmtBR(cc.total_amount)}</p>
                              <p className="text-xs text-red-500">{fmtBR(cc.total_amount / cc.installments)}/mês</p>
                           </div>
                           <button onClick={() => deleteCreditCardBuy(cc.id)} className="text-red-400 hover:text-red-600 font-bold" title="Remover">✖</button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         <div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6">
               <p className="text-sm text-red-600 font-bold mb-1">Comprometimento Mensal Calculado</p>
               <h2 className="text-4xl font-black text-red-900">{fmtBR(billThisMonth)}</h2>
               <p className="text-xs text-red-500 mt-2">Corrói a sua taxa de entrada de dinheiro vital.</p>
            </div>
         </div>
      </div>
   );
};

const EmergencyTab = () => {
   const { emergencyFund, saveEmergencyFund } = useFinancial();
   
   const [fixo, setFixo] = useState(fmtReal(emergencyFund?.fixed_cost || 0));
   const [months, setMonths] = useState(emergencyFund?.coverage_months || 6);
   const [atual, setAtual] = useState(fmtReal(emergencyFund?.current_reserve || 0));
   const [aporte, setAporte] = useState(fmtReal(emergencyFund?.expected_deposit || 0));

   const tgt = parseReal(fixo) * months;
   const pct = tgt > 0 ? (parseReal(atual) / tgt) * 100 : 0;
   const missing = Math.max(tgt - parseReal(atual), 0);
   const time = (parseReal(aporte) > 0 && missing > 0) ? Math.ceil(missing / parseReal(aporte)) : 0;

   const handleSave = () => {
      saveEmergencyFund(parseReal(fixo), months, parseReal(atual), parseReal(aporte));
   };

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-6">
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Escala de Sobrevivência</h3>
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Custo Fixo Mensal Calculado (R$)</label>
                  <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={fixo} onChange={formatInput(setFixo)}/>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Meses Desejados de Escudo</label>
                  <input type="number" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={months} onChange={e=>setMonths(e.target.value)}/>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reserva Atual Salva (R$)</label>
                  <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={atual} onChange={formatInput(setAtual)}/>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Aporte Mensal Destinado (R$)</label>
                  <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={aporte} onChange={formatInput(setAporte)}/>
               </div>
                <button onClick={handleSave} className="w-full bg-[#0a2540] hover:bg-blue-900 text-amber-500 font-bold py-3 px-4 rounded-lg transition-all shadow-md mt-2">Gravar Barreira</button>
            </div>
         </div>
          <div>
             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-6 shadow-sm">
                <p className="text-sm text-emerald-600 font-bold mb-1 uppercase tracking-wider">Tamanho Matemático Ideal</p>
                <h2 className="text-4xl font-black text-emerald-900">{fmtBR(tgt)}</h2>
                <p className="text-xs text-emerald-500 mt-2">Muralha anti-falência baseada no custo fixo.</p>
             </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h3 className="text-sm font-bold text-gray-700 mb-2">Progresso do Sistema Defensivo ({pct.toFixed(1)}%)</h3>
               <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div className="bg-emerald-500 h-4 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
               </div>
               <p className="text-sm text-gray-600 border-l-4 border-emerald-500 pl-3">
                  {missing > 0 ? `Faltam R$ ${fmtBR(missing)}. Com os aportes declarados, a proteção máxima é alcançada em ${time} meses.` : `Parabéns. Sua blindagem está com 100% da integridade máxima exigida.`}
               </p>
            </div>
         </div>
      </div>
   );
};

const CompoundInterestTab = () => {
   const [initial, setInitial] = useState(fmtReal(50000));
   const [monthly, setMonthly] = useState(fmtReal(2000));
   const [years, setYears] = useState(10);
   const [rate, setRate] = useState(12);

   // Math engine
   const initialVal = parseReal(initial);
   const monthlyVal = parseReal(monthly);
   const monthlyRate = (rate / 100) / 12;
   const totalMonths = years * 12;
   const yearData = [];

   let balance = initialVal;
   let totalInvested = initialVal;
   let crossoverYear = null;

for (let y = 1; y <= years; y++) {
       for (let m = 0; m < 12; m++) {
          balance = balance * (1 + monthlyRate) + monthlyVal;
          totalInvested += monthlyVal;
       }
      const interest = balance - totalInvested;
      if (!crossoverYear && interest > totalInvested) crossoverYear = y;
      yearData.push({ year: y, invested: totalInvested, interest, balance });
   }

   const finalInvested = totalInvested;
   const finalInterest = balance - totalInvested;
   const maxBalance = yearData.length > 0 ? yearData[yearData.length - 1].balance : 1;

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-6">
         <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Parâmetros da Simulação</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Investimento Inicial (R$)</label>
                     <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={initial} onChange={formatInput(setInitial)} />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Aporte Mensal (R$)</label>
                     <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={monthly} onChange={formatInput(setMonthly)} />
                  </div>
                  <div className="flex gap-4">
                     <div className="w-1/2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tempo (Anos)</label>
                        <input type="number" min="1" max="50" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={years} onChange={e => setYears(Number(e.target.value))} />
                     </div>
                     <div className="w-1/2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Taxa Anual (%)</label>
                        <input type="number" step="0.1" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={rate} onChange={e => setRate(Number(e.target.value))} />
                     </div>
                  </div>
               </div>
               <p className="text-xs text-gray-400 mt-4">Simulação baseada em capitalização mensal composta. Resultados são projeções e não garantem rentabilidade futura.</p>
            </div>

            {/* Evolução Anual */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Evolução Anual</h3>
               <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                     <thead>
                        <tr className="text-gray-500 border-b border-gray-100">
                           <th className="py-2 text-left font-semibold">Ano</th>
                           <th className="py-2 text-right font-semibold">Investido</th>
                           <th className="py-2 text-right font-semibold">Juros</th>
                           <th className="py-2 text-right font-semibold">Saldo</th>
                        </tr>
                     </thead>
                     <tbody>
                        {yearData.map(d => (
                           <tr key={d.year} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 font-bold text-gray-700">{d.year}º</td>
<td className="py-2 text-right text-gray-600">{fmtBR(d.invested)}</td>
                               <td className="py-2 text-right text-amber-600 font-semibold">{fmtBR(d.interest)}</td>
                               <td className="py-2 text-right text-gray-900 font-bold">{fmtBR(d.balance)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

          <div>
              {/* Crossover */}
              <div className="bg-[#cda434] border border-[#b8860b] rounded-xl p-6 mb-6 shadow-lg text-[#0a2540] dark:text-white">
                <p className="text-sm font-black mb-1 uppercase tracking-widest opacity-70">Ponto de Ignição (Crossover)</p>
                <h2 className="text-4xl font-black">
                   {crossoverYear ? `Ano ${crossoverYear}` : `Acima de ${years} anos`}
                </h2>
                <p className="text-xs mt-2 font-bold opacity-60">Quando os juros superam o valor investido do bolso.</p>
             </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <p className="text-sm text-gray-500 font-semibold mb-1">Total do seu Bolso</p>
                  <p className="text-2xl font-black text-gray-900">{fmtBR(finalInvested)}</p>
                  <p className="text-xs text-gray-400 mt-1">Capital + Aportes</p>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
                  <p className="text-sm text-amber-600 font-semibold mb-1">Bola de Neve</p>
                  <p className="text-2xl font-black text-amber-600">{fmtBR(finalInterest)}</p>
                  <p className="text-xs text-amber-400 mt-1">Rendimento passivo</p>
               </div>
            </div>

            {/* Visual Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-700">Projeção de Crescimento</h3>
                  <div className="flex gap-4 text-xs">
                     <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block"></span> Investido</span>
                     <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block"></span> Juros</span>
                  </div>
               </div>
               <div className="flex items-end gap-1" style={{ height: '200px' }}>
                  {yearData.map(d => {
                     const totalH = (d.balance / maxBalance) * 100;
                     const investedH = (d.invested / maxBalance) * 100;
                     const interestH = totalH - investedH;
                     return (
                        <div key={d.year} className="flex-1 flex flex-col justify-end items-center" title={`Ano ${d.year}: R$ ${fmtBR(d.balance)}`}>
                           <div className="w-full rounded-t bg-amber-400" style={{ height: `${Math.max(interestH, 0)}%` }}></div>
                           <div className="w-full bg-blue-400" style={{ height: `${Math.max(investedH, 1)}%` }}></div>
                           {d.year % Math.max(1, Math.floor(years / 10)) === 0 && (
                              <span className="text-[9px] text-gray-400 mt-1">{d.year}</span>
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
      </div>
   );
};

export const FinancialTools = () => {
   const { isLoaded } = useFinancial();
   const [activeTab, setActiveTab] = useState('budget');

   if (!isLoaded) {
      return <div className="text-center p-12 text-gray-400 font-bold animate-pulse">Sincronizando Vault Financeiro...</div>;
   }

   const tabs = [
      { id: 'budget', label: 'Orçamento 50/30' },
      { id: 'cards', label: 'Matador de Cartões' },
      { id: 'emergency', label: 'Fundo Blindado' },
      { id: 'snowball', label: 'Bola de Neve' },
      { id: 'debt_calc', label: 'Destruidor de Dívidas' },
      { id: 'fee_calc', label: 'Auditoria de Taxas' },
   ];

   return (
     <div className="max-w-6xl mx-auto w-full">
         <div className="mb-8 border-b border-gray-200 flex overflow-x-auto no-scrollbar">
             {tabs.map(tab => (
                <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-[#cda434] text-[#0a2540] bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900 border-b-transparent hover:bg-gray-50'}`}
                >
                   {tab.label}
                </button>
             ))}
         </div>

         <div className="w-full">
            {activeTab === 'budget' && <BudgetTab />}
            {activeTab === 'cards' && <CreditCardTab />}
            {activeTab === 'emergency' && <EmergencyTab />}
            {activeTab === 'snowball' && <CompoundInterestTab />}
            {activeTab === 'debt_calc' && <div className="mt-8 flex justify-center"><DebtDestroyerCalc /></div>}
            {activeTab === 'fee_calc' && <div className="mt-8 flex justify-center"><FeeAuditorCalc /></div>}
         </div>
     </div>
   );
};
