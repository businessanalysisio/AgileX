import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { canViewTask, isActiveBlocker, projectRole, visibleTasks } from '../services/access';
import { formatDate, parseDay } from '../services/format';
import type { Milestone, Phase, Task } from '../types';
import { Empty, PageHeader, Select } from './ui';

export const TimelinePage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const tasks = useAppStore(s => s.tasks);
  const blockers = useAppStore(s => s.blockers);
  const phases = useAppStore(s => s.phases);
  const milestones = useAppStore(s => s.milestones);
  const projects = useAppStore(s => s.projects);
  const users = useAppStore(s => s.users);
  const navigate = useAppStore(s => s.navigate);
  const [projectId, setProjectId] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const visible = visibleTasks(user, tasks, grants);
  const projectOptions = projects.filter(p => visible.some(t => t.projectId === p.id) || user?.orgAdmin);
  const activeProject = projectId || projectOptions[0]?.id || '';

  const model = useMemo(() => {
    const projectPhases = phases
      .filter(p => p.projectId === activeProject)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.order - b.order);
    const lead = projectRole(user, grants, activeProject) === 'TeamLead';
    const phaseVisible = (phase: Phase) => {
      if (!lead) return true;
      return visible.some(t => t.phaseId === phase.id) || milestones.some(m => m.phaseId === phase.id && m.ownerId === user?.id);
    };
    const shownPhases = projectPhases.filter(phaseVisible);
    const shownTasks = visible.filter(t => t.projectId === activeProject && shownPhases.some(p => p.id === t.phaseId));
    const shownMilestones = milestones.filter(m => {
      if (m.projectId !== activeProject) return false;
      if (!lead) return true;
      return shownPhases.some(p => p.id === m.phaseId);
    });
    const dates = [
      ...shownPhases.flatMap(p => [p.startDate, p.endDate]),
      ...shownTasks.flatMap(t => [t.startDate, t.dueDate]),
      ...shownMilestones.map(m => m.date),
    ].filter(Boolean).sort();
    const start = dates[0] ? parseDay(dates[0]) : parseDay('2026-09-01');
    const end = dates.at(-1) ? parseDay(dates.at(-1)!) : start + 86400000 * 30;
    const span = Math.max(end - start, 86400000);
    const left = (iso: string) => ((parseDay(iso) - start) / span) * 100;
    const width = (a: string, b: string) => Math.max(1.5, ((parseDay(b) - parseDay(a)) / span) * 100);
    return { shownPhases, shownTasks, shownMilestones, left, width };
  }, [activeProject, phases, milestones, visible, user, grants]);

  const blocked = (taskId: string) => blockers.some(b => b.taskId === taskId && isActiveBlocker(b));
  const name = (id?: string) => users.find(u => u.id === id)?.name ?? '—';
  const milestone = model.shownMilestones.find(m => m.id === selected);
  const milestoneTasks = milestone
    ? model.shownTasks.filter(t => t.milestoneId === milestone.id || t.phaseId === milestone.phaseId)
    : [];
  const done = milestoneTasks.filter(t => t.status === 'done' && t.classification !== 'not_applicable').length;
  const activeCount = milestoneTasks.filter(t => t.classification !== 'not_applicable').length;

  return (
    <div>
      <PageHeader
        eyebrow="Timeline"
        title="Phases, milestones, and blockers"
        lede="Bars follow the live task and milestone dates. A blocked task is marked in red."
        actions={
          <Select value={activeProject} onChange={e => { setProjectId(e.target.value); setSelected(null); }} className="w-56">
            {projectOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        }
      />
      {model.shownPhases.length === 0 && <Empty>No timeline data in your scope for this project.</Empty>}
      <div className="space-y-4">
        {model.shownPhases.map(phase => (
          <section key={phase.id} className="bg-white border border-stone-200 rounded-2xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <h2 className="font-semibold">{phase.name}</h2>
              <span className="text-stone-500">{formatDate(phase.startDate)} – {formatDate(phase.endDate)}</span>
            </div>
            <Bar left={model.left(phase.startDate)} width={model.width(phase.startDate, phase.endDate)} className="bg-stone-200 h-2 mb-3" />
            <div className="relative h-8 mb-3">
              {model.shownMilestones.filter(m => m.phaseId === phase.id).map(m => (
                <button
                  key={m.id}
                  type="button"
                  title={`${m.name} · ${formatDate(m.date)}`}
                  onClick={() => setSelected(m.id)}
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: `${model.left(m.date)}%` }}
                >
                  <span className={`block w-3 h-3 rotate-45 ${selected === m.id ? 'bg-teal-700' : 'bg-stone-800'}`} />
                  <span className="block text-[11px] text-stone-600 mt-1 whitespace-nowrap -rotate-0 translate-x-2">{m.name}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2 mt-6">
              {model.shownTasks.filter(t => t.phaseId === phase.id).map(task => (
                <TaskBar
                  key={task.id}
                  task={task}
                  left={model.left(task.startDate)}
                  width={model.width(task.startDate, task.dueDate)}
                  blocked={blocked(task.id)}
                  onOpen={() => {
                    if (canViewTask(user, task, grants)) navigate({ page: 'tasks', taskId: task.id });
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {milestone && (
        <aside className="mt-4 bg-white border border-teal-200 rounded-2xl p-4">
          <h2 className="font-serif text-2xl">{milestone.name}</h2>
          <p className="text-sm text-stone-600 mt-1">{milestone.summary}</p>
          <dl className="grid sm:grid-cols-3 gap-3 text-sm mt-3">
            <div><dt className="text-stone-500">Date</dt><dd>{formatDate(milestone.date)}</dd></div>
            <div><dt className="text-stone-500">Owner</dt><dd>{name(milestone.ownerId)}</dd></div>
            <div><dt className="text-stone-500">Completion</dt><dd>{done} of {activeCount} active tasks done</dd></div>
          </dl>
          <ul className="mt-3 text-sm space-y-1">
            {milestoneTasks.map(t => (
              <li key={t.id}>
                <button type="button" className="hover:underline" onClick={() => navigate({ page: 'tasks', taskId: t.id })}>
                  {t.code} {t.title}
                </button>
                {blocked(t.id) ? ' · blocked' : ''} · {t.status.replaceAll('_', ' ')}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
};

function Bar({ left, width, className }: { left: number; width: number; className: string }) {
  return <div className={`rounded-full ${className}`} style={{ marginLeft: `${left}%`, width: `${width}%` }} />;
}

const TaskBar: React.FC<{ task: Task; left: number; width: number; blocked: boolean; onOpen: () => void }> = ({ task, left, width, blocked, onOpen }) => {
  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <div className="flex justify-between text-xs text-stone-500 mb-1">
        <span>{task.code} {task.title}</span>
        <span>{blocked ? 'Blocked' : task.status.replaceAll('_', ' ')}</span>
      </div>
      <div className="h-3 bg-stone-100 rounded-full">
        <div className={`h-3 rounded-full ${blocked ? 'bg-rose-600' : 'bg-teal-700'}`} style={{ marginLeft: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} />
      </div>
    </button>
  );
};
