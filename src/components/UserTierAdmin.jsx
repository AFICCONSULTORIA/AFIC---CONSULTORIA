import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTier } from './TierContext';

export const UserTierAdmin = () => {
  const { isAdmin, upgradeUserTier, refreshTier } = useTier();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [upgrading, setUpgrading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('afic_subscriptions_tier')
        .select('*, afic_tiers(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
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
    const email = u.user_id || '';
    return !searchTerm || email.includes(searchTerm);
  });

  if (!isAdmin) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800">Acesso restrito a administradores.</p>
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
                <p className="font-medium text-gray-900">{user.user_id?.slice(0, 8)}...</p>
                <p className="text-sm text-gray-500">
                  Tier: <span className="font-bold">{user.tier_id}</span>
                </p>
                <p className="text-xs text-gray-400">
                  Status: {user.status} | Desde: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
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
    </div>
  );
};

export default UserTierAdmin;