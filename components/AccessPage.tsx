import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { canManageUsers } from '../services/access';
import { labelRole } from '../services/format';
import type { ProjectRole } from '../types';
import { AccessDenied, Button, Empty, Field, PageHeader, Select, TextInput } from './ui';

export const AccessPage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const users = useAppStore(s => s.users);
  const grants = useAppStore(s => s.grants);
  const projects = useAppStore(s => s.projects);
  const inviteUser = useAppStore(s => s.inviteUser);
  const setOrgAdmin = useAppStore(s => s.setOrgAdmin);
  const grantAccess = useAppStore(s => s.grantAccess);
  const revokeAccess = useAppStore(s => s.revokeAccess);
  const deactivateUser = useAppStore(s => s.deactivateUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orgAdmin, setAdminFlag] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [role, setRole] = useState<ProjectRole>('TeamMember');

  if (!canManageUsers(user)) return <AccessDenied what="access administration" />;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="People, roles, and project access"
        lede="Invitations stay pending until accepted. Deactivation closes sign-in and keeps the person's name on historical tasks, comments, blockers, evidence, and approvals."
      />
      <form
        className="bg-white border border-stone-200 rounded-2xl p-4 grid md:grid-cols-2 gap-3 mb-5"
        onSubmit={e => {
          e.preventDefault();
          const saved = inviteUser({ name, email, orgAdmin, projectId: orgAdmin ? undefined : projectId, role: orgAdmin ? undefined : role });
          if (saved) { setName(''); setEmail(''); }
        }}
      >
        <h2 className="md:col-span-2 font-semibold">Invite</h2>
        <Field label="Name"><TextInput value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Email"><TextInput type="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={orgAdmin} onChange={e => setAdminFlag(e.target.checked)} />
          Organization admin
        </label>
        {!orgAdmin && (
          <>
            <Field label="Project">
              <Select value={projectId} onChange={e => setProjectId(e.target.value)}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Project role">
              <Select value={role} onChange={e => setRole(e.target.value as ProjectRole)}>
                <option value="ProjectManager">Project Manager</option>
                <option value="TeamLead">Team Lead</option>
                <option value="TeamMember">Team Member</option>
              </Select>
            </Field>
          </>
        )}
        <div><Button type="submit">Send invitation</Button></div>
      </form>

      {users.length === 0 && <Empty>No users.</Empty>}
      <div className="space-y-3">
        {users.map(person => {
          const personGrants = grants.filter(g => g.userId === person.id);
          return (
            <article key={person.id} className="bg-white border border-stone-200 rounded-2xl p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{person.name}</h2>
                  <div className="text-sm text-stone-500">{person.email} · {person.status}{person.orgAdmin ? ' · Admin' : ''}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {person.status !== 'deactivated' && (
                    <Button tone="ghost" onClick={() => setOrgAdmin(person.id, !person.orgAdmin)}>
                      {person.orgAdmin ? 'Remove admin' : 'Make admin'}
                    </Button>
                  )}
                  {person.status !== 'deactivated' && person.id !== user?.id && (
                    <Button tone="danger" onClick={() => deactivateUser(person.id)}>Deactivate</Button>
                  )}
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {personGrants.map(grant => {
                  const project = projects.find(p => p.id === grant.projectId);
                  return (
                    <li key={grant.id} className="flex flex-wrap items-center gap-2">
                      <span className="w-48">{project?.name}</span>
                      <Select
                        className="w-48"
                        value={grant.role}
                        onChange={e => grantAccess(person.id, grant.projectId, e.target.value as ProjectRole)}
                      >
                        <option value="ProjectManager">{labelRole('ProjectManager')}</option>
                        <option value="TeamLead">{labelRole('TeamLead')}</option>
                        <option value="TeamMember">{labelRole('TeamMember')}</option>
                      </Select>
                      <Button tone="ghost" onClick={() => revokeAccess(grant.id)}>Revoke</Button>
                    </li>
                  );
                })}
              </ul>
              {person.status !== 'deactivated' && (
                <GrantForm
                  projects={projects.filter(p => !personGrants.some(g => g.projectId === p.id))}
                  onGrant={(pid, nextRole) => grantAccess(person.id, pid, nextRole)}
                />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

function GrantForm({
  projects,
  onGrant,
}: {
  projects: { id: string; name: string }[];
  onGrant: (projectId: string, role: ProjectRole) => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [role, setRole] = useState<ProjectRole>('TeamMember');
  if (projects.length === 0) return null;
  return (
    <form
      className="mt-3 flex flex-wrap gap-2 items-end"
      onSubmit={e => { e.preventDefault(); if (projectId) onGrant(projectId, role); }}
    >
      <Field label="Grant another project">
        <Select value={projectId} onChange={e => setProjectId(e.target.value)}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <Select value={role} onChange={e => setRole(e.target.value as ProjectRole)} className="w-48">
        <option value="ProjectManager">Project Manager</option>
        <option value="TeamLead">Team Lead</option>
        <option value="TeamMember">Team Member</option>
      </Select>
      <Button type="submit" tone="ghost">Grant</Button>
    </form>
  );
}
