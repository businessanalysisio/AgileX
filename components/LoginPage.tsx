import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { labelRole } from '../services/format';
import { ToastHost } from './ui';

const BLURB: Record<string, string> = {
  'u-minh': 'PM on both projects. Opens the six-panel governance dashboard.',
  'u-hoa': 'Harbor lead. Sees only her assigned discovery and launch work, not the build tasks.',
  'u-khoa': 'Clinic lead. Sees intake work. The lab interface stays hidden.',
  'u-an': 'Harbor member. Can update tasks he owns. Other Harbor tasks are visible but locked.',
  'u-bao': 'Harbor member. Owns field mapping.',
  'u-mai': 'Clinic member. Owns consent copy and the lab interface.',
  'u-lan': 'Admin. Invites people, assigns roles, grants or revokes project access, and deactivates accounts.',
  'u-que': 'Pending invitation. Accept it, then sign in.',
  'u-duc': 'Deactivated. Sign-in is refused. His comment on H-01 stays attributed to him.',
};

export const LoginPage: React.FC = () => {
  const users = useAppStore(s => s.users);
  const grants = useAppStore(s => s.grants);
  const projects = useAppStore(s => s.projects);
  const login = useAppStore(s => s.login);
  const acceptInvite = useAppStore(s => s.acceptInvite);
  const [selected, setSelected] = useState<string | null>('u-minh');

  const roleOf = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.orgAdmin) return 'Admin';
    const grant = grants.find(g => g.userId === userId);
    return grant ? labelRole(grant.role) : 'No project role';
  };

  return (
    <div className="min-h-screen bg-[#1c1915] text-stone-100">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.2em] text-teal-300">Northline</div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mt-2">Project & task governance</h1>
          <p className="text-stone-300 mt-3 max-w-2xl">
            Pick a demo account. Each role sees a different slice of the same projects: tasks, blockers, evidence, conditional scope, timeline, access, and approval.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {users.map(user => {
            const projectsFor = grants
              .filter(g => g.userId === user.id)
              .map(g => projects.find(p => p.id === g.projectId)?.name)
              .filter(Boolean)
              .join(', ');
            const active = selected === user.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelected(user.id)}
                className={`text-left rounded-2xl border p-4 ${active ? 'border-teal-400 bg-stone-900' : 'border-stone-700 bg-stone-900/40 hover:border-stone-500'}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-teal-200">{roleOf(user.id)}</div>
                </div>
                <div className="text-xs text-stone-400 mt-1">{user.status}{projectsFor ? ` · ${projectsFor}` : ''}</div>
                <p className="text-sm text-stone-300 mt-2">{BLURB[user.id]}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && login(selected)}
            className="px-4 py-2.5 rounded-xl bg-teal-500 text-stone-950 font-semibold disabled:opacity-40"
          >
            Sign in
          </button>
          {selected && users.find(u => u.id === selected)?.status === 'pending' && (
            <button
              type="button"
              onClick={() => acceptInvite(selected)}
              className="px-4 py-2.5 rounded-xl border border-stone-500"
            >
              Accept invitation
            </button>
          )}
        </div>
      </div>
      <ToastHost />
    </div>
  );
};
