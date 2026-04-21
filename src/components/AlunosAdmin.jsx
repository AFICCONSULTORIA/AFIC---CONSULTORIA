import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AlunosAdmin = () => {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAluno, setEditingAluno] = useState(null);

  const planOptions = ['nenhum', 'iniciante', 'intermediario', 'avancado', 'institucional', 'vip'];
  const statusOptions = ['pendente', 'aprovado', 'cancelado', 'inadimplente'];

  useEffect(() => {
    loadAlunos();
  }, []);

  const loadAlunos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('afic_alunos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAlunos(data || []);
    } catch (err) {
      console.error('Error loading alunos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAluno = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('afic_alunos')
        .update({
          plano: editingAluno.plano,
          status_pagamento: editingAluno.status_pagamento,
          valor_pago: editingAluno.valor_pago,
          notas: editingAluno.notas
        })
        .eq('id', editingAluno.id);

      if (error) throw error;
      
      setAlunos(alunos.map(a => a.id === editingAluno.id ? editingAluno : a));
      setEditingAluno(null);
    } catch (err) {
      console.error('Error updating aluno:', err);
      alert('Erro ao atualizar dados do aluno.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'inadimplente': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-[#cda434] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 font-medium">Carregando Gestão de Alunos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-up">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Alunos</h2>
          <p className="text-gray-500 dark:text-gray-400">Controle matrículas, status financeiro e permissões gerais na Academia.</p>
        </div>
        <div className="bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 flex gap-4 text-sm font-medium shadow-sm">
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs">Total</span>
            <span className="text-xl font-bold text-[#cda434]">{alunos.length}</span>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs">Ativos</span>
            <span className="text-xl font-bold text-green-500">
              {alunos.filter(a => a.status_pagamento === 'aprovado').length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#071d36] border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="p-4 font-bold">Aluno</th>
              <th className="p-4 font-bold">Contato</th>
              <th className="p-4 font-bold">Plano</th>
              <th className="p-4 font-bold">Status Pgto</th>
              <th className="p-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {alunos.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">Nenhum aluno registrado.</td>
              </tr>
            ) : (
              alunos.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-gray-50 dark:hover:bg-[#0c2a4a] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-[#051829] flex items-center justify-center text-[#cda434] font-bold text-sm">
                        {aluno.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{aluno.nome}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{aluno.email}</div>
                    <div className="text-xs text-gray-400">{aluno.whatsapp}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 uppercase">
                      {aluno.plano || 'Nenhum'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(aluno.status_pagamento)}`}>
                      {(aluno.status_pagamento || "indefinido").toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setEditingAluno(aluno)}
                      className="text-[#cda434] hover:text-yellow-600 font-bold text-sm"
                    >
                      Editar Ficha
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingAluno && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-[#0a2540] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white">Ficha do Aluno: {editingAluno.nome}</h3>
              <button onClick={() => setEditingAluno(null)} className="text-gray-400 hover:text-gray-800 dark:hover:text-white text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateAluno} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nível de Acesso (Plano)</label>
                  <select 
                    value={editingAluno.plano || 'nenhum'}
                    onChange={e => setEditingAluno({...editingAluno, plano: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#051829] dark:text-white rounded p-2 text-sm"
                  >
                    {planOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Status Pagamento</label>
                  <select 
                    value={editingAluno.status_pagamento || 'pendente'}
                    onChange={e => setEditingAluno({...editingAluno, status_pagamento: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#051829] dark:text-white rounded p-2 text-sm"
                  >
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Valor Total Pago (R$)</label>
                <input 
                  type="number" step="0.01" 
                  value={editingAluno.valor_pago || 0}
                  onChange={e => setEditingAluno({...editingAluno, valor_pago: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#051829] dark:text-white rounded p-2 text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Notas Institucionais Internas</label>
                <textarea 
                  value={editingAluno.notas || ''}
                  onChange={e => setEditingAluno({...editingAluno, notas: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#051829] dark:text-white rounded p-2 text-sm h-24" 
                  placeholder="Anotações visíveis apenas para admins..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingAluno(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded font-bold hover:bg-gray-200 dark:hover:bg-gray-700">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#0a2540] dark:bg-[#cda434] dark:text-gray-900 text-white rounded font-bold hover:bg-blue-900 dark:hover:bg-yellow-600 border border-[#0a2540] dark:border-[#cda434]">
                  Salvar Ficha Escolar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
