import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { canClassify, pmProjectIds } from '../services/access';
import { labelClass } from '../services/format';
import type { ConditionalClass } from '../types';
import { AccessDenied, Button, ClassPill, Empty, Field, PageHeader, Select, TextInput } from './ui';

export const ScopePage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const tasks = useAppStore(s => s.tasks);
  const projects = useAppStore(s => s.projects);
  const classifyTask = useAppStore(s => s.classifyTask);
  const navigate = useAppStore(s => s.navigate);
  const pmIds = pmProjectIds(user, grants);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [choice, setChoice] = useState<Record<string, ConditionalClass>>({});

  if (!user || pmIds.length === 0) return <AccessDenied what="conditional scope" />;

  const rows = tasks.filter(t => t.isConditional && pmIds.includes(t.projectId));
  const queue = rows.filter(t => t.classification === 'needs_clarification' || t.classification === 'unclassified');

  return (
    <div>
      <PageHeader
        eyebrow="Conditional scope"
        title="Applicable, not applicable, or needs clarification"
        lede="Not applicable tasks drop out of active counts and readiness, and stay visible here and in history. Needs clarification stays in the follow-up queue."
      />
      <section className="mb-5">
        <h2 className="font-semibold mb-2">Follow-up queue ({queue.length})</h2>
        {queue.length === 0 && <Empty>Nothing is waiting on a classification.</Empty>}
        <ul className="space-y-1 text-sm">
          {queue.map(t => (
            <li key={t.id}>{t.code} {t.title} · {projects.find(p => p.id === t.projectId)?.name} · {labelClass(t.classification)}</li>
          ))}
        </ul>
      </section>
      <div className="space-y-3">
        {rows.map(task => {
          const selected = choice[task.id] ?? (task.classification === 'unclassified' ? 'applicable' : task.classification);
          return (
            <form
              key={task.id}
              className="bg-white border border-stone-200 rounded-2xl p-4 grid md:grid-cols-[1fr_220px_1fr_auto] gap-3 items-end"
              onSubmit={e => {
                e.preventDefault();
                classifyTask(task.id, selected, notes[task.id] ?? task.classificationNote);
              }}
            >
              <div>
                <button type="button" className="font-medium text-left hover:underline" onClick={() => navigate({ page: 'tasks', taskId: task.id })}>
                  {task.code} {task.title}
                </button>
                <div className="text-sm text-stone-500">{projects.find(p => p.id === task.projectId)?.name}</div>
                <div className="mt-1"><ClassPill value={task.classification} /></div>
              </div>
              <Field label="Classification">
                <Select value={selected} onChange={e => setChoice(c => ({ ...c, [task.id]: e.target.value as ConditionalClass }))}>
                  <option value="applicable">Applicable</option>
                  <option value="not_applicable">Not applicable</option>
                  <option value="needs_clarification">Needs clarification</option>
                </Select>
              </Field>
              <Field label="Justification">
                <TextInput
                  value={notes[task.id] ?? task.classificationNote}
                  onChange={e => setNotes(n => ({ ...n, [task.id]: e.target.value }))}
                  placeholder="Required"
                />
              </Field>
              <Button type="submit" disabled={!canClassify(user, task, grants)}>Save</Button>
            </form>
          );
        })}
      </div>
    </div>
  );
};
