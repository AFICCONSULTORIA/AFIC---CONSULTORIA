import React, { useState, useEffect } from 'react';
import { useUserProfile } from './UserProfileContext';
import { supabase } from '../lib/supabase';

export const DashboardWidgets = () => {
  const { userProfile } = useUserProfile();
  const [userNickname, setUserNickname] = useState('');
  const [userPlan, setUserPlan] = useState('');
  const [showScoreModal, setShowScoreModal] = useState(false);
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
      
      {/* SCORE DE SAÚDE - CLICKABLE */}
      <div onClick={() => setShowScoreModal(true)} className="bg-white p-6 rounded-xl border border-gray-100 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all" style={{maxWidth: '600px'}}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-gray-900">📊 Score de Saúde Financeira</h4>
          <span className="text-2xl">🩺</span>
        </div>
        <div className="text-center py-2">
          <p className="text-4xl font-bold text-gray-900">{finalScore || 842}<span className="text-2xl text-gray-400">/1000</span></p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-3">
          <div>• Solvência: {parseInt(scoreData.solvencia) >= 7 ? '✓' : '⚠️'}</div>
          <div>• Endividamento: {parseInt(scoreData.endividamento) >= 7 ? '✓' : '⚠️'}</div>
          <div>• Liquidez: {parseInt(scoreData.liquidez) >= 7 ? '✓' : '⚠️'}</div>
          <div>• Poupança: {parseInt(scoreData.pouparanca) >= 7 ? '✓' : '⚠️'}</div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">Clique para calcular</p>
      </div>
      
      {/* PRÓXIMAS AÇÕES */}
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <h4 className="text-gray-900 font-semibold mb-4">Próximas Ações Recomendadas</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
            <span className="text-lg">📚</span>
            <div className="flex-1">
              <p className="text-gray-900 font-medium text-sm">Assista: Como estruturar seu patrimônio</p>
              <p className="text-gray-500 text-xs">Academy • 15 min</p>
            </div>
            <button className="text-amber-600 font-medium text-sm">Assistir</button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-lg">💰</span>
            <div className="flex-1">
              <p className="text-gray-900 font-medium text-sm">Atualizar controle de gastos</p>
              <p className="text-gray-500 text-xs">Ferramentas • 2 min</p>
            </div>
            <button className="text-blue-600 font-medium text-sm">Atualizar</button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
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