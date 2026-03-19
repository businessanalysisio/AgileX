import React from 'react';
import { useAppStore } from './store/appStore';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { ContributionsPage } from './components/ContributionsPage';
import { MembersPage } from './components/MembersPage';
import { ReputationPage } from './components/ReputationPage';
import { GovernancePage } from './components/GovernancePage';
import { RewardsPage } from './components/RewardsPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { SettingsPage } from './components/SettingsPage';

const App: React.FC = () => {
  const { isAuthenticated, currentPage } = useAppStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'contributions':
        return <ContributionsPage />;
      case 'members':
      case 'profile':
        return <MembersPage />;
      case 'reputation':
        return <ReputationPage />;
      case 'governance':
        return <GovernancePage />;
      case 'rewards':
        return <RewardsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

export default App;
