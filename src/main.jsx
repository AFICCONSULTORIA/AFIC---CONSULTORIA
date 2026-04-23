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
import { PricingPage } from './components/PricingPage';
import { SubscriptionProvider } from './components/SubscriptionContext';
import { TierProvider } from './components/TierContext';
import { AdminPanel } from './components/AdminPanel';
import { LandingPage } from './components/LandingPage';

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

// Aplica tema salvo no carregamento
const savedTheme = localStorage.getItem('afic-theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

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
const ReactApp = ({ isAdmin = false }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('afic-theme') === 'dark');
  
  useEffect(() => {
    const handleThemeChange = (e) => {
      setIsDark(e.detail.dark);
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  
  const landingRoot = document.getElementById('react-landing-root');
  const dashboardRoot = document.getElementById('react-dashboard-root');
  const educationRoot = document.getElementById('react-education-root');
  const toolsRoot = document.getElementById('react-tools-root');
  const communityRoot = document.getElementById('react-community-root');
  const pricingRoot = document.getElementById('react-pricing-root');
  const adminRoot = document.getElementById('react-admin-root');

  return (
    <TierProvider>
      <FinancialProvider>
        <UserProfileProvider>
          {landingRoot && createPortal(
            <LandingPage />,
            landingRoot
          )}
          {adminRoot && createPortal(
            <AdminPanel />,
            adminRoot
          )}
          {dashboardRoot && createPortal(
            <div className="space-y-6">
              <ProfileOnboarding />
              <DashboardWidgets />
            </div>,
            dashboardRoot
          )}
          {!dashboardRoot && (
            <div className="space-y-6">
              <ProfileOnboarding />
            </div>
          )}

        {toolsRoot && createPortal(
          <div className="pt-6">
            <FinancialTools />
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

      {pricingRoot && createPortal(
        <SubscriptionProvider>
          <PricingPage />
        </SubscriptionProvider>,
        pricingRoot
      )}
      </UserProfileProvider>
    </FinancialProvider>
  </TierProvider>
);
};

// Ponto de entrada Global do React
document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.id = 'react-global-container';
  container.style.cssText = 'position:absolute;z-index:0;pointer-events:none;';
  document.body.appendChild(container);

  const isAdmin = window.adminMode || window.location.pathname.includes('admin-plans') || window.location.href.includes('admin-plans');
  
  ReactDOM.createRoot(container).render(
    <ReactApp isAdmin={isAdmin} />
  );
});
