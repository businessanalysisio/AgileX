import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { hasPermission } from '../services/rbacService';
import { Modal } from './ui/Modal';
import { Avatar } from './ui/Avatar';
import type { RewardType } from '../types';

// ─── Create Reward Pool Modal ─────────────────────────────────────────────────

const CreateRewardPoolModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, createRewardPool } = useAppStore();
  const [form, setForm] = useState({
    name: '',
    type: 'profit_sharing' as RewardType,
    totalAmount: 10000,
    currency: 'USD',
  });

  const types: { value: RewardType; label: string }[] = [
    { value: 'profit_sharing', label: 'Profit Sharing' },
    { value: 'bonus_tokens', label: 'Bonus Tokens' },
    { value: 'contributor_reward', label: 'Contributor Reward' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    createRewardPool({
      name: form.name,
      type: form.type,
      totalAmount: form.totalAmount,
      currency: form.currency,
      snapshotDate: new Date().toISOString(),
      createdById: currentUser.id,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pool Name *</label>
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required placeholder="Q1 2025 Profit Sharing"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as RewardType }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={form.currency}
            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="TOKENS">Tokens</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Amount: <span className="font-bold text-indigo-600">${form.totalAmount.toLocaleString()}</span>
        </label>
        <input
          type="range" min={1000} max={200000} step={1000}
          value={form.totalAmount}
          onChange={e => setForm(f => ({ ...f, totalAmount: parseInt(e.target.value) }))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>$1,000</span><span>$100,000</span><span>$200,000</span>
        </div>
      </div>
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700">
        <strong>Distribution Formula:</strong> member_share = member_reputation / total_reputation.<br />
        Rewards will be allocated proportionally based on reputation scores at time of distribution.
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          Create Pool
        </button>
      </div>
    </form>
  );
};

// ─── Distribution Detail Modal ────────────────────────────────────────────────

const DistributionDetailModal: React.FC<{ poolId: string; onClose: () => void }> = ({ poolId, onClose }) => {
  const { rewardPools, rewardAllocations, members } = useAppStore();
  const pool = rewardPools.find(p => p.id === poolId);
  if (!pool) return null;

  const allocations = rewardAllocations
    .filter(a => a.poolId === poolId)
    .sort((a, b) => b.amount - a.amount);

  const typeLabels: Record<string, string> = {
    profit_sharing: 'Profit Sharing',
    bonus_tokens: 'Bonus Tokens',
    contributor_reward: 'Contributor Reward',
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">{pool.name}</h3>
            <p className="text-sm text-gray-500">{typeLabels[pool.type]}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">${pool.totalAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-400">{pool.currency}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>Snapshot: {new Date(pool.snapshotDate).toLocaleDateString()}</span>
          {pool.distributedAt && <span>Distributed: {new Date(pool.distributedAt).toLocaleDateString()}</span>}
          <span className={`px-2 py-0.5 rounded-full font-medium ${pool.status === 'distributed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {pool.status}
          </span>
        </div>
      </div>

      {allocations.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribution Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Member</th>
                  <th className="py-2 pr-3 text-right">Reputation</th>
                  <th className="py-2 pr-3 text-right">Share %</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allocations.map((alloc, idx) => {
                  const member = members.find(m => m.id === alloc.memberId);
                  return (
                    <tr key={alloc.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-3 text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <Avatar initials={member?.avatar ?? '??'} size="sm" />
                          <span className="font-medium text-gray-800">{alloc.memberName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-indigo-600 font-medium">{alloc.reputationScore.toFixed(2)}</td>
                      <td className="py-2.5 pr-3 text-right text-gray-600">{alloc.sharePercentage.toFixed(2)}%</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">${alloc.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-bold">
                  <td colSpan={2} className="py-2 text-gray-700">Total</td>
                  <td className="py-2 text-right text-indigo-600">
                    {allocations.reduce((s, a) => s + a.reputationScore, 0).toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-gray-700">100%</td>
                  <td className="py-2 text-right text-emerald-700">
                    ${pool.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="font-medium">Not yet distributed</p>
          <p className="text-sm mt-1">Distribute this pool to see allocation details.</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const RewardsPage: React.FC = () => {
  const { rewardPools, rewardAllocations, members, currentUser, activeModal, openModal, closeModal, distributeRewards } = useAppStore();
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const canManageRewards = hasPermission(currentUser, 'manage_rewards');
  const canDistribute = hasPermission(currentUser, 'distribute_rewards');

  const totalDistributed = rewardPools
    .filter(p => p.status === 'distributed')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPending = rewardPools
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const typeLabels: Record<string, string> = {
    profit_sharing: 'Profit Sharing',
    bonus_tokens: 'Bonus Tokens',
    contributor_reward: 'Contributor Reward',
  };

  const typeColors: Record<string, string> = {
    profit_sharing: 'bg-emerald-100 text-emerald-700',
    bonus_tokens: 'bg-violet-100 text-violet-700',
    contributor_reward: 'bg-blue-100 text-blue-700',
  };

  // Top earners (by tokenBalance)
  const topEarners = [...members]
    .filter(m => m.status === 'active' && m.tokenBalance > 0)
    .sort((a, b) => b.tokenBalance - a.tokenBalance)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
          <div className="text-2xl font-bold text-emerald-600">${totalDistributed.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Distributed</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">Pending Distribution</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
          <div className="text-2xl font-bold text-indigo-600">{rewardPools.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Reward Pools</div>
        </div>
      </div>

      {/* Formula Note */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-700">
        <strong>Distribution Formula:</strong> member_share = member_reputation / total_reputation.
        Rewards are allocated proportionally — higher reputation means a larger share.
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-700">Reward Pools</h2>
        {canManageRewards && (
          <button
            onClick={() => openModal('createRewardPool')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Reward Pool
          </button>
        )}
      </div>

      {/* Pools List */}
      <div className="space-y-3">
        {rewardPools.map(pool => {
          const allocations = rewardAllocations.filter(a => a.poolId === pool.id);
          const createdBy = members.find(m => m.id === pool.createdById);
          return (
            <div key={pool.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900">{pool.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[pool.type]}`}>
                      {typeLabels[pool.type]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pool.status === 'distributed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {pool.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>Created by {createdBy?.name ?? 'Unknown'}</span>
                    <span>•</span>
                    <span>Snapshot: {new Date(pool.snapshotDate).toLocaleDateString()}</span>
                    {pool.distributedAt && (
                      <>
                        <span>•</span>
                        <span>Distributed: {new Date(pool.distributedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-indigo-600">${pool.totalAmount.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{pool.currency}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {pool.status === 'pending' && canDistribute && (
                  <button
                    onClick={() => distributeRewards(pool.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Distribute Rewards
                  </button>
                )}
                <button
                  onClick={() => setSelectedPoolId(pool.id)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {pool.status === 'distributed' ? 'View Report' : 'Preview'}
                </button>
              </div>

              {/* Quick allocation preview for distributed pools */}
              {pool.status === 'distributed' && allocations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex gap-3 overflow-x-auto">
                    {allocations.slice(0, 5).map((alloc, idx) => (
                      <div key={alloc.id} className="flex items-center gap-1.5 flex-shrink-0 text-xs">
                        <span className="text-gray-400">#{idx + 1}</span>
                        <Avatar initials={members.find(m => m.id === alloc.memberId)?.avatar ?? '??'} size="sm" />
                        <span className="font-medium text-gray-700">{alloc.memberName}</span>
                        <span className="text-emerald-600 font-bold">${alloc.amount.toFixed(0)}</span>
                      </div>
                    ))}
                    {allocations.length > 5 && (
                      <span className="text-xs text-gray-400 self-center">+{allocations.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {rewardPools.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">No reward pools yet</p>
            <p className="text-sm mt-1">Create a reward pool to begin distributing rewards.</p>
          </div>
        )}
      </div>

      {/* Top Earners */}
      {topEarners.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Earners (Token Balance)</h2>
          <div className="space-y-2">
            {topEarners.map((member, idx) => (
              <div key={member.id} className="flex items-center gap-3 py-1.5">
                <span className="text-xs font-bold text-gray-400 w-5 text-center">#{idx + 1}</span>
                <Avatar initials={member.avatar} size="sm" />
                <span className="flex-1 text-sm font-medium text-gray-800">{member.name}</span>
                <span className="text-sm font-bold text-amber-600">{member.tokenBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                <span className="text-xs text-gray-400">tokens</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'createRewardPool' && (
        <Modal title="Create Reward Pool" onClose={closeModal} size="md">
          <CreateRewardPoolModal onClose={closeModal} />
        </Modal>
      )}
      {selectedPoolId && (
        <Modal title="Distribution Details" onClose={() => setSelectedPoolId(null)} size="lg">
          <DistributionDetailModal poolId={selectedPoolId} onClose={() => setSelectedPoolId(null)} />
        </Modal>
      )}
    </div>
  );
};
