import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { hasPermission } from '../services/rbacService';
import { CATEGORY_WEIGHTS } from '../constants';
import { RoleBadge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Sparkline, DonutChart } from './ui/BarChart';

export const ReputationPage: React.FC = () => {
  const { members, reputationScores, contributions, currentUser, recalculateReputation } = useAppStore();
  const [view, setView] = useState<'leaderboard' | 'details'>('leaderboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const canRecalculate = hasPermission(currentUser, 'configure_system') || hasPermission(currentUser, 'manage_rbac');

  // Sorted leaderboard
  const leaderboard = [...members]
    .filter(m => m.status === 'active')
    .sort((a, b) => b.reputationScore - a.reputationScore)
    .map((m, idx) => ({
      ...m,
      rank: idx + 1,
      repData: reputationScores.find(s => s.memberId === m.id),
    }));

  const selectedMemberData = selectedMemberId
    ? leaderboard.find(m => m.id === selectedMemberId)
    : leaderboard[0];

  const rankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const trendColor = (trend?: string) =>
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  const trendIcon = (trend?: string) =>
    trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  // Category colors for donut
  const catColors = Object.fromEntries(CATEGORY_WEIGHTS.map(cw => [cw.category, cw.color]));

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView('leaderboard')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'leaderboard' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setView('details')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'details' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Score Details
          </button>
        </div>
        {canRecalculate && (
          <button
            onClick={() => recalculateReputation()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-medium hover:bg-indigo-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalculate All
          </button>
        )}
      </div>

      {/* Formula Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5">
        <h3 className="text-sm font-semibold text-indigo-800 mb-2">Reputation Score Formula</h3>
        <div className="font-mono text-sm text-indigo-700 bg-white rounded-xl p-3 border border-indigo-100">
          Score = Σ (Points × CategoryWeight × e<sup>−λ·days</sup>)
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {CATEGORY_WEIGHTS.map(cw => (
            <div key={cw.category} className="flex items-center gap-1.5 text-xs text-indigo-700">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cw.color }} />
              <span className="font-medium">{cw.category}</span>
              <span className="text-indigo-500">×{cw.weight}</span>
            </div>
          ))}
          <div className="text-xs text-indigo-500">λ = 0.001 (decay rate)</div>
        </div>
      </div>

      {view === 'leaderboard' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Reputation Leaderboard</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {leaderboard.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-all cursor-pointer ${
                  member.id === currentUser?.id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => { setSelectedMemberId(member.id); setView('details'); }}
              >
                {/* Rank */}
                <div className={`text-lg font-bold w-10 text-center flex-shrink-0 ${
                  member.rank <= 3 ? '' : 'text-gray-400 text-sm'
                }`}>
                  {rankMedal(member.rank)}
                </div>

                {/* Avatar + Name */}
                <Avatar initials={member.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{member.name}</span>
                    <RoleBadge role={member.role} />
                    {member.id === currentUser?.id && (
                      <span className="text-xs text-indigo-600 font-medium">(you)</span>
                    )}
                  </div>
                  {/* Category bar */}
                  <div className="flex gap-0.5 mt-1.5 h-1.5 rounded-full overflow-hidden">
                    {CATEGORY_WEIGHTS.map(cw => {
                      const catScore = member.repData?.categoryBreakdown[cw.category] ?? 0;
                      const pct = member.reputationScore > 0 ? (catScore / member.reputationScore) * 100 : 0;
                      return pct > 0 ? (
                        <div key={cw.category} style={{ width: `${pct}%`, backgroundColor: cw.color }} title={`${cw.category}: ${catScore.toFixed(1)}`} />
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Sparkline */}
                {member.repData && member.repData.history.length > 1 && (
                  <div className="hidden sm:block">
                    <Sparkline
                      data={member.repData.history.map(h => h.score)}
                      color="#6366f1"
                      width={60}
                      height={28}
                    />
                  </div>
                )}

                {/* Score + Trend */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-indigo-600">{member.reputationScore.toFixed(2)}</div>
                  <div className={`text-xs font-medium ${trendColor(member.repData?.trend)}`}>
                    {trendIcon(member.repData?.trend)} {member.repData?.trend ?? 'stable'}
                  </div>
                </div>

                {/* Contributions count */}
                <div className="text-right flex-shrink-0 hidden md:block">
                  <div className="text-sm font-semibold text-gray-700">{member.totalContributions}</div>
                  <div className="text-xs text-gray-400">contribs</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Score Details View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Member Selector */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Select Member</h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {leaderboard.map(member => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-all ${
                    selectedMemberId === member.id || (!selectedMemberId && member.rank === 1) ? 'bg-indigo-50' : ''
                  }`}
                >
                  <span className="text-xs text-gray-400 w-6 text-center font-medium">#{member.rank}</span>
                  <Avatar initials={member.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{member.name}</div>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{member.reputationScore.toFixed(1)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          {selectedMemberData && (
            <div className="lg:col-span-2 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-4">
                  <Avatar initials={selectedMemberData.avatar} size="xl" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedMemberData.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-indigo-600">{selectedMemberData.reputationScore.toFixed(2)}</span>
                      <span className="text-gray-400">reputation score</span>
                      <span className={`text-sm font-medium ${trendColor(selectedMemberData.repData?.trend)}`}>
                        {trendIcon(selectedMemberData.repData?.trend)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Rank #{selectedMemberData.rank} • {selectedMemberData.totalContributions} approved contributions
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Score by Category</h3>
                <div className="flex items-center gap-6">
                  <DonutChart
                    segments={CATEGORY_WEIGHTS.map(cw => ({
                      label: cw.category,
                      value: selectedMemberData.repData?.categoryBreakdown[cw.category] ?? 0,
                      color: cw.color,
                    }))}
                    size={120}
                  />
                  <div className="flex-1 space-y-2">
                    {CATEGORY_WEIGHTS.map(cw => {
                      const score = selectedMemberData.repData?.categoryBreakdown[cw.category] ?? 0;
                      const pct = selectedMemberData.reputationScore > 0
                        ? (score / selectedMemberData.reputationScore) * 100 : 0;
                      return (
                        <div key={cw.category} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cw.color }} />
                          <span className="text-sm text-gray-600 flex-1">{cw.category}</span>
                          <span className="text-xs text-gray-400">w={cw.weight}</span>
                          <span className="text-sm font-semibold text-gray-800 w-16 text-right">{score.toFixed(2)}</span>
                          <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reputation History */}
              {selectedMemberData.repData && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">6-Month Score History</h3>
                  <div className="relative">
                    <Sparkline
                      data={selectedMemberData.repData.history.map(h => h.score)}
                      color="#6366f1"
                      width={520}
                      height={80}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    {selectedMemberData.repData.history.map(h => (
                      <span key={h.date}>
                        {new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                    {[
                      { label: 'Current', value: selectedMemberData.repData.history.at(-1)?.score.toFixed(2) },
                      {
                        label: 'Peak',
                        value: Math.max(...selectedMemberData.repData.history.map(h => h.score)).toFixed(2),
                      },
                      {
                        label: 'Growth',
                        value: (() => {
                          const hist = selectedMemberData.repData!.history;
                          const first = hist[0]?.score ?? 0;
                          const last = hist.at(-1)?.score ?? 0;
                          return first > 0 ? `+${(((last - first) / first) * 100).toFixed(1)}%` : 'N/A';
                        })(),
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2">
                        <div className="font-bold text-gray-800">{value}</div>
                        <div className="text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
