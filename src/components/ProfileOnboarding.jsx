import React from 'react';
import { useUserProfile } from './UserProfileContext';

// Componente UI de Triagem
export const ProfileOnboarding = () => {
  const { userProfile, setUserProfile } = useUserProfile();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Qual o seu foco atual?</h3>
      <p className="text-gray-500 mb-6 text-sm">Personalize as ferramentas selecionando seu momento financeiro atual.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Iniciante */}
        <button 
          onClick={() => setUserProfile('iniciante')}
          className={`flex flex-col text-left p-5 rounded-lg border-2 transition-all duration-200 ${
            userProfile === 'iniciante' 
              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' 
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2 w-full">
            <span className="font-semibold text-gray-900">Modo Sobrevivência</span>
            {userProfile === 'iniciante' && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">Ativo</span>
            )}
          </div>
          <p className="text-sm text-gray-600">Sair das dívidas, organizar a casa e montar a reserva de emergência.</p>
        </button>

        {/* Card Avançado */}
        <button 
          onClick={() => setUserProfile('avancado')}
          className={`flex flex-col text-left p-5 rounded-lg border-2 transition-all duration-200 ${
            userProfile === 'avancado' 
              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100' 
              : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2 w-full">
            <span className="font-semibold text-gray-900">Modo Otimização</span>
            {userProfile === 'avancado' && (
              <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-medium">Ativo</span>
            )}
          </div>
          <p className="text-sm text-gray-600">Alocação de ativos, eficiência tributária e geração de renda passiva.</p>
        </button>
      </div>
    </div>
  );
};
