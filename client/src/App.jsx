import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { FacebookPage } from './pages/FacebookPage';
import { Posts } from './pages/Posts';
import { Scheduler } from './pages/Scheduler';
import { Analytics } from './pages/Analytics';
import { Automation } from './pages/Automation';
import { NewsAutomation } from './pages/NewsAutomation';
import { Settings } from './pages/Settings';

const AppContent = () => {
  const { activeTab } = useDashboard();

  switch (activeTab) {
    case 'dashboard':
      return <Dashboard />;
    case 'page':
      return <FacebookPage />;
    case 'posts':
      return <Posts />;
    case 'scheduler':
      return <Scheduler />;
    case 'analytics':
      return <Analytics />;
    case 'automation':
      return <Automation />;
    case 'news':
      return <NewsAutomation />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
};

export default function App() {
  return (
    <DashboardProvider>
      <DashboardLayout>
        <AppContent />
      </DashboardLayout>
    </DashboardProvider>
  );
}
