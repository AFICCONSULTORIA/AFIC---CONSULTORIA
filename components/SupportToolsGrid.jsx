import React from 'react';

export const SupportToolsGrid = () => {
  return (
    <div className="space-y-10 w-full max-w-5xl">
      {/* Grupo: Ferramentas de Base */}
      <section>
        <div className="flex items-center space-x-3 mb-5">
          <div className="h-6 w-1 base bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Ferramentas de Base</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button className="group flex text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-200">
            <div className="mr-5 p-4 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors h-min">⚔️</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Destruidor de Dívidas</h3>
              <p className="font-normal text-sm text-gray-600 mt-2 leading-relaxed">Crie um plano matemático para quitar o que você deve focado em destruir os juros primeiro.</p>
            </div>
          </button>

          <button className="group flex text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-200">
            <div className="mr-5 p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors h-min">🗺️</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Mapa do Dinheiro Invisível</h3>
              <p className="font-normal text-sm text-gray-600 mt-2 leading-relaxed">Ache despesas fantasmas e libere fluxo de caixa escondido nos seus extratos mensais.</p>
            </div>
          </button>
        </div>
      </section>

      {/* Grupo: Ferramentas de Otimização */}
      <section>
        <div className="flex items-center space-x-3 mb-5">
          <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Ferramentas de Otimização</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button className="group flex text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div className="mr-5 p-4 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors h-min">🕵️‍♂️</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Auditoria de Custos Ocultos</h3>
              <p className="font-normal text-sm text-gray-600 mt-2 leading-relaxed">Calcule perfeitamente o impacto das taxas de corretagem sobre seu patrimônio no longo prazo.</p>
            </div>
          </button>

          <button className="group flex text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div className="mr-5 p-4 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors h-min">💸</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Projetor de Renda Passiva Real</h3>
              <p className="font-normal text-sm text-gray-600 mt-2 leading-relaxed">Simule o dia exato da sua independência financeira já descontando a inflação corrosiva.</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
