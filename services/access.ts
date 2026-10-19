import type {
  AccessGrant,
  Blocker,
  ProjectRole,
  Task,
  User,
} from '../types';

export function isActiveBlocker(blocker: Blocker): boolean {
  return blocker.status === 'open' || blocker.status === 'in_progress' || blocker.status === 'reopened';
}

export function projectGrant(
  user: User | null | undefined,
  grants: AccessGrant[],
  projectId: string
): AccessGrant | undefined {
  if (!user) return undefined;
  return grants.find(g => g.userId === user.id && g.projectId === projectId);
}

export function projectRole(
  user: User | null | undefined,
  grants: AccessGrant[],
  projectId: string
): ProjectRole | null {
  return projectGrant(user, grants, projectId)?.role ?? null;
}

export function isOrgAdmin(user: User | null | undefined): boolean {
  return Boolean(user?.orgAdmin && user.status === 'active');
}

export function canAuthenticate(user: User | null | undefined): boolean {
  return Boolean(user && user.status === 'active');
}

/** Lead visibility is assignment-scoped. PM and member see the whole project. Admin can read every project. */
export function canViewTask(user: User | null | undefined, task: Task, grants: AccessGrant[]): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.orgAdmin) return true;
  const grant = projectGrant(user, grants, task.projectId);
  if (!grant) return false;
  if (grant.role === 'ProjectManager' || grant.role === 'TeamMember') return true;
  return (
    task.ownerId === user.id ||
    task.assigneeIds.includes(user.id) ||
    task.approverId === user.id ||
    task.authorizedUserIds.includes(user.id)
  );
}

export function canEditTask(user: User | null | undefined, task: Task, grants: AccessGrant[]): boolean {
  if (!user || user.status !== 'active') return false;
  if (!canViewTask(user, task, grants)) return false;
  const role = projectRole(user, grants, task.projectId);
  if (role === 'ProjectManager') return true;
  if (task.ownerId === user.id || task.assigneeIds.includes(user.id)) return true;
  if (role === 'TeamLead') return true;
  return false;
}

export function canReassignTask(user: User | null | undefined, task: Task, grants: AccessGrant[]): boolean {
  return projectRole(user, grants, task.projectId) === 'ProjectManager';
}

export function canRaiseBlocker(user: User | null | undefined, task: Task, grants: AccessGrant[]): boolean {
  if (!canViewTask(user, task, grants)) return false;
  return projectRole(user, grants, task.projectId) !== null;
}

export function canManageBlocker(user: User | null | undefined, task: Task, grants: AccessGrant[]): boolean {
  return projectRole(user, grants, task.projectId) === 'ProjectManager';
}

export function canClassify(user: User | null | undefined, task: Task, grants: AccessGrant[]): boolean {
  return task.isConditional && projectRole(user, grants, task.projectId) === 'ProjectManager';
}

export function canManageEvidence(user: User | null | undefined, task: Task, grants: AccessGrant[]): boolean {
  return canEditTask(user, task, grants);
}

export function canManageUsers(user: User | null | undefined): boolean {
  return isOrgAdmin(user);
}

export function isPmOnAnyProject(user: User | null | undefined, grants: AccessGrant[]): boolean {
  if (!user || user.status !== 'active') return false;
  return grants.some(g => g.userId === user.id && g.role === 'ProjectManager');
}

export function isLeadOnAnyProject(user: User | null | undefined, grants: AccessGrant[]): boolean {
  if (!user || user.status !== 'active') return false;
  return grants.some(g => g.userId === user.id && g.role === 'TeamLead');
}

export function pmProjectIds(user: User | null | undefined, grants: AccessGrant[]): string[] {
  if (!user) return [];
  return grants.filter(g => g.userId === user.id && g.role === 'ProjectManager').map(g => g.projectId);
}

export function visibleTasks(user: User | null | undefined, tasks: Task[], grants: AccessGrant[]): Task[] {
  if (!user) return [];
  return tasks.filter(task => canViewTask(user, task, grants));
}

export function isActiveTask(task: Task): boolean {
  return task.classification !== 'not_applicable';
}

export function leadCanReviewPhase(
  user: User | null | undefined,
  projectId: string,
  phaseId: string,
  tasks: Task[],
  grants: AccessGrant[]
): boolean {
  if (projectRole(user, grants, projectId) !== 'TeamLead') return false;
  return tasks.some(
    task => task.projectId === projectId && task.phaseId === phaseId && canViewTask(user, task, grants)
  );
}
