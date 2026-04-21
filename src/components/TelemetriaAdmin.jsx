import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const TelemetriaAdmin = () => {
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    totalAlunos: 0,
    alunosAtivos: 0,
    receitaTotal: 0,
    leadsMensais: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Assessment Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('afic_assessment_responses')
        .select('created_at, status');
      
      if (leadsError) throw leadsError;

      // 2. Fetch Alunos
      const { data: alunosData, error: alunosError } = await supabase
        .from('afic_alunos')
        .select('status_pagamento, valor_pago');

      if (alunosError) throw alunosError;

      // Process Metrics
      const totalLeads = leadsData ? leadsData.length : 0;
      const totalAlunos = alunosData ? alunosData.length : 0;
      const alunosAtivos = alunosData ? alunosData.filter(a => a.status_pagamento === 'aprovado').length : 0;
      
      const receitaTotal = alunosData ? alunosData.reduce((acc, curr) => {
        return acc + (parseFloat(curr.valor_pago) || 0);
      }, 0) : 0;

      // Calculate monthly leads (simulated simple chart data)
      const months = Array(6).fill(0).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return { 
          monthIndex: d.getMonth(), 
          label: d.toLocaleDateString('pt-BR', { month: 'short' }),
          count: 0
        };
      });

      if (leadsData) {
        leadsData.forEach(lead => {
          const lDate = new Date(lead.created_at);
          const monthOpt = months.find(m => m.monthIndex === lDate.getMonth() && lDate.getFullYear() === new Date().getFullYear());
          if (monthOpt) monthOpt.count++;
        });
      }

      setMetrics({
        totalLeads,
        totalAlunos,
        alunosAtivos,
        receitaTotal,
        leadsMensais: months
      });

    } catch (err) {
      console.error('Error loading telemetria:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxChartVal = metrics.leadsMensais.reduce((max, cur) => Math.max(max, cur.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-[#cda434] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 font-medium">Extraindo dados telemétricos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Telemetria & BI</h2>
        <p className="text-gray-500 dark:text-gray-400">Hub de inteligência de negócios da AFIC Consultoria.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Receita Card */}
        <div className="bg-gradient-to-br from-[#0a2540] to-[#071a2d] rounded-2xl p-6 shadow-lg border border-gray-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-5 blur-2xl"></div>
          <p className="text-gray-400 text-sm font-medium mb-1">Receita Gerada</p>
          <h3 className="text-3xl font-bold text-[#cda434]">
            R$ {metrics.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            <span>LTV Saudável</span>
          </div>
        </div>

        {/* Alunos Ativos */}
        <div className="bg-white dark:bg-[#0a2540] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Matrículas Ativas</p>
            <div className="bg-green-100 text-green-800 rounded p-1.5 dark:bg-green-900/30 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics.alunosAtivos}
          </h3>
          <p className="mt-2 text-xs text-gray-500">De {metrics.totalAlunos} cadastros totais</p>
        </div>

        {/* Leads Gerados */}
        <div className="bg-white dark:bg-[#0a2540] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Leads (Assessment)</p>
            <div className="bg-blue-100 text-blue-800 rounded p-1.5 dark:bg-blue-900/30 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics.totalLeads}
          </h3>
          <p className="mt-2 text-xs text-gray-500">Potenciais clientes mapeados</p>
        </div>

        {/* Taxa de Conversão Mock */}
        <div className="bg-white dark:bg-[#0a2540] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Taxa de Conversão</p>
            <div className="bg-purple-100 text-purple-800 rounded p-1.5 dark:bg-purple-900/30 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics.totalLeads > 0 ? ((metrics.alunosAtivos / metrics.totalLeads) * 100).toFixed(1) : 0}%
          </h3>
          <p className="mt-2 text-xs text-gray-500">Média em todo o período</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-[#0a2540] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Captação de Leads (Últimos 6 meses)</h3>
        <div className="h-48 flex items-end justify-between gap-2 overflow-x-auto pb-2">
          {metrics.leadsMensais.map((month, idx) => {
            const heightPerc = Math.max((month.count / maxChartVal) * 100, 5); // min 5% height
            return (
              <div key={idx} className="flex flex-col items-center flex-1 min-w-[50px] group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-gray-700 dark:text-white mb-2">
                  {month.count}
                </div>
                <div 
                  className="w-full max-w-[40px] bg-gradient-to-t from-blue-700 to-blue-400 rounded-t-sm transition-all duration-500"
                  style={{ height: `${heightPerc}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-3 font-medium capitalize">{month.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};
