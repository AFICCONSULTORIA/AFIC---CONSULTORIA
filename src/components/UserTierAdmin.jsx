import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTier } from './TierContext';
import { AdminUserBudgetModal } from './AdminUserBudgetModal';

export const UserTierAdmin = () => {
  const { isAdmin, upgradeUserTier, refreshTier, userEmail } = useTier();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [upgrading, setUpgrading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State for Budget Viewer Modal
  const [viewingBudgetUser, setViewingBudgetUser] = useState(null);

  // State for new user form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('12345678');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // 1. Buscar todos os perfis (quem tem conta no sistema)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (profileError) throw profileError;

      if (profiles && profiles.length > 0) {
        // 2. Buscar assinaturas para esses perfis
        const userIds = profiles.map(p => p.id);
        const { data: tiers, error: tierError } = await supabase
          .from('afic_subscriptions_tier')
          .select('*, afic_tiers(*)')
          .in('user_id', userIds);

        // 3. Mapear as assinaturas para os perfis
        const tiersMap = (tiers || []).reduce((acc, t) => ({ ...acc, [t.user_id]: t }), {});
        const enrichedUsers = profiles.map(p => ({
          ...p,
          // Adaptar para o formato que o componente já usa
          user_id: p.id,
          status: tiersMap[p.id]?.status || 'sem_acesso',
          tier_id: tiersMap[p.id]?.tier_id || 'nenhum',
          afic_tiers: tiersMap[p.id]?.afic_tiers || null,
          created_at: tiersMap[p.id]?.created_at || p.updated_at,
          profiles: p // para manter compatibilidade com o código anterior
        }));
        
        setUsers(enrichedUsers);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (userId, newTier) => {
    setUpgrading(userId);
    setMessage({ type: '', text: '' });

    try {
      const result = await upgradeUserTier(userId, newTier);
      if (result.success) {
        setMessage({ type: 'success', text: 'Usuário atualizado com sucesso!' });
        loadUsers();
        await refreshTier();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao atualizar usuário' });
    } finally {
      setUpgrading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase();
    const idMatch = u.id?.toLowerCase().includes(search);
    const emailMatch = u.email_public?.toLowerCase().includes(search);
    const nickMatch = u.nickname?.toLowerCase().includes(search);
    return !searchTerm || idMatch || emailMatch || nickMatch;
  });

  if (!isAdmin) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg max-w-2xl mx-auto mt-10">
        <h2 className="text-xl font-bold text-amber-900 mb-2">Acesso restrito a administradores</h2>
        <p className="text-amber-800 mb-4">
          O seu usuário atual (<span className="font-bold">{useTier().userEmail || 'Não identificado'}</span>) não possui permissões administrativas.
        </p>
        <div className="bg-white/60 p-4 rounded-lg text-sm text-amber-900 border border-amber-200">
          <p className="font-bold mb-2">Como resolver?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Faça login com o e-mail: <strong>aficconsultoria@gmail.com</strong></li>
            <li>Ou certifique-se de que a coluna <strong>role</strong> na tabela <strong>profiles</strong> do Supabase está preenchida com o valor <strong>admin</strong> para o seu usuário.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">Gerenciar Acesso de Usuários</h2>
          <p className="text-gray-500 text-sm">Atualize o plano/tier dos usuários</p>
        </div>
        <button
          onClick={loadUsers}
          className="text-sm text-blue-600 hover:underline"
        >
          ↻ Atualizar
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulário de Criação de Novo Usuário */}
      <div className="mb-8 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Adicionar Novo Usuário
        </h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!newEmail || !newPassword) return;
          setCreatingUser(true);
          setMessage({ type: '', text: '' });

          try {
            // Criar um client isolado para signUp sem afetar a sessão atual do admin
            const secondarySupabase = window.supabase.createClient(
              'https://sueyfodlqcviojivlxgv.supabase.co',
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZXlmb2RscWN2aW9qaXZseGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzU4NTMsImV4cCI6MjA5MTI1MTg1M30.g40c4ko9uFKOdN2x4tvQQg-IuWx2ZB4K8_fsZpgeIDw',
              { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
            );

            const { data, error } = await secondarySupabase.auth.signUp({
              email: newEmail,
              password: newPassword
            });

            if (error) {
              setMessage({ type: 'error', text: `Erro no Auth: ${error.message}` });
            } else {
              if (data?.user?.id) {
                // 1. Garantir que o usuário tenha um tier inicial
                const tierResult = await upgradeUserTier(data.user.id, 'despertar');
                if (!tierResult.success) {
                  console.error('Tier upgrade failed:', tierResult.error);
                }
                
                // 2. Criar um perfil básico para que ele seja identificado na lista
                const { error: profileError } = await supabase.from('profiles').upsert({
                  id: data.user.id,
                  nickname: newEmail.split('@')[0],
                  email_public: newEmail,
                  updated_at: new Date().toISOString()
                });

                if (profileError) {
                  console.error('Profile creation failed:', profileError.message);
                  setMessage({ type: 'error', text: `Usuário criado, mas erro no perfil: ${profileError.message}` });
                } else {
                  setMessage({ type: 'success', text: 'Usuário e Perfil criados com sucesso!' });
                }
              }
              
              setNewEmail('');
              setNewPassword('12345678');
              setTimeout(loadUsers, 500); // Pequeno delay para o Supabase processar
            }
          } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao criar usuário.' });
          } finally {
            setCreatingUser(false);
          }
        }} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-600 mb-1">Email do Usuário</label>
            <input
              type="email"
              placeholder="exemplo@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div className="w-full md:w-40">
            <label className="block text-xs font-bold text-gray-600 mb-1">Senha Inicial</label>
            <input
              type="text"
              placeholder="12345678"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creatingUser}
              className="w-full md:w-auto bg-[#0a2540] hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 transition-colors"
            >
              {creatingUser ? 'Criando...' : '+ Criar Conta'}
            </button>
          </div>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-lg">Usuários Cadastrados</h3>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por email ou ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center p-8 text-gray-400">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="mb-2">
                  <div className="font-bold text-gray-900 text-sm">
                    {user.profiles?.email_public || user.profiles?.nickname || 'Usuário sem Perfil'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-gray-200 rounded text-gray-500 select-all">
                      ID: {user.user_id}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(user.user_id); alert('ID copiado!'); }}
                      className="text-gray-300 hover:text-blue-500 transition-colors"
                      title="Copiar ID"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Plano: <span className="font-bold text-gray-700">{user.afic_tiers?.name || user.tier_id}</span>
                </p>
                <p className="text-[10px] text-gray-400">
                  Status: <span className="capitalize">{user.status}</span> | Desde: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingBudgetUser({ id: user.user_id, name: user.profiles?.nickname || user.profiles?.email_public || 'Usuário' })}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                  <span>👁️</span> Orçamento
                </button>
                <div className="w-px bg-gray-200 mx-1"></div>
                <button
                  onClick={() => handleUpgrade(user.user_id, 'assinante')}
                  disabled={upgrading === user.user_id}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  ASSINANTE
                </button>
                <button
                  onClick={() => handleUpgrade(user.user_id, 'private_elite')}
                  disabled={upgrading === user.user_id}
                  className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                >
                  ELITE
                </button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center p-8 text-gray-400">Nenhum usuário encontrado</p>
          )}
        </div>
      )}

      {viewingBudgetUser && (
        <AdminUserBudgetModal 
          userId={viewingBudgetUser.id} 
          userName={viewingBudgetUser.name} 
          onClose={() => setViewingBudgetUser(null)} 
        />
      )}
    </div>
  );
};

export default UserTierAdmin;