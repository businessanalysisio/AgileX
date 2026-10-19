import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { canEditTask, isActiveBlocker, visibleTasks } from '../services/access';
import { formatDate, isOverdue, labelPriority, labelStatus } from '../services/format';
import type { Priority, Task, TaskStatus } from '../types';
import { PRIORITIES, TASK_STATUSES } from '../types';
import { Button, Empty, Field, PageHeader, PriorityPill, Select, StatusPill, TextArea, TextInput } from './ui';

type SortKey = 'code' | 'title' | 'project' | 'phase' | 'owner' | 'priority' | 'status' | 'due' | 'blocker';

export const TasksPage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const tasks = useAppStore(s => s.tasks);
  const blockers = useAppStore(s => s.blockers);
  const projects = useAppStore(s => s.projects);
  const phases = useAppStore(s => s.phases);
  const users = useAppStore(s => s.users);
  const navigate = useAppStore(s => s.navigate);
  const updateTask = useAppStore(s => s.updateTask);

  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dueBefore, setDueBefore] = useState('');
  const [blocker, setBlocker] = useState('');
  const [showNa, setShowNa] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('due');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editing, setEditing] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<TaskStatus>('not_started');
  const [draftNotes, setDraftNotes] = useState('');

  const visible = visibleTasks(user, tasks, grants);
  const name = (id?: string) => users.find(u => u.id === id)?.name ?? '—';
  const projectName = (id: string) => projects.find(p => p.id === id)?.code ?? id;
  const phaseName = (id: string) => phases.find(p => p.id === id)?.name ?? id;
  const blocked = (taskId: string) => blockers.some(b => b.taskId === taskId && isActiveBlocker(b));

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = visible.filter(task => {
      if (!showNa && task.classification === 'not_applicable') return false;
      if (q && !`${task.code} ${task.title} ${task.description}`.toLowerCase().includes(q)) return false;
      if (projectId && task.projectId !== projectId) return false;
      if (phaseId && task.phaseId !== phaseId) return false;
      if (ownerId && task.ownerId !== ownerId) return false;
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      if (dueBefore && task.dueDate > dueBefore) return false;
      if (blocker === 'yes' && !blocked(task.id)) return false;
      if (blocker === 'no' && blocked(task.id)) return false;
      return true;
    });
    const value = (task: Task): string | number => {
      switch (sortKey) {
        case 'code': return task.code;
        case 'title': return task.title;
        case 'project': return projectName(task.projectId);
        case 'phase': return phaseName(task.phaseId);
        case 'owner': return name(task.ownerId);
        case 'priority': return PRIORITIES.indexOf(task.priority);
        case 'status': return labelStatus(task.status);
        case 'due': return task.dueDate;
        case 'blocker': return blocked(task.id) ? 1 : 0;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [visible, search, showNa, projectId, phaseId, ownerId, status, priority, dueBefore, blocker, sortKey, sortDir, blockers]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const phaseOptions = phases.filter(p => !projectId || p.projectId === projectId);
  const owners = users.filter(u => visible.some(t => t.ownerId === u.id));

  const beginEdit = (task: Task) => {
    setEditing(task.id);
    setDraftStatus(task.status);
    setDraftNotes(task.notes);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Tasks"
        title="Search and update"
        lede="Keyword search matches the code, title, or description. Filters combine. Sorting does not reload the page."
      />
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <Field label="Search">
          <TextInput value={search} placeholder="Title, code, or description" onChange={e => setSearch(e.target.value)} />
        </Field>
        <Field label="Project">
          <Select value={projectId} onChange={e => { setProjectId(e.target.value); setPhaseId(''); }}>
            <option value="">Any</option>
            {projects.filter(p => visible.some(t => t.projectId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Phase">
          <Select value={phaseId} onChange={e => setPhaseId(e.target.value)}>
            <option value="">Any</option>
            {phaseOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Owner">
          <Select value={ownerId} onChange={e => setOwnerId(e.target.value)}>
            <option value="">Any</option>
            {owners.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Any</option>
            {TASK_STATUSES.map(s => <option key={s} value={s}>{labelStatus(s)}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">Any</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{labelPriority(p)}</option>)}
          </Select>
        </Field>
        <Field label="Due on or before">
          <TextInput type="date" value={dueBefore} onChange={e => setDueBefore(e.target.value)} />
        </Field>
        <Field label="Blocker">
          <Select value={blocker} onChange={e => setBlocker(e.target.value)}>
            <option value="">Any</option>
            <option value="yes">Has an active blocker</option>
            <option value="no">Clear</option>
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600 mb-3">
        <input type="checkbox" checked={showNa} onChange={e => setShowNa(e.target.checked)} />
        Show tasks classified not applicable
      </label>

      {rows.length === 0 && <Empty>No tasks match the current search and filters.</Empty>}
      {rows.length > 0 && (
        <div className="overflow-x-auto bg-white border border-stone-200 rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-500 border-b border-stone-100">
                {([
                  ['code', 'ID'],
                  ['title', 'Title'],
                  ['project', 'Project'],
                  ['phase', 'Phase'],
                  ['owner', 'Owner'],
                  ['priority', 'Priority'],
                  ['status', 'Status'],
                  ['due', 'Due'],
                  ['blocker', 'Blocker'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} className="px-3 py-2 font-medium">
                    <button type="button" onClick={() => toggleSort(key)} className="hover:text-stone-950">
                      {label}{sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map(task => (
                <React.Fragment key={task.id}>
                  <tr className="border-b border-stone-50 align-top">
                    <td className="px-3 py-2 font-medium">{task.code}</td>
                    <td className="px-3 py-2">
                      <button type="button" className="text-left hover:underline" onClick={() => navigate({ page: 'tasks', taskId: task.id })}>{task.title}</button>
                      {task.classification === 'not_applicable' && <div className="text-xs text-stone-400">Not applicable</div>}
                    </td>
                    <td className="px-3 py-2">{projectName(task.projectId)}</td>
                    <td className="px-3 py-2">{phaseName(task.phaseId)}</td>
                    <td className="px-3 py-2">{name(task.ownerId)}</td>
                    <td className="px-3 py-2"><PriorityPill priority={task.priority} /></td>
                    <td className="px-3 py-2"><StatusPill status={task.status} /></td>
                    <td className={`px-3 py-2 ${isOverdue(task.dueDate, task.status) ? 'text-rose-700 font-medium' : ''}`}>{formatDate(task.dueDate)}</td>
                    <td className="px-3 py-2">{blocked(task.id) ? <span className="text-rose-700">Blocked</span> : '—'}</td>
                    <td className="px-3 py-2">
                      <Button tone="quiet" onClick={() => beginEdit(task)}>Update</Button>
                    </td>
                  </tr>
                  {editing === task.id && (
                    <tr className="bg-stone-50">
                      <td colSpan={10} className="px-3 py-3">
                        <form
                          className="grid md:grid-cols-[180px_1fr_auto] gap-3 items-end"
                          onSubmit={e => {
                            e.preventDefault();
                            const saved = updateTask(task.id, { status: draftStatus, notes: draftNotes });
                            if (saved) setEditing(null);
                          }}
                        >
                          <Field label="Status">
                            <Select value={draftStatus} onChange={e => setDraftStatus(e.target.value as TaskStatus)}>
                              {TASK_STATUSES.map(s => <option key={s} value={s}>{labelStatus(s)}</option>)}
                            </Select>
                          </Field>
                          <Field label="Notes">
                            <TextArea rows={2} value={draftNotes} onChange={e => setDraftNotes(e.target.value)} />
                          </Field>
                          <div className="flex gap-2">
                            <Button type="submit">Save</Button>
                            <Button tone="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                          </div>
                          {!canEditTask(user, task, grants) && (
                            <p className="md:col-span-3 text-xs text-rose-700">You can see this task, but saving will be rejected because you are not the owner or assignee.</p>
                          )}
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
