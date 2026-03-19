// ─── RBAC Types ───────────────────────────────────────────────────────────────

export type RoleName =
  | 'Guest'
  | 'Contributor'
  | 'Reviewer'
  | 'CommunityManager'
  | 'BoardMember'
  | 'Admin';

export type Permission =
  | 'view_leaderboard'
  | 'submit_contribution'
  | 'view_own_profile'
  | 'view_all_profiles'
  | 'review_contributions'
  | 'approve_contributions'
  | 'reject_contributions'
  | 'manage_members'
  | 'assign_roles'
  | 'assign_reviewers'
  | 'moderate_community'
  | 'create_proposals'
  | 'vote_proposals'
  | 'manage_rewards'
  | 'distribute_rewards'
  | 'configure_system'
  | 'manage_rbac'
  | 'view_audit_logs'
  | 'view_analytics';

export interface Role {
  id: string;
  name: RoleName;
  label: string;
  description: string;
  permissions: Permission[];
  color: string;
  level: number;
}

// ─── Member Types ─────────────────────────────────────────────────────────────

export type MemberStatus = 'active' | 'suspended' | 'archived';

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: RoleName;
  status: MemberStatus;
  joinedAt: string;
  bio: string;
  skills: string[];
  github?: string;
  reputationScore: number;
  tokenBalance: number;
  totalContributions: number;
}

// ─── Contribution Types ───────────────────────────────────────────────────────

export type ContributionCategory =
  | 'Code'
  | 'Content'
  | 'Revenue'
  | 'Community'
  | 'Governance';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  activityType: string;
  category: ContributionCategory;
  points: number;
  description: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  approvalStatus: ApprovalStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewNote?: string;
  reviewedAt?: string;
  githubPrUrl?: string;
  evidence?: string;
}

// ─── Reputation Types ─────────────────────────────────────────────────────────

export interface ReputationScore {
  memberId: string;
  totalScore: number;
  categoryBreakdown: Record<ContributionCategory, number>;
  lastCalculated: string;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  history: { date: string; score: number }[];
}

export interface CategoryWeight {
  category: ContributionCategory;
  weight: number;
  color: string;
  icon: string;
}

// ─── Governance Types ─────────────────────────────────────────────────────────

export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'executed';
export type ProposalCategory =
  | 'project_approval'
  | 'fund_allocation'
  | 'member_acceptance'
  | 'strategic'
  | 'policy'
  | 'other';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: ProposalCategory;
  authorId: string;
  authorName: string;
  status: ProposalStatus;
  createdAt: string;
  endsAt: string;
  votesFor: number;
  votesAgainst: number;
  totalWeight: number;
  comments: ProposalComment[];
  executionNote?: string;
}

export interface Vote {
  id: string;
  proposalId: string;
  memberId: string;
  memberName: string;
  choice: 'for' | 'against' | 'abstain';
  weight: number;
  timestamp: string;
  rationale?: string;
}

export interface ProposalComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: string;
}

// ─── Reward Types ─────────────────────────────────────────────────────────────

export type RewardType = 'profit_sharing' | 'bonus_tokens' | 'contributor_reward';

export interface RewardPool {
  id: string;
  name: string;
  type: RewardType;
  totalAmount: number;
  currency: string;
  snapshotDate: string;
  distributedAt?: string;
  status: 'pending' | 'distributed';
  createdById: string;
}

export interface RewardAllocation {
  id: string;
  poolId: string;
  memberId: string;
  memberName: string;
  reputationScore: number;
  sharePercentage: number;
  amount: number;
  distributed: boolean;
}

// ─── Audit Log Types ──────────────────────────────────────────────────────────

export type AuditAction =
  | 'member_created'
  | 'member_updated'
  | 'role_changed'
  | 'contribution_submitted'
  | 'contribution_approved'
  | 'contribution_rejected'
  | 'proposal_created'
  | 'vote_cast'
  | 'reward_distributed'
  | 'permission_changed'
  | 'member_suspended'
  | 'reputation_recalculated';

export interface AuditLog {
  id: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  details: string;
  timestamp: string;
}

// ─── Project Types ────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
}

// ─── UI / App State Types ─────────────────────────────────────────────────────

export type PageId =
  | 'login'
  | 'dashboard'
  | 'contributions'
  | 'members'
  | 'reputation'
  | 'governance'
  | 'rewards'
  | 'analytics'
  | 'settings'
  | 'profile';

export interface AppState {
  currentUser: Member | null;
  isAuthenticated: boolean;
  currentPage: PageId;
  selectedMemberId: string | null;
  selectedProposalId: string | null;
  selectedContributionId: string | null;
  members: Member[];
  contributions: Contribution[];
  reputationScores: ReputationScore[];
  proposals: Proposal[];
  votes: Vote[];
  rewardPools: RewardPool[];
  rewardAllocations: RewardAllocation[];
  auditLogs: AuditLog[];
  projects: Project[];
  isSidebarOpen: boolean;
  activeModal: string | null;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;

  login: (memberId: string) => void;
  logout: () => void;
  navigate: (page: PageId, params?: { memberId?: string; proposalId?: string; contributionId?: string }) => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  addMember: (member: Omit<Member, 'id' | 'reputationScore' | 'totalContributions'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  updateMemberStatus: (id: string, status: MemberStatus) => void;
  assignRole: (memberId: string, role: RoleName) => void;
  submitContribution: (contribution: Omit<Contribution, 'id' | 'timestamp' | 'memberName' | 'approvalStatus'>) => void;
  reviewContribution: (id: string, status: 'approved' | 'rejected', note: string) => void;
  recalculateReputation: (memberId?: string) => void;
  createProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'votesFor' | 'votesAgainst' | 'totalWeight' | 'comments' | 'authorName'>) => void;
  castVote: (proposalId: string, choice: 'for' | 'against' | 'abstain', rationale?: string) => void;
  addComment: (proposalId: string, text: string) => void;
  createRewardPool: (pool: Omit<RewardPool, 'id' | 'status'>) => void;
  distributeRewards: (poolId: string) => void;
}
