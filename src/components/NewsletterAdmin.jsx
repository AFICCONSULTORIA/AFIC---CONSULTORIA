import React, { useState, useEffect } from 'react';

export const NewsletterAdmin = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.aficSupabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.error('Erro ao buscar inscritos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!subscribers.length) return;
    
    // Header
    let csvContent = "Data de Inscricao,E-mail\n";
    
    // Rows
    subscribers.forEach(sub => {
      const date = new Date(sub.created_at).toLocaleString('pt-BR');
      csvContent += `${date},${sub.email}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `afic_newsletter_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-[#0a2540] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cda434" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Inscritos na Newsletter
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie os e-mails capturados através da Landing Page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#cda434]/10 text-[#cda434] px-4 py-2 rounded-lg font-bold text-sm">
            {subscribers.length} Inscritos
          </div>
          <button 
            onClick={downloadCSV}
            disabled={subscribers.length === 0}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              subscribers.length > 0 
                ? 'bg-[#cda434] text-[#0a2540] hover:bg-[#e8cc6e]' 
                : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
          Erro ao carregar dados: {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cda434] mx-auto mb-4"></div>
          Carregando inscritos...
        </div>
      ) : subscribers.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#051829] rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 opacity-50"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          <p>Nenhum inscrito até o momento.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#051829] text-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-semibold rounded-tl-lg">E-mail</th>
                <th className="px-6 py-4 font-semibold rounded-tr-lg">Data de Inscrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-[#051829]/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {sub.email}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(sub.created_at).toLocaleDateString('pt-BR', { 
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
