import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { canManageUsers, isLeadOnAnyProject, isPmOnAnyProject } from '../services/access';
import { formatWhen, labelRole } from '../services/format';
import type { PageId } from '../types';
import { ToastHost } from './ui';

const NAV: { id: PageId; label: string; group: 'work' | 'govern' | 'admin' }[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'work' },
  { id: 'tasks', label: 'Tasks', group: 'work' },
  { id: 'timeline', label: 'Timeline', group: 'work' },
  { id: 'blockers', label: 'Blockers', group: 'work' },
  { id: 'evidence', label: 'Evidence', group: 'work' },
  { id: 'scope', label: 'Conditional scope', group: 'govern' },
  { id: 'approvals', label: 'Readiness', group: 'govern' },
  { id: 'access', label: 'Access', group: 'admin' },
  { id: 'audit', label: 'Audit log', group: 'admin' },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const route = useAppStore(s => s.route);
  const navigate = useAppStore(s => s.navigate);
  const logout = useAppStore(s => s.logout);
  const notifications = useAppStore(s => s.notifications.filter(n => n.userId === s.currentUserId));
  const markRead = useAppStore(s => s.markNotificationsRead);
  const [openNav, setOpenNav] = useState(false);
  const [openNotes, setOpenNotes] = useState(false);

  if (!user) return null;

  const show = (id: PageId) => {
    if (id === 'scope') return isPmOnAnyProject(user, grants);
    if (id === 'approvals') return isLeadOnAnyProject(user, grants) || isPmOnAnyProject(user, grants);
    if (id === 'access') return canManageUsers(user);
    return true;
  };

  const roleLabel = user.orgAdmin ? 'Admin' : labelRole(grants.find(g => g.userId === user.id)?.role ?? 'TeamMember');
  const unread = notifications.filter(n => !n.read).length;

  const nav = (
    <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
      {(['work', 'govern', 'admin'] as const).map(group => {
        const items = NAV.filter(item => item.group === group && show(item.id));
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <div className="px-2 mb-1 text-[10px] uppercase tracking-[0.18em] text-stone-500">{group}</div>
            {items.map(item => {
              const active = route.page === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { navigate({ page: item.id }); setOpenNav(false); }}
                  className={`w-full text-left px-2 py-2 rounded-lg text-sm mb-0.5 ${active ? 'bg-teal-800 text-white' : 'text-stone-200 hover:bg-stone-800'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f4f0e6] text-stone-900 flex">
      <aside className="hidden md:flex w-60 bg-stone-950 text-stone-100 flex-col">
        <div className="px-4 py-5 border-b border-stone-800">
          <div className="font-serif text-xl leading-none">Northline</div>
          <div className="text-xs text-stone-400 mt-1">Task governance</div>
        </div>
        {nav}
      </aside>

      {openNav && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpenNav(false)} aria-label="Close menu" />
          <aside className="relative w-64 h-full bg-stone-950 text-stone-100 flex flex-col">{nav}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-stone-200 bg-[#fbf8f1] flex items-center justify-between px-4 gap-3">
          <button type="button" className="md:hidden text-sm font-medium" onClick={() => setOpenNav(true)}>Menu</button>
          <div className="text-sm text-stone-500 hidden sm:block">Project & task governance</div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <button
                type="button"
                className="text-sm px-2 py-1 rounded-lg hover:bg-stone-200"
                onClick={() => { setOpenNotes(v => !v); markRead(); }}
              >
                Alerts{unread > 0 ? ` (${unread})` : ''}
              </button>
              {openNotes && (
                <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto bg-white border border-stone-200 rounded-xl shadow-lg z-30">
                  {notifications.length === 0 && <div className="p-4 text-sm text-stone-500">No alerts yet.</div>}
                  {[...notifications].sort((a, b) => b.at.localeCompare(a.at)).map(n => (
                    <div key={n.id} className="px-3 py-2 border-b border-stone-100 text-sm">
                      <div>{n.message}</div>
                      <div className="text-xs text-stone-400 mt-1">{formatWhen(n.at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-[11px] text-stone-500">{roleLabel}</div>
            </div>
            <button type="button" onClick={logout} className="text-sm text-stone-600 hover:text-stone-950">Sign out</button>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
};
