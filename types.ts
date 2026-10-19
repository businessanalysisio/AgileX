export type ProjectRole = 'ProjectManager' | 'TeamLead' | 'TeamMember';

export type UserStatus = 'active' | 'pending' | 'deactivated';

export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'in_review' | 'done';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type ConditionalClass =
  | 'unclassified'
  | 'applicable'
  | 'not_applicable'
  | 'needs_clarification';

export type BlockerStatus = 'open' | 'in_progress' | 'resolved' | 'reopened';

export type EvidenceKind = 'file' | 'link';

export type EvidenceStatus = 'draft' | 'submitted' | 'replaced';

export type ApprovalChoice = 'approve' | 'reject' | 'approve_with_conditions';

export type PageId =
  | 'dashboard'
  | 'tasks'
  | 'timeline'
  | 'blockers'
  | 'evidence'
  | 'scope'
  | 'approvals'
  | 'access'
  | 'audit';

export interface Route {
  page: PageId;
  taskId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  orgAdmin: boolean;
  title: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  summary: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  order: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  phaseId: string;
  name: string;
  date: string;
  ownerId: string;
  summary: string;
}

export interface Task {
  id: string;
  code: string;
  projectId: string;
  phaseId: string;
  milestoneId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  ownerId: string;
  assigneeIds: string[];
  approverId?: string;
  authorizedUserIds: string[];
  startDate: string;
  dueDate: string;
  isConditional: boolean;
  classification: ConditionalClass;
  classificationNote: string;
  notes: string;
}

export interface Blocker {
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: BlockerStatus;
  ownerId?: string;
  raisedById: string;
  resolutionNote: string;
  reopenReason: string;
  createdAt: string;
}

export interface Evidence {
  id: string;
  taskId: string;
  label: string;
  kind: EvidenceKind;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  url?: string;
  version: number;
  replacesId?: string;
  status: EvidenceStatus;
  uploaderId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface ApprovalDecision {
  id: string;
  projectId: string;
  phaseId: string;
  decision: ApprovalChoice;
  rationale: string;
  conditions: string;
  actorId: string;
  createdAt: string;
  supersedesId?: string;
}

export interface AccessGrant {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: 'task' | 'blocker' | 'evidence' | 'approval' | 'access' | 'user';
  entityId: string;
  taskId?: string;
  projectId?: string;
  summary: string;
  before?: string;
  after?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  at: string;
  read: boolean;
}

export interface DashboardFilters {
  projectId: string;
  phaseId: string;
  status: string;
}

export const TASK_STATUSES: TaskStatus[] = [
  'not_started',
  'in_progress',
  'blocked',
  'in_review',
  'done',
];

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

export const BLOCKER_STATUSES: BlockerStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'reopened',
];
