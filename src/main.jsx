import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createPortal } from 'react-dom';
import './index.css';
import '../styles.css'; // Legado

// Importando componentes originais
import { UserProfileProvider } from './components/UserProfileContext';
import { ProfileOnboarding } from './components/ProfileOnboarding';
import { DashboardWidgets } from './components/DashboardWidgets';
import { SupportToolsGrid } from './components/SupportToolsGrid';
import { DebtDestroyerCalc, FeeAuditorCalc } from './components/Calculators';

// Importa o script vanilla JS antigo, garantindo que rode normalmente
import '../app.js';

// O componente App coordena onde renderizar cada funcionalidade React (Portals)
const ReactApp = () => {
  const dashboardRoot = document.getElementById('react-dashboard-root');
  const toolsRoot = document.getElementById('react-tools-root');

  return (
    <UserProfileProvider>
      {/* 
        Portal 1: Dashboard
        Aqui colocamos a triagem do perfil e os widgets de visão geral
      */}
      {dashboardRoot && createPortal(
        <div className="space-y-6">
          <ProfileOnboarding />
          <DashboardWidgets />
        </div>,
        dashboardRoot
      )}

      {/* 
        Portal 2: Ferramentas
        Aqui colocamos as calculadoras e demais suportes
      */}
      {toolsRoot && createPortal(
        <div className="space-y-12 pb-24">
          <SupportToolsGrid />
          <DebtDestroyerCalc />
          <FeeAuditorCalc />
        </div>,
        toolsRoot
      )}
    </UserProfileProvider>
  );
};

// Ponto de entrada Global do React
document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.id = 'react-global-container';
  document.body.appendChild(container);

  ReactDOM.createRoot(container).render(<ReactApp />);
});
