import type {
  ApprovalChoice,
  BlockerStatus,
  ConditionalClass,
  Priority,
  ProjectRole,
  TaskStatus,
} from '../types';

export const APP_TODAY = '2026-10-19';

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m) - 1]} ${Number(d)}, ${y}`;
}

export function formatWhen(iso: string): string {
  const date = formatDate(iso);
  const time = iso.includes('T') ? iso.slice(11, 16) : '';
  return time ? `${date} ${time}` : date;
}

export function labelStatus(status: TaskStatus): string {
  switch (status) {
    case 'not_started': return 'Not started';
    case 'in_progress': return 'In progress';
    case 'blocked': return 'Blocked';
    case 'in_review': return 'In review';
    case 'done': return 'Done';
  }
}

export function labelPriority(priority: Priority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function labelBlocker(status: BlockerStatus): string {
  switch (status) {
    case 'open': return 'Open';
    case 'in_progress': return 'In progress';
    case 'resolved': return 'Resolved';
    case 'reopened': return 'Reopened';
  }
}

export function labelClass(value: ConditionalClass): string {
  switch (value) {
    case 'unclassified': return 'Unclassified';
    case 'applicable': return 'Applicable';
    case 'not_applicable': return 'Not applicable';
    case 'needs_clarification': return 'Needs clarification';
  }
}

export function labelRole(role: ProjectRole | 'Admin'): string {
  switch (role) {
    case 'Admin': return 'Admin';
    case 'ProjectManager': return 'Project Manager';
    case 'TeamLead': return 'Team Lead';
    case 'TeamMember': return 'Team Member';
  }
}

export function labelDecision(decision: ApprovalChoice): string {
  switch (decision) {
    case 'approve': return 'Approve';
    case 'reject': return 'Reject';
    case 'approve_with_conditions': return 'Approve with conditions';
  }
}

export function isOverdue(dueDate: string, status: TaskStatus): boolean {
  return status !== 'done' && dueDate < APP_TODAY;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseDay(iso: string): number {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
}
