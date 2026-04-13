import React from 'react';
import { useUserProfile } from './UserProfileContext';

export const DashboardWidgets = () => {
  const { userProfile } = useUserProfile();

  if (userProfile === 'iniciante') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Card 1: Fôlego Financeiro */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Fôlego Financeiro</h4>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">🚀</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">3.5 <span className="text-xl font-medium text-gray-500">meses</span></div>
            <p className="text-sm text-gray-600">Sobrevivência garantida com sua reserva atual.</p>
          </div>
        </div>

        {/* Card 2: Quitação de Dívidas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Quitação de Dívidas</h4>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">🔥</div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <div className="text-3xl font-bold text-gray-900">45%</div>
              <div className="text-sm text-gray-500 font-medium mb-1">Concluído</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-right">Faltam R$ 12.450 para zerar.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Card 1: Net Worth */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Patrimônio Líquido Total</h4>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">💎</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-gray-900 mb-1">R$ 1.250.000</div>
          <div className="flex items-center text-sm mt-2">
            <span className="text-emerald-600 font-medium flex items-center">↑ +4.2%</span>
            <span className="text-gray-500 ml-2">em relação ao mês passado</span>
          </div>
        </div>
      </div>

      {/* Card 2: Rentabilidade Real vs Inflação */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Acima da Inflação (12m)</h4>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">📈</div>
        </div>
        <div>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold text-gray-900 mb-1">6.8%</div>
            <div className="text-sm font-medium text-gray-500">Ganho Real</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase">A Carteira</p>
              <p className="font-semibold text-gray-900">11.3%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">A Inflação (IPCA)</p>
              <p className="font-semibold text-gray-900">4.5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
