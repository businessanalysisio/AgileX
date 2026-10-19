import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { canManageBlocker, canViewTask, isActiveBlocker } from '../services/access';
import { formatWhen, labelBlocker } from '../services/format';
import { BLOCKER_STATUSES } from '../types';
import { BlockerPill, Button, Empty, Field, PageHeader, Select, TextArea } from './ui';

export const BlockersPage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const tasks = useAppStore(s => s.tasks);
  const blockers = useAppStore(s => s.blockers);
  const users = useAppStore(s => s.users);
  const projects = useAppStore(s => s.projects);
  const audit = useAppStore(s => s.audit);
  const assignBlocker = useAppStore(s => s.assignBlocker);
  const setBlockerProgress = useAppStore(s => s.setBlockerProgress);
  const resolveBlocker = useAppStore(s => s.resolveBlocker);
  const reopenBlocker = useAppStore(s => s.reopenBlocker);
  const navigate = useAppStore(s => s.navigate);
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

  const name = (id?: string) => users.find(u => u.id === id)?.name ?? 'Unassigned';
  const rows = blockers.filter(b => {
    const task = tasks.find(t => t.id === b.taskId);
    if (!task || !canViewTask(user, task, grants)) return false;
    if (status && b.status !== status) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Blockers"
        title="Lifecycle"
        lede="Blockers are never deleted. A project manager assigns, tracks, resolves (with a note), and reopens them. Everyone else can raise one from the task."
      />
      <div className="max-w-xs mb-4">
        <Field label="Status">
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Any</option>
            {BLOCKER_STATUSES.map(s => <option key={s} value={s}>{labelBlocker(s)}</option>)}
          </Select>
        </Field>
      </div>
      {rows.length === 0 && <Empty>No blockers in your scope.</Empty>}
      <div className="space-y-3">
        {rows.map(blocker => {
          const task = tasks.find(t => t.id === blocker.taskId)!;
          const project = projects.find(p => p.id === task.projectId);
          const manage = canManageBlocker(user, task, grants);
          const history = audit.filter(a => a.entityId === blocker.id).sort((a, b) => a.at.localeCompare(b.at));
          return (
            <article key={blocker.id} className={`bg-white border rounded-2xl p-4 ${isActiveBlocker(blocker) ? 'border-rose-200' : 'border-stone-200'}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{blocker.title}</h2>
                  <p className="text-sm text-stone-600 mt-1">{blocker.description}</p>
                  <button type="button" className="text-sm text-teal-800 mt-1" onClick={() => navigate({ page: 'tasks', taskId: task.id })}>
                    {task.code} {task.title} · {project?.name}
                  </button>
                  <div className="text-xs text-stone-500 mt-1">
                    Owner {name(blocker.ownerId)} · Raised by {name(blocker.raisedById)} · {formatWhen(blocker.createdAt)}
                  </div>
                </div>
                <BlockerPill status={blocker.status} />
              </div>
              {blocker.resolutionNote && <p className="text-sm mt-2">Resolution: {blocker.resolutionNote}</p>}
              {blocker.reopenReason && <p className="text-sm mt-1">Reopen reason: {blocker.reopenReason}</p>}
              <button type="button" className="text-sm text-stone-600 mt-2" onClick={() => setOpenId(openId === blocker.id ? null : blocker.id)}>
                {openId === blocker.id ? 'Hide history' : 'History'}
              </button>
              {openId === blocker.id && (
                <div className="mt-3 space-y-3">
                  <ol className="text-sm space-y-1">
                    {history.map(entry => (
                      <li key={entry.id}><span className="text-stone-400">{formatWhen(entry.at)}</span> · {entry.actorName} · {entry.summary}</li>
                    ))}
                  </ol>
                  {manage && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <form className="space-y-2" onSubmit={e => { e.preventDefault(); assignBlocker(blocker.id, ownerId); }}>
                        <Field label="Assign owner">
                          <Select value={ownerId} onChange={e => setOwnerId(e.target.value)} required>
                            <option value="">Choose a person</option>
                            {users.filter(u => u.status === 'active').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </Select>
                        </Field>
                        <Button type="submit">Assign and notify</Button>
                      </form>
                      <div className="space-y-2">
                        {blocker.status !== 'resolved' && blocker.status !== 'in_progress' && (
                          <Button tone="ghost" onClick={() => setBlockerProgress(blocker.id)}>Mark in progress</Button>
                        )}
                        {blocker.status !== 'resolved' && (
                          <form className="space-y-2" onSubmit={e => { e.preventDefault(); resolveBlocker(blocker.id, note); }}>
                            <Field label="Resolution note">
                              <TextArea value={note} onChange={e => setNote(e.target.value)} />
                            </Field>
                            <Button type="submit">Resolve</Button>
                          </form>
                        )}
                        {blocker.status === 'resolved' && (
                          <form className="space-y-2" onSubmit={e => { e.preventDefault(); reopenBlocker(blocker.id, reason); }}>
                            <Field label="Reopen reason">
                              <TextArea value={reason} onChange={e => setReason(e.target.value)} />
                            </Field>
                            <Button type="submit" tone="danger">Reopen</Button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
