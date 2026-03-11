import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { hasPermission } from '../services/rbacService';
import { ROLES, PERMISSION_LABELS, CATEGORY_WEIGHTS, ROLE_LABELS, ROLE_COLORS } from '../constants';
import type { Permission, RoleName } from '../types';

type SettingsTab = 'rbac' | 'weights' | 'audit' | 'integrations';

export const SettingsPage: React.FC = () => {
  const { currentUser, auditLogs, members } = useAppStore();
  const [tab, setTab] = useState<SettingsTab>('rbac');

  const canViewAudit = hasPermission(currentUser, 'view_audit_logs');
  const canConfigure = hasPermission(currentUser, 'configure_system');

  const tabs: { id: SettingsTab; label: string; show: boolean }[] = [
    { id: 'rbac', label: 'RBAC Matrix', show: true },
    { id: 'weights', label: 'Scoring Weights', show: true },
    { id: 'audit', label: 'Audit Logs', show: canViewAudit },
    { id: 'integrations', label: 'Integrations', show: canConfigure },
  ];

  return (
    <div className="space-y-5">
      {/* Tab Nav */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
        {tabs.filter(t => t.show).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rbac' && <RBACMatrix />}
      {tab === 'weights' && <ScoringWeights />}
      {tab === 'audit' && canViewAudit && <AuditLogViewer />}
      {tab === 'integrations' && canConfigure && <IntegrationsPanel />}
    </div>
  );
};

// ─── RBAC Matrix ──────────────────────────────────────────────────────────────

const RBACMatrix: React.FC = () => {
  const allPermissions = Object.keys(PERMISSION_LABELS) as Permission[];
  const roleNames: RoleName[] = ['Guest', 'Contributor', 'Reviewer', 'CommunityManager', 'BoardMember', 'Admin'];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Role-Based Access Control Matrix</h2>
        <p className="text-xs text-gray-400 mt-0.5">Permission assignments for each role. Higher roles inherit lower role capabilities through role hierarchy.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600 sticky left-0 bg-gray-50 min-w-48">Permission</th>
              {roleNames.map(role => (
                <th key={role} className="py-3 px-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role]}`}>
                    {ROLE_LABELS[role]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allPermissions.map(perm => (
              <tr key={perm} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-medium text-gray-700 sticky left-0 bg-white hover:bg-gray-50">
                  {PERMISSION_LABELS[perm]}
                </td>
                {roleNames.map(role => {
                  const roleObj = ROLES.find(r => r.name === role);
                  const has = roleObj?.permissions.includes(perm) ?? false;
                  return (
                    <td key={role} className="py-2.5 px-3 text-center">
                      {has ? (
                        <span className="inline-flex w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full items-center justify-center">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex w-5 h-5 bg-gray-100 text-gray-300 rounded-full items-center justify-center">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        <strong>Role Hierarchy:</strong> Guest (0) → Contributor (1) → Reviewer (2) → Community Manager (3) → Board Member (4) → Admin (5).
        Higher-level roles can manage lower-level roles.
      </div>
    </div>
  );
};

// ─── Scoring Weights ──────────────────────────────────────────────────────────

const ScoringWeights: React.FC = () => (
  <div className="space-y-5">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Contribution Category Weights</h2>
      <div className="space-y-4">
        {CATEGORY_WEIGHTS.map(cw => (
          <div key={cw.category}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cw.color }} />
                <span className="text-sm font-medium text-gray-700">{cw.category}</span>
              </div>
              <span className="text-sm font-bold text-indigo-600">{(cw.weight * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${cw.weight * 100}%`, backgroundColor: cw.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        Total weight: {CATEGORY_WEIGHTS.reduce((s, w) => s + w.weight, 0).toFixed(2)} (must equal 1.0)
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Reputation Formula</h2>
      <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm text-gray-700 space-y-2">
        <p><strong>Reputation Score</strong> = Σ (Points × CategoryWeight × TimeDecay)</p>
        <p><strong>Time Decay</strong> = e<sup>−λ·days</sup> where λ = 0.001</p>
        <p><strong>Vote Weight</strong> = log(reputation_score + 1)</p>
        <p><strong>Reward Share</strong> = member_reputation / total_reputation</p>
      </div>
      <div className="mt-3 bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700">
        <strong>Anti-gaming:</strong> Contributions require peer review. Self-review is not allowed.
        Points are only counted after approval. Time decay ensures recent contributions are valued more.
      </div>
    </div>
  </div>
);

// ─── Audit Log Viewer ─────────────────────────────────────────────────────────

const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useAppStore();
  const [filterAction, setFilterAction] = useState<string>('all');

  const actions = [...new Set(auditLogs.map(l => l.action))];
  const filtered = filterAction === 'all'
    ? auditLogs
    : auditLogs.filter(l => l.action === filterAction);

  const actionColors: Record<string, string> = {
    contribution_approved: 'bg-emerald-100 text-emerald-700',
    contribution_rejected: 'bg-red-100 text-red-700',
    contribution_submitted: 'bg-blue-100 text-blue-700',
    role_changed: 'bg-purple-100 text-purple-700',
    member_created: 'bg-indigo-100 text-indigo-700',
    member_suspended: 'bg-yellow-100 text-yellow-700',
    proposal_created: 'bg-violet-100 text-violet-700',
    vote_cast: 'bg-teal-100 text-teal-700',
    reward_distributed: 'bg-emerald-100 text-emerald-700',
    reputation_recalculated: 'bg-gray-100 text-gray-700',
    member_updated: 'bg-blue-100 text-blue-600',
    permission_changed: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Audit Logs</h2>
          <p className="text-xs text-gray-400 mt-0.5">Complete history of system actions for transparency and compliance.</p>
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Actions ({auditLogs.length})</option>
          {actions.map(a => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')} ({auditLogs.filter(l => l.action === a).length})</option>
          ))}
        </select>
      </div>
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">No audit logs yet</p>
            <p className="text-xs mt-1">Actions will be logged as you use the platform.</p>
          </div>
        ) : (
          filtered.map(log => (
            <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50">
              <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">by <strong>{log.actorName}</strong></span>
                  {log.targetName && <span className="text-xs text-gray-400">→ {log.targetName}</span>}
                </div>
                <p className="text-xs text-gray-600">{log.details}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Integrations Panel ───────────────────────────────────────────────────────

const IntegrationsPanel: React.FC = () => {
  const integrations = [
    {
      name: 'GitHub',
      description: 'Automatically track code contributions from pull requests and commits.',
      status: 'available',
      icon: '🐙',
      features: ['PR contributions', 'Code review tracking', 'Commit analysis'],
    },
    {
      name: 'Slack / Discord',
      description: 'Track community activity from chat platforms.',
      status: 'available',
      icon: '💬',
      features: ['Message activity', 'Support threads', 'Event participation'],
    },
    {
      name: 'LMS (Moodle/Canvas)',
      description: 'Capture course content contributions from learning management systems.',
      status: 'planned',
      icon: '📚',
      features: ['Course content', 'Tutorial creation', 'Student mentorship'],
    },
    {
      name: 'CRM (Salesforce/HubSpot)',
      description: 'Attribute revenue contributions from sales and partnership activities.',
      status: 'planned',
      icon: '📊',
      features: ['Revenue attribution', 'Pipeline tracking', 'Client onboarding'],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Integrations</strong> automatically create contribution records when members perform tracked activities on connected platforms.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(integ => (
          <div key={integ.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{integ.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{integ.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    integ.status === 'available'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {integ.status === 'available' ? 'Available' : 'Planned'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{integ.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {integ.features.map(f => (
                <span key={f} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{f}</span>
              ))}
            </div>
            <button
              disabled={integ.status !== 'available'}
              className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
                integ.status === 'available'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              {integ.status === 'available' ? 'Configure Integration' : 'Coming Soon'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
