import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { canViewTask, isOrgAdmin, pmProjectIds } from '../services/access';
import { formatWhen } from '../services/format';
import { Empty, PageHeader, TextInput } from './ui';

export const AuditPage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const audit = useAppStore(s => s.audit);
  const tasks = useAppStore(s => s.tasks);
  const grants = useAppStore(s => s.grants);
  const [query, setQuery] = useState('');

  const pmIds = pmProjectIds(user, grants);
  const admin = isOrgAdmin(user);
  const rows = [...audit]
    .filter(entry => {
      if (admin) return true;
      if (entry.projectId && pmIds.includes(entry.projectId)) return true;
      if (entry.taskId) {
        const task = tasks.find(t => t.id === entry.taskId);
        return Boolean(task && canViewTask(user, task, grants));
      }
      if (entry.entityType === 'user' || entry.entityType === 'access') return false;
      return false;
    })
    .filter(entry => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return `${entry.summary} ${entry.actorName} ${entry.action} ${entry.before ?? ''} ${entry.after ?? ''}`.toLowerCase().includes(q);
    })
    .sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div>
      <PageHeader
        eyebrow="Audit"
        title="Immutable record"
        lede="Entries cannot be edited or deleted, including by an admin. A deactivated person's name stays on the actions they took."
      />
      <div className="max-w-sm mb-4">
        <TextInput value={query} placeholder="Search the log" onChange={e => setQuery(e.target.value)} />
      </div>
      {rows.length === 0 && <Empty>No audit entries in your scope.</Empty>}
      <ol className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100">
        {rows.map(entry => (
          <li key={entry.id} className="px-4 py-3 text-sm">
            <div className="text-stone-400">{formatWhen(entry.at)} · {entry.action}</div>
            <div>{entry.actorName}: {entry.summary}</div>
            {(entry.before || entry.after) && (
              <div className="text-stone-500">{entry.before ? `${entry.before} → ` : ''}{entry.after}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};
