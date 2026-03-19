import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { hasPermission } from '../services/rbacService';
import { ACTIVITY_TYPES } from '../constants';
import { CategoryBadge, ApprovalBadge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Modal } from './ui/Modal';
import type { ContributionCategory, ApprovalStatus } from '../types';

// ─── Submit Contribution Form ─────────────────────────────────────────────────

const SubmitContributionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, projects, submitContribution } = useAppStore();
  const [form, setForm] = useState({
    category: 'Code' as ContributionCategory,
    activityType: '',
    points: 50,
    description: '',
    projectId: '',
    evidence: '',
    githubPrUrl: '',
  });

  const handleCategoryChange = (cat: ContributionCategory) => {
    setForm(f => ({ ...f, category: cat, activityType: ACTIVITY_TYPES[cat][0] }));
  };

  React.useEffect(() => {
    setForm(f => ({ ...f, activityType: ACTIVITY_TYPES['Code'][0] }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !form.description.trim()) return;
    submitContribution({
      memberId: currentUser.id,
      activityType: form.activityType,
      category: form.category,
      points: form.points,
      description: form.description,
      projectId: form.projectId || undefined,
      projectName: form.projectId ? projects.find(p => p.id === form.projectId)?.name : undefined,
      evidence: form.evidence || undefined,
      githubPrUrl: form.githubPrUrl || undefined,
    });
    onClose();
  };

  const categories: ContributionCategory[] = ['Code', 'Content', 'Revenue', 'Community', 'Governance'];
  const categoryColors: Record<ContributionCategory, string> = {
    Code: 'border-indigo-400 bg-indigo-50 text-indigo-700',
    Content: 'border-amber-400 bg-amber-50 text-amber-700',
    Revenue: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    Community: 'border-pink-400 bg-pink-50 text-pink-700',
    Governance: 'border-violet-400 bg-violet-50 text-violet-700',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contribution Category</label>
        <div className="grid grid-cols-5 gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                form.category === cat ? categoryColors[cat] : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
        <select
          value={form.activityType}
          onChange={e => setForm(f => ({ ...f, activityType: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          {ACTIVITY_TYPES[form.category]?.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Points */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Points: <span className="font-bold text-indigo-600">{form.points}</span>
        </label>
        <input
          type="range" min={5} max={200} step={5}
          value={form.points}
          onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) }))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>5 (minor)</span><span>100 (major)</span><span>200 (landmark)</span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="Describe what you did, the impact, and any relevant context..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          required
        />
      </div>

      {/* Project */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project (optional)</label>
        <select
          value={form.projectId}
          onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— No specific project —</option>
          {projects.filter(p => p.status === 'active').map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* GitHub PR (Code only) */}
      {form.category === 'Code' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub PR URL (optional)</label>
          <input
            type="url"
            value={form.githubPrUrl}
            onChange={e => setForm(f => ({ ...f, githubPrUrl: e.target.value }))}
            placeholder="https://github.com/org/repo/pull/123"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Evidence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Evidence / Links (optional)</label>
        <input
          type="text"
          value={form.evidence}
          onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
          placeholder="Link to documentation, screenshot URL, etc."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          Submit for Review
        </button>
      </div>
    </form>
  );
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal: React.FC<{ contributionId: string; onClose: () => void }> = ({ contributionId, onClose }) => {
  const { contributions, reviewContribution } = useAppStore();
  const [note, setNote] = useState('');
  const contrib = contributions.find(c => c.id === contributionId);
  if (!contrib) return null;

  const handleReview = (status: 'approved' | 'rejected') => {
    reviewContribution(contributionId, status, note);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={contrib.category} />
          <span className="text-sm font-semibold text-gray-800">{contrib.activityType}</span>
          <span className="text-sm text-gray-500">by {contrib.memberName}</span>
        </div>
        <p className="text-sm text-gray-600">{contrib.description}</p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Points requested: <strong className="text-indigo-600">{contrib.points}</strong></span>
          {contrib.projectName && <span>Project: {contrib.projectName}</span>}
          {contrib.githubPrUrl && (
            <a href={contrib.githubPrUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
              View PR
            </a>
          )}
          {contrib.evidence && <span>Evidence: {contrib.evidence}</span>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Review Note</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Add a review comment (optional but encouraged)..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={() => handleReview('rejected')} className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100">
          Reject
        </button>
        <button onClick={() => handleReview('approved')} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
          Approve
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ContributionsPage: React.FC = () => {
  const { contributions, currentUser, activeModal, openModal, closeModal } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ContributionCategory | 'all'>('all');
  const [filterMine, setFilterMine] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const canSubmit = hasPermission(currentUser, 'submit_contribution');
  const canReview = hasPermission(currentUser, 'review_contributions');

  const filtered = contributions.filter(c => {
    if (filterMine && c.memberId !== currentUser?.id) return false;
    if (filterStatus !== 'all' && c.approvalStatus !== filterStatus) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (search && !c.memberName.toLowerCase().includes(search.toLowerCase()) &&
        !c.description.toLowerCase().includes(search.toLowerCase()) &&
        !c.activityType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const categories: ContributionCategory[] = ['Code', 'Content', 'Revenue', 'Community', 'Governance'];
  const statuses: ApprovalStatus[] = ['pending', 'under_review', 'approved', 'rejected'];

  const pendingCount = contributions.filter(c => c.approvalStatus === 'pending').length;
  const approvedCount = contributions.filter(c => c.approvalStatus === 'approved').length;

  return (
    <div className="space-y-5">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg px-3 py-1.5 text-sm font-medium">
            {pendingCount} Pending
          </div>
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-1.5 text-sm font-medium">
            {approvedCount} Approved
          </div>
        </div>
        {canSubmit && (
          <button
            onClick={() => openModal('submitContribution')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit Contribution
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search contributions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as ApprovalStatus | 'all')}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as ContributionCategory | 'all')}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {currentUser && (
          <button
            onClick={() => setFilterMine(!filterMine)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              filterMine ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            My Contributions
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{sorted.length} results</span>
      </div>

      {/* Contributions List */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium">No contributions found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          sorted.map(contrib => (
            <div key={contrib.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <Avatar initials={contrib.memberName.split(' ').map(n => n[0]).join('')} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{contrib.memberName}</span>
                    <CategoryBadge category={contrib.category} />
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {contrib.activityType}
                    </span>
                    {contrib.projectName && (
                      <span className="text-xs text-gray-400">• {contrib.projectName}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{contrib.description}</p>
                  {contrib.reviewNote && (
                    <p className="text-xs text-gray-400 mt-1.5 italic border-l-2 border-gray-200 pl-2">
                      Review: {contrib.reviewNote}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <ApprovalBadge status={contrib.approvalStatus} />
                    {contrib.reviewerName && (
                      <span className="text-xs text-gray-400">Reviewed by {contrib.reviewerName}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(contrib.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {contrib.githubPrUrl && (
                      <a href="#" className="text-xs text-indigo-600 hover:underline">View PR</a>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                  <div>
                    <div className="text-lg font-bold text-indigo-600">+{contrib.points}</div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                  {canReview && contrib.approvalStatus === 'pending' && contrib.memberId !== currentUser?.id && (
                    <button
                      onClick={() => setReviewingId(contrib.id)}
                      className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {activeModal === 'submitContribution' && (
        <Modal title="Submit a Contribution" onClose={closeModal} size="lg">
          <SubmitContributionModal onClose={closeModal} />
        </Modal>
      )}
      {reviewingId && (
        <Modal title="Review Contribution" onClose={() => setReviewingId(null)} size="md">
          <ReviewModal contributionId={reviewingId} onClose={() => setReviewingId(null)} />
        </Modal>
      )}
    </div>
  );
};
