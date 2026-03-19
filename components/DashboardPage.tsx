import React from 'react';
import { useAppStore } from '../store/appStore';
import { CATEGORY_WEIGHTS } from '../constants';
import { StatCard } from './ui/StatCard';
import { BarChart, DonutChart, Sparkline } from './ui/BarChart';
import { RoleBadge, CategoryBadge, ApprovalBadge } from './ui/Badge';
import { Avatar } from './ui/Avatar';

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon: React.FC<{ d: string }> = ({ d }) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

export const DashboardPage: React.FC = () => {
  const {
    members, contributions, reputationScores, proposals, navigate,
  } = useAppStore();

  // Stats
  const activeMembers = members.filter(m => m.status === 'active').length;
  const pendingContributions = contributions.filter(c => c.approvalStatus === 'pending').length;
  const approvedContributions = contributions.filter(c => c.approvalStatus === 'approved').length;
  const totalPoints = contributions
    .filter(c => c.approvalStatus === 'approved')
    .reduce((sum, c) => sum + c.points, 0);
  const activeProposals = proposals.filter(p => p.status === 'active').length;

  // Top contributors (by reputation)
  const topContributors = [...members]
    .filter(m => m.status === 'active' && m.reputationScore > 0)
    .sort((a, b) => b.reputationScore - a.reputationScore)
    .slice(0, 5);

  // Category breakdown (total approved points per category)
  const categoryTotals = CATEGORY_WEIGHTS.map(cw => {
    const total = contributions
      .filter(c => c.category === cw.category && c.approvalStatus === 'approved')
      .reduce((sum, c) => sum + c.points, 0);
    return { label: cw.category, value: total, color: cw.color };
  });

  // Recent contributions
  const recentContributions = [...contributions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  // Recent proposals
  const recentProposals = [...proposals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Sparkline data for top contributor
  const topMember = topContributors[0];
  const topMemberScoreHistory = topMember
    ? reputationScores.find(s => s.memberId === topMember.id)?.history.map(h => h.score) ?? []
    : [];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Members"
          value={activeMembers}
          sub={`${members.length} total`}
          color="indigo"
          icon={<Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
        />
        <StatCard
          label="Total Points"
          value={totalPoints.toLocaleString()}
          sub={`${approvedContributions} approved`}
          color="emerald"
          trend={{ value: '+12% this month', up: true }}
          icon={<Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
        />
        <StatCard
          label="Pending Reviews"
          value={pendingContributions}
          sub="awaiting approval"
          color="amber"
          icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <StatCard
          label="Active Proposals"
          value={activeProposals}
          sub={`${proposals.length} total`}
          color="violet"
          icon={<Icon d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Contributors */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Top Contributors</h2>
            <button onClick={() => navigate('reputation')} className="text-xs text-indigo-600 hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {topContributors.map((member, idx) => {
              const scoreHistory = reputationScores.find(s => s.memberId === member.id)?.history.map(h => h.score) ?? [];
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center ${idx === 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                    #{idx + 1}
                  </span>
                  <Avatar initials={member.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate('profile', { memberId: member.id })}
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block text-left"
                    >
                      {member.name}
                    </button>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="h-1.5 bg-gray-100 rounded-full flex-1">
                        <div
                          className="h-1.5 bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min((member.reputationScore / (topContributors[0]?.reputationScore || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 w-12 text-right">
                        {member.reputationScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {scoreHistory.length > 1 && (
                    <Sparkline data={scoreHistory} color="#6366f1" width={50} height={24} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contribution Category Breakdown */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Points by Category</h2>
          <div className="flex items-end gap-4">
            <DonutChart segments={categoryTotals} size={100} />
            <div className="flex-1 space-y-2">
              {categoryTotals.map(cat => (
                <div key={cat.label} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-500 flex-1">{cat.label}</span>
                  <span className="font-semibold text-gray-800">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <BarChart data={categoryTotals} height={80} />
          </div>
        </div>

        {/* Active Proposals */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Proposals</h2>
            <button onClick={() => navigate('governance')} className="text-xs text-indigo-600 hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentProposals.map(proposal => (
              <button
                key={proposal.id}
                onClick={() => navigate('governance', { proposalId: proposal.id })}
                className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
              >
                <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{proposal.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    proposal.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    proposal.status === 'passed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{proposal.status}</span>
                  <span className="text-xs text-gray-400">by {proposal.authorName}</span>
                </div>
                {proposal.status === 'active' && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>For: {proposal.votesFor.toFixed(1)}</span>
                      <span>Against: {proposal.votesAgainst.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      {proposal.totalWeight > 0 && (
                        <div
                          className="h-1.5 bg-emerald-500 rounded-full"
                          style={{ width: `${(proposal.votesFor / proposal.totalWeight) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Recent Contribution Activity</h2>
          <button onClick={() => navigate('contributions')} className="text-xs text-indigo-600 hover:underline">
            View all
          </button>
        </div>
        <div className="space-y-2">
          {recentContributions.map(contrib => (
            <div key={contrib.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <Avatar initials={contrib.memberName.split(' ').map(n => n[0]).join('')} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{contrib.memberName}</span>
                  <CategoryBadge category={contrib.category} />
                  <ApprovalBadge status={contrib.approvalStatus} />
                </div>
                <p className="text-xs text-gray-500 truncate">{contrib.activityType} — {contrib.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-indigo-600">+{contrib.points}</div>
                <div className="text-xs text-gray-400">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
