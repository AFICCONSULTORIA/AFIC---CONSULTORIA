import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const CRMAdmin = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState(null);

  // Status mapping
  const statusOptions = [
    { value: 'novo', label: 'Novo Lead', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'em contato', label: 'Em Contato', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { value: 'negociando', label: 'Negociando', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'fechado', label: 'Fechado/Ganho', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800 border-red-200' }
  ];

  const questionMap = {
    dinheiro1: "O que acontece com o dinheiro?",
    emergencia: "Como resolve emergências?",
    trava: "O que trava o patrimônio?",
    cartao: "Como usa o cartão?",
    paciencia: "Nível de paciência",
    sucesso: "O que é sucesso?",
    corte: "Reação ao cortar luxos",
    tempo: "Tempo de dedicação"
  };

  const answerMap = {
    "some": "Vai quase tudo para pagar as contas do mês passado e faturas.",
    "percebe": "Consigo pagar o básico, mas o resto some sem perceber.",
    "separo": "Já separo uma parte antes de começar a gastar.",
    "emprestou": "Usaria limite, cartão ou pediria emprestado.",
    "atrasar": "Venderia algo ou atrasaria outras contas.",
    "fundo": "Pagaria tranquilamente, tenho fundo de emergência.",
    "pouco": "Ganha pouco, só rico investe. / Tenho pouco tempo, quero algo passivo.", // Used in both trava and tempo, see fix below
    "conhecimento": "Tenho medo de perder, não entendo o mercado.",
    "disciplina": "Tento guardar, mas sempre gasto demais.",
    "extensao": "Extensão da renda. Pago mínimo ou parcelo.",
    "consome": "Uso muito, pago o total, mas consome o que ganho.",
    "estrategico": "Uso estratégico para pontos, sempre pago o total.",
    "imediato": "Preciso de retorno imediato.",
    "medio": "Aceito esperar / Consigo dedicar 1-2 horas semanais.", // Used in paciencia and tempo, see fix below
    "processo": "Entendo o processo. Quero resultados em anos.",
    "acertar": "Acertar a moeda e não trabalhar mais.",
    "dividas": "Sair das dívidas, sem ansiedade, não perder para inflação.",
    "patrimonio": "Construir patrimônio consistente e viver de renda.",
    "difcil": "Difícil. Prefiro ganhar mais.",
    "dificil": "Difícil. Prefiro ganhar mais.",
    "sacrificio": "Pronto para o sacrifício hoje pela paz amanhã.",
    "equilibrio": "Consigo equilibrar qualidade de vida com disciplina.",
    "2-3": "Prioridade. 2 a 3 horas semanais."
  };

  const getAnswerText = (key, val) => {
    if (!val) return null;
    // Handle ambiguous keys
    if (val === 'pouco') {
      if (key === 'trava') return "Ganha pouco, só rico investe.";
      if (key === 'tempo') return "Tenho pouco tempo, quero algo passivo.";
    }
    if (val === 'medio') {
      if (key === 'paciencia') return "Aceito esperar, mas preciso ver resultados em 6-12 meses.";
      if (key === 'tempo') return "Consigo dedicar 1-2 horas semanais.";
    }
    return answerMap[val] || val;
  };

  const formatWhatsAppLink = (phone, nome) => {
    let clean = (phone || '').replace(/\D/g, '');
    if (clean && !clean.startsWith('55') && clean.length <= 11) {
      clean = '55' + clean;
    }
    const firstName = nome ? nome.split(' ')[0] : '';
    const mensagem = `Olá ${firstName}, ficamos felizes em receber a sua análise de perfil! Após a nossa análise, voltaremos a entrar em contato com a aprovação ou reprovação do seu perfil.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(mensagem)}`;
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('afic_assessment_responses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error loading CRM leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('afic_assessment_responses')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setLeads(leads.map(lead => 
        lead.id === id ? { ...lead, status: newStatus } : lead
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status.');
    }
  };

  const getStatusBadge = (status) => {
    const s = statusOptions.find(opt => opt.value === status) || statusOptions[0];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.color}`}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-[#cda434] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 font-medium">Carregando CRM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-up">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Triagem & Formulários</h2>
          <p className="text-gray-500 dark:text-gray-400">Acompanhe e gerencie as aplicações do Assessment.</p>
        </div>
        <div className="bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 flex gap-4 text-sm font-medium shadow-sm">
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs">Total</span>
            <span className="text-xl font-bold text-[#cda434]">{leads.length}</span>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs">Novos</span>
            <span className="text-xl font-bold text-blue-500">
              {leads.filter(l => l.status === 'novo' || !l.status).length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma submissão recebida.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {leads.map((lead) => {
              const isExpanded = expandedLead === lead.id;
              // Format date DD/MM/YYYY
              const dateObj = new Date(lead.created_at);
              const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
              
              return (
                <div key={lead.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#0c2a4a]">
                  
                  {/* Row header */}
                  <div 
                    onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-[#051829] flex items-center justify-center text-[#cda434] font-bold shrink-0">
                        {lead.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{lead.nome}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{lead.email}</span>
                          <span className="hidden md:inline">•</span>
                          <span>{lead.whatsapp}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 justify-between md:justify-end">
                      <span className="text-xs text-gray-400 font-medium">{dateStr}</span>
                      
                      {/* Status Dropdown - Stop Propagation so row doesn't expand when changing status */}
                      <div className="relative group" onClick={e => e.stopPropagation()}>
                        <select 
                          value={lead.status || 'novo'}
                          onChange={(e) => updateStatus(lead.id, e.target.value, e)}
                          className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border outline-none
                            ${(statusOptions.find(o => o.value === (lead.status || 'novo')) || statusOptions[0]).color}
                          `}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="text-gray-900 bg-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {/* Custom arrow for select to fit the badge look */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                          <svg className="w-3 h-3 text-current opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>

                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Body (Answers) */}
                  {isExpanded && (
                    <div className="px-6 py-5 bg-gray-50/50 dark:bg-[#071d36] border-t border-gray-100 dark:border-gray-800">
                      <h5 className="text-sm font-bold text-[#cda434] mb-4 uppercase tracking-wider">Mapeamento de Perfil</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {Object.entries(questionMap).map(([key, question]) => (
                          <div key={key} className="bg-white dark:bg-[#0a2540] p-3 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-xs text-gray-500 font-medium mb-1">{question}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                              {getAnswerText(key, lead[key]) || <span className="text-gray-400 italic">Não respondido</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <a 
                          href={formatWhatsAppLink(lead.whatsapp, lead.nome)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#20bd5a] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          Iniciar Chamada
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
