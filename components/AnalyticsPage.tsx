import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { CATEGORY_WEIGHTS } from '../constants';
import { BarChart, DonutChart, Sparkline } from './ui/BarChart';
import { Avatar } from './ui/Avatar';
import type { ContributionCategory } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { members, contributions, reputationScores, proposals, votes, rewardPools } = useAppStore();
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('all');

  const now = Date.now();
  const rangeMs: Record<string, number> = { '30d': 30 * 86400000, '90d': 90 * 86400000, all: Infinity };
  const cutoff = now - rangeMs[timeRange];

  const filteredContribs = contributions.filter(c => new Date(c.timestamp).getTime() >= cutoff);
  const approvedContribs = filteredContribs.filter(c => c.approvalStatus === 'approved');
  const activeMembers = members.filter(m => m.status === 'active');

  // ── Category Stats ──────────────────────────────────────────────────────

  const catStats = CATEGORY_WEIGHTS.map(cw => {
    const catContribs = approvedContribs.filter(c => c.category === cw.category);
    return {
      category: cw.category,
      color: cw.color,
      weight: cw.weight,
      count: catContribs.length,
      totalPoints: catContribs.reduce((s, c) => s + c.points, 0),
      avgPoints: catContribs.length > 0 ? catContribs.reduce((s, c) => s + c.points, 0) / catContribs.length : 0,
      contributors: new Set(catContribs.map(c => c.memberId)).size,
    };
  });

  // ── Approval Stats ──────────────────────────────────────────────────────

  const approvalStats = {
    total: filteredContribs.length,
    approved: filteredContribs.filter(c => c.approvalStatus === 'approved').length,
    pending: filteredContribs.filter(c => c.approvalStatus === 'pending').length,
    rejected: filteredContribs.filter(c => c.approvalStatus === 'rejected').length,
    underReview: filteredContribs.filter(c => c.approvalStatus === 'under_review').length,
  };
  const approvalRate = approvalStats.total > 0
    ? ((approvalStats.approved / (approvalStats.approved + approvalStats.rejected)) * 100).toFixed(1)
    : '0';

  // ── Monthly Trends (last 6 months) ─────────────────────────────────────

  const monthlyData: { month: string; count: number; points: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthContribs = contributions.filter(c => {
      const t = new Date(c.timestamp);
      return t >= monthStart && t <= monthEnd && c.approvalStatus === 'approved';
    });
    monthlyData.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      count: monthContribs.length,
      points: monthContribs.reduce((s, c) => s + c.points, 0),
    });
  }

  // ── Top Activity Types ──────────────────────────────────────────────────

  const activityMap = new Map<string, { count: number; points: number }>();
  approvedContribs.forEach(c => {
    const key = c.activityType;
    const prev = activityMap.get(key) ?? { count: 0, points: 0 };
    activityMap.set(key, { count: prev.count + 1, points: prev.points + c.points });
  });
  const topActivities = Array.from(activityMap.entries())
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 8);

  // ── Member Activity (contributions per member) ─────────────────────────

  const memberActivity = activeMembers
    .map(m => ({
      ...m,
      contribCount: approvedContribs.filter(c => c.memberId === m.id).length,
      points: approvedContribs.filter(c => c.memberId === m.id).reduce((s, c) => s + c.points, 0),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 8);

  // ── Governance Stats ────────────────────────────────────────────────────

  const govStats = {
    totalProposals: proposals.length,
    active: proposals.filter(p => p.status === 'active').length,
    passed: proposals.filter(p => p.status === 'passed' || p.status === 'executed').length,
    totalVotes: votes.length,
    avgVotesPerProposal: proposals.length > 0 ? (votes.length / proposals.length).toFixed(1) : '0',
    uniqueVoters: new Set(votes.map(v => v.memberId)).size,
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Platform Analytics</h2>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['30d', '90d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === range ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range === 'all' ? 'All Time' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{activeMembers.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Active Members</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-indigo-600">{approvedContribs.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Approved Contributions</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{approvedContribs.reduce((s, c) => s + c.points, 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Points</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{approvalRate}%</div>
          <div className="text-xs text-gray-500 mt-0.5">Approval Rate</div>
        </div>
      </div>

      {/* Row 1: Category Breakdown + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Contributions by Category</h3>
          <div className="flex items-center gap-6 mb-4">
            <DonutChart
              segments={catStats.map(c => ({ label: c.category, value: c.totalPoints, color: c.color }))}
              size={110}
            />
            <div className="flex-1 space-y-2">
              {catStats.map(cat => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-600 flex-1">{cat.category}</span>
                  <span className="font-medium text-gray-800">{cat.count} contribs</span>
                  <span className="font-bold text-indigo-600 w-14 text-right">{cat.totalPoints} pts</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 pt-3 border-t border-gray-50">
            {catStats.map(cat => (
              <div key={cat.category} className="text-center">
                <div className="text-xs font-bold text-gray-800">{cat.avgPoints.toFixed(0)}</div>
                <div className="text-xs text-gray-400">avg pts</div>
                <div className="text-xs text-gray-400">{cat.contributors} people</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Contribution Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Contribution Trend</h3>
          <BarChart
            data={monthlyData.map(m => ({ label: m.month, value: m.points, color: '#6366f1' }))}
            height={140}
          />
          <div className="mt-4">
            <Sparkline data={monthlyData.map(m => m.count)} color="#10b981" width={300} height={50} />
            <p className="text-xs text-gray-400 mt-1">Contribution count trend</p>
          </div>
        </div>
      </div>

      {/* Row 2: Approval Funnel + Top Activity Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Approval Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Approval Pipeline</h3>
          <div className="space-y-3">
            {[
              { label: 'Submitted', value: approvalStats.total, color: '#6b7280', pct: 100 },
              { label: 'Under Review', value: approvalStats.underReview, color: '#3b82f6', pct: approvalStats.total > 0 ? (approvalStats.underReview / approvalStats.total) * 100 : 0 },
              { label: 'Approved', value: approvalStats.approved, color: '#10b981', pct: approvalStats.total > 0 ? (approvalStats.approved / approvalStats.total) * 100 : 0 },
              { label: 'Rejected', value: approvalStats.rejected, color: '#ef4444', pct: approvalStats.total > 0 ? (approvalStats.rejected / approvalStats.total) * 100 : 0 },
              { label: 'Pending', value: approvalStats.pending, color: '#f59e0b', pct: approvalStats.total > 0 ? (approvalStats.pending / approvalStats.total) * 100 : 0 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{item.label}</span>
                  <span className="text-gray-800 font-bold">{item.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Activity Types */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Activity Types</h3>
          <div className="space-y-2">
            {topActivities.map(([type, stats], idx) => (
              <div key={type} className="flex items-center gap-3 py-1">
                <span className="text-xs text-gray-400 w-5 text-center font-medium">{idx + 1}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{type}</span>
                <span className="text-xs text-gray-400">{stats.count}x</span>
                <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                  <div
                    className="h-1.5 bg-indigo-500 rounded-full"
                    style={{ width: `${(stats.points / (topActivities[0]?.[1]?.points || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-indigo-600 w-12 text-right">{stats.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Member Leaderboard + Governance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Member Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Members by Points</h3>
          <div className="space-y-2">
            {memberActivity.map((member, idx) => (
              <div key={member.id} className="flex items-center gap-3 py-1.5">
                <span className={`text-xs font-bold w-5 text-center ${idx < 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                  #{idx + 1}
                </span>
                <Avatar initials={member.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 block truncate">{member.name}</span>
                  <div className="h-1 bg-gray-100 rounded-full mt-1">
                    <div
                      className="h-1 bg-indigo-500 rounded-full"
                      style={{ width: `${(member.points / (memberActivity[0]?.points || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-indigo-600">{member.points}</div>
                  <div className="text-xs text-gray-400">{member.contribCount} contribs</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governance Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Governance Overview</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-blue-600">{govStats.totalProposals}</div>
              <div className="text-xs text-gray-500">Total Proposals</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-emerald-600">{govStats.passed}</div>
              <div className="text-xs text-gray-500">Passed</div>
            </div>
            <div className="bg-violet-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-violet-600">{govStats.totalVotes}</div>
              <div className="text-xs text-gray-500">Total Votes</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-600">{govStats.uniqueVoters}</div>
              <div className="text-xs text-gray-500">Unique Voters</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-700">{govStats.avgVotesPerProposal}</div>
            <div className="text-xs text-gray-500">Avg Votes per Proposal</div>
          </div>
          <div className="mt-3 text-xs text-gray-400 text-center">
            Active: {govStats.active} proposals • {rewardPools.filter(p => p.status === 'distributed').length} reward distributions completed
          </div>
        </div>
      </div>
    </div>
  );
};
