import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createPortal } from 'react-dom';
import './index.css';

// Importando componentes originais
import { UserProfileProvider } from './components/UserProfileContext';
import { ProfileOnboarding } from './components/ProfileOnboarding';
import { DashboardWidgets } from './components/DashboardWidgets';
import { DebtDestroyerCalc, FeeAuditorCalc } from './components/Calculators';
import { SovereignAcademy } from './components/SovereignAcademy';
import { AcademyProvider } from './components/AcademyContext';
import { FinancialProvider } from './components/FinancialContext';
import { FinancialTools } from './components/FinancialTools';
import { CommunityProvider } from './components/CommunityContext';
import { CommunityForum } from './components/CommunityForum';

// Importa o script vanilla JS antigo, garantindo que rode normalmente
import '../app.js';

// O componente App coordena onde renderizar cada funcionalidade React (Portals)
const ReactApp = () => {
  const dashboardRoot = document.getElementById('react-dashboard-root');
  const educationRoot = document.getElementById('react-education-root');
  const toolsRoot = document.getElementById('react-tools-root');
  const communityRoot = document.getElementById('react-community-root');

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
        Portal 3: Aba de Ferramentas Integrada (Substitui as isoladas)
      */}
      {toolsRoot && createPortal(
        <div className="pt-6">
          <FinancialProvider>
            <FinancialTools />
          </FinancialProvider>
        </div>,
        toolsRoot
      )}

      {/* 
        Portal 5: Sovereign Academy (Educação)
      */}
      {educationRoot && createPortal(
        <div className="pt-6">
          <AcademyProvider>
            <SovereignAcademy />
          </AcademyProvider>
        </div>,
        educationRoot
      )}

      {/* 
        Portal 4: Comunidade Institucional
      */}
      {communityRoot && createPortal(
        <div className="pt-2">
          <CommunityProvider>
            <CommunityForum />
          </CommunityProvider>
        </div>,
        communityRoot
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
