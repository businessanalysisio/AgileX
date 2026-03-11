import { create } from 'zustand';
import type {
  AppState, Member, MemberStatus, RoleName, Contribution, Proposal,
  RewardPool, RewardAllocation, AuditLog, AuditAction, PageId, Vote, ProposalComment
} from '../types';
import {
  SEED_MEMBERS, SEED_CONTRIBUTIONS, SEED_PROPOSALS, SEED_VOTES,
  SEED_PROJECTS, SEED_REWARD_POOLS,
} from '../constants';
import { recalculateAllReputations, calculateRewardShares } from '../services/reputationEngine';
import { voteWeight } from '../constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 1000;
const uid = (prefix: string) => `${prefix}_${Date.now()}_${_idCounter++}`;

function makeAuditLog(
  action: AuditAction,
  actor: Member,
  details: string,
  targetId?: string,
  targetName?: string
): AuditLog {
  return {
    id: uid('al'),
    action,
    actorId: actor.id,
    actorName: actor.name,
    targetId,
    targetName,
    details,
    timestamp: new Date().toISOString(),
  };
}

// ─── Initial State Bootstrap ──────────────────────────────────────────────────

function bootstrapState() {
  const members = SEED_MEMBERS;
  const contributions = SEED_CONTRIBUTIONS;
  const reputationScores = recalculateAllReputations(members, contributions);

  // Update member reputation scores from engine
  const updatedMembers = members.map(m => {
    const score = reputationScores.find(s => s.memberId === m.id);
    const totalContributions = contributions.filter(c => c.memberId === m.id && c.approvalStatus === 'approved').length;
    return { ...m, reputationScore: score?.totalScore ?? 0, totalContributions };
  });

  // Populate vote weights based on calculated reputation
  const votesWithWeights = SEED_VOTES.map(vote => {
    const member = updatedMembers.find(m => m.id === vote.memberId);
    const rep = member?.reputationScore ?? 0;
    return { ...vote, weight: voteWeight(rep) };
  });

  // Update proposal vote tallies
  const proposalsWithVotes = SEED_PROPOSALS.map(proposal => {
    const proposalVotes = votesWithWeights.filter(v => v.proposalId === proposal.id);
    const votesFor = proposalVotes
      .filter(v => v.choice === 'for')
      .reduce((sum, v) => sum + v.weight, 0);
    const votesAgainst = proposalVotes
      .filter(v => v.choice === 'against')
      .reduce((sum, v) => sum + v.weight, 0);
    return {
      ...proposal,
      votesFor: Math.round(votesFor * 100) / 100,
      votesAgainst: Math.round(votesAgainst * 100) / 100,
      totalWeight: Math.round((votesFor + votesAgainst) * 100) / 100,
    };
  });

  return {
    members: updatedMembers,
    contributions,
    reputationScores,
    proposals: proposalsWithVotes,
    votes: votesWithWeights,
    projects: SEED_PROJECTS,
    rewardPools: SEED_REWARD_POOLS,
    rewardAllocations: [] as RewardAllocation[],
    auditLogs: [] as AuditLog[],
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => {
  const initialData = bootstrapState();

  return {
    // Auth
    currentUser: null,
    isAuthenticated: false,

    // Navigation
    currentPage: 'login',
    selectedMemberId: null,
    selectedProposalId: null,
    selectedContributionId: null,

    // Data
    ...initialData,

    // UI
    isSidebarOpen: true,
    activeModal: null,
    notification: null,

    // ── Auth Actions ────────────────────────────────────────────────────────

    login: (memberId: string) => {
      const member = get().members.find(m => m.id === memberId);
      if (!member) return;
      set({ currentUser: member, isAuthenticated: true, currentPage: 'dashboard' });
    },

    logout: () => {
      set({ currentUser: null, isAuthenticated: false, currentPage: 'login', selectedMemberId: null });
    },

    // ── Navigation ──────────────────────────────────────────────────────────

    navigate: (page: PageId, params = {}) => {
      set({
        currentPage: page,
        selectedMemberId: params.memberId ?? null,
        selectedProposalId: params.proposalId ?? null,
        selectedContributionId: params.contributionId ?? null,
      });
    },

    // ── UI Actions ──────────────────────────────────────────────────────────

    toggleSidebar: () => set(s => ({ isSidebarOpen: !s.isSidebarOpen })),

    openModal: (modalId: string) => set({ activeModal: modalId }),

    closeModal: () => set({ activeModal: null }),

    showNotification: (type, message) => {
      set({ notification: { type, message } });
      setTimeout(() => set({ notification: null }), 3500);
    },

    // ── Member Actions ──────────────────────────────────────────────────────

    addMember: (memberData) => {
      const { currentUser, members, contributions, showNotification } = get();
      const newMember: Member = {
        ...memberData,
        id: uid('m'),
        reputationScore: 0,
        totalContributions: 0,
      };
      const newMembers = [...members, newMember];
      const reputationScores = recalculateAllReputations(newMembers, contributions);
      const auditLog = currentUser
        ? makeAuditLog('member_created', currentUser, `Created member ${newMember.name}`, newMember.id, newMember.name)
        : null;

      set(s => ({
        members: newMembers,
        reputationScores,
        auditLogs: auditLog ? [auditLog, ...s.auditLogs] : s.auditLogs,
      }));
      showNotification('success', `Member ${newMember.name} created successfully.`);
    },

    updateMember: (id, updates) => {
      const { currentUser, members, contributions, showNotification } = get();
      const updatedMembers = members.map(m => m.id === id ? { ...m, ...updates } : m);
      const reputationScores = recalculateAllReputations(updatedMembers, contributions);
      const target = members.find(m => m.id === id);
      const auditLog = currentUser && target
        ? makeAuditLog('member_updated', currentUser, `Updated member profile`, id, target.name)
        : null;

      set(s => ({
        members: updatedMembers,
        reputationScores,
        auditLogs: auditLog ? [auditLog, ...s.auditLogs] : s.auditLogs,
      }));
      // Sync currentUser if self-update
      if (get().currentUser?.id === id) {
        set({ currentUser: updatedMembers.find(m => m.id === id) ?? null });
      }
      showNotification('success', 'Member updated successfully.');
    },

    updateMemberStatus: (id, status: MemberStatus) => {
      const { currentUser, members, showNotification } = get();
      const target = members.find(m => m.id === id);
      const updatedMembers = members.map(m => m.id === id ? { ...m, status } : m);
      const auditLog = currentUser && target
        ? makeAuditLog('member_suspended', currentUser, `Changed status to ${status}`, id, target.name)
        : null;

      set(s => ({
        members: updatedMembers,
        auditLogs: auditLog ? [auditLog, ...s.auditLogs] : s.auditLogs,
      }));
      showNotification('success', `Member status updated to ${status}.`);
    },

    assignRole: (memberId, role: RoleName) => {
      const { currentUser, members, contributions, showNotification } = get();
      const target = members.find(m => m.id === memberId);
      const updatedMembers = members.map(m => m.id === memberId ? { ...m, role } : m);
      const reputationScores = recalculateAllReputations(updatedMembers, contributions);
      const auditLog = currentUser && target
        ? makeAuditLog('role_changed', currentUser, `Role changed from ${target.role} to ${role}`, memberId, target.name)
        : null;

      set(s => ({
        members: updatedMembers,
        reputationScores,
        auditLogs: auditLog ? [auditLog, ...s.auditLogs] : s.auditLogs,
      }));
      if (get().currentUser?.id === memberId) {
        set({ currentUser: updatedMembers.find(m => m.id === memberId) ?? null });
      }
      showNotification('success', `Role updated to ${role}.`);
    },

    // ── Contribution Actions ────────────────────────────────────────────────

    submitContribution: (data) => {
      const { currentUser, members, showNotification } = get();
      const memberName = members.find(m => m.id === data.memberId)?.name ?? 'Unknown';
      const newContrib: Contribution = {
        ...data,
        id: uid('c'),
        memberName,
        timestamp: new Date().toISOString(),
        approvalStatus: 'pending',
      };
      const auditLog = currentUser
        ? makeAuditLog('contribution_submitted', currentUser, `Submitted ${newContrib.activityType} contribution (${newContrib.points} pts)`, newContrib.id)
        : null;

      set(s => ({
        contributions: [newContrib, ...s.contributions],
        auditLogs: auditLog ? [auditLog, ...s.auditLogs] : s.auditLogs,
      }));
      showNotification('success', 'Contribution submitted for review.');
    },

    reviewContribution: (id, status, note) => {
      const { currentUser, members, contributions, showNotification } = get();
      const contrib = contributions.find(c => c.id === id);
      if (!contrib || !currentUser) return;

      const reviewerName = currentUser.name;
      const updatedContributions = contributions.map(c =>
        c.id === id
          ? { ...c, approvalStatus: status, reviewerId: currentUser.id, reviewerName, reviewNote: note, reviewedAt: new Date().toISOString() }
          : c
      );

      const reputationScores = recalculateAllReputations(members, updatedContributions);
      const updatedMembers = members.map(m => {
        const score = reputationScores.find(s => s.memberId === m.id);
        const totalContributions = updatedContributions.filter(c => c.memberId === m.id && c.approvalStatus === 'approved').length;
        return { ...m, reputationScore: score?.totalScore ?? 0, totalContributions };
      });

      const action: AuditAction = status === 'approved' ? 'contribution_approved' : 'contribution_rejected';
      const auditLog = makeAuditLog(action, currentUser, `${status} contribution: ${contrib.activityType}`, id);

      set(s => ({
        contributions: updatedContributions,
        members: updatedMembers,
        reputationScores,
        auditLogs: [auditLog, ...s.auditLogs],
      }));

      if (get().currentUser?.id === contrib.memberId) {
        set({ currentUser: updatedMembers.find(m => m.id === contrib.memberId) ?? null });
      }

      showNotification('success', `Contribution ${status}.`);
    },

    // ── Reputation Actions ──────────────────────────────────────────────────

    recalculateReputation: (memberId?) => {
      const { members, contributions, currentUser, showNotification } = get();
      const targetMembers = memberId ? members.filter(m => m.id === memberId) : members;
      const allScores = recalculateAllReputations(targetMembers, contributions);

      // If recalculating specific member, merge with existing scores
      const existingScores = get().reputationScores;
      const mergedScores = memberId
        ? existingScores.map(s => allScores.find(ns => ns.memberId === s.memberId) ?? s)
        : allScores;

      const updatedMembers = members.map(m => {
        const score = mergedScores.find(s => s.memberId === m.id);
        return score ? { ...m, reputationScore: score.totalScore } : m;
      });

      const auditLog = currentUser
        ? makeAuditLog('reputation_recalculated', currentUser, memberId ? `Recalculated for member ${memberId}` : 'Full reputation recalculation')
        : null;

      set(s => ({
        reputationScores: mergedScores,
        members: updatedMembers,
        auditLogs: auditLog ? [auditLog, ...s.auditLogs] : s.auditLogs,
      }));

      if (get().currentUser) {
        const updatedCurrentUser = updatedMembers.find(m => m.id === get().currentUser?.id);
        if (updatedCurrentUser) set({ currentUser: updatedCurrentUser });
      }

      showNotification('success', 'Reputation scores recalculated.');
    },

    // ── Governance Actions ──────────────────────────────────────────────────

    createProposal: (data) => {
      const { currentUser, members, showNotification } = get();
      if (!currentUser) return;
      const authorName = members.find(m => m.id === data.authorId)?.name ?? currentUser.name;
      const newProposal: Proposal = {
        ...data,
        id: uid('pr'),
        authorName,
        createdAt: new Date().toISOString(),
        votesFor: 0,
        votesAgainst: 0,
        totalWeight: 0,
        comments: [],
      };
      const auditLog = makeAuditLog('proposal_created', currentUser, `Created proposal: ${newProposal.title}`, newProposal.id);

      set(s => ({
        proposals: [newProposal, ...s.proposals],
        auditLogs: [auditLog, ...s.auditLogs],
      }));
      showNotification('success', 'Proposal created successfully.');
    },

    castVote: (proposalId, choice, rationale) => {
      const { currentUser, votes, proposals, showNotification } = get();
      if (!currentUser) return;

      const existingVote = votes.find(v => v.proposalId === proposalId && v.memberId === currentUser.id);
      if (existingVote) {
        showNotification('error', 'You have already voted on this proposal.');
        return;
      }

      const repScore = get().reputationScores.find(s => s.memberId === currentUser.id);
      const weight = voteWeight(repScore?.totalScore ?? 0);

      const newVote: Vote = {
        id: uid('v'),
        proposalId,
        memberId: currentUser.id,
        memberName: currentUser.name,
        choice,
        weight: Math.round(weight * 100) / 100,
        timestamp: new Date().toISOString(),
        rationale,
      };

      // Update proposal tallies
      const updatedProposals = proposals.map(p => {
        if (p.id !== proposalId) return p;
        const delta = choice === 'for' ? weight : choice === 'against' ? 0 : 0;
        const deltaAgainst = choice === 'against' ? weight : 0;
        return {
          ...p,
          votesFor: Math.round((p.votesFor + delta) * 100) / 100,
          votesAgainst: Math.round((p.votesAgainst + deltaAgainst) * 100) / 100,
          totalWeight: Math.round((p.totalWeight + weight) * 100) / 100,
        };
      });

      const auditLog = makeAuditLog('vote_cast', currentUser, `Voted ${choice} on proposal ${proposalId}`, proposalId);

      set(s => ({
        votes: [newVote, ...s.votes],
        proposals: updatedProposals,
        auditLogs: [auditLog, ...s.auditLogs],
      }));
      showNotification('success', `Vote cast: ${choice}.`);
    },

    addComment: (proposalId, text) => {
      const { currentUser, proposals } = get();
      if (!currentUser) return;

      const newComment: ProposalComment = {
        id: uid('cm'),
        authorId: currentUser.id,
        authorName: currentUser.name,
        text,
        timestamp: new Date().toISOString(),
      };

      const updatedProposals = proposals.map(p =>
        p.id === proposalId ? { ...p, comments: [...p.comments, newComment] } : p
      );
      set({ proposals: updatedProposals });
    },

    // ── Reward Actions ──────────────────────────────────────────────────────

    createRewardPool: (poolData) => {
      const { currentUser, showNotification } = get();
      if (!currentUser) return;
      const newPool: RewardPool = {
        ...poolData,
        id: uid('rp'),
        status: 'pending',
      };
      set(s => ({ rewardPools: [newPool, ...s.rewardPools] }));
      showNotification('success', `Reward pool "${newPool.name}" created.`);
    },

    distributeRewards: (poolId) => {
      const { currentUser, members, reputationScores, rewardPools, showNotification } = get();
      if (!currentUser) return;
      const pool = rewardPools.find(p => p.id === poolId);
      if (!pool || pool.status === 'distributed') return;

      const shares = calculateRewardShares(members, reputationScores, pool.totalAmount);
      const allocations: RewardAllocation[] = shares.map(share => ({
        id: uid('ra'),
        poolId,
        memberId: share.memberId,
        memberName: share.memberName,
        reputationScore: share.reputationScore,
        sharePercentage: share.sharePercentage,
        amount: share.amount,
        distributed: true,
      }));

      // Update member token balances
      const updatedMembers = members.map(m => {
        const alloc = allocations.find(a => a.memberId === m.id);
        return alloc ? { ...m, tokenBalance: m.tokenBalance + alloc.amount } : m;
      });

      const updatedPools = rewardPools.map(p =>
        p.id === poolId ? { ...p, status: 'distributed' as const, distributedAt: new Date().toISOString() } : p
      );

      const auditLog = makeAuditLog('reward_distributed', currentUser, `Distributed pool "${pool.name}" — $${pool.totalAmount}`, poolId);

      set(s => ({
        rewardPools: updatedPools,
        rewardAllocations: [...allocations, ...s.rewardAllocations],
        members: updatedMembers,
        auditLogs: [auditLog, ...s.auditLogs],
      }));

      if (get().currentUser) {
        const updatedCurrentUser = updatedMembers.find(m => m.id === get().currentUser?.id);
        if (updatedCurrentUser) set({ currentUser: updatedCurrentUser });
      }

      showNotification('success', `Rewards distributed from "${pool.name}".`);
    },
  };
});
