import React, { useState } from 'react';
import { useUserProfile } from './UserProfileContext';
import { DebtDestroyerCalc, FeeAuditorCalc } from './Calculators';

export const QuickToolsBar = () => {
    const { profile } = useUserProfile();
    const [activeTool, setActiveTool] = useState(null);

    // Determines tool access based on tier
    const isBeginner = profile.tier === 'iniciante';
    
    // Tools definition
    const tools = [
        {
            id: 'debt',
            title: 'Destruidor de Dívidas',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
            ),
            component: <DebtDestroyerCalc />,
            color: 'text-red-400'
        },
        {
            id: 'fee',
            title: 'Auditoria de Custos',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
            ),
            component: <FeeAuditorCalc />,
            color: 'text-amber-500'
        }
    ];

    const availableTools = isBeginner ? [tools[0]] : tools;

    const toggleTool = (id) => {
        if (activeTool === id) {
            setActiveTool(null);
        } else {
            setActiveTool(id);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="w-full bg-[#1A1D24] border border-[#2A2E39] rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#E5B94E]/10 border border-[#E5B94E]/20 flex items-center justify-center text-[#E5B94E] flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                            <line x1="6" y1="6" x2="6.01" y2="6"/>
                            <line x1="6" y1="18" x2="6.01" y2="18"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-base m-0">Ferramentas Integradas</h3>
                        <p className="text-sm text-gray-400 m-0">Acesse simulações inteligentes sem sair da Visão Geral</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full lg:w-auto mt-4 lg:mt-0">
                    {availableTools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => toggleTool(tool.id)}
                            className={`flex-1 lg:flex-none flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 border text-sm ${
                                activeTool === tool.id 
                                ? `bg-[#E5B94E] text-[#0A0C10] border-[#E5B94E] shadow-[0_0_15px_rgba(229,185,78,0.2)]` 
                                : `bg-[#0A0C10] text-gray-300 border-[#2A2E39] hover:border-[#4A5165] hover:bg-[#11141A]`
                            } whitespace-nowrap`}
                        >
                            <span className={activeTool === tool.id ? 'text-[#0A0C10]' : tool.color}>{tool.icon}</span>
                            {tool.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Expansible accordion area */}
            <div 
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    activeTool ? 'max-h-[2500px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0 pt-0'
                }`}
            >
                {activeTool && (
                    <div className="bg-[#1A1D24] border border-[#E5B94E]/30 rounded-xl p-1 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative">
                        {/* Close button in top right */}
                        <button 
                            onClick={() => setActiveTool(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 bg-[#0A0C10] border border-[#2A2E39] rounded-full p-1.5"
                            title="Fechar ferramenta"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                        
                        <div className="transition-opacity duration-500 delay-150 relative">
                            {tools.find(t => t.id === activeTool)?.component}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
