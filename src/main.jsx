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
import { LandingPage } from './components/LandingPage';

// Importa o script vanilla JS antigo, garantindo que rode normalmente
import '../app.js';

// O componente App coordena onde renderizar cada funcionalidade React (Portals)
const ReactApp = () => {
  const dashboardRoot = document.getElementById('react-dashboard-root');
  const educationRoot = document.getElementById('react-education-root');
  const toolsRoot = document.getElementById('react-tools-root');
  const communityRoot = document.getElementById('react-community-root');
  const landingRoot = document.getElementById('react-landing-root');

  const handleEnterSystem = () => {
    document.getElementById('page-home')?.classList.add('page-hidden');
    document.getElementById('page-dashboard')?.classList.remove('page-hidden');
    window.switchPage?.('dashboard');
  };

  window.showLoginModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.right = '0';
      modal.style.bottom = '0';
      modal.style.background = 'rgba(0,0,0,0.9)';
      modal.style.zIndex = '9999';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
    }
    console.log('showLoginModal called');
  };

  const handleLoginClick = () => {
    window.showLoginModal?.();
  };

  const handleCloseLogin = () => {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
      authModal.style.display = 'none';
    }
  };

  return (
    <UserProfileProvider>
      {landingRoot && createPortal(
        <LandingPage onEnterSystem={handleEnterSystem} onLoginClick={handleLoginClick} />,
        landingRoot
      )}

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
