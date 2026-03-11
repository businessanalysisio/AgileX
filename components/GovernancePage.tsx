import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { hasPermission } from '../services/rbacService';
import { voteWeight } from '../constants';
import { ProposalStatusBadge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Modal } from './ui/Modal';
import type { ProposalCategory, ProposalStatus } from '../types';

// ─── Create Proposal Modal ────────────────────────────────────────────────────

const CreateProposalModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, createProposal } = useAppStore();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'strategic' as ProposalCategory,
    endsAt: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const categories: { value: ProposalCategory; label: string }[] = [
    { value: 'project_approval', label: 'Project Approval' },
    { value: 'fund_allocation', label: 'Fund Allocation' },
    { value: 'member_acceptance', label: 'Member Acceptance' },
    { value: 'strategic', label: 'Strategic Decision' },
    { value: 'policy', label: 'Policy Change' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    createProposal({
      title: form.title,
      description: form.description,
      category: form.category,
      authorId: currentUser.id,
      status: 'active',
      endsAt: new Date(form.endsAt).toISOString(),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title *</label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required placeholder="Clear, descriptive proposal title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value as ProposalCategory }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={6}
          placeholder="Describe the proposal in detail. Include motivation, expected outcomes, and any relevant data..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Voting Ends</label>
        <input
          type="date"
          value={form.endsAt}
          onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
          min={new Date().toISOString().split('T')[0]}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          Create Proposal
        </button>
      </div>
    </form>
  );
};

// ─── Proposal Detail Modal ────────────────────────────────────────────────────

const ProposalDetailModal: React.FC<{ proposalId: string; onClose: () => void }> = ({ proposalId, onClose }) => {
  const { proposals, votes, currentUser, reputationScores, castVote, addComment } = useAppStore();
  const [commentText, setCommentText] = useState('');
  const [voteRationale, setVoteRationale] = useState('');

  const proposal = proposals.find(p => p.id === proposalId);
  if (!proposal) return null;

  const proposalVotes = votes.filter(v => v.proposalId === proposalId);
  const myVote = proposalVotes.find(v => v.memberId === currentUser?.id);
  const canVote = hasPermission(currentUser, 'vote_proposals') && !myVote && proposal.status === 'active';

  const myRepScore = reputationScores.find(s => s.memberId === currentUser?.id);
  const myVoteWeight = myRepScore ? voteWeight(myRepScore.totalScore) : 0;

  const totalVoters = proposalVotes.length;
  const forPct = proposal.totalWeight > 0 ? (proposal.votesFor / proposal.totalWeight) * 100 : 0;
  const againstPct = proposal.totalWeight > 0 ? (proposal.votesAgainst / proposal.totalWeight) * 100 : 0;

  const handleVote = (choice: 'for' | 'against' | 'abstain') => {
    castVote(proposalId, choice, voteRationale);
    setVoteRationale('');
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(proposalId, commentText);
    setCommentText('');
  };

  const categoryLabels: Record<string, string> = {
    project_approval: 'Project Approval',
    fund_allocation: 'Fund Allocation',
    member_acceptance: 'Member Acceptance',
    strategic: 'Strategic',
    policy: 'Policy',
    other: 'Other',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <ProposalStatusBadge status={proposal.status} />
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {categoryLabels[proposal.category]}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 leading-snug">{proposal.title}</h2>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <span>by {proposal.authorName}</span>
          <span>•</span>
          <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
          {proposal.status === 'active' && (
            <>
              <span>•</span>
              <span className="text-amber-600 font-medium">
                Ends {new Date(proposal.endsAt).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{proposal.description}</p>
      </div>

      {/* Execution Note */}
      {proposal.executionNote && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
          <strong>Execution: </strong>{proposal.executionNote}
        </div>
      )}

      {/* Vote Tally */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Vote Results</h3>
          <span className="text-xs text-gray-400">{totalVoters} voters • weight-adjusted</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-emerald-600 font-medium">For</span>
              <span className="text-emerald-600 font-semibold">{proposal.votesFor.toFixed(2)} ({forPct.toFixed(1)}%)</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full">
              <div className="h-3 bg-emerald-500 rounded-full transition-all" style={{ width: `${forPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-500 font-medium">Against</span>
              <span className="text-red-500 font-semibold">{proposal.votesAgainst.toFixed(2)} ({againstPct.toFixed(1)}%)</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full">
              <div className="h-3 bg-red-400 rounded-full transition-all" style={{ width: `${againstPct}%` }} />
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          Total weight: {proposal.totalWeight.toFixed(2)} • Formula: weight = log(reputation + 1)
        </div>
      </div>

      {/* Vote Casting */}
      {canVote && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-1">Cast Your Vote</h3>
          <p className="text-xs text-indigo-600 mb-3">
            Your vote weight: <strong>{myVoteWeight.toFixed(3)}</strong> (based on reputation {myRepScore?.totalScore.toFixed(2) ?? 0})
          </p>
          <textarea
            value={voteRationale}
            onChange={e => setVoteRationale(e.target.value)}
            placeholder="Add your rationale (optional)..."
            rows={2}
            className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white mb-3 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => handleVote('against')} className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100">
              Vote Against
            </button>
            <button onClick={() => handleVote('abstain')} className="flex-1 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200">
              Abstain
            </button>
            <button onClick={() => handleVote('for')} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
              Vote For
            </button>
          </div>
        </div>
      )}

      {myVote && (
        <div className={`rounded-xl p-3 text-sm font-medium text-center ${
          myVote.choice === 'for' ? 'bg-emerald-50 text-emerald-700' :
          myVote.choice === 'against' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
        }`}>
          You voted: <strong>{myVote.choice}</strong> (weight: {myVote.weight.toFixed(3)})
        </div>
      )}

      {/* Voters List */}
      {proposalVotes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Votes Cast ({proposalVotes.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {proposalVotes.map(vote => (
              <div key={vote.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  vote.choice === 'for' ? 'bg-emerald-400' :
                  vote.choice === 'against' ? 'bg-red-400' : 'bg-gray-300'
                }`} />
                <span className="font-medium text-gray-800">{vote.memberName}</span>
                <span className={`text-xs ${vote.choice === 'for' ? 'text-emerald-600' : vote.choice === 'against' ? 'text-red-500' : 'text-gray-400'}`}>
                  {vote.choice}
                </span>
                <span className="text-xs text-gray-400">w={vote.weight.toFixed(2)}</span>
                {vote.rationale && (
                  <span className="text-xs text-gray-400 flex-1 truncate italic">"{vote.rationale}"</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Discussion ({proposal.comments.length})</h3>
        <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
          {proposal.comments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to discuss.</p>
          )}
          {proposal.comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar initials={comment.authorName.split(' ').map(n => n[0]).join('')} size="sm" />
              <div className="flex-1 bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{comment.authorName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        {currentUser && (
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GovernancePage: React.FC = () => {
  const { proposals, votes, currentUser, activeModal, openModal, closeModal } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'all'>('all');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const canCreateProposal = hasPermission(currentUser, 'create_proposals');
  const canVote = hasPermission(currentUser, 'vote_proposals');

  const filtered = [...proposals]
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statuses: ProposalStatus[] = ['active', 'passed', 'rejected', 'draft', 'executed'];

  const activeCount = proposals.filter(p => p.status === 'active').length;
  const passedCount = proposals.filter(p => p.status === 'passed').length;
  const myVoteCount = votes.filter(v => v.memberId === currentUser?.id).length;

  const categoryIcons: Record<string, string> = {
    project_approval: '🔨',
    fund_allocation: '💰',
    member_acceptance: '👤',
    strategic: '🎯',
    policy: '📜',
    other: '📌',
  };

  const categoryLabels: Record<string, string> = {
    project_approval: 'Project Approval',
    fund_allocation: 'Fund Allocation',
    member_acceptance: 'Member Acceptance',
    strategic: 'Strategic',
    policy: 'Policy',
    other: 'Other',
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Active Proposals</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
          <div className="text-2xl font-bold text-emerald-600">{passedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Passed</div>
        </div>
        <div className="bg-violet-50 rounded-xl p-4 text-center border border-violet-100">
          <div className="text-2xl font-bold text-violet-600">{myVoteCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Your Votes</div>
        </div>
      </div>

      {/* Governance Note */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-4 text-sm text-violet-700">
        <strong>Weighted Voting:</strong> vote_weight = log(reputation_score + 1).
        Members with higher reputation scores have proportionally greater governance influence.
        {canVote && (
          <span className="ml-2 text-indigo-600 font-medium">You are eligible to vote.</span>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filterStatus === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            All ({proposals.length})
          </button>
          {statuses.map(s => {
            const count = proposals.filter(p => p.status === s).length;
            if (count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
        {canCreateProposal && (
          <button
            onClick={() => openModal('createProposal')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Proposal
          </button>
        )}
      </div>

      {/* Proposals List */}
      <div className="space-y-3">
        {filtered.map(proposal => {
          const proposalVotes = votes.filter(v => v.proposalId === proposal.id);
          const myVote = proposalVotes.find(v => v.memberId === currentUser?.id);
          const forPct = proposal.totalWeight > 0 ? (proposal.votesFor / proposal.totalWeight) * 100 : 0;
          const daysLeft = Math.max(0, Math.ceil((new Date(proposal.endsAt).getTime() - Date.now()) / 86400000));

          return (
            <div
              key={proposal.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 transition-all cursor-pointer"
              onClick={() => setSelectedProposalId(proposal.id)}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">{categoryIcons[proposal.category] ?? '📌'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <ProposalStatusBadge status={proposal.status} />
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {categoryLabels[proposal.category]}
                    </span>
                    {myVote && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        myVote.choice === 'for' ? 'bg-emerald-100 text-emerald-700' :
                        myVote.choice === 'against' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        You voted: {myVote.choice}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">{proposal.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{proposal.description}</p>

                  {/* Vote Progress */}
                  {proposal.status === 'active' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>For: {proposal.votesFor.toFixed(1)}</span>
                        <span>{proposalVotes.length} voters</span>
                        <span>Against: {proposal.votesAgainst.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full flex overflow-hidden">
                        <div className="bg-emerald-400 transition-all" style={{ width: `${forPct}%` }} />
                        <div className="bg-red-400 transition-all" style={{ width: `${100 - forPct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>by {proposal.authorName}</span>
                    <span>•</span>
                    <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                    {proposal.status === 'active' && daysLeft > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 font-medium">{daysLeft}d left</span>
                      </>
                    )}
                    {proposal.comments.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{proposal.comments.length} comments</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {activeModal === 'createProposal' && (
        <Modal title="Create Governance Proposal" onClose={closeModal} size="lg">
          <CreateProposalModal onClose={closeModal} />
        </Modal>
      )}
      {selectedProposalId && (
        <Modal
          title="Proposal Details"
          onClose={() => setSelectedProposalId(null)}
          size="xl"
        >
          <ProposalDetailModal proposalId={selectedProposalId} onClose={() => setSelectedProposalId(null)} />
        </Modal>
      )}
    </div>
  );
};
