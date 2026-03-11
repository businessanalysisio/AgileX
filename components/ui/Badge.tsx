import React from 'react';
import { ROLE_COLORS, ROLE_LABELS, STATUS_COLORS, APPROVAL_COLORS, PROPOSAL_STATUS_COLORS } from '../../constants';
import type { RoleName, MemberStatus, ApprovalStatus, ProposalStatus } from '../../types';

export const RoleBadge: React.FC<{ role: RoleName }> = ({ role }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}>
    {ROLE_LABELS[role]}
  </span>
);

export const StatusBadge: React.FC<{ status: MemberStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

export const ApprovalBadge: React.FC<{ status: ApprovalStatus }> = ({ status }) => {
  const labels: Record<ApprovalStatus, string> = {
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected', under_review: 'Under Review',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${APPROVAL_COLORS[status]}`}>
      {labels[status]}
    </span>
  );
};

export const ProposalStatusBadge: React.FC<{ status: ProposalStatus }> = ({ status }) => {
  const labels: Record<ProposalStatus, string> = {
    draft: 'Draft', active: 'Active', passed: 'Passed', rejected: 'Rejected', executed: 'Executed',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PROPOSAL_STATUS_COLORS[status]}`}>
      {labels[status]}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const styles: Record<string, string> = {
    Code:       'bg-indigo-100 text-indigo-700',
    Content:    'bg-amber-100 text-amber-700',
    Revenue:    'bg-emerald-100 text-emerald-700',
    Community:  'bg-pink-100 text-pink-700',
    Governance: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[category] ?? 'bg-gray-100 text-gray-700'}`}>
      {category}
    </span>
  );
};
