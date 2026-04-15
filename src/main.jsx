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

// Espera o Supabase CDN estar disponível
const waitForSupabase = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (window.supabase?.createClient) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Supabase timeout'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

// Inicializa tudo após Supabase carregar
waitForSupabase().then(() => {
  console.log('Supabase loaded, initializing app...');
  // Executa o app.js
  import('../app.js').then(() => {
    console.log('app.js loaded');
  }).catch(err => {
    console.error('Error loading app.js:', err);
  });
}).catch(err => {
  console.error('Supabase failed to load:', err);
});

// O componente App coordena onde renderizar cada funcionalidade React (Portals)
const ReactApp = () => {
  const dashboardRoot = document.getElementById('react-dashboard-root');
  const educationRoot = document.getElementById('react-education-root');
  const toolsRoot = document.getElementById('react-tools-root');
  const communityRoot = document.getElementById('react-community-root');

  return (
    <UserProfileProvider>
      {dashboardRoot && createPortal(
        <div className="space-y-6">
          <ProfileOnboarding />
          <DashboardWidgets />
        </div>,
        dashboardRoot
      )}

      {toolsRoot && createPortal(
        <div className="pt-6">
          <FinancialProvider>
            <FinancialTools />
          </FinancialProvider>
        </div>,
        toolsRoot
      )}

      {educationRoot && createPortal(
        <div className="pt-6">
          <AcademyProvider>
            <SovereignAcademy />
          </AcademyProvider>
        </div>,
        educationRoot
      )}

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
