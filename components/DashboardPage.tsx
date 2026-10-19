import React, { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { isActiveBlocker, isActiveTask, isPmOnAnyProject, pmProjectIds, visibleTasks } from '../services/access';
import { formatDate, labelClass, labelStatus } from '../services/format';
import type { Task } from '../types';
import { BlockerPill, ClassPill, Empty, PageHeader, Panel, Select, Stat, StatusPill } from './ui';

export const DashboardPage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const tasks = useAppStore(s => s.tasks);
  const blockers = useAppStore(s => s.blockers);
  const evidence = useAppStore(s => s.evidence);
  const approvals = useAppStore(s => s.approvals);
  const projects = useAppStore(s => s.projects);
  const phases = useAppStore(s => s.phases);
  const users = useAppStore(s => s.users);
  const filters = useAppStore(s => s.dashboardFilters);
  const setFilters = useAppStore(s => s.setDashboardFilters);
  const navigate = useAppStore(s => s.navigate);

  const pm = isPmOnAnyProject(user, grants);
  const pmIds = pmProjectIds(user, grants);

  const scoped = useMemo(() => {
    const base = pm
      ? tasks.filter(t => pmIds.includes(t.projectId))
      : visibleTasks(user, tasks, grants);
    return base.filter(task => {
      if (filters.projectId && task.projectId !== filters.projectId) return false;
      if (filters.phaseId && task.phaseId !== filters.phaseId) return false;
      if (filters.status && task.status !== filters.status) return false;
      return true;
    });
  }, [pm, pmIds, tasks, user, grants, filters]);

  const projectName = (id: string) => projects.find(p => p.id === id)?.name ?? id;
  const phaseName = (id: string) => phases.find(p => p.id === id)?.name ?? id;
  const userName = (id?: string) => users.find(u => u.id === id)?.name ?? 'Unassigned';

  const active = scoped.filter(isActiveTask);
  const openBlockers = blockers.filter(b => scoped.some(t => t.id === b.taskId) && isActiveBlocker(b));
  const evidenceRows = evidence.filter(e => scoped.some(t => t.id === e.taskId));
  const submitted = evidenceRows.filter(e => e.status === 'submitted');
  const drafts = evidenceRows.filter(e => e.status === 'draft');
  const conditional = scoped.filter(t => t.isConditional);
  const needs = conditional.filter(t => t.classification === 'needs_clarification' || t.classification === 'unclassified');
  const phaseIds = new Set(scoped.map(t => t.phaseId));
  const decisionRows = approvals.filter(a => phaseIds.has(a.phaseId) && (!filters.projectId || a.projectId === filters.projectId));
  const accessRows = grants.filter(g => {
    if (pm && !pmIds.includes(g.projectId)) return false;
    if (filters.projectId && g.projectId !== filters.projectId) return false;
    return true;
  });

  const filterProjects = pm ? projects.filter(p => pmIds.includes(p.id)) : projects.filter(p => scoped.some(t => t.projectId === p.id) || grants.some(g => g.userId === user?.id && g.projectId === p.id));
  const filterPhases = phases.filter(p => !filters.projectId || p.projectId === filters.projectId);

  if (!pm) {
    return (
      <div>
        <PageHeader
          eyebrow="Your work"
          title={user?.orgAdmin ? 'Administration' : 'Assigned work'}
          lede={user?.orgAdmin
            ? 'Admins manage people and access. Task editing, blocker resolution, and approval decisions stay with the project roles.'
            : 'You only see tasks and deliverables in your authorized scope.'}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Stat label="Visible tasks" value={scoped.length} onClick={() => navigate({ page: 'tasks' })} />
          <Stat label="Open blockers" value={openBlockers.length} onClick={() => navigate({ page: 'blockers' })} />
          <Stat label="Needs classification" value={needs.length} />
          <Stat label="Submitted evidence" value={submitted.length} onClick={() => navigate({ page: 'evidence' })} />
        </div>
        <TaskTable tasks={scoped} projectName={projectName} onOpen={id => navigate({ page: 'tasks', taskId: id })} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Governance"
        title="Oversight dashboard"
        lede="Tasks, blockers, evidence, conditional scope, access, and approvals for the projects you manage."
      />
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <label className="text-sm">
          <span className="block text-stone-500 mb-1">Project</span>
          <Select value={filters.projectId} onChange={e => setFilters({ projectId: e.target.value })}>
            <option value="">All authorized projects</option>
            {filterProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </label>
        <label className="text-sm">
          <span className="block text-stone-500 mb-1">Phase</span>
          <Select value={filters.phaseId} onChange={e => setFilters({ phaseId: e.target.value })}>
            <option value="">All phases</option>
            {filterPhases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </label>
        <label className="text-sm">
          <span className="block text-stone-500 mb-1">Task status</span>
          <Select value={filters.status} onChange={e => setFilters({ status: e.target.value })}>
            <option value="">Any status</option>
            {['not_started', 'in_progress', 'blocked', 'in_review', 'done'].map(s => (
              <option key={s} value={s}>{labelStatus(s as Task['status'])}</option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Tasks" action={<button className="text-sm text-teal-800" onClick={() => navigate({ page: 'tasks' })}>Open</button>}>
          <div className="text-sm text-stone-500 mb-3">{active.length} active · {scoped.length - active.length} not applicable excluded from the active count</div>
          <TaskTable tasks={scoped.slice(0, 6)} projectName={projectName} onOpen={id => navigate({ page: 'tasks', taskId: id })} />
        </Panel>
        <Panel title="Blockers" action={<button className="text-sm text-teal-800" onClick={() => navigate({ page: 'blockers' })}>Open</button>}>
          <div className="text-sm text-stone-500 mb-3">{openBlockers.length} open, in progress, or reopened</div>
          {openBlockers.length === 0 && <Empty>No open blockers in this scope.</Empty>}
          <ul className="space-y-2">
            {openBlockers.map(b => {
              const task = scoped.find(t => t.id === b.taskId);
              return (
                <li key={b.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <div className="font-medium">{b.title}</div>
                    <div className="text-stone-500">{task?.code} · {task ? projectName(task.projectId) : ''} · {userName(b.ownerId)}</div>
                  </div>
                  <BlockerPill status={b.status} />
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Evidence" action={<button className="text-sm text-teal-800" onClick={() => navigate({ page: 'evidence' })}>Open</button>}>
          <div className="text-sm text-stone-500 mb-3">{submitted.length} submitted · {drafts.length} draft (drafts do not count toward readiness)</div>
          {evidenceRows.length === 0 && <Empty>No evidence in this scope.</Empty>}
          <ul className="space-y-2 text-sm">
            {evidenceRows.slice(0, 5).map(e => {
              const task = tasks.find(t => t.id === e.taskId);
              return (
                <li key={e.id} className="flex justify-between gap-2">
                  <span>{e.label} <span className="text-stone-500">v{e.version} · {task?.code} · {task ? projectName(task.projectId) : ''}</span></span>
                  <span className="capitalize text-stone-600">{e.status}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Conditional scope" action={<button className="text-sm text-teal-800" onClick={() => navigate({ page: 'scope' })}>Open</button>}>
          <div className="text-sm text-stone-500 mb-3">{needs.length} waiting on a PM decision</div>
          {conditional.length === 0 && <Empty>No conditional tasks in this scope.</Empty>}
          <ul className="space-y-2 text-sm">
            {conditional.map(t => (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <button className="text-left" onClick={() => navigate({ page: 'tasks', taskId: t.id })}>
                  <span className="font-medium">{t.code}</span> {t.title}
                  <span className="block text-stone-500">{projectName(t.projectId)} · {phaseName(t.phaseId)}</span>
                </button>
                <ClassPill value={t.classification} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Team access" action={<button className="text-sm text-teal-800" onClick={() => navigate({ page: 'audit' })}>Audit</button>}>
          {accessRows.length === 0 && <Empty>No access grants in this scope.</Empty>}
          <ul className="space-y-2 text-sm">
            {accessRows.map(g => (
              <li key={g.id} className="flex justify-between gap-2">
                <span>{userName(g.userId)} <span className="text-stone-500">{projectName(g.projectId)}</span></span>
                <span className="text-stone-600">{g.role === 'ProjectManager' ? 'PM' : g.role === 'TeamLead' ? 'Lead' : 'Member'}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Approval governance" action={<button className="text-sm text-teal-800" onClick={() => navigate({ page: 'approvals' })}>Open</button>}>
          {decisionRows.length === 0 && <Empty>No approval decisions in this scope.</Empty>}
          <ul className="space-y-2 text-sm">
            {[...decisionRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(a => (
              <li key={a.id}>
                <div className="font-medium">{phaseName(a.phaseId)} · {a.decision.replaceAll('_', ' ')}</div>
                <div className="text-stone-500">{projectName(a.projectId)} · {userName(a.actorId)} · {formatDate(a.createdAt)}{a.supersedesId ? ` · supersedes ${a.supersedesId}` : ''}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

function TaskTable({ tasks, projectName, onOpen }: { tasks: Task[]; projectName: (id: string) => string; onOpen: (id: string) => void }) {
  if (tasks.length === 0) return <Empty>No tasks in this scope.</Empty>;
  return (
    <ul className="space-y-2">
      {tasks.map(t => (
        <li key={t.id}>
          <button type="button" onClick={() => onOpen(t.id)} className="w-full text-left flex items-center justify-between gap-2 text-sm">
            <span>
              <span className="font-medium">{t.code}</span> {t.title}
              <span className="block text-stone-500">{projectName(t.projectId)}</span>
            </span>
            <StatusPill status={t.status} />
          </button>
        </li>
      ))}
    </ul>
  );
}
