import React from 'react';
import { useAppStore } from '../store/appStore';
import { hasPermission } from '../services/rbacService';
import { ROLE_LABELS } from '../constants';
import { Avatar } from './ui/Avatar';
import type { PageId } from '../types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon: React.FC<{ d: string; className?: string }> = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS: Record<string, string> = {
  dashboard:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  contributions:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  members:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0',
  reputation:   'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  governance:   'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  rewards:      'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  analytics:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  settings:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  logout:       'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu:         'M4 6h16M4 12h16M4 18h16',
  bell:         'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
};

interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  requiredPermission?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',     label: 'Dashboard',      icon: 'dashboard' },
  { id: 'contributions', label: 'Contributions',  icon: 'contributions' },
  { id: 'members',       label: 'Members',        icon: 'members' },
  { id: 'reputation',    label: 'Reputation',     icon: 'reputation' },
  { id: 'governance',    label: 'Governance',     icon: 'governance' },
  { id: 'rewards',       label: 'Rewards',        icon: 'rewards' },
  { id: 'analytics',     label: 'Analytics',      icon: 'analytics' },
  { id: 'settings',      label: 'Settings',       icon: 'settings', adminOnly: true },
];

// ─── Notification Toast ───────────────────────────────────────────────────────

const NotificationToast: React.FC = () => {
  const notification = useAppStore(s => s.notification);
  if (!notification) return null;
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  };
  const icons = {
    success: '✓', error: '✕', info: 'ℹ',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 border rounded-xl px-4 py-3 shadow-lg text-sm font-medium flex items-center gap-2 animate-pulse ${colors[notification.type]}`}>
      <span className="text-base">{icons[notification.type]}</span>
      {notification.message}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar: React.FC = () => {
  const { currentUser, currentPage, navigate, logout, isSidebarOpen } = useAppStore();

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !hasPermission(currentUser, 'configure_system')) return false;
    return true;
  });

  return (
    <aside className={`${isSidebarOpen ? 'w-60' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        {isSidebarOpen && (
          <div>
            <div className="text-sm font-bold leading-tight">CoopContrib</div>
            <div className="text-xs text-gray-400">Management Platform</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <Icon d={ICONS[item.icon]} className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      {currentUser && (
        <div className="border-t border-gray-700 p-3">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <Avatar initials={currentUser.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{ROLE_LABELS[currentUser.role]}</p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <Icon d={ICONS.logout} className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={logout} title="Logout" className="w-full flex justify-center text-gray-400 hover:text-white">
              <Icon d={ICONS.logout} className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────

const PAGE_TITLES: Partial<Record<PageId, string>> = {
  dashboard:     'Dashboard',
  contributions: 'Contributions',
  members:       'Members',
  reputation:    'Reputation & Leaderboard',
  governance:    'Governance',
  rewards:       'Rewards',
  analytics:     'Analytics',
  settings:      'Settings',
  profile:       'Member Profile',
};

const Header: React.FC = () => {
  const { currentPage, toggleSidebar, currentUser } = useAppStore();
  const pendingCount = useAppStore(s => s.contributions.filter(c => c.approvalStatus === 'pending').length);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icon d={ICONS.menu} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{PAGE_TITLES[currentPage] ?? 'Dashboard'}</h1>
      </div>
      <div className="flex items-center gap-4">
        {(hasPermission(currentUser, 'review_contributions') || hasPermission(currentUser, 'approve_contributions')) && pendingCount > 0 && (
          <div className="relative">
            <Icon d={ICONS.bell} className="w-5 h-5 text-gray-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          </div>
        )}
        {currentUser && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Avatar initials={currentUser.avatar} size="sm" />
            <span className="font-medium hidden sm:block">{currentUser.name}</span>
          </div>
        )}
      </div>
    </header>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen bg-gray-50 overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
    <NotificationToast />
  </div>
);
