import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from './UserProfileContext';

export const ProfileOnboarding = () => {
  const { userProfile, setUserProfile } = useUserProfile();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    window.addEventListener('open-profile-modal', () => {
      setIsChanging(true);
      setShowModal(true);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSessionUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkProfile() {
      if (isChanging) {
        setShowModal(true);
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('profile_type')
        .eq('id', session.user.id)
        .maybeSingle();
      
      const profileType = data?.profile_type;
      if (profileType === 'conservador' || profileType === 'equilibrado' || profileType === 'arrojado') {
        setUserProfile(profileType);
      } else {
        setShowModal(true);
      }
      setLoading(false);
    }
    checkProfile();
  }, [sessionUser, isChanging]);

  const handleSave = async (profile) => {
    if (!nickname || nickname.trim().length === 0) {
      setError('Nome é obrigatório');
      return;
    }
    
    setUserProfile(profile);
    setShowModal(false);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: session.user.id, 
          nickname: nickname || null,
          profile_type: profile, 
          updated_at: new Date().toISOString() 
        });
      
      if (!error) {
        window.dispatchEvent(new CustomEvent('profile-selected', { detail: { profile, nickname } }));
        window.location.reload();
      }
    }
  };

  if (loading) return null;
  if (!showModal) return null;

  const handleNicknameChange = (e) => {
    const val = e.target.value;
    if (val.length <= 32) {
      setNickname(val);
      setError('');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '550px', width: '100%', padding: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111' }}>Complete seu Cadastro</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Como gostaria de ser chamado?</label>
          <input
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="Seu apelido"
            maxLength={32}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: error ? '1px solid #ef4444' : '1px solid #d1d5db', fontSize: '16px' }}
          />
          <p style={{ fontSize: '12px', color: error ? '#ef4444' : '#6b7280', marginTop: '4px' }}>{error || `${nickname.length}/32 caracteres`}</p>
        </div>
        
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>Selecione seu perfil para personalizar as ferramentas:</p>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <button 
            onClick={() => handleSave('conservador')}
            className={`flex flex-col text-left p-5 rounded-lg border-2 transition-all duration-200 text-left ${
              userProfile === 'conservador' 
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🛡️</span>
              <span className="font-bold text-gray-900">Conservador</span>
            </div>
            <p className="text-sm text-gray-600">Prioriza segurança e preservação do patrimônio. Prefere investimentos de menor risco como renda fixa, títulos públicos e fundos conservadores.</p>
          </button>

          <button 
            onClick={() => handleSave('equilibrado')}
            className={`flex flex-col text-left p-5 rounded-lg border-2 transition-all duration-200 text-left ${
              userProfile === 'equilibrado' 
                ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100' 
                : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚖️</span>
              <span className="font-bold text-gray-900">Equilibrado</span>
            </div>
            <p className="text-sm text-gray-600">Busca equilíbrio entre segurança e rentabilidade. Mistura investimentos de renda fixa e variável, diversificando para mitigar riscos.</p>
          </button>

          <button 
            onClick={() => handleSave('arrojado')}
            className={`flex flex-col text-left p-5 rounded-lg border-2 transition-all duration-200 text-left ${
              userProfile === 'arrojado' 
                ? 'border-red-600 bg-red-50 ring-2 ring-red-100' 
                : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚀</span>
              <span className="font-bold text-gray-900">Arrojado</span>
            </div>
            <p className="text-sm text-gray-600">Aceita maior volatilidade em busca de retornos superiores. Foca em investimentos de alto crescimento como ações, criptomoedas e fundos de ações.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
