import type { Contribution, ReputationScore, ContributionCategory, Member } from '../types';
import { CATEGORY_WEIGHTS, TIME_DECAY_LAMBDA } from '../constants';

// ─── Time Decay ───────────────────────────────────────────────────────────────
// Formula: decayFactor = e^(-λ * days_since_contribution)

function timeDacayFactor(timestamp: string): number {
  const contributionDate = new Date(timestamp).getTime();
  const now = Date.now();
  const daysSince = (now - contributionDate) / (1000 * 60 * 60 * 24);
  return Math.exp(-TIME_DECAY_LAMBDA * daysSince);
}

// ─── Category Weight ──────────────────────────────────────────────────────────

function getCategoryWeight(category: ContributionCategory): number {
  const found = CATEGORY_WEIGHTS.find(cw => cw.category === category);
  return found ? found.weight : 0.1;
}

// ─── Core Reputation Calculation ──────────────────────────────────────────────
// Reputation Score = Σ (Contribution Points × Category Weight × Time Decay Factor)

export function calculateReputationScore(
  memberId: string,
  contributions: Contribution[]
): ReputationScore {
  const approvedContributions = contributions.filter(
    c => c.memberId === memberId && c.approvalStatus === 'approved'
  );

  const categoryBreakdown: Record<ContributionCategory, number> = {
    Code: 0, Content: 0, Revenue: 0, Community: 0, Governance: 0,
  };

  let totalScore = 0;

  for (const contrib of approvedContributions) {
    const weight = getCategoryWeight(contrib.category);
    const decay = timeDacayFactor(contrib.timestamp);
    const score = contrib.points * weight * decay;
    categoryBreakdown[contrib.category] += score;
    totalScore += score;
  }

  // Round to 2 decimal places
  totalScore = Math.round(totalScore * 100) / 100;
  for (const cat of Object.keys(categoryBreakdown) as ContributionCategory[]) {
    categoryBreakdown[cat] = Math.round(categoryBreakdown[cat] * 100) / 100;
  }

  // Generate history (last 6 months, simulated monthly snapshots)
  const history = generateHistoricalScores(memberId, approvedContributions);

  return {
    memberId,
    totalScore,
    categoryBreakdown,
    lastCalculated: new Date().toISOString(),
    rank: 0, // will be assigned after sorting all members
    trend: determineTrend(history),
    history,
  };
}

// ─── Historical Score Generation ─────────────────────────────────────────────

function generateHistoricalScores(
  memberId: string,
  contributions: Contribution[]
): { date: string; score: number }[] {
  const history: { date: string; score: number }[] = [];
  const now = new Date();

  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const snapshotDate = new Date(now);
    snapshotDate.setMonth(now.getMonth() - monthsAgo);
    snapshotDate.setDate(1);

    // Only include contributions that existed at snapshot date
    const snapshotContributions = contributions.filter(
      c => new Date(c.timestamp) <= snapshotDate
    );

    let score = 0;
    for (const contrib of snapshotContributions) {
      const weight = getCategoryWeight(contrib.category);
      const daysSince = (snapshotDate.getTime() - new Date(contrib.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      const decay = Math.exp(-TIME_DECAY_LAMBDA * daysSince);
      score += contrib.points * weight * decay;
    }

    history.push({
      date: snapshotDate.toISOString().split('T')[0],
      score: Math.round(score * 100) / 100,
    });
  }

  return history;
}

function determineTrend(history: { date: string; score: number }[]): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable';
  const last = history[history.length - 1].score;
  const prev = history[history.length - 2].score;
  if (last > prev * 1.02) return 'up';
  if (last < prev * 0.98) return 'down';
  return 'stable';
}

// ─── Bulk Recalculation ───────────────────────────────────────────────────────

export function recalculateAllReputations(
  members: Member[],
  contributions: Contribution[]
): ReputationScore[] {
  const scores = members.map(member =>
    calculateReputationScore(member.id, contributions)
  );

  // Assign ranks (highest score = rank 1)
  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
}

// ─── Reward Distribution ──────────────────────────────────────────────────────
// member_share = member_reputation / total_reputation

export function calculateRewardShares(
  members: Member[],
  scores: ReputationScore[],
  totalPoolAmount: number
): Array<{
  memberId: string;
  memberName: string;
  reputationScore: number;
  sharePercentage: number;
  amount: number;
}> {
  const activeMembers = members.filter(m => m.status === 'active');
  const totalReputation = activeMembers.reduce((sum, member) => {
    const score = scores.find(s => s.memberId === member.id);
    return sum + (score?.totalScore ?? 0);
  }, 0);

  if (totalReputation === 0) return [];

  return activeMembers
    .map(member => {
      const score = scores.find(s => s.memberId === member.id);
      const reputationScore = score?.totalScore ?? 0;
      const sharePercentage = (reputationScore / totalReputation) * 100;
      const amount = (reputationScore / totalReputation) * totalPoolAmount;
      return {
        memberId: member.id,
        memberName: member.name,
        reputationScore,
        sharePercentage: Math.round(sharePercentage * 100) / 100,
        amount: Math.round(amount * 100) / 100,
      };
    })
    .filter(r => r.reputationScore > 0)
    .sort((a, b) => b.reputationScore - a.reputationScore);
}
