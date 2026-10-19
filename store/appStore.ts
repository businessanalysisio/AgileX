import { create } from 'zustand';
import {
  SEED_APPROVALS,
  SEED_AUDIT,
  SEED_BLOCKERS,
  SEED_COMMENTS,
  SEED_EVIDENCE,
  SEED_GRANTS,
  SEED_MILESTONES,
  SEED_PHASES,
  SEED_PROJECTS,
  SEED_TASKS,
  SEED_USERS,
} from '../data/seed';
import {
  canAuthenticate,
  canClassify,
  canEditTask,
  canManageBlocker,
  canManageEvidence,
  canManageUsers,
  canRaiseBlocker,
  canReassignTask,
  leadCanReviewPhase,
} from '../services/access';
import { isHttpUrl, labelClass, labelStatus } from '../services/format';
import type {
  AccessGrant,
  ApprovalChoice,
  ApprovalDecision,
  AppNotification,
  AuditEntry,
  Blocker,
  BlockerStatus,
  Comment,
  ConditionalClass,
  DashboardFilters,
  Evidence,
  Milestone,
  Phase,
  Priority,
  Project,
  ProjectRole,
  Route,
  Task,
  TaskStatus,
  User,
} from '../types';

let seq = 1;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

export interface TaskPatch {
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  startDate?: string;
  dueDate?: string;
  notes?: string;
  ownerId?: string;
}

interface StoreData {
  users: User[];
  projects: Project[];
  phases: Phase[];
  milestones: Milestone[];
  tasks: Task[];
  blockers: Blocker[];
  evidence: Evidence[];
  comments: Comment[];
  approvals: ApprovalDecision[];
  grants: AccessGrant[];
  audit: AuditEntry[];
  notifications: AppNotification[];
  currentUserId: string | null;
  route: Route;
  dashboardFilters: DashboardFilters;
  toast: { type: 'success' | 'error' | 'info'; message: string } | null;
}

interface StoreActions {
  login: (userId: string) => void;
  acceptInvite: (userId: string) => void;
  logout: () => void;
  navigate: (route: Route) => void;
  setDashboardFilters: (patch: Partial<DashboardFilters>) => void;
  dismissToast: () => void;
  markNotificationsRead: () => void;
  updateTask: (taskId: string, patch: TaskPatch) => boolean;
  addComment: (taskId: string, body: string) => boolean;
  raiseBlocker: (taskId: string, title: string, description: string) => boolean;
  assignBlocker: (blockerId: string, ownerId: string) => boolean;
  setBlockerProgress: (blockerId: string) => boolean;
  resolveBlocker: (blockerId: string, resolutionNote: string) => boolean;
  reopenBlocker: (blockerId: string, reason: string) => boolean;
  classifyTask: (taskId: string, classification: ConditionalClass, note: string) => boolean;
  addEvidenceFile: (taskId: string, file: { name: string; size: string; type: string }, label: string) => boolean;
  addEvidenceLink: (taskId: string, url: string, label: string) => boolean;
  replaceEvidenceFile: (evidenceId: string, file: { name: string; size: string; type: string }) => boolean;
  replaceEvidenceLink: (evidenceId: string, url: string) => boolean;
  submitEvidence: (evidenceId: string) => boolean;
  inviteUser: (input: { name: string; email: string; orgAdmin: boolean; projectId?: string; role?: ProjectRole }) => boolean;
  setOrgAdmin: (userId: string, orgAdmin: boolean) => boolean;
  grantAccess: (userId: string, projectId: string, role: ProjectRole) => boolean;
  revokeAccess: (grantId: string) => boolean;
  deactivateUser: (userId: string) => boolean;
  submitApproval: (input: { projectId: string; phaseId: string; decision: ApprovalChoice; rationale: string; conditions: string }) => boolean;
}

export type AppStore = StoreData & StoreActions;

function routeFromHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/dashboard';
  const parts = raw.split('/').filter(Boolean);
  const page = parts[0] as Route['page'];
  const known: Route['page'][] = ['dashboard', 'tasks', 'timeline', 'blockers', 'evidence', 'scope', 'approvals', 'access', 'audit'];
  if (!known.includes(page)) return { page: 'dashboard' };
  if (page === 'tasks' && parts[1]) return { page, taskId: decodeURIComponent(parts[1]) };
  return { page };
}

function hashFor(route: Route): string {
  if (route.page === 'tasks' && route.taskId) return `#/tasks/${route.taskId}`;
  return `#/${route.page}`;
}

function current(state: StoreData): User | null {
  return state.users.find(u => u.id === state.currentUserId) ?? null;
}

export const useAppStore = create<AppStore>((set, get) => {
  const fail = (message: string) => {
    set({ toast: { type: 'error', message } });
    return false;
  };
  const ok = (message: string) => {
    set({ toast: { type: 'success', message } });
    return true;
  };

  const writeAudit = (
    draft: Omit<AuditEntry, 'id' | 'at' | 'actorId' | 'actorName'> & { at?: string },
    actor: User
  ): AuditEntry => ({
    id: uid('au'),
    at: draft.at ?? new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    action: draft.action,
    entityType: draft.entityType,
    entityId: draft.entityId,
    taskId: draft.taskId,
    projectId: draft.projectId,
    summary: draft.summary,
    before: draft.before,
    after: draft.after,
  });

  const notify = (userId: string, message: string, at = new Date().toISOString()): AppNotification => ({
    id: uid('nt'),
    userId,
    message,
    at,
    read: false,
  });

  const taskOf = (taskId: string) => get().tasks.find(t => t.id === taskId);
  const blockerOf = (id: string) => get().blockers.find(b => b.id === id);

  return {
    users: SEED_USERS,
    projects: SEED_PROJECTS,
    phases: SEED_PHASES,
    milestones: SEED_MILESTONES,
    tasks: SEED_TASKS,
    blockers: SEED_BLOCKERS,
    evidence: SEED_EVIDENCE,
    comments: SEED_COMMENTS,
    approvals: SEED_APPROVALS,
    grants: SEED_GRANTS,
    audit: SEED_AUDIT,
    notifications: [
      notify('u-bao', 'Minh Pham assigned you the blocker "Identity vendor certificate delay".', '2026-10-08T09:20:00Z'),
      notify('u-an', 'Minh Pham assigned you the blocker "CRM API rate limit".', '2026-10-11T04:45:00Z'),
      notify('u-minh', 'An Nguyen submitted evidence on H-06 Scope evidence pack.', '2026-09-24T07:35:00Z'),
      notify('u-hoa', 'An Nguyen submitted evidence on H-06 Scope evidence pack.', '2026-09-24T07:35:00Z'),
    ],
    currentUserId: null,
    route: routeFromHash(),
    dashboardFilters: { projectId: '', phaseId: '', status: '' },
    toast: null,

    login: (userId) => {
      const user = get().users.find(u => u.id === userId);
      if (!user) return;
      if (user.status === 'deactivated') {
        fail('This account is deactivated and can no longer sign in.');
        return;
      }
      if (user.status === 'pending') {
        fail('This invitation is still pending. Accept it before signing in.');
        return;
      }
      if (!canAuthenticate(user)) return;
      const route = window.location.hash ? routeFromHash() : { page: 'dashboard' as const };
      set({ currentUserId: user.id, toast: null, route });
      if (!window.location.hash) window.location.hash = '#/dashboard';
    },

    acceptInvite: (userId) => {
      const user = get().users.find(u => u.id === userId);
      if (!user || user.status !== 'pending') return;
      const actor = user;
      const entry = writeAudit({
        action: 'accept_invite',
        entityType: 'user',
        entityId: user.id,
        summary: `${user.name} accepted the invitation.`,
        before: 'pending',
        after: 'active',
      }, actor);
      set({
        users: get().users.map(u => u.id === userId ? { ...u, status: 'active' } : u),
        audit: [...get().audit, entry],
        toast: { type: 'success', message: `${user.name} accepted the invitation and can sign in.` },
      });
    },

    logout: () => {
      set({ currentUserId: null, toast: null, route: { page: 'dashboard' } });
      if (window.location.hash !== '#/dashboard') window.location.hash = '#/dashboard';
    },

    navigate: (route) => {
      set({ route });
      const next = hashFor(route);
      if (window.location.hash !== next) window.location.hash = next;
    },

    setDashboardFilters: (patch) => {
      const prev = get().dashboardFilters;
      const next = { ...prev, ...patch };
      if (patch.projectId !== undefined && patch.projectId !== prev.projectId) next.phaseId = patch.phaseId ?? '';
      set({ dashboardFilters: next });
    },

    dismissToast: () => set({ toast: null }),
    markNotificationsRead: () => {
      const id = get().currentUserId;
      set({
        notifications: get().notifications.map(n => n.userId === id ? { ...n, read: true } : n),
      });
    },

    updateTask: (taskId, patch) => {
      const state = get();
      const actor = current(state);
      const task = taskOf(taskId);
      if (!actor || !task) return fail('Task not found.');
      if (!canEditTask(actor, task, state.grants)) {
        return fail('You can only update tasks you own or are assigned to.');
      }
      if (patch.ownerId && patch.ownerId !== task.ownerId && !canReassignTask(actor, task, state.grants)) {
        return fail('Only the project manager can reassign the task owner.');
      }
      const next: Task = { ...task, ...patch };
      const changes: string[] = [];
      const befores: string[] = [];
      const afters: string[] = [];
      (Object.keys(patch) as (keyof TaskPatch)[]).forEach(key => {
        const before = String(task[key] ?? '');
        const after = String(next[key] ?? '');
        if (before !== after) {
          changes.push(key);
          befores.push(`${key}: ${before}`);
          afters.push(`${key}: ${after}`);
        }
      });
      if (changes.length === 0) return true;
      const entry = writeAudit({
        action: 'task_update',
        entityType: 'task',
        entityId: task.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Updated ${changes.join(', ')} on ${task.code}.`,
        before: befores.join('; '),
        after: afters.join('; '),
      }, actor);
      set({
        tasks: state.tasks.map(t => t.id === task.id ? next : t),
        audit: [...state.audit, entry],
      });
      return ok(`Saved ${task.code}. ${labelStatus(next.status)}.`);
    },

    addComment: (taskId, body) => {
      const state = get();
      const actor = current(state);
      const task = taskOf(taskId);
      const text = body.trim();
      if (!actor || !task) return fail('Task not found.');
      if (!canEditTask(actor, task, state.grants)) return fail('You cannot comment on this task.');
      if (!text) return fail('Comment cannot be empty.');
      const comment: Comment = { id: uid('c'), taskId, authorId: actor.id, body: text, createdAt: new Date().toISOString() };
      const entry = writeAudit({
        action: 'comment',
        entityType: 'task',
        entityId: task.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Comment added on ${task.code}.`,
      }, actor);
      set({ comments: [...state.comments, comment], audit: [...state.audit, entry] });
      return ok('Comment added.');
    },

    raiseBlocker: (taskId, title, description) => {
      const state = get();
      const actor = current(state);
      const task = taskOf(taskId);
      if (!actor || !task) return fail('Task not found.');
      if (!canRaiseBlocker(actor, task, state.grants)) return fail('You cannot raise a blocker on this task.');
      if (!title.trim() || !description.trim()) return fail('A blocker needs a title and a description.');
      const blocker: Blocker = {
        id: uid('b'),
        taskId,
        title: title.trim(),
        description: description.trim(),
        status: 'open',
        raisedById: actor.id,
        resolutionNote: '',
        reopenReason: '',
        createdAt: new Date().toISOString(),
      };
      const entry = writeAudit({
        action: 'blocker_raise',
        entityType: 'blocker',
        entityId: blocker.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Raised blocker "${blocker.title}" on ${task.code}.`,
        after: 'open',
      }, actor);
      set({ blockers: [...state.blockers, blocker], audit: [...state.audit, entry] });
      return ok('Blocker raised and set to Open.');
    },

    assignBlocker: (blockerId, ownerId) => {
      const state = get();
      const actor = current(state);
      const blocker = blockerOf(blockerId);
      const task = blocker ? taskOf(blocker.taskId) : undefined;
      const owner = state.users.find(u => u.id === ownerId);
      if (!actor || !blocker || !task || !owner) return fail('Blocker not found.');
      if (!canManageBlocker(actor, task, state.grants)) return fail('Only the project manager can assign blockers.');
      if (owner.status !== 'active') return fail('Assign the blocker to an active user.');
      const entry = writeAudit({
        action: 'blocker_assign',
        entityType: 'blocker',
        entityId: blocker.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Assigned blocker "${blocker.title}" to ${owner.name}.`,
        before: blocker.ownerId,
        after: owner.id,
      }, actor);
      const note = notify(owner.id, `${actor.name} assigned you the blocker "${blocker.title}" on ${task.code}.`);
      set({
        blockers: state.blockers.map(b => b.id === blocker.id ? { ...b, ownerId: owner.id } : b),
        audit: [...state.audit, entry],
        notifications: [...state.notifications, note],
      });
      return ok(`${owner.name} was notified and now owns this blocker.`);
    },

    setBlockerProgress: (blockerId) => {
      const state = get();
      const actor = current(state);
      const blocker = blockerOf(blockerId);
      const task = blocker ? taskOf(blocker.taskId) : undefined;
      if (!actor || !blocker || !task) return fail('Blocker not found.');
      if (!canManageBlocker(actor, task, state.grants)) return fail('Only the project manager can track blocker status.');
      if (blocker.status === 'resolved') return fail('Reopen a resolved blocker before moving it to in progress.');
      const entry = writeAudit({
        action: 'blocker_status',
        entityType: 'blocker',
        entityId: blocker.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Moved blocker "${blocker.title}" to in progress.`,
        before: blocker.status,
        after: 'in_progress',
      }, actor);
      set({
        blockers: state.blockers.map(b => b.id === blocker.id ? { ...b, status: 'in_progress' } : b),
        audit: [...state.audit, entry],
      });
      return ok('Blocker is in progress.');
    },

    resolveBlocker: (blockerId, resolutionNote) => {
      const state = get();
      const actor = current(state);
      const blocker = blockerOf(blockerId);
      const task = blocker ? taskOf(blocker.taskId) : undefined;
      const note = resolutionNote.trim();
      if (!actor || !blocker || !task) return fail('Blocker not found.');
      if (!canManageBlocker(actor, task, state.grants)) return fail('Only the project manager can resolve blockers.');
      if (!note) return fail('A resolution note is required.');
      const entry = writeAudit({
        action: 'blocker_resolve',
        entityType: 'blocker',
        entityId: blocker.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Resolved blocker "${blocker.title}".`,
        before: blocker.status,
        after: 'resolved',
      }, actor);
      set({
        blockers: state.blockers.map(b => b.id === blocker.id ? { ...b, status: 'resolved', resolutionNote: note } : b),
        audit: [...state.audit, entry],
      });
      return ok('Blocker resolved. The record stays in the audit history.');
    },

    reopenBlocker: (blockerId, reason) => {
      const state = get();
      const actor = current(state);
      const blocker = blockerOf(blockerId);
      const task = blocker ? taskOf(blocker.taskId) : undefined;
      const text = reason.trim();
      if (!actor || !blocker || !task) return fail('Blocker not found.');
      if (!canManageBlocker(actor, task, state.grants)) return fail('Only the project manager can reopen blockers.');
      if (blocker.status !== 'resolved') return fail('Only a resolved blocker can be reopened.');
      if (!text) return fail('A reason is required to reopen a blocker.');
      const entry = writeAudit({
        action: 'blocker_reopen',
        entityType: 'blocker',
        entityId: blocker.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Reopened blocker "${blocker.title}".`,
        before: 'resolved',
        after: 'reopened',
      }, actor);
      set({
        blockers: state.blockers.map(b => b.id === blocker.id ? { ...b, status: 'reopened' as BlockerStatus, reopenReason: text } : b),
        audit: [...state.audit, entry],
      });
      return ok('Blocker reopened. The reopen event is in the audit trail.');
    },

    classifyTask: (taskId, classification, note) => {
      const state = get();
      const actor = current(state);
      const task = taskOf(taskId);
      const text = note.trim();
      if (!actor || !task) return fail('Task not found.');
      if (!canClassify(actor, task, state.grants)) return fail('Only the project manager can classify conditional tasks.');
      if (!text) return fail('A justification note is required.');
      if (classification === task.classification && text === task.classificationNote) return true;
      const entry = writeAudit({
        action: 'classify',
        entityType: 'task',
        entityId: task.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Classified ${task.code} as ${labelClass(classification)}.`,
        before: task.classification,
        after: classification,
      }, actor);
      set({
        tasks: state.tasks.map(t => t.id === task.id ? { ...t, classification, classificationNote: text } : t),
        audit: [...state.audit, entry],
      });
      return ok(`${task.code} is now ${labelClass(classification)}.`);
    },

    addEvidenceFile: (taskId, file, label) => addFile(get, set, fail, ok, writeAudit, taskId, file, label),
    addEvidenceLink: (taskId, url, label) => addLink(get, set, fail, ok, writeAudit, taskId, url, label),

    replaceEvidenceFile: (evidenceId, file) => {
      const state = get();
      const prior = state.evidence.find(e => e.id === evidenceId);
      if (!prior || prior.kind !== 'file') return fail('Choose a file evidence item to replace.');
      return addFile(get, set, fail, ok, writeAudit, prior.taskId, file, prior.label, prior);
    },

    replaceEvidenceLink: (evidenceId, url) => {
      const state = get();
      const prior = state.evidence.find(e => e.id === evidenceId);
      if (!prior || prior.kind !== 'link') return fail('Choose a link evidence item to replace.');
      return addLink(get, set, fail, ok, writeAudit, prior.taskId, url, prior.label, prior);
    },

    submitEvidence: (evidenceId) => {
      const state = get();
      const actor = current(state);
      const item = state.evidence.find(e => e.id === evidenceId);
      const task = item ? taskOf(item.taskId) : undefined;
      if (!actor || !item || !task) return fail('Evidence not found.');
      if (!canManageEvidence(actor, task, state.grants)) return fail('You cannot submit evidence on this task.');
      if (item.status === 'replaced') return fail('This version was replaced. Submit the current version.');
      if (item.status === 'submitted') return fail('This evidence is already submitted.');
      const entry = writeAudit({
        action: 'evidence_submit',
        entityType: 'evidence',
        entityId: item.id,
        taskId: task.id,
        projectId: task.projectId,
        summary: `Submitted ${item.label} for ${task.code}.`,
        before: 'draft',
        after: 'submitted',
      }, actor);
      const recipients = new Set<string>();
      if (task.ownerId !== actor.id) recipients.add(task.ownerId);
      state.grants
        .filter(g => g.projectId === task.projectId && g.role === 'ProjectManager')
        .forEach(g => { if (g.userId !== actor.id) recipients.add(g.userId); });
      const notes = [...recipients].map(userId =>
        notify(userId, `${actor.name} submitted evidence on ${task.code} ${task.title}.`)
      );
      set({
        evidence: state.evidence.map(e => e.id === item.id ? { ...e, status: 'submitted' } : e),
        audit: [...state.audit, entry],
        notifications: [...state.notifications, ...notes],
      });
      return ok('Evidence submitted for review. Reviewers were notified.');
    },

    inviteUser: ({ name, email, orgAdmin, projectId, role }) => {
      const state = get();
      const actor = current(state);
      if (!actor || !canManageUsers(actor)) return fail('Only an admin can invite users.');
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return fail('Enter a name and a valid email.');
      if (state.users.some(u => u.email.toLowerCase() === cleanEmail)) return fail('A user with that email already exists.');
      if (!orgAdmin && (!projectId || !role)) return fail('Choose a project and a role, or invite an admin.');
      const user: User = {
        id: uid('u'),
        name: cleanName,
        email: cleanEmail,
        status: 'pending',
        orgAdmin,
        title: orgAdmin ? 'Invited admin' : 'Invited member',
      };
      const grant: AccessGrant | null = !orgAdmin && projectId && role
        ? { id: uid('g'), userId: user.id, projectId, role }
        : null;
      const entry = writeAudit({
        action: 'invite',
        entityType: 'user',
        entityId: user.id,
        projectId,
        summary: `Invited ${user.name} (${user.email}). Invitation is pending.`,
        after: 'pending',
      }, actor);
      set({
        users: [...state.users, user],
        grants: grant ? [...state.grants, grant] : state.grants,
        audit: [...state.audit, entry],
      });
      return ok(`Invitation sent to ${user.email}. They stay pending until they accept.`);
    },

    setOrgAdmin: (userId, orgAdmin) => {
      const state = get();
      const actor = current(state);
      const user = state.users.find(u => u.id === userId);
      if (!actor || !user || !canManageUsers(actor)) return fail('Only an admin can assign roles.');
      if (user.id === actor.id && !orgAdmin) return fail('You cannot remove your own admin role while signed in.');
      if (user.orgAdmin === orgAdmin) return true;
      const entry = writeAudit({
        action: 'role_change',
        entityType: 'user',
        entityId: user.id,
        summary: orgAdmin ? `Granted admin to ${user.name}.` : `Removed admin from ${user.name}.`,
        before: user.orgAdmin ? 'admin' : 'member',
        after: orgAdmin ? 'admin' : 'member',
      }, actor);
      set({
        users: state.users.map(u => u.id === user.id ? { ...u, orgAdmin } : u),
        audit: [...state.audit, entry],
      });
      return ok(`${user.name}'s admin access applies on their next action.`);
    },

    grantAccess: (userId, projectId, role) => {
      const state = get();
      const actor = current(state);
      const user = state.users.find(u => u.id === userId);
      const project = state.projects.find(p => p.id === projectId);
      if (!actor || !user || !project || !canManageUsers(actor)) return fail('Only an admin can manage project access.');
      if (user.status === 'deactivated') return fail('Reactivate is not available. Deactivated accounts stay closed.');
      const existing = state.grants.find(g => g.userId === userId && g.projectId === projectId);
      const entry = writeAudit({
        action: 'grant_access',
        entityType: 'access',
        entityId: existing?.id ?? uid('g'),
        projectId,
        summary: existing
          ? `Changed ${user.name}'s role on ${project.name} to ${role}.`
          : `Granted ${user.name} ${role} on ${project.name}.`,
        before: existing?.role,
        after: role,
      }, actor);
      const grants = existing
        ? state.grants.map(g => g.id === existing.id ? { ...g, role } : g)
        : [...state.grants, { id: uid('g'), userId, projectId, role }];
      set({ grants, audit: [...state.audit, entry] });
      return ok(`${user.name} will see this access on next load. No re-login is required beyond opening the project again.`);
    },

    revokeAccess: (grantId) => {
      const state = get();
      const actor = current(state);
      const grant = state.grants.find(g => g.id === grantId);
      const user = grant ? state.users.find(u => u.id === grant.userId) : undefined;
      const project = grant ? state.projects.find(p => p.id === grant.projectId) : undefined;
      if (!actor || !grant || !user || !project || !canManageUsers(actor)) return fail('Only an admin can revoke access.');
      const entry = writeAudit({
        action: 'revoke_access',
        entityType: 'access',
        entityId: grant.id,
        projectId: project.id,
        summary: `Revoked ${user.name}'s access to ${project.name}.`,
        before: grant.role,
      }, actor);
      const stillHere = state.currentUserId === user.id
        ? { currentUserId: null as string | null, toast: { type: 'info' as const, message: `Your access to ${project.name} was revoked.` } }
        : { toast: { type: 'success' as const, message: `${user.name} immediately lost visibility into ${project.name}.` } };
      set({
        grants: state.grants.filter(g => g.id !== grant.id),
        audit: [...state.audit, entry],
        ...stillHere,
      });
      return true;
    },

    deactivateUser: (userId) => {
      const state = get();
      const actor = current(state);
      const user = state.users.find(u => u.id === userId);
      if (!actor || !user || !canManageUsers(actor)) return fail('Only an admin can deactivate users.');
      if (user.id === actor.id) return fail('You cannot deactivate your own account.');
      if (user.status === 'deactivated') return fail('This user is already deactivated.');
      const entry = writeAudit({
        action: 'deactivate',
        entityType: 'user',
        entityId: user.id,
        summary: `Deactivated ${user.name}. Historical contributions were kept.`,
        before: user.status,
        after: 'deactivated',
      }, actor);
      set({
        users: state.users.map(u => u.id === user.id ? { ...u, status: 'deactivated' } : u),
        audit: [...state.audit, entry],
      });
      return ok(`${user.name} can no longer sign in. Their name stays on the historical record.`);
    },

    submitApproval: ({ projectId, phaseId, decision, rationale, conditions }) => {
      const state = get();
      const actor = current(state);
      const phase = state.phases.find(p => p.id === phaseId && p.projectId === projectId);
      if (!actor || !phase) return fail('Deliverable not found.');
      if (!leadCanReviewPhase(actor, projectId, phaseId, state.tasks, state.grants)) {
        return fail('Only the team lead for this deliverable can submit an approval decision.');
      }
      const why = rationale.trim();
      const cond = conditions.trim();
      if (!why) return fail('A rationale is required.');
      if (decision === 'reject' && !why) return fail('Reject requires a rationale.');
      if (decision === 'approve_with_conditions' && !cond) return fail('Approve with conditions requires a condition note.');
      const prior = [...state.approvals]
        .filter(a => a.projectId === projectId && a.phaseId === phaseId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .at(-1);
      const decisionRecord: ApprovalDecision = {
        id: uid('ap'),
        projectId,
        phaseId,
        decision,
        rationale: why,
        conditions: decision === 'approve_with_conditions' ? cond : '',
        actorId: actor.id,
        createdAt: new Date().toISOString(),
        supersedesId: prior?.id,
      };
      const entry = writeAudit({
        action: 'approval',
        entityType: 'approval',
        entityId: decisionRecord.id,
        projectId,
        summary: prior
          ? `New approval decision for ${phase.name} supersedes ${prior.id}.`
          : `Approval decision for ${phase.name}.`,
        before: prior?.decision,
        after: decision,
      }, actor);
      set({
        approvals: [...state.approvals, decisionRecord],
        audit: [...state.audit, entry],
      });
      return ok(prior
        ? 'Decision recorded. The previous decision stays in the audit history.'
        : 'Decision recorded in the audit log.');
    },
  };
});

type Get = () => AppStore;
type Set = (partial: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>)) => void;

function addFile(
  get: Get,
  set: Set,
  fail: (m: string) => boolean,
  ok: (m: string) => boolean,
  writeAudit: (draft: Omit<AuditEntry, 'id' | 'at' | 'actorId' | 'actorName'>, actor: User) => AuditEntry,
  taskId: string,
  file: { name: string; size: string; type: string },
  label: string,
  prior?: Evidence
): boolean {
  const state = get();
  const actor = state.users.find(u => u.id === state.currentUserId) ?? null;
  const task = state.tasks.find(t => t.id === taskId);
  if (!actor || !task) return fail('Task not found.');
  if (!canManageEvidence(actor, task, state.grants)) return fail('You cannot attach evidence to this task.');
  if (!file.name) return fail('Choose a file.');
  const item: Evidence = {
    id: uid('ev'),
    taskId,
    label: label.trim() || file.name,
    kind: 'file',
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
    version: prior ? prior.version + 1 : 1,
    replacesId: prior?.id,
    status: 'draft',
    uploaderId: actor.id,
    createdAt: new Date().toISOString(),
  };
  const entry = writeAudit({
    action: prior ? 'evidence_replace' : 'evidence_upload',
    entityType: 'evidence',
    entityId: item.id,
    taskId: task.id,
    projectId: task.projectId,
    summary: prior
      ? `Replaced ${prior.label} on ${task.code}. Prior version retained.`
      : `Uploaded ${item.label} on ${task.code}.`,
    before: prior?.id,
    after: item.fileName,
  }, actor);
  set({
    evidence: prior
      ? [...state.evidence.map(e => e.id === prior.id ? { ...e, status: 'replaced' as const } : e), item]
      : [...state.evidence, item],
    audit: [...state.audit, entry],
  });
  return ok(prior ? 'New version saved as draft. The previous file is still in history.' : 'File attached as draft. Submit it when it is ready for review.');
}

function addLink(
  get: Get,
  set: Set,
  fail: (m: string) => boolean,
  ok: (m: string) => boolean,
  writeAudit: (draft: Omit<AuditEntry, 'id' | 'at' | 'actorId' | 'actorName'>, actor: User) => AuditEntry,
  taskId: string,
  url: string,
  label: string,
  prior?: Evidence
): boolean {
  const state = get();
  const actor = state.users.find(u => u.id === state.currentUserId) ?? null;
  const task = state.tasks.find(t => t.id === taskId);
  if (!actor || !task) return fail('Task not found.');
  if (!canManageEvidence(actor, task, state.grants)) return fail('You cannot attach evidence to this task.');
  if (!isHttpUrl(url)) return fail('Enter a valid http or https link.');
  const item: Evidence = {
    id: uid('ev'),
    taskId,
    label: label.trim() || url.trim(),
    kind: 'link',
    url: url.trim(),
    version: prior ? prior.version + 1 : 1,
    replacesId: prior?.id,
    status: 'draft',
    uploaderId: actor.id,
    createdAt: new Date().toISOString(),
  };
  const entry = writeAudit({
    action: prior ? 'evidence_replace' : 'evidence_link',
    entityType: 'evidence',
    entityId: item.id,
    taskId: task.id,
    projectId: task.projectId,
    summary: prior
      ? `Replaced link ${prior.label} on ${task.code}. Prior version retained.`
      : `Linked ${item.label} on ${task.code}.`,
    before: prior?.url,
    after: item.url,
  }, actor);
  set({
    evidence: prior
      ? [...state.evidence.map(e => e.id === prior.id ? { ...e, status: 'replaced' as const } : e), item]
      : [...state.evidence, item],
    audit: [...state.audit, entry],
  });
  return ok(prior ? 'New link saved as draft. The previous link is still in history.' : 'Link saved as draft. Submit it when it is ready for review.');
}

export function syncRouteFromHash(): void {
  const route = routeFromHash();
  const currentRoute = useAppStore.getState().route;
  if (currentRoute.page !== route.page || currentRoute.taskId !== route.taskId) {
    useAppStore.setState({ route });
  }
}
