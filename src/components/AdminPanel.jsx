import React, { useState } from 'react';
import { AcademyAdmin } from './AcademyAdmin';
import { CRMAdmin } from './CRMAdmin';
import { AlunosAdmin } from './AlunosAdmin';
import { TelemetriaAdmin } from './TelemetriaAdmin';
import { FinanceiroAdmin } from './FinanceiroAdmin';
import { AcademyProvider } from './AcademyContext';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('crm');

  const tabs = [
    { id: 'crm', label: 'CRM & Triagem' },
    { id: 'alunos', label: 'Gestão de Alunos' },
    { id: 'telemetria', label: 'Telemetria' },
    { id: 'financeiro', label: 'Motor Financeiro' },
    { id: 'conteudo', label: 'Conteúdo' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      
      {/* Top Navigation Menu */}
      <div className="bg-white dark:bg-[#0a2540] border-b border-gray-200 dark:border-gray-800 shadow-sm z-10 sticky top-0">
        <div className="px-4 md:px-8">
          <div className="flex space-x-1 md:space-x-8 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-3 md:px-1 whitespace-nowrap border-b-2 font-medium text-sm md:text-base transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-[#cda434] text-[#cda434]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full bg-gray-50 dark:bg-[#051829]">
        
        {/* CRM */}
        {activeTab === 'crm' && (
          <CRMAdmin />
        )}

        {/* Gestão de Alunos */}
        {activeTab === 'alunos' && (
          <AlunosAdmin />
        )}

        {/* Telemetria */}
        {activeTab === 'telemetria' && (
          <TelemetriaAdmin />
        )}

        {/* Motor Financeiro */}
        {activeTab === 'financeiro' && (
          <FinanceiroAdmin />
        )}

        {/* Conteúdo Section */}
        {activeTab === 'conteudo' && (
          <div className="py-8 px-4 max-w-6xl mx-auto animate-fade-in-up">
            <AcademyProvider>
              <AcademyAdmin onExit={() => window.switchPage('dashboard')} />
            </AcademyProvider>
          </div>
        )}
      </div>

    </div>
  );
};
