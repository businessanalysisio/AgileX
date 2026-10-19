import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import {
  isActiveBlocker,
  isActiveTask,
  isPmOnAnyProject,
  leadCanReviewPhase,
  projectRole,
  visibleTasks,
} from '../services/access';
import { formatWhen, labelDecision } from '../services/format';
import type { ApprovalChoice } from '../types';
import { AccessDenied, Button, Empty, Field, PageHeader, Panel, Select, Stat, TextArea } from './ui';

export const ApprovalsPage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const tasks = useAppStore(s => s.tasks);
  const blockers = useAppStore(s => s.blockers);
  const evidence = useAppStore(s => s.evidence);
  const approvals = useAppStore(s => s.approvals);
  const phases = useAppStore(s => s.phases);
  const projects = useAppStore(s => s.projects);
  const users = useAppStore(s => s.users);
  const submitApproval = useAppStore(s => s.submitApproval);
  const [phaseId, setPhaseId] = useState('');
  const [decision, setDecision] = useState<ApprovalChoice>('approve');
  const [rationale, setRationale] = useState('');
  const [conditions, setConditions] = useState('');

  const visible = visibleTasks(user, tasks, grants);
  const lead = user ? grants.some(g => g.userId === user.id && g.role === 'TeamLead') : false;
  const pm = isPmOnAnyProject(user, grants);
  const options = useMemo(() => {
    return phases.filter(phase => {
      if (lead) return leadCanReviewPhase(user, phase.projectId, phase.id, tasks, grants);
      if (pm) return projectRole(user, grants, phase.projectId) === 'ProjectManager' && visible.some(t => t.phaseId === phase.id);
      return false;
    });
  }, [phases, lead, pm, user, tasks, grants, visible]);

  const selected = options.find(p => p.id === phaseId) ?? options[0];

  if (!user || (!lead && !pm)) return <AccessDenied what="readiness review" />;
  if (!selected) return <div><PageHeader title="Readiness" /><Empty>No deliverables are in your scope.</Empty></div>;

  const inScope = visible.filter(t => t.phaseId === selected.id);
  const active = inScope.filter(isActiveTask);
  const done = active.filter(t => t.status === 'done').length;
  const openBlockers = blockers.filter(b => inScope.some(t => t.id === b.taskId) && isActiveBlocker(b));
  const unclassified = active.filter(t => t.isConditional && (t.classification === 'unclassified' || t.classification === 'needs_clarification'));
  const evidenceReady = active.filter(t => evidence.some(e => e.taskId === t.id && e.status === 'submitted')).length;
  const risks = openBlockers.length > 0 || unclassified.length > 0;
  const history = approvals
    .filter(a => a.phaseId === selected.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const canSubmit = leadCanReviewPhase(user, selected.projectId, selected.id, tasks, grants);

  return (
    <div>
      <PageHeader
        eyebrow="Approval governance"
        title="Readiness review"
        lede="A decision is immutable. A later decision supersedes the earlier one and leaves it in the audit log."
        actions={
          <Select value={selected.id} onChange={e => setPhaseId(e.target.value)} className="w-72">
            {options.map(phase => {
              const project = projects.find(p => p.id === phase.projectId);
              return <option key={phase.id} value={phase.id}>{project?.code} · {phase.name}</option>;
            })}
          </Select>
        }
      />
      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <Stat label="Completion" value={`${done}/${active.length}`} hint="Not applicable tasks excluded" />
        <Stat label="Open blockers" value={openBlockers.length} />
        <Stat label="Unclassified conditional" value={unclassified.length} />
        <Stat label="Evidence submitted" value={`${evidenceReady}/${active.length}`} hint="Drafts excluded" />
      </div>
      {risks && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Readiness risks: {openBlockers.length} unresolved blocker{openBlockers.length === 1 ? '' : 's'}
          {unclassified.length > 0 ? ` and ${unclassified.length} conditional task${unclassified.length === 1 ? '' : 's'} still needing a decision` : ''}.
          You can still submit a decision, and the risk stays on the record.
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="In-scope deliverable">
          <ul className="text-sm space-y-1">
            {inScope.map(t => (
              <li key={t.id}>{t.code} {t.title} · {t.status.replaceAll('_', ' ')}{t.classification === 'not_applicable' ? ' · not applicable' : ''}</li>
            ))}
          </ul>
        </Panel>
        <Panel title={canSubmit ? 'Submit a decision' : 'Decisions'}>
          {canSubmit ? (
            <form
              className="space-y-3"
              onSubmit={e => {
                e.preventDefault();
                const saved = submitApproval({
                  projectId: selected.projectId,
                  phaseId: selected.id,
                  decision,
                  rationale,
                  conditions,
                });
                if (saved) { setRationale(''); setConditions(''); }
              }}
            >
              <Field label="Decision">
                <Select value={decision} onChange={e => setDecision(e.target.value as ApprovalChoice)}>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="approve_with_conditions">Approve with conditions</option>
                </Select>
              </Field>
              <Field label="Rationale">
                <TextArea value={rationale} onChange={e => setRationale(e.target.value)} placeholder="Required" />
              </Field>
              {decision === 'approve_with_conditions' && (
                <Field label="Conditions">
                  <TextArea value={conditions} onChange={e => setConditions(e.target.value)} placeholder="At least one condition" />
                </Field>
              )}
              <Button type="submit">Submit decision</Button>
            </form>
          ) : (
            <p className="text-sm text-stone-500">Project managers can review readiness. Only the team lead submits the decision.</p>
          )}
        </Panel>
      </div>
      <section className="mt-4">
        <h2 className="font-semibold mb-2">Decision history</h2>
        {history.length === 0 && <Empty>No decision has been recorded for this deliverable.</Empty>}
        <ol className="space-y-2">
          {history.map((item, index) => (
            <li key={item.id} className="bg-white border border-stone-200 rounded-xl p-3 text-sm">
              <div className="font-medium">{labelDecision(item.decision)}{index === history.length - 1 ? ' · current' : ''}</div>
              <div className="text-stone-500">{users.find(u => u.id === item.actorId)?.name} · {formatWhen(item.createdAt)} · {item.id}</div>
              <p className="mt-1">{item.rationale}</p>
              {item.conditions && <p className="mt-1">Conditions: {item.conditions}</p>}
              {item.supersedesId && <p className="text-stone-500 mt-1">Supersedes {item.supersedesId}. The earlier decision is unchanged.</p>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
