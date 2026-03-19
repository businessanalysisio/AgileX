import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { hasPermission, canManage, getAssignableRoles } from '../services/rbacService';
import { ROLE_LABELS } from '../constants';
import { RoleBadge, StatusBadge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Modal } from './ui/Modal';
import { Sparkline } from './ui/BarChart';
import type { RoleName, MemberStatus } from '../types';

// ─── Add Member Modal ─────────────────────────────────────────────────────────

const AddMemberModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addMember } = useAppStore();
  const [form, setForm] = useState({
    name: '', email: '', role: 'Contributor' as RoleName,
    bio: '', skills: '', github: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMember({
      name: form.name,
      email: form.email,
      role: form.role,
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0],
      bio: form.bio,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      github: form.github || undefined,
      avatar: form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      tokenBalance: 0,
    });
    onClose();
  };

  const roles: RoleName[] = ['Guest', 'Contributor', 'Reviewer', 'CommunityManager', 'BoardMember'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required placeholder="jane@cooperative.io"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select
          value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as RoleName }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          rows={2} placeholder="Brief member description..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
        <input
          value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="React, TypeScript, GraphQL"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Username</label>
        <input
          value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="username"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          Add Member
        </button>
      </div>
    </form>
  );
};

// ─── Member Profile Modal ─────────────────────────────────────────────────────

const MemberProfileModal: React.FC<{ memberId: string; onClose: () => void }> = ({ memberId, onClose }) => {
  const { members, contributions, reputationScores, currentUser, assignRole, updateMemberStatus } = useAppStore();
  const member = members.find(m => m.id === memberId);
  if (!member) return null;

  const memberContribs = contributions.filter(c => c.memberId === memberId);
  const approvedContribs = memberContribs.filter(c => c.approvalStatus === 'approved');
  const repScore = reputationScores.find(s => s.memberId === memberId);
  const assignableRoles = getAssignableRoles(currentUser);
  const canManageMember = canManage(currentUser, member);

  const categoryTotals = ['Code', 'Content', 'Revenue', 'Community', 'Governance'].map(cat => ({
    cat,
    points: approvedContribs.filter(c => c.category === cat).reduce((s, c) => s + c.points, 0),
  })).filter(x => x.points > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar initials={member.avatar} size="xl" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
            <RoleBadge role={member.role} />
            <StatusBadge status={member.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">{member.email}</p>
          <p className="text-sm text-gray-600 mt-2">{member.bio}</p>
          {member.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {member.skills.map(skill => (
                <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{skill}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center bg-indigo-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-indigo-600">{member.reputationScore.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Reputation Score</div>
          {repScore && <div className="text-xs font-medium text-gray-500 mt-0.5">Rank #{repScore.rank}</div>}
        </div>
        <div className="text-center bg-emerald-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-emerald-600">{member.totalContributions}</div>
          <div className="text-xs text-gray-500 mt-0.5">Contributions</div>
          <div className="text-xs text-gray-400 mt-0.5">{approvedContribs.length} approved</div>
        </div>
        <div className="text-center bg-amber-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-amber-600">{member.tokenBalance.toFixed(0)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Tokens</div>
          <div className="text-xs text-gray-400 mt-0.5">USD equiv.</div>
        </div>
      </div>

      {/* Reputation History */}
      {repScore && repScore.history.length > 1 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Reputation Growth (6 months)</h3>
          <div className="flex items-end justify-between gap-1">
            <Sparkline data={repScore.history.map(h => h.score)} color="#6366f1" width={300} height={60} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            {repScore.history.map(h => (
              <span key={h.date}>{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</span>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contribution Categories</h3>
          <div className="space-y-2">
            {categoryTotals.sort((a, b) => b.points - a.points).map(({ cat, points }) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20">{cat}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${(points / (categoryTotals[0]?.points || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Contributions */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Contributions</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {memberContribs
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5)
            .map(contrib => (
              <div key={contrib.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  contrib.approvalStatus === 'approved' ? 'bg-emerald-400' :
                  contrib.approvalStatus === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'
                }`} />
                <span className="text-gray-700 flex-1 truncate">{contrib.activityType}</span>
                <span className="text-indigo-600 font-semibold text-xs">+{contrib.points}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(contrib.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Admin Actions */}
      {canManageMember && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Actions</h3>
          {assignableRoles.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">Change Role:</label>
              <select
                value={member.role}
                onChange={e => assignRole(member.id, e.target.value as RoleName)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {assignableRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            {member.status === 'active' && (
              <button
                onClick={() => { updateMemberStatus(member.id, 'suspended'); onClose(); }}
                className="flex-1 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-medium hover:bg-yellow-100"
              >
                Suspend Member
              </button>
            )}
            {member.status === 'suspended' && (
              <button
                onClick={() => { updateMemberStatus(member.id, 'active'); onClose(); }}
                className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100"
              >
                Reactivate Member
              </button>
            )}
            <button
              onClick={() => { updateMemberStatus(member.id, 'archived'); onClose(); }}
              className="flex-1 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100"
            >
              Archive Member
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MembersPage: React.FC = () => {
  const { members, currentUser, activeModal, openModal, closeModal, selectedMemberId, navigate } = useAppStore();
  const [filterRole, setFilterRole] = useState<RoleName | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [profileMemberId, setProfileMemberId] = useState<string | null>(selectedMemberId);

  const canAddMembers = hasPermission(currentUser, 'manage_members');

  const filtered = members.filter(m => {
    if (filterRole !== 'all' && m.role !== filterRole) return false;
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roles: RoleName[] = ['Guest', 'Contributor', 'Reviewer', 'CommunityManager', 'BoardMember', 'Admin'];

  return (
    <div className="space-y-5">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{members.filter(m => m.status === 'active').length}</span> active members
        </div>
        {canAddMembers && (
          <button
            onClick={() => openModal('addMember')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value as RoleName | 'all')}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as MemberStatus | 'all')}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} results</span>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(member => (
          <div
            key={member.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setProfileMemberId(member.id)}
          >
            <div className="flex items-start gap-3 mb-3">
              <Avatar initials={member.avatar} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{member.name}</div>
                <div className="text-xs text-gray-500 truncate">{member.email}</div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <RoleBadge role={member.role} />
                  <StatusBadge status={member.status} />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{member.bio}</p>
            {member.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {member.skills.slice(0, 3).map(skill => (
                  <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{skill}</span>
                ))}
                {member.skills.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">+{member.skills.length - 3}</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-3">
              <div className="text-center">
                <div className="font-bold text-indigo-600">{member.reputationScore.toFixed(1)}</div>
                <div className="text-gray-400">reputation</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-emerald-600">{member.totalContributions}</div>
                <div className="text-gray-400">contributions</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-amber-600">{member.tokenBalance.toFixed(0)}</div>
                <div className="text-gray-400">tokens</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {activeModal === 'addMember' && (
        <Modal title="Add New Member" onClose={closeModal} size="md">
          <AddMemberModal onClose={closeModal} />
        </Modal>
      )}
      {profileMemberId && (
        <Modal
          title="Member Profile"
          onClose={() => setProfileMemberId(null)}
          size="lg"
        >
          <MemberProfileModal memberId={profileMemberId} onClose={() => setProfileMemberId(null)} />
        </Modal>
      )}
    </div>
  );
};
