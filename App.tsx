import React, { useEffect } from 'react';
import { useAppStore, syncRouteFromHash } from './store/appStore';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { TasksPage } from './components/TasksPage';
import { TaskDetailPage } from './components/TaskDetailPage';
import { TimelinePage } from './components/TimelinePage';
import { BlockersPage } from './components/BlockersPage';
import { EvidencePage } from './components/EvidencePage';
import { ScopePage } from './components/ScopePage';
import { ApprovalsPage } from './components/ApprovalsPage';
import { AccessPage } from './components/AccessPage';
import { AuditPage } from './components/AuditPage';

const App: React.FC = () => {
  const currentUserId = useAppStore(s => s.currentUserId);
  const route = useAppStore(s => s.route);

  useEffect(() => {
    const onHash = () => syncRouteFromHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!currentUserId) return <LoginPage />;

  const page = () => {
    if (route.page === 'tasks' && route.taskId) return <TaskDetailPage key={route.taskId} taskId={route.taskId} />;
    switch (route.page) {
      case 'dashboard': return <DashboardPage />;
      case 'tasks': return <TasksPage />;
      case 'timeline': return <TimelinePage />;
      case 'blockers': return <BlockersPage />;
      case 'evidence': return <EvidencePage />;
      case 'scope': return <ScopePage />;
      case 'approvals': return <ApprovalsPage />;
      case 'access': return <AccessPage />;
      case 'audit': return <AuditPage />;
      default: return <DashboardPage />;
    }
  };

  return <Layout>{page()}</Layout>;
};

export default App;
