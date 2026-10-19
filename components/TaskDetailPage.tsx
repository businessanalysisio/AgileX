import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import {
  canClassify,
  canEditTask,
  canManageEvidence,
  canRaiseBlocker,
  canReassignTask,
  canViewTask,
  isActiveBlocker,
} from '../services/access';
import { formatDate, formatWhen, isHttpUrl, labelClass, labelPriority, labelStatus } from '../services/format';
import type { ConditionalClass, Priority, TaskStatus } from '../types';
import { PRIORITIES, TASK_STATUSES } from '../types';
import { AccessDenied, BlockerPill, Button, ClassPill, Field, PageHeader, PriorityPill, Select, StatusPill, TextArea, TextInput } from './ui';

export const TaskDetailPage: React.FC<{ taskId: string }> = ({ taskId }) => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const task = useAppStore(s => s.tasks.find(t => t.id === taskId));
  const projects = useAppStore(s => s.projects);
  const phases = useAppStore(s => s.phases);
  const users = useAppStore(s => s.users);
  const allBlockers = useAppStore(s => s.blockers);
  const allEvidence = useAppStore(s => s.evidence);
  const allComments = useAppStore(s => s.comments);
  const allAudit = useAppStore(s => s.audit);
  const blockers = useMemo(() => allBlockers.filter(b => b.taskId === taskId), [allBlockers, taskId]);
  const evidence = useMemo(() => allEvidence.filter(e => e.taskId === taskId), [allEvidence, taskId]);
  const comments = useMemo(() => allComments.filter(c => c.taskId === taskId), [allComments, taskId]);
  const audit = useMemo(() => allAudit.filter(a => a.taskId === taskId), [allAudit, taskId]);
  const navigate = useAppStore(s => s.navigate);
  const updateTask = useAppStore(s => s.updateTask);
  const addComment = useAppStore(s => s.addComment);
  const raiseBlocker = useAppStore(s => s.raiseBlocker);
  const classifyTask = useAppStore(s => s.classifyTask);
  const addEvidenceFile = useAppStore(s => s.addEvidenceFile);
  const addEvidenceLink = useAppStore(s => s.addEvidenceLink);
  const replaceEvidenceFile = useAppStore(s => s.replaceEvidenceFile);
  const replaceEvidenceLink = useAppStore(s => s.replaceEvidenceLink);
  const submitEvidence = useAppStore(s => s.submitEvidence);

  const [comment, setComment] = useState('');
  const [blockerTitle, setBlockerTitle] = useState('');
  const [blockerBody, setBlockerBody] = useState('');
  const [classValue, setClassValue] = useState<ConditionalClass>(
    task && task.classification !== 'unclassified' ? task.classification : 'applicable'
  );
  const [classNote, setClassNote] = useState(task?.classificationNote ?? '');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [fileLabel, setFileLabel] = useState('');
  const [replaceUrl, setReplaceUrl] = useState('');

  if (!task || !user || !canViewTask(user, task, grants)) return <AccessDenied what="this task" />;

  const name = (id?: string) => users.find(u => u.id === id)?.name ?? 'Unknown';
  const project = projects.find(p => p.id === task.projectId);
  const phase = phases.find(p => p.id === task.phaseId);
  const editable = canEditTask(user, task, grants);
  const history = [...audit].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="space-y-4">
      <button type="button" className="text-sm text-teal-800" onClick={() => navigate({ page: 'tasks' })}>Back to tasks</button>
      <PageHeader
        eyebrow={`${project?.name ?? ''} · ${phase?.name ?? ''}`}
        title={`${task.code} ${task.title}`}
        lede={task.description}
        actions={<div className="flex gap-2"><StatusPill status={task.status} /><PriorityPill priority={task.priority} /></div>}
      />
      {blockers.some(isActiveBlocker) && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-900">
          This task has an active blocker. It is flagged on lists and on the timeline.
        </div>
      )}

      <section className="bg-white border border-stone-200 rounded-2xl p-4">
        <h2 className="font-semibold mb-3">Details</h2>
        <form
          className="grid md:grid-cols-2 gap-3"
          onSubmit={e => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            updateTask(task.id, {
              description: String(data.get('description') ?? ''),
              status: String(data.get('status')) as TaskStatus,
              priority: String(data.get('priority')) as Priority,
              startDate: String(data.get('startDate') ?? ''),
              dueDate: String(data.get('dueDate') ?? ''),
              notes: String(data.get('notes') ?? ''),
              ownerId: String(data.get('ownerId') ?? task.ownerId),
            });
          }}
        >
          <Field label="Description"><TextArea name="description" defaultValue={task.description} rows={3} /></Field>
          <Field label="Notes"><TextArea name="notes" defaultValue={task.notes} rows={3} /></Field>
          <Field label="Status">
            <Select name="status" defaultValue={task.status}>
              {TASK_STATUSES.map(s => <option key={s} value={s}>{labelStatus(s)}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue={task.priority}>
              {PRIORITIES.map(p => <option key={p} value={p}>{labelPriority(p)}</option>)}
            </Select>
          </Field>
          <Field label="Start"><TextInput type="date" name="startDate" defaultValue={task.startDate} /></Field>
          <Field label="Due"><TextInput type="date" name="dueDate" defaultValue={task.dueDate} /></Field>
          <Field label="Owner">
            <Select name="ownerId" defaultValue={task.ownerId} disabled={!canReassignTask(user, task, grants)}>
              {users.filter(u => u.status !== 'deactivated' || u.id === task.ownerId).map(u => (
                <option key={u.id} value={u.id}>{u.name}{u.status === 'deactivated' ? ' (deactivated)' : ''}</option>
              ))}
            </Select>
          </Field>
          <div className="text-sm text-stone-500 self-end">
            Approver: {task.approverId ? name(task.approverId) : 'None'} · Due {formatDate(task.dueDate)}
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save details</Button>
            {!editable && <p className="text-xs text-rose-700 mt-2">Saving is rejected for people who do not own or are not assigned to this task.</p>}
          </div>
        </form>
        {task.isConditional && (
          <form
            className="mt-4 border-t border-stone-100 pt-4 grid md:grid-cols-[220px_1fr_auto] gap-3 items-end"
            onSubmit={e => { e.preventDefault(); classifyTask(task.id, classValue, classNote); }}
          >
            <Field label="Conditional classification">
              <Select value={classValue} onChange={e => setClassValue(e.target.value as ConditionalClass)}>
                <option value="applicable">{labelClass('applicable')}</option>
                <option value="not_applicable">{labelClass('not_applicable')}</option>
                <option value="needs_clarification">{labelClass('needs_clarification')}</option>
              </Select>
            </Field>
            <Field label="Justification">
              <TextInput value={classNote} onChange={e => setClassNote(e.target.value)} placeholder="Required" />
            </Field>
            <Button type="submit" disabled={!canClassify(user, task, grants)}>Classify</Button>
            <div className="md:col-span-3 text-sm text-stone-500">Current: <ClassPill value={task.classification} /> {task.classificationNote}</div>
          </form>
        )}
      </section>

      <section className="bg-white border border-stone-200 rounded-2xl p-4">
        <h2 className="font-semibold mb-3">Evidence</h2>
        {evidence.length === 0 && <p className="text-sm text-stone-500 mb-3">No evidence yet. Drafts are not counted toward readiness.</p>}
        <ul className="space-y-3 mb-4">
          {[...evidence].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(item => (
            <li key={item.id} className="border border-stone-100 rounded-xl p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <span className="font-medium">{item.label}</span> · v{item.version} · {item.kind} · {item.status}
                  <div className="text-stone-500">
                    {item.kind === 'file' ? `${item.fileName} · ${item.fileSize} · ${item.fileType}` : item.url}
                    {' · '}{name(item.uploaderId)} · {formatWhen(item.createdAt)}
                  </div>
                </div>
                {item.status === 'draft' && canManageEvidence(user, task, grants) && (
                  <Button onClick={() => submitEvidence(item.id)}>Submit for review</Button>
                )}
              </div>
              {item.status !== 'replaced' && canManageEvidence(user, task, grants) && (
                <div className="mt-2">
                  {item.kind === 'file' ? (
                    <input
                      type="file"
                      className="text-xs"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        replaceEvidenceFile(item.id, { name: file.name, size: formatBytes(file.size), type: file.type });
                        e.target.value = '';
                      }}
                    />
                  ) : (
                    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (isHttpUrl(replaceUrl)) replaceEvidenceLink(item.id, replaceUrl); }}>
                      <TextInput value={replaceUrl} placeholder="https:// replacement link" onChange={ev => setReplaceUrl(ev.target.value)} />
                      <Button type="submit" tone="ghost">Replace link</Button>
                    </form>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        {canManageEvidence(user, task, grants) && (
          <div className="grid md:grid-cols-2 gap-4">
            <form
              className="space-y-2"
              onSubmit={e => {
                e.preventDefault();
                const file = (e.currentTarget.elements.namedItem('file') as HTMLInputElement).files?.[0];
                if (!file) return;
                addEvidenceFile(task.id, { name: file.name, size: formatBytes(file.size), type: file.type }, fileLabel || file.name);
                e.currentTarget.reset();
                setFileLabel('');
              }}
            >
              <Field label="Upload a file"><TextInput name="file" type="file" /></Field>
              <Field label="Label"><TextInput value={fileLabel} onChange={e => setFileLabel(e.target.value)} /></Field>
              <Button type="submit">Attach file</Button>
            </form>
            <form className="space-y-2" onSubmit={e => { e.preventDefault(); addEvidenceLink(task.id, linkUrl, linkLabel); setLinkUrl(''); setLinkLabel(''); }}>
              <Field label="Link"><TextInput value={linkUrl} placeholder="https://" onChange={e => setLinkUrl(e.target.value)} /></Field>
              <Field label="Label"><TextInput value={linkLabel} onChange={e => setLinkLabel(e.target.value)} /></Field>
              <Button type="submit">Save link</Button>
            </form>
          </div>
        )}
      </section>

      <section className="bg-white border border-stone-200 rounded-2xl p-4">
        <h2 className="font-semibold mb-3">Comments</h2>
        <ul className="space-y-3 mb-3">
          {[...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(c => (
            <li key={c.id} className="text-sm">
              <div className="font-medium">{name(c.authorId)} <span className="font-normal text-stone-400">{formatWhen(c.createdAt)}</span></div>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
        <form className="space-y-2" onSubmit={e => { e.preventDefault(); if (addComment(task.id, comment)) setComment(''); }}>
          <TextArea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment" />
          <Button type="submit">Add comment</Button>
        </form>
      </section>

      <section className="bg-white border border-stone-200 rounded-2xl p-4">
        <h2 className="font-semibold mb-3">Blockers</h2>
        <ul className="space-y-2 mb-3">
          {blockers.map(b => (
            <li key={b.id} className="text-sm flex justify-between gap-2">
              <span>{b.title} · {name(b.ownerId)} {b.resolutionNote && `· ${b.resolutionNote}`}</span>
              <BlockerPill status={b.status} />
            </li>
          ))}
        </ul>
        {canRaiseBlocker(user, task, grants) && (
          <form className="grid md:grid-cols-2 gap-3" onSubmit={e => { e.preventDefault(); if (raiseBlocker(task.id, blockerTitle, blockerBody)) { setBlockerTitle(''); setBlockerBody(''); } }}>
            <Field label="Raise a blocker"><TextInput value={blockerTitle} onChange={e => setBlockerTitle(e.target.value)} /></Field>
            <Field label="Description"><TextInput value={blockerBody} onChange={e => setBlockerBody(e.target.value)} /></Field>
            <Button type="submit">Raise blocker</Button>
          </form>
        )}
      </section>

      <section className="bg-white border border-stone-200 rounded-2xl p-4">
        <h2 className="font-semibold mb-3">History</h2>
        <ol className="space-y-2 text-sm">
          {history.map(entry => (
            <li key={entry.id}>
              <span className="text-stone-400">{formatWhen(entry.at)}</span> · {entry.actorName} · {entry.summary}
              {(entry.before || entry.after) && <span className="text-stone-500"> ({entry.before ? `${entry.before} → ` : ''}{entry.after})</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
