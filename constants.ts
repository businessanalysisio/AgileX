import type {
  RoleName, Permission, Role, CategoryWeight,
  Member, Contribution, Proposal, Vote, RewardPool, Project, ProposalComment
} from './types';

// ─── RBAC Configuration ───────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  Guest: ['view_leaderboard'],
  Contributor: [
    'view_leaderboard', 'submit_contribution', 'view_own_profile', 'view_analytics',
  ],
  Reviewer: [
    'view_leaderboard', 'submit_contribution', 'view_own_profile', 'view_all_profiles',
    'review_contributions', 'approve_contributions', 'reject_contributions', 'view_analytics',
  ],
  CommunityManager: [
    'view_leaderboard', 'submit_contribution', 'view_own_profile', 'view_all_profiles',
    'review_contributions', 'approve_contributions', 'reject_contributions',
    'manage_members', 'assign_reviewers', 'moderate_community', 'view_analytics',
  ],
  BoardMember: [
    'view_leaderboard', 'submit_contribution', 'view_own_profile', 'view_all_profiles',
    'create_proposals', 'vote_proposals', 'manage_rewards', 'distribute_rewards', 'view_analytics',
  ],
  Admin: [
    'view_leaderboard', 'submit_contribution', 'view_own_profile', 'view_all_profiles',
    'review_contributions', 'approve_contributions', 'reject_contributions',
    'manage_members', 'assign_roles', 'assign_reviewers', 'moderate_community',
    'create_proposals', 'vote_proposals', 'manage_rewards', 'distribute_rewards',
    'configure_system', 'manage_rbac', 'view_audit_logs', 'view_analytics',
  ],
};

export const ROLES: Role[] = [
  {
    id: 'guest', name: 'Guest', label: 'Guest', level: 0,
    description: 'Public observer with view-only access to leaderboard.',
    permissions: ROLE_PERMISSIONS.Guest, color: 'gray',
  },
  {
    id: 'contributor', name: 'Contributor', label: 'Contributor', level: 1,
    description: 'Active member who submits contributions and tracks progress.',
    permissions: ROLE_PERMISSIONS.Contributor, color: 'blue',
  },
  {
    id: 'reviewer', name: 'Reviewer', label: 'Reviewer', level: 2,
    description: 'Trusted member who reviews and approves contribution submissions.',
    permissions: ROLE_PERMISSIONS.Reviewer, color: 'purple',
  },
  {
    id: 'community_manager', name: 'CommunityManager', label: 'Community Manager', level: 3,
    description: 'Manages community members, assigns roles, and moderates activity.',
    permissions: ROLE_PERMISSIONS.CommunityManager, color: 'orange',
  },
  {
    id: 'board_member', name: 'BoardMember', label: 'Board Member', level: 4,
    description: 'Governance participant who creates proposals and votes on decisions.',
    permissions: ROLE_PERMISSIONS.BoardMember, color: 'indigo',
  },
  {
    id: 'admin', name: 'Admin', label: 'Admin', level: 5,
    description: 'Full system access including RBAC management and system configuration.',
    permissions: ROLE_PERMISSIONS.Admin, color: 'red',
  },
];

// ─── Reputation Engine Config ─────────────────────────────────────────────────

export const CATEGORY_WEIGHTS: CategoryWeight[] = [
  { category: 'Code',       weight: 0.35, color: '#6366f1', icon: 'code' },
  { category: 'Revenue',    weight: 0.25, color: '#10b981', icon: 'revenue' },
  { category: 'Content',    weight: 0.20, color: '#f59e0b', icon: 'content' },
  { category: 'Community',  weight: 0.15, color: '#ec4899', icon: 'community' },
  { category: 'Governance', weight: 0.05, color: '#8b5cf6', icon: 'governance' },
];

export const TIME_DECAY_LAMBDA = 0.001;

export const voteWeight = (reputationScore: number): number =>
  Math.log(reputationScore + 1);

// ─── Activity Types per Category ──────────────────────────────────────────────

export const ACTIVITY_TYPES: Record<string, string[]> = {
  Code: [
    'Feature Implementation', 'Bug Fix', 'Code Review', 'Architecture Design',
    'Performance Optimization', 'Security Patch', 'Refactoring', 'Test Coverage',
  ],
  Content: [
    'Documentation', 'Blog Post', 'Tutorial', 'Case Study',
    'Video Content', 'Technical Guide', 'API Documentation',
  ],
  Revenue: [
    'Client Acquisition', 'Partnership Development', 'Sales Contribution',
    'Grant Application', 'Sponsorship', 'Revenue Strategy',
  ],
  Community: [
    'Forum Moderation', 'Onboarding Support', 'Event Organization',
    'Mentorship', 'Community Management', 'Outreach Campaign',
  ],
  Governance: [
    'Proposal Authoring', 'Voting Participation', 'Policy Review',
    'Committee Work', 'Strategic Planning',
  ],
};

// ─── Role Display Config ──────────────────────────────────────────────────────

export const ROLE_COLORS: Record<RoleName, string> = {
  Guest:            'bg-gray-100 text-gray-700 border border-gray-200',
  Contributor:      'bg-blue-100 text-blue-700 border border-blue-200',
  Reviewer:         'bg-purple-100 text-purple-700 border border-purple-200',
  CommunityManager: 'bg-orange-100 text-orange-700 border border-orange-200',
  BoardMember:      'bg-indigo-100 text-indigo-700 border border-indigo-200',
  Admin:            'bg-red-100 text-red-700 border border-red-200',
};

export const ROLE_LABELS: Record<RoleName, string> = {
  Guest:            'Guest',
  Contributor:      'Contributor',
  Reviewer:         'Reviewer',
  CommunityManager: 'Community Manager',
  BoardMember:      'Board Member',
  Admin:            'Admin',
};

export const STATUS_COLORS = {
  active:    'bg-green-100 text-green-700 border border-green-200',
  suspended: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  archived:  'bg-gray-100 text-gray-600 border border-gray-200',
};

export const APPROVAL_COLORS = {
  pending:      'bg-yellow-100 text-yellow-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  under_review: 'bg-blue-100 text-blue-700',
};

export const PROPOSAL_STATUS_COLORS = {
  draft:    'bg-gray-100 text-gray-600',
  active:   'bg-blue-100 text-blue-700',
  passed:   'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  executed: 'bg-purple-100 text-purple-700',
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_leaderboard:    'View Leaderboard',
  submit_contribution: 'Submit Contribution',
  view_own_profile:    'View Own Profile',
  view_all_profiles:   'View All Profiles',
  review_contributions: 'Review Contributions',
  approve_contributions: 'Approve Contributions',
  reject_contributions:  'Reject Contributions',
  manage_members:    'Manage Members',
  assign_roles:      'Assign Roles',
  assign_reviewers:  'Assign Reviewers',
  moderate_community: 'Moderate Community',
  create_proposals:  'Create Proposals',
  vote_proposals:    'Vote on Proposals',
  manage_rewards:    'Manage Rewards',
  distribute_rewards: 'Distribute Rewards',
  configure_system:  'Configure System',
  manage_rbac:       'Manage RBAC',
  view_audit_logs:   'View Audit Logs',
  view_analytics:    'View Analytics',
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const SEED_MEMBERS: Member[] = [
  {
    id: 'm1', name: 'Alex Rivera', email: 'alex@cooperative.io',
    avatar: 'AR', role: 'Admin', status: 'active', joinedAt: '2023-01-15',
    bio: 'Co-founder and systems architect. Passionate about cooperative economics.',
    skills: ['TypeScript', 'Rust', 'System Design', 'DevOps'],
    github: 'alexrivera', reputationScore: 0, tokenBalance: 5420, totalContributions: 0,
  },
  {
    id: 'm2', name: 'Maya Chen', email: 'maya@cooperative.io',
    avatar: 'MC', role: 'BoardMember', status: 'active', joinedAt: '2023-02-20',
    bio: 'Product strategist and governance expert. Leads cooperative policy development.',
    skills: ['Product Management', 'Governance', 'Strategy', 'Data Analysis'],
    github: 'mayachen', reputationScore: 0, tokenBalance: 3890, totalContributions: 0,
  },
  {
    id: 'm3', name: 'Jordan Smith', email: 'jordan@cooperative.io',
    avatar: 'JS', role: 'Reviewer', status: 'active', joinedAt: '2023-03-10',
    bio: 'Senior developer with focus on quality and code standards.',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Testing'],
    github: 'jordansmith', reputationScore: 0, tokenBalance: 2760, totalContributions: 0,
  },
  {
    id: 'm4', name: 'Sam Park', email: 'sam@cooperative.io',
    avatar: 'SP', role: 'CommunityManager', status: 'active', joinedAt: '2023-04-05',
    bio: 'Community builder focused on onboarding and member engagement.',
    skills: ['Community Management', 'Content Creation', 'Event Planning'],
    reputationScore: 0, tokenBalance: 1980, totalContributions: 0,
  },
  {
    id: 'm5', name: 'Dana Kim', email: 'dana@cooperative.io',
    avatar: 'DK', role: 'Contributor', status: 'active', joinedAt: '2023-05-18',
    bio: 'Full-stack developer contributing to core platform features.',
    skills: ['Vue.js', 'Python', 'Machine Learning', 'GraphQL'],
    github: 'danakim', reputationScore: 0, tokenBalance: 1340, totalContributions: 0,
  },
  {
    id: 'm6', name: 'Riley Thompson', email: 'riley@cooperative.io',
    avatar: 'RT', role: 'Contributor', status: 'active', joinedAt: '2023-06-30',
    bio: 'Content creator and technical writer building documentation.',
    skills: ['Technical Writing', 'UX Writing', 'Markdown'],
    reputationScore: 0, tokenBalance: 890, totalContributions: 0,
  },
  {
    id: 'm7', name: 'Morgan Walsh', email: 'morgan@cooperative.io',
    avatar: 'MW', role: 'Contributor', status: 'active', joinedAt: '2023-07-12',
    bio: 'Business development specialist driving partnership growth.',
    skills: ['Sales', 'Business Development', 'CRM', 'Negotiation'],
    reputationScore: 0, tokenBalance: 1120, totalContributions: 0,
  },
  {
    id: 'm8', name: 'Taylor Nguyen', email: 'taylor@cooperative.io',
    avatar: 'TN', role: 'Reviewer', status: 'active', joinedAt: '2023-08-22',
    bio: 'Security engineer and code reviewer ensuring platform integrity.',
    skills: ['Cybersecurity', 'Code Review', 'Penetration Testing', 'Rust'],
    github: 'taylornguyen', reputationScore: 0, tokenBalance: 2100, totalContributions: 0,
  },
  {
    id: 'm9', name: 'Casey Brooks', email: 'casey@cooperative.io',
    avatar: 'CB', role: 'Contributor', status: 'suspended', joinedAt: '2023-09-01',
    bio: 'Frontend developer on leave.',
    skills: ['HTML', 'CSS', 'JavaScript'],
    reputationScore: 0, tokenBalance: 340, totalContributions: 0,
  },
  {
    id: 'm10', name: 'Avery Johnson', email: 'avery@cooperative.io',
    avatar: 'AJ', role: 'Guest', status: 'active', joinedAt: '2024-01-10',
    bio: 'Recently joined to explore the cooperative.',
    skills: ['Python', 'Data Science'],
    reputationScore: 0, tokenBalance: 0, totalContributions: 0,
  },
];

export const SEED_CONTRIBUTIONS: Contribution[] = [
  { id: 'c1', memberId: 'm1', memberName: 'Alex Rivera', activityType: 'Feature Implementation', category: 'Code', points: 120, description: 'Implemented reputation engine core algorithm with time-decay support.', timestamp: daysAgo(90), projectId: 'p1', projectName: 'Core Platform', approvalStatus: 'approved', reviewerId: 'm3', reviewerName: 'Jordan Smith', reviewNote: 'Excellent implementation.', reviewedAt: daysAgo(88) },
  { id: 'c2', memberId: 'm1', memberName: 'Alex Rivera', activityType: 'Architecture Design', category: 'Code', points: 150, description: 'Designed microservices architecture for v2.0 platform migration.', timestamp: daysAgo(75), projectId: 'p1', projectName: 'Core Platform', approvalStatus: 'approved', reviewerId: 'm8', reviewerName: 'Taylor Nguyen', reviewedAt: daysAgo(73) },
  { id: 'c3', memberId: 'm1', memberName: 'Alex Rivera', activityType: 'Security Patch', category: 'Code', points: 80, description: 'Patched critical XSS vulnerability in the contribution submission form.', timestamp: daysAgo(45), projectId: 'p1', projectName: 'Core Platform', approvalStatus: 'approved', reviewerId: 'm8', reviewerName: 'Taylor Nguyen', reviewedAt: daysAgo(44) },
  { id: 'c4', memberId: 'm1', memberName: 'Alex Rivera', activityType: 'Voting Participation', category: 'Governance', points: 20, description: 'Voted on Q3 budget allocation proposal.', timestamp: daysAgo(30), approvalStatus: 'approved', reviewerId: 'm2', reviewerName: 'Maya Chen', reviewedAt: daysAgo(29) },
  { id: 'c5', memberId: 'm2', memberName: 'Maya Chen', activityType: 'Policy Review', category: 'Governance', points: 60, description: 'Reviewed and updated contributor governance bylaws.', timestamp: daysAgo(85), approvalStatus: 'approved', reviewerId: 'm1', reviewerName: 'Alex Rivera', reviewedAt: daysAgo(83) },
  { id: 'c6', memberId: 'm2', memberName: 'Maya Chen', activityType: 'Blog Post', category: 'Content', points: 40, description: 'Published "Cooperative Economics in the Digital Age" — 12k reads.', timestamp: daysAgo(60), approvalStatus: 'approved', reviewerId: 'm4', reviewerName: 'Sam Park', reviewedAt: daysAgo(58) },
  { id: 'c7', memberId: 'm2', memberName: 'Maya Chen', activityType: 'Strategic Planning', category: 'Governance', points: 90, description: 'Led Q4 strategic planning sessions and produced roadmap document.', timestamp: daysAgo(20), approvalStatus: 'approved', reviewerId: 'm1', reviewerName: 'Alex Rivera', reviewedAt: daysAgo(18) },
  { id: 'c8', memberId: 'm2', memberName: 'Maya Chen', activityType: 'Grant Application', category: 'Revenue', points: 100, description: 'Secured $50,000 NSF grant for platform research.', timestamp: daysAgo(50), approvalStatus: 'approved', reviewerId: 'm1', reviewerName: 'Alex Rivera', reviewedAt: daysAgo(48) },
  { id: 'c9', memberId: 'm3', memberName: 'Jordan Smith', activityType: 'Code Review', category: 'Code', points: 45, description: 'Reviewed 8 PRs in the authentication module overhaul.', timestamp: daysAgo(55), projectId: 'p1', projectName: 'Core Platform', approvalStatus: 'approved', reviewerId: 'm1', reviewerName: 'Alex Rivera', reviewedAt: daysAgo(53) },
  { id: 'c10', memberId: 'm3', memberName: 'Jordan Smith', activityType: 'Bug Fix', category: 'Code', points: 35, description: 'Fixed pagination bug causing data loss in large datasets.', timestamp: daysAgo(40), projectId: 'p2', projectName: 'Analytics Module', approvalStatus: 'approved', reviewerId: 'm8', reviewerName: 'Taylor Nguyen', reviewedAt: daysAgo(38) },
  { id: 'c11', memberId: 'm3', memberName: 'Jordan Smith', activityType: 'Test Coverage', category: 'Code', points: 55, description: 'Raised unit test coverage from 68% to 91% across core modules.', timestamp: daysAgo(25), projectId: 'p1', projectName: 'Core Platform', approvalStatus: 'approved', reviewerId: 'm1', reviewerName: 'Alex Rivera', reviewedAt: daysAgo(23) },
  { id: 'c12', memberId: 'm4', memberName: 'Sam Park', activityType: 'Event Organization', category: 'Community', points: 70, description: 'Organized CoopHack hackathon with 120 participants.', timestamp: daysAgo(80), approvalStatus: 'approved', reviewerId: 'm2', reviewerName: 'Maya Chen', reviewedAt: daysAgo(78) },
  { id: 'c13', memberId: 'm4', memberName: 'Sam Park', activityType: 'Onboarding Support', category: 'Community', points: 40, description: 'Onboarded 15 new contributors in Q3 cohort.', timestamp: daysAgo(35), approvalStatus: 'approved', reviewerId: 'm1', reviewerName: 'Alex Rivera', reviewedAt: daysAgo(33) },
  { id: 'c14', memberId: 'm4', memberName: 'Sam Park', activityType: 'Tutorial', category: 'Content', points: 50, description: 'Created "Getting Started with Contribution Tracking" video series (5 episodes).', timestamp: daysAgo(15), approvalStatus: 'under_review' },
  { id: 'c15', memberId: 'm5', memberName: 'Dana Kim', activityType: 'Feature Implementation', category: 'Code', points: 95, description: 'Built ML-powered contribution categorization engine.', timestamp: daysAgo(70), projectId: 'p3', projectName: 'ML Pipeline', approvalStatus: 'approved', reviewerId: 'm3', reviewerName: 'Jordan Smith', reviewedAt: daysAgo(68) },
  { id: 'c16', memberId: 'm5', memberName: 'Dana Kim', activityType: 'Documentation', category: 'Content', points: 30, description: 'Wrote comprehensive API documentation for the GraphQL schema.', timestamp: daysAgo(45), projectId: 'p1', projectName: 'Core Platform', approvalStatus: 'approved', reviewerId: 'm6', reviewerName: 'Riley Thompson', reviewedAt: daysAgo(43) },
  { id: 'c17', memberId: 'm5', memberName: 'Dana Kim', activityType: 'Performance Optimization', category: 'Code', points: 65, description: 'Reduced API response times by 40% through query optimization.', timestamp: daysAgo(10), projectId: 'p1', projectName: 'Core Platform', approvalStatus: 'pending' },
  { id: 'c18', memberId: 'm6', memberName: 'Riley Thompson', activityType: 'Documentation', category: 'Content', points: 55, description: 'Rewrote the entire developer documentation portal.', timestamp: daysAgo(65), approvalStatus: 'approved', reviewerId: 'm4', reviewerName: 'Sam Park', reviewedAt: daysAgo(63) },
  { id: 'c19', memberId: 'm6', memberName: 'Riley Thompson', activityType: 'Case Study', category: 'Content', points: 45, description: 'Published "How CoopX Increased Contributor Retention by 60%" case study.', timestamp: daysAgo(30), approvalStatus: 'approved', reviewerId: 'm4', reviewerName: 'Sam Park', reviewedAt: daysAgo(28) },
  { id: 'c20', memberId: 'm6', memberName: 'Riley Thompson', activityType: 'Technical Guide', category: 'Content', points: 35, description: 'Authored RBAC implementation guide for platform administrators.', timestamp: daysAgo(8), approvalStatus: 'pending' },
  { id: 'c21', memberId: 'm7', memberName: 'Morgan Walsh', activityType: 'Client Acquisition', category: 'Revenue', points: 110, description: 'Closed partnership with TechCoop Network — $120k annual contract.', timestamp: daysAgo(72), approvalStatus: 'approved', reviewerId: 'm2', reviewerName: 'Maya Chen', reviewedAt: daysAgo(70) },
  { id: 'c22', memberId: 'm7', memberName: 'Morgan Walsh', activityType: 'Partnership Development', category: 'Revenue', points: 80, description: 'Established 3 strategic integrations with open-source tooling vendors.', timestamp: daysAgo(40), approvalStatus: 'approved', reviewerId: 'm2', reviewerName: 'Maya Chen', reviewedAt: daysAgo(38) },
  { id: 'c23', memberId: 'm7', memberName: 'Morgan Walsh', activityType: 'Revenue Strategy', category: 'Revenue', points: 50, description: 'Developed tiered membership pricing model — projected +35% ARR.', timestamp: daysAgo(12), approvalStatus: 'pending' },
  { id: 'c24', memberId: 'm8', memberName: 'Taylor Nguyen', activityType: 'Security Patch', category: 'Code', points: 90, description: 'Identified and resolved 4 critical vulnerabilities in the auth layer.', timestamp: daysAgo(58), projectId: 'p1', projectName: 'Core Platform', approvalStatus: 'approved', reviewerId: 'm1', reviewerName: 'Alex Rivera', reviewedAt: daysAgo(56) },
  { id: 'c25', memberId: 'm8', memberName: 'Taylor Nguyen', activityType: 'Code Review', category: 'Code', points: 40, description: 'Security-focused review of payment integration module.', timestamp: daysAgo(22), approvalStatus: 'approved', reviewerId: 'm3', reviewerName: 'Jordan Smith', reviewedAt: daysAgo(20) },
  { id: 'c26', memberId: 'm9', memberName: 'Casey Brooks', activityType: 'Bug Fix', category: 'Code', points: 25, description: 'Fixed CSS responsive layout issues on mobile devices.', timestamp: daysAgo(100), approvalStatus: 'approved', reviewerId: 'm3', reviewerName: 'Jordan Smith', reviewedAt: daysAgo(98) },
];

const commentBase: ProposalComment[] = [
  { id: 'cm1', authorId: 'm3', authorName: 'Jordan Smith', text: 'This aligns with our Q3 technical roadmap. Strongly supportive.', timestamp: daysAgo(12) },
  { id: 'cm2', authorId: 'm4', authorName: 'Sam Park', text: 'Community feedback has been overwhelmingly positive on this direction.', timestamp: daysAgo(11) },
];

export const SEED_PROPOSALS: Proposal[] = [
  {
    id: 'pr1', title: 'Adopt Event-Driven Architecture for Contribution Pipeline',
    description: 'Proposal to migrate the contribution processing pipeline to an event-driven model using Kafka. This enables real-time reputation updates, better scalability, and decoupled service communication.\n\nExpected benefits:\n- Sub-second reputation recalculations\n- Horizontal scalability to 10k+ concurrent contributors\n- Full audit trail via event log\n- Easier external integrations (GitHub, Discord)',
    category: 'project_approval', authorId: 'm1', authorName: 'Alex Rivera',
    status: 'active', createdAt: daysAgo(14),
    endsAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
    votesFor: 0, votesAgainst: 0, totalWeight: 0, comments: commentBase,
  },
  {
    id: 'pr2', title: 'Q4 2024 Community Development Fund — $25,000 Allocation',
    description: 'Allocate $25,000 from the platform treasury to community development initiatives in Q4 2024.\n\nBreakdown:\n- $10,000 — Hackathon prizes and events\n- $8,000 — Content creator incentives\n- $5,000 — Onboarding infrastructure\n- $2,000 — Community tooling',
    category: 'fund_allocation', authorId: 'm2', authorName: 'Maya Chen',
    status: 'passed', createdAt: daysAgo(30), endsAt: daysAgo(16),
    votesFor: 0, votesAgainst: 0, totalWeight: 0, comments: [],
    executionNote: 'Approved by board vote. Treasury transfer initiated.',
  },
  {
    id: 'pr3', title: 'Formalize Reviewer Role with Structured Training Requirements',
    description: 'Formalize the Reviewer role with structured onboarding, training requirements, and enhanced governance participation rights.\n\nKey changes:\n- Reviewers can vote on technical proposals\n- Mandatory 40-hour review training completion\n- Quarterly reviewer performance reviews',
    category: 'policy', authorId: 'm2', authorName: 'Maya Chen',
    status: 'active', createdAt: daysAgo(5),
    endsAt: new Date(now.getTime() + 10 * 86400000).toISOString(),
    votesFor: 0, votesAgainst: 0, totalWeight: 0, comments: [],
  },
  {
    id: 'pr4', title: 'Accept Zara Patel as Platform Contributor',
    description: 'Application for Zara Patel (ML Engineer, 5 years experience) to join as Contributor. Brings deep expertise in recommendation systems.',
    category: 'member_acceptance', authorId: 'm4', authorName: 'Sam Park',
    status: 'passed', createdAt: daysAgo(20), endsAt: daysAgo(13),
    votesFor: 0, votesAgainst: 0, totalWeight: 0, comments: [],
    executionNote: 'Member accepted. Welcome email sent.',
  },
];

export const SEED_VOTES: Vote[] = [
  { id: 'v1', proposalId: 'pr2', memberId: 'm1', memberName: 'Alex Rivera', choice: 'for', weight: 0, timestamp: daysAgo(28), rationale: 'Community investment is critical at this growth stage.' },
  { id: 'v2', proposalId: 'pr2', memberId: 'm2', memberName: 'Maya Chen', choice: 'for', weight: 0, timestamp: daysAgo(27) },
  { id: 'v3', proposalId: 'pr2', memberId: 'm3', memberName: 'Jordan Smith', choice: 'for', weight: 0, timestamp: daysAgo(26), rationale: 'Hackathon investment is well-justified.' },
  { id: 'v4', proposalId: 'pr2', memberId: 'm8', memberName: 'Taylor Nguyen', choice: 'against', weight: 0, timestamp: daysAgo(25), rationale: 'Amount seems high. Suggest $18k.' },
  { id: 'v5', proposalId: 'pr4', memberId: 'm1', memberName: 'Alex Rivera', choice: 'for', weight: 0, timestamp: daysAgo(18) },
  { id: 'v6', proposalId: 'pr4', memberId: 'm2', memberName: 'Maya Chen', choice: 'for', weight: 0, timestamp: daysAgo(17) },
  { id: 'v7', proposalId: 'pr4', memberId: 'm4', memberName: 'Sam Park', choice: 'for', weight: 0, timestamp: daysAgo(16) },
  { id: 'v8', proposalId: 'pr1', memberId: 'm3', memberName: 'Jordan Smith', choice: 'for', weight: 0, timestamp: daysAgo(11) },
  { id: 'v9', proposalId: 'pr1', memberId: 'm5', memberName: 'Dana Kim', choice: 'for', weight: 0, timestamp: daysAgo(10), rationale: 'This will massively improve the ML pipeline integration.' },
];

export const SEED_PROJECTS: Project[] = [
  { id: 'p1', name: 'Core Platform', description: 'Main platform infrastructure and APIs.', status: 'active', createdAt: '2023-01-01' },
  { id: 'p2', name: 'Analytics Module', description: 'Data analytics and reporting dashboard.', status: 'active', createdAt: '2023-06-01' },
  { id: 'p3', name: 'ML Pipeline', description: 'Machine learning contribution analysis tools.', status: 'active', createdAt: '2023-09-01' },
  { id: 'p4', name: 'Mobile App', description: 'Cross-platform mobile application.', status: 'archived', createdAt: '2023-03-01' },
];

export const SEED_REWARD_POOLS: RewardPool[] = [
  {
    id: 'rp1', name: 'Q3 2024 Profit Sharing', type: 'profit_sharing',
    totalAmount: 50000, currency: 'USD',
    snapshotDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
    status: 'pending', createdById: 'm2',
  },
  {
    id: 'rp2', name: 'Q2 2024 Contributor Bonus', type: 'contributor_reward',
    totalAmount: 20000, currency: 'USD',
    snapshotDate: new Date(now.getTime() - 95 * 86400000).toISOString(),
    distributedAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
    status: 'distributed', createdById: 'm1',
  },
];
