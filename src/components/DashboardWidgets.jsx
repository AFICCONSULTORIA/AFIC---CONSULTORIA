import React, { useState, useEffect } from 'react';
import { useUserProfile } from './UserProfileContext';
import { supabase } from '../lib/supabase';

export const DashboardWidgets = () => {
  const { userProfile } = useUserProfile();
  const [userNickname, setUserNickname] = useState('');
  const [userPlan, setUserPlan] = useState('');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showLiberdadeModal, setShowLiberdadeModal] = useState(false);
const [liberdadeData, setLiberdadeData] = useState({
    idadeAlvo: 45,
    idadeAtual: 30,
    custoVida: 5000,
    rendaPassivaAlvo: 10000,
    rendaAtual: 1500,
    patrimonio: 100000,
    aporteMensal: 2000
  });
  const [liberdadeInputs, setLiberdadeInputs] = useState({
    custoVida: '5000',
    aporteMensal: '2000',
    patrimonio: '100000',
    idadeAtual: '30',
    idadeAlvo: '45'
  });
  const [allocationData, setAllocationData] = useState({
    rf: 35,
    rv: 30,
    caixa: 35
  });
  const [scoreData, setScoreData] = useState({
    solvencia: 7,
    endividamento: 7,
    liquidez: 7,
    pouparanca: 7
  });
  const [finalScore, setFinalScore] = useState(842);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    async function loadUserInfo() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', session.user.id)
          .maybeSingle();
        
        // Get subscription to find the plan
        const { data: subscription } = await supabase
          .from('afic_subscriptions')
          .select('plan_id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        let name = profile?.nickname;
        let plan = subscription?.plan_id;
        
        // If no nickname, use email
        if (!name && session.user.email) {
          name = session.user.email.split('@')[0];
        }
        
        setUserNickname(name || 'Usuário');
        setUserPlan(plan || 'free');
      }
    }
    loadUserInfo();
  }, []);

  const getPlanLabel = (plan) => {
    const plans = {
      'free': 'Free',
      'user': 'Free',
      'admin': 'Admin',
      'basic': 'Básico',
      'pro': 'Profissional',
      'elite': 'Elite'
    };
    return plans[plan] || 'Free';
  };

  const getNoteColor = (value) => {
    if (value <= 3) return 'bg-red-500';
    if (value <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getNoteLabel = (key, value) => {
    const labels = {
      solvencia: ['Crise finance', 'Atenção', 'Estável', 'Sólido'],
      endividamento: ['Risco alto', 'Atenção', 'Controlado', 'Seguro'],
      liquidez: ['Sem reserva', 'Insuficiente', 'Adequado', 'Robusto'],
      pouparanca: ['Zero ahorro', 'Baixo', 'Regular', 'Exemplar']
    };
    const idx = Math.floor(value / 3.5);
    return labels[key]?.[idx] || '';
  };

  const getClassification = (score) => {
    if (score >= 800) return { label: 'Saúde de Ferro', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 600) return { label: 'Em Observação', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'UTI Financeira', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const calculateScore = () => {
    const soma = (
      parseInt(scoreData.solvencia || 0) +
      parseInt(scoreData.endividamento || 0) +
      parseInt(scoreData.liquidez || 0) +
      parseInt(scoreData.pouparanca || 0)
    );
    const media = soma / 4;
    const score = media * 100; // média 0-10 convertida para 0-1000
    setFinalScore(Math.round(score));
    setShowResult(true);
  };

  const getWeakMetric = () => {
    const min = Math.min(parseInt(scoreData.solvencia), parseInt(scoreData.endividamento), parseInt(scoreData.liquidez), parseInt(scoreData.pouparanca));
    if (min === parseInt(scoreData.solvencia)) return 'Solvência';
    if (min === parseInt(scoreData.endividamento)) return 'Endividamento';
    if (min === parseInt(scoreData.liquidez)) return 'Liquidez';
    return 'Poupança';
  };

  const calcAllocationPath = (rf, rv, caixa) => {
    const total = rf + rv + caixa;
    const rfDeg = (rf / total) * 360;
    const rvDeg = rfDeg + (rv / total) * 360;
    
    const rfRad = (rfDeg - 90) * Math.PI / 180;
    const rvRad = (rvDeg - 90) * Math.PI / 180;
    const caixaRad = (360 - 90) * Math.PI / 180;
    const startRad = -90 * Math.PI / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(rfRad);
    const y2 = 50 + 40 * Math.sin(rfRad);
    const x3 = 50 + 40 * Math.cos(rvRad);
    const y3 = 50 + 40 * Math.sin(rvRad);
    
    const large = (rf / total) > 0.5 ? 1 : 0;
    const large2 = (rv / total) > 0.5 ? 1 : 0;
    
    return [
      `M50,50 L${x1.toFixed(1)},${y1.toFixed(1)} A40,40 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`,
      `M50,50 L${x2.toFixed(1)},${y2.toFixed(1)} A40,40 0 ${large2},1 ${x3.toFixed(1)},${y3.toFixed(1)} Z`,
      `M50,50 L${x3.toFixed(1)},${y3.toFixed(1)} A40,40 0 0,1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`
    ];
  };
  
  const allocationPaths = calcAllocationPath(allocationData.rf, allocationData.rv, allocationData.caixa);

  if (showAllocationModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">🎯 Alocação de Ativos</h3>
          <p className="text-gray-500 text-sm mb-4">Ajuste os percentuais para ver a alocação ideal para seu perfil.</p>
          
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 100 100" width="120" height="120">
              <circle cx="50" cy="50" r="40" fill="#e5e7eb" stroke="none"/>
              <path d={allocationPaths[0]} fill="#22c55e"/>
              <path d={allocationPaths[1]} fill="#3b82f6"/>
              <path d={allocationPaths[2]} fill="#f59e0b"/>
            </svg>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">Renda Fixa</span>
                <span className="text-green-600 font-bold">{allocationData.rf}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={allocationData.rf}
                onChange={(e) => setAllocationData({...allocationData, rf: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">Renda Variável</span>
                <span className="text-blue-600 font-bold">{allocationData.rv}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={allocationData.rv}
                onChange={(e) => setAllocationData({...allocationData, rv: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">Caixa</span>
                <span className="text-yellow-600 font-bold">{allocationData.caixa}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={allocationData.caixa}
                onChange={(e) => setAllocationData({...allocationData, caixa: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Total:</span>
            <span className={`font-bold ${allocationData.rf + allocationData.rv + allocationData.caixa === 100 ? 'text-green-600' : 'text-red-600'}`}>
              {allocationData.rf + allocationData.rv + allocationData.caixa}%
            </span>
          </div>
          
          <button onClick={() => setShowAllocationModal(false)} className="w-full mt-4 bg-[#0a2540] text-amber-400 py-3 rounded-lg font-bold">
            Salvar
          </button>
        </div>
      </div>
    );
  }

  const calcPatrimonioNecessario = () => {
    return liberdadeData.custoVida * 12 * 25;
  };

  const calcPctLiberdade = () => {
    const meta = calcPatrimonioNecessario();
    return meta > 0 ? Math.min(100, Math.round((liberdadeData.patrimonio / meta) * 100)) : 0;
  };

  const calcAnosAteLiberdade = () => {
    const meta = calcPatrimonioNecessario();
    const atual = liberdadeData.patrimonio;
    const aporte = liberdadeData.aporteMensal;
    const taxa = 0.004;
    
    if (atual >= meta) return 0;
    if (aporte <= 0) return 999;
    
    let anos = 0;
    let saldo = atual;
    while (saldo < meta && anos < 100) {
      saldo = saldo * (1 + taxa * 12) + aporte * 12;
      anos++;
    }
    return Math.min(anos, liberdadeData.idadeAlvo - liberdadeData.idadeAtual);
  };

  const calcNivel = () => {
    const custoBasico = liberdadeData.custoVida * 0.5;
    const patrimonio = liberdadeData.patrimonio;
    const custoVida = liberdadeData.custoVida;
    
    const seguranca = custoBasico * 12 * 25;
    const independencia = custoVida * 12 * 25;
    
    if (patrimonio >= independencia) return 3;
    if (patrimonio >= seguranca) return 2;
    if (patrimonio >= seguranca * 0.25) return 1;
    return 0;
  };

  if (showLiberdadeModal) {
    const patrimonioNecessario = calcPatrimonioNecessario();
    const nivel = calcNivel();
    const nivelLabels = ['Segurança', 'Independência', 'Liberdade'];
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-1">🏝️ Liberdade Financeira</h3>
          <p className="text-gray-500 text-sm mb-4">Defina seus dados. Regra dos 4%: patrimônio = custo anual × 25</p>
          
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 rounded-xl text-white text-center mb-4">
            <p className="text-sm opacity-90">Patrimônio Necessário</p>
            <p className="text-2xl font-bold">R$ {patrimonioNecessario.toLocaleString()}</p>
            <div className="w-full bg-white/30 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{width: `${calcPctLiberdade()}%`}}></div>
            </div>
            <p className="text-sm mt-1">{calcPctLiberdade()}% conquistado</p>
          </div>
          
          <div className="flex gap-2 mb-4">
            {[1,2,3].map(n => (
              <div key={n} className={`flex-1 p-2 rounded-lg text-center text-xs ${nivel >= n ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                {n === 1 ? '🛡️ Segurança' : n === 2 ? '⚖️ Independencia' : '🌟 Liberdade'}
              </div>
            ))}
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">Custo de Vida (R$/mês)</span>
                <span className="text-gray-600 font-bold">R$ {liberdadeData.custoVida.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="1000" max="50000" step="500"
                value={liberdadeData.custoVida}
                onChange={(e) => setLiberdadeData({...liberdadeData, custoVida: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-500"
              />
              <input 
                type="number" 
                value={liberdadeInputs.custoVida}
                onChange={(e) => {
                  setLiberdadeInputs({...liberdadeInputs, custoVida: e.target.value});
                  if (e.target.value !== '') {
                    setLiberdadeData({...liberdadeData, custoVida: parseInt(e.target.value) || 0});
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    setLiberdadeInputs({...liberdadeInputs, custoVida: String(liberdadeData.custoVida)});
                  }
                }}
                onFocus={(e) => {
                  setLiberdadeInputs({...liberdadeInputs, custoVida: ''});
                }}
                className="w-full mt-1 px-2 py-1 text-sm border rounded"
                placeholder="Ou digite um valor"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">Aporte Mensal (R$)</span>
                <span className="text-blue-600 font-bold">R$ {liberdadeData.aporteMensal.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="0" max="20000" step="500"
                value={liberdadeData.aporteMensal}
                onChange={(e) => setLiberdadeData({...liberdadeData, aporteMensal: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <input 
                type="number" 
                value={liberdadeInputs.aporteMensal}
                onChange={(e) => {
                  setLiberdadeInputs({...liberdadeInputs, aporteMensal: e.target.value});
                  if (e.target.value !== '') {
                    setLiberdadeData({...liberdadeData, aporteMensal: parseInt(e.target.value) || 0});
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    setLiberdadeInputs({...liberdadeInputs, aporteMensal: String(liberdadeData.aporteMensal)});
                  }
                }}
                onFocus={(e) => {
                  setLiberdadeInputs({...liberdadeInputs, aporteMensal: ''});
                }}
                className="w-full mt-1 px-2 py-1 text-sm border rounded"
                placeholder="Ou digite um valor"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">Patrimônio Atual (R$)</span>
                <span className="text-purple-600 font-bold">R$ {liberdadeData.patrimonio.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="0" max="5000000" step="10000"
                value={liberdadeData.patrimonio}
                onChange={(e) => setLiberdadeData({...liberdadeData, patrimonio: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <input 
                type="number" 
                value={liberdadeInputs.patrimonio}
                onChange={(e) => {
                  setLiberdadeInputs({...liberdadeInputs, patrimonio: e.target.value});
                  if (e.target.value !== '') {
                    setLiberdadeData({...liberdadeData, patrimonio: parseInt(e.target.value) || 0});
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    setLiberdadeInputs({...liberdadeInputs, patrimonio: String(liberdadeData.patrimonio)});
                  }
                }}
                onFocus={(e) => {
                  setLiberdadeInputs({...liberdadeInputs, patrimonio: ''});
                }}
                className="w-full mt-1 px-2 py-1 text-sm border rounded"
                placeholder="Ou digite um valor"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-700">Idade Atual</span>
                  <span className="text-gray-600 font-bold">{liberdadeData.idadeAtual} anos</span>
                </div>
                <input 
                  type="range" min="18" max="80" 
                  value={liberdadeData.idadeAtual}
                  onChange={(e) => setLiberdadeData({...liberdadeData, idadeAtual: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-500"
                />
                <input 
                  type="number" 
                  value={liberdadeInputs.idadeAtual}
                  onChange={(e) => {
                    setLiberdadeInputs({...liberdadeInputs, idadeAtual: e.target.value});
                    if (e.target.value !== '') {
                      setLiberdadeData({...liberdadeData, idadeAtual: parseInt(e.target.value) || 18});
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setLiberdadeInputs({...liberdadeInputs, idadeAtual: String(liberdadeData.idadeAtual)});
                    }
                  }}
                  onFocus={(e) => {
                    setLiberdadeInputs({...liberdadeInputs, idadeAtual: ''});
                  }}
                  className="w-full mt-1 px-2 py-1 text-sm border rounded"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-700">Idade Alvo</span>
                  <span className="text-emerald-600 font-bold">{liberdadeData.idadeAlvo} anos</span>
                </div>
                <input 
                  type="range" min="18" max="80" 
                  value={liberdadeData.idadeAlvo}
                  onChange={(e) => setLiberdadeData({...liberdadeData, idadeAlvo: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <input 
                  type="number" 
                  value={liberdadeInputs.idadeAlvo}
                  onChange={(e) => {
                    setLiberdadeInputs({...liberdadeInputs, idadeAlvo: e.target.value});
                    if (e.target.value !== '') {
                      setLiberdadeData({...liberdadeData, idadeAlvo: parseInt(e.target.value) || 80});
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setLiberdadeInputs({...liberdadeInputs, idadeAlvo: String(liberdadeData.idadeAlvo)});
                    }
                  }}
                  onFocus={(e) => {
                    setLiberdadeInputs({...liberdadeInputs, idadeAlvo: ''});
                  }}
                  className="w-full mt-1 px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">{calcAnosAteLiberdade() < 999 ? `Faltam ${calcAnosAteLiberdade()} anos para a liberdade` : 'Aumente aportes para proyectar'}</p>
          </div>
          
          <button onClick={() => setShowLiberdadeModal(false)} className="w-full mt-4 bg-[#0a2540] text-amber-400 py-3 rounded-lg font-bold">
            Salvar
          </button>
        </div>
      </div>
    );
  }

  if (showScoreModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-2">📊 Calcule Sua Saúde Financeira</h3>
          <p className="text-gray-500 text-sm mb-4">Arraste os sliders para avaliar sua situação. Passe o mouse nos cards para entender melhor cada métrica:</p>
          
          {/* SOLVÊNCIA */}
          <div className="bg-gray-50 p-4 rounded-xl mb-3 border-l-4 border-blue-500">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <span className="font-bold text-gray-900">SOLVÊNCIA</span>
              </div>
              <span className={`font-bold text-2xl ${getNoteColor(scoreData.solvencia).replace('bg-', 'text-')}`}>{scoreData.solvencia}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2"><strong>O que é:</strong> Sua riqueza real (ativos menos dívidas).</p>
            <p className="text-xs text-gray-500 mb-2"><strong>Como avaliar:</strong> Some todo seu patrimônio (imóveis, investimentos, carro) e subtraia suas dívidas. Se o resultado for positivo e crescente, sua nota é alta.</p>
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded"><strong>Exemplo:</strong>Nota 10 = Patrimônio de R$ 1M e dívidas R$ 100k | Nota 5 = Patrimônio R$ 500k e dívidas R$ 400k | Nota 2 = Dívidas maiores que ativos</p>
            <input 
              type="range" min="0" max="10" 
              value={scoreData.solvencia} 
              onChange={(e) => setScoreData({...scoreData, solvencia: e.target.value})}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{background: `linear-gradient(to right, #ef4444 0%, #eab308 30%, #22c55e 70%, #22c55e 100%)`}}
            />
          </div>

          {/* ENDIVIDAMENTO */}
          <div className="bg-gray-50 p-4 rounded-xl mb-3 border-l-4 border-red-500">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-bold text-gray-900">ENDIVIDAMENTO</span>
              </div>
              <span className={`font-bold text-2xl ${getNoteColor(scoreData.endividamento).replace('bg-', 'text-')}`}>{scoreData.endividamento}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2"><strong>O que é:</strong> Quanto de sua renda mensal vai para pagar dívidas.</p>
            <p className="text-xs text-gray-500 mb-2"><strong>Como avaliar:</strong> Calcule: (Parcela mensal de todas as dívidas / Sua renda mensal) x 100.</p>
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded"><strong>Exemplo:</strong>Nota 10 = até 15% da renda | Nota 5 = 30% a 50% da renda | Nota 2 = mais de 60% da renda (risco de inadimplência)</p>
            <input 
              type="range" min="0" max="10" 
              value={scoreData.endividamento} 
              onChange={(e) => setScoreData({...scoreData, endividamento: e.target.value})}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{background: `linear-gradient(to right, #ef4444 0%, #eab308 30%, #22c55e 70%, #22c55e 100%)`}}
            />
          </div>

          {/* LIQUIDEZ */}
          <div className="bg-gray-50 p-4 rounded-xl mb-3 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <span className="font-bold text-gray-900">LIQUIDEZ</span>
              </div>
              <span className={`font-bold text-2xl ${getNoteColor(scoreData.liquidez).replace('bg-', 'text-')}`}>{scoreData.liquidez}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2"><strong>O que é:</strong> Quanto tempo você sobrevive sem renda.</p>
            <p className="text-xs text-gray-500 mb-2"><strong>Como avaliar:</strong> Some suas reservas (poupança, CDI, Tesouro Selic) e divida pelo seu custo mensal de vida.</p>
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded"><strong>Exemplo:</strong>Nota 10 = mais de 12 meses guardados | Nota 5 = 6 meses | Nota 2 = menos de 2 meses (vulnerável)</p>
            <input 
              type="range" min="0" max="10" 
              value={scoreData.liquidez} 
              onChange={(e) => setScoreData({...scoreData, liquidez: e.target.value})}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{background: `linear-gradient(to right, #ef4444 0%, #eab308 30%, #22c55e 70%, #22c55e 100%)`}}
            />
          </div>

          {/* POUPANÇA */}
          <div className="bg-gray-50 p-4 rounded-xl mb-3 border-l-4 border-green-500">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐷</span>
                <span className="font-bold text-gray-900">POUPANÇA</span>
              </div>
              <span className={`font-bold text-2xl ${getNoteColor(scoreData.pouparanca).replace('bg-', 'text-')}`}>{scoreData.pouparanca}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2"><strong>O que é:</strong> Quanto você consegue guardar do que ganha.</p>
            <p className="text-xs text-gray-500 mb-2"><strong>Como avaliar:</strong> (Quanto economiza por mês / Sua renda mensal) x 100.</p>
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded"><strong>Exemplo:</strong>Nota 10 = guarda acima de 30% | Nota 5 = 15% a 20% | Nota 2 = menos de 5% (quase não guarda)</p>
            <input 
              type="range" min="0" max="10" 
              value={scoreData.pouparanca} 
              onChange={(e) => setScoreData({...scoreData, pouparanca: e.target.value})}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{background: `linear-gradient(to right, #ef4444 0%, #eab308 30%, #22c55e 70%, #22c55e 100%)`}}
            />
          </div>

          {showResult && (
            <div className="mt-4 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Sua Saúde Financeira:</p>
              <p className="text-4xl font-bold text-gray-900">{finalScore}<span className="text-xl text-gray-400">/1000</span></p>
              <div className={`inline-block px-4 py-1 rounded-full mt-2 ${getClassification(finalScore).bg}`}>
                <span className={`font-bold ${getClassification(finalScore).color}`}>{getClassification(finalScore).label}</span>
              </div>
              {getWeakMetric() && (
                <p className="text-sm text-gray-600 mt-3">
                  Foque primeiro em: <span className="font-bold text-red-600">{getWeakMetric()}</span>
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <button onClick={calculateScore} className="flex-1 bg-[#0a2540] text-amber-400 py-3 rounded-lg font-bold">
              {showResult ? 'Recalcular' : 'Calcular'}
            </button>
            <button onClick={() => { setShowScoreModal(false); setShowResult(false); }} className="px-6 py-3 text-gray-500 font-medium">
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* STATUS DO USUÁRIO */}
      <div className="bg-gradient-to-r from-[#0a2540] to-[#1a3a5c] p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-[#0a2540] font-bold text-xl">
              {userNickname ? userNickname.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{userNickname || 'Usuário'}</h3>
              <p className="text-amber-400 text-sm">🛡️ {userProfile === 'conservador' ? 'Conservador' : userProfile === 'equilibrado' ? 'Equilibrado' : userProfile === 'arrojado' ? 'Arrojado' : 'Perfil'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Plano</p>
            <p className="text-amber-400 font-semibold">{getPlanLabel(userPlan)}</p>
          </div>
        </div>
      </div>
      
      {/* ACESSO RÁPIDO */}
      <div>
        <h4 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Acesso Rápido</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="#" data-page="tools" onClick={(e) => { e.preventDefault(); window.switchPage('tools'); }} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-md transition-all text-center cursor-pointer">
            <div className="text-2xl mb-2">🛠️</div>
            <p className="text-gray-900 font-medium text-sm">Ferramentas</p>
          </a>
          <a href="#" data-page="education" onClick={(e) => { e.preventDefault(); window.switchPage('education'); }} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-md transition-all text-center cursor-pointer">
            <div className="text-2xl mb-2">🎓</div>
            <p className="text-gray-900 font-medium text-sm">Academy</p>
          </a>
          <a href="#" data-page="community" onClick={(e) => { e.preventDefault(); window.switchPage('community'); }} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-md transition-all text-center cursor-pointer">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-gray-900 font-medium text-sm">Comunidade</p>
          </a>
          <a href="#" data-page="account" onClick={(e) => { e.preventDefault(); window.switchPage('account'); }} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-md transition-all text-center cursor-pointer">
            <div className="text-2xl mb-2">⚙️</div>
            <p className="text-gray-900 font-medium text-sm">Minha Conta</p>
          </a>
        </div>
      </div>
      
      {/* WIDGETS ROW - Score, Alocação, Liberdade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SCORE DE SAÚDE - CLICKABLE */}
        <div onClick={() => setShowScoreModal(true)} className="bg-white p-5 rounded-xl border border-gray-100 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-bold text-gray-900">📊 Score de Saúde</h4>
            <span className="text-xl">🩺</span>
          </div>
          <div className="text-center py-1">
            <p className="text-3xl font-bold text-gray-900">{finalScore || 700}<span className="text-lg text-gray-400">/1000</span></p>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">Clique para calcular</p>
        </div>
        
        {/* ALOCAÇÃO DE ATIVOS */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 cursor-pointer hover:border-amber-400 transition-colors" onClick={() => setShowAllocationModal(true)}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-bold text-gray-900">🎯 Alocação</h4>
            <span className="text-xl">⚖️</span>
          </div>
          <div className="flex items-center justify-center py-2">
            <svg viewBox="0 0 100 100" width="80" height="80">
              <circle cx="50" cy="50" r="40" fill="#e5e7eb" stroke="none"/>
              <path d={calcAllocationPath(allocationData.rf, allocationData.rv, allocationData.caixa)[0]} fill="#22c55e"/>
              <path d={calcAllocationPath(allocationData.rf, allocationData.rv, allocationData.caixa)[1]} fill="#3b82f6"/>
              <path d={calcAllocationPath(allocationData.rf, allocationData.rv, allocationData.caixa)[2]} fill="#f59e0b"/>
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center text-xs mt-2">
            <div><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>RF {allocationData.rf}%</div>
            <div><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>RV {allocationData.rv}%</div>
            <div><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>Caixa {allocationData.caixa}%</div>
          </div>
        </div>
        
        {/* RUMO À LIBERDADE */}
        {(() => {
          const pctLiberdade = calcPctLiberdade();
          const patrimonioNecessario = calcPatrimonioNecessario();
          return (
        <div className="bg-white p-5 rounded-xl border border-gray-100 cursor-pointer hover:border-amber-400 transition-colors" onClick={() => setShowLiberdadeModal(true)}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-bold text-gray-900">🏁 Liberdade</h4>
            <span className="text-xl">🏝️</span>
          </div>
          <div className="text-center py-1">
            <p className="text-3xl font-bold text-emerald-600">{pctLiberdade}<span className="text-lg text-gray-400">%</span></p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-emerald-500 h-2 rounded-full" style={{width: `${pctLiberdade}%`}}></div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">R${liberdadeData.patrimonio >= 1000000 ? (liberdadeData.patrimonio / 1000000).toFixed(1) + 'M' : (liberdadeData.patrimonio / 1000).toFixed(0) + 'k'} / R${patrimonioNecessario >= 1000000 ? (patrimonioNecessario / 1000000).toFixed(1) + 'M' : (patrimonioNecessario / 1000).toFixed(0) + 'k'}</p>
        </div>
          );
        })()}
      </div>
      
      {/* PRÓXIMAS AÇÕES */}
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <h4 className="text-gray-900 font-semibold mb-4">Próximas Ações Recomendadas</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => window.switchPage && window.switchPage('academy')}>
            <span className="text-lg">📚</span>
            <div className="flex-1">
              <p className="text-gray-900 font-medium text-sm">Assista: Como estruturar seu patrimônio</p>
              <p className="text-gray-500 text-xs">Academy • 15 min</p>
            </div>
            <button className="text-amber-600 font-medium text-sm">Assistir</button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => window.switchPage && window.switchPage('tools')}>
            <span className="text-lg">💰</span>
            <div className="flex-1">
              <p className="text-gray-900 font-medium text-sm">Atualizar controle de gastos</p>
              <p className="text-gray-500 text-xs">Ferramentas • 2 min</p>
            </div>
            <button className="text-blue-600 font-medium text-sm">Atualizar</button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => window.switchPage && window.switchPage('community')}>
            <span className="text-lg">💬</span>
            <div className="flex-1">
              <p className="text-gray-900 font-medium text-sm">Participar da discussão</p>
              <p className="text-gray-500 text-xs">Comunidade • 5 min</p>
            </div>
            <button className="text-purple-600 font-medium text-sm">Participar</button>
          </div>
        </div>
      </div>
    </div>
  );
};