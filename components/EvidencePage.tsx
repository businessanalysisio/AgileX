import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { canManageEvidence, canViewTask } from '../services/access';
import { formatWhen } from '../services/format';
import { Button, Empty, PageHeader, Select } from './ui';

export const EvidencePage: React.FC = () => {
  const user = useAppStore(s => s.users.find(u => u.id === s.currentUserId) ?? null);
  const grants = useAppStore(s => s.grants);
  const tasks = useAppStore(s => s.tasks);
  const evidence = useAppStore(s => s.evidence);
  const users = useAppStore(s => s.users);
  const projects = useAppStore(s => s.projects);
  const submitEvidence = useAppStore(s => s.submitEvidence);
  const navigate = useAppStore(s => s.navigate);
  const [status, setStatus] = useState('');

  const rows = evidence.filter(item => {
    const task = tasks.find(t => t.id === item.taskId);
    if (!task || !canViewTask(user, task, grants)) return false;
    if (status && item.status !== status) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Evidence"
        title="Drafts, submissions, and versions"
        lede="Replacing evidence keeps the prior version. Only submitted items count toward readiness review."
        actions={
          <Select value={status} onChange={e => setStatus(e.target.value)} className="w-40">
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="replaced">Replaced</option>
          </Select>
        }
      />
      {rows.length === 0 && <Empty>No evidence in your scope.</Empty>}
      {rows.length > 0 && <div className="overflow-x-auto bg-white border border-stone-200 rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-100">
              {['Task', 'Project', 'Label', 'Version', 'Status', 'Uploader', 'When', ''].map(h => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(item => {
              const task = tasks.find(t => t.id === item.taskId)!;
              const project = projects.find(p => p.id === task.projectId);
              return (
                <tr key={item.id} className="border-b border-stone-50">
                  <td className="px-3 py-2">
                    <button type="button" className="hover:underline" onClick={() => navigate({ page: 'tasks', taskId: task.id })}>{task.code}</button>
                  </td>
                  <td className="px-3 py-2">{project?.code}</td>
                  <td className="px-3 py-2">{item.label}{item.kind === 'link' && item.url ? <a className="block text-teal-800 truncate max-w-xs" href={item.url}>{item.url}</a> : <span className="block text-stone-500">{item.fileName}</span>}</td>
                  <td className="px-3 py-2">v{item.version}</td>
                  <td className="px-3 py-2 capitalize">{item.status}</td>
                  <td className="px-3 py-2">{users.find(u => u.id === item.uploaderId)?.name}</td>
                  <td className="px-3 py-2">{formatWhen(item.createdAt)}</td>
                  <td className="px-3 py-2">
                    {item.status === 'draft' && canManageEvidence(user, task, grants) && (
                      <Button onClick={() => submitEvidence(item.id)}>Submit</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </div>
  );
};
