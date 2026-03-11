import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { ROLE_LABELS, ROLE_COLORS } from '../constants';
import { Avatar } from './ui/Avatar';
import type { Member } from '../types';

export const LoginPage: React.FC = () => {
  const { members, login } = useAppStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const activeDemoAccounts = members.filter(m => m.status !== 'archived');
  const filtered = activeDemoAccounts.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    ROLE_LABELS[m.role].toLowerCase().includes(search.toLowerCase())
  );

  const handleLogin = () => {
    if (selected) login(selected);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-white text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-1">CoopContrib</h1>
          <p className="text-indigo-200 text-sm">Contribution Management Platform</p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-indigo-200">
            <span>Track Contributions</span>
            <span>•</span>
            <span>Build Reputation</span>
            <span>•</span>
            <span>Govern Fairly</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Choose a Demo Account</h2>
          <p className="text-sm text-gray-500 mb-4">Each account has a different role and permissions level.</p>

          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          />

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filtered.map(member => (
              <DemoAccountCard
                key={member.id}
                member={member}
                selected={selected === member.id}
                onClick={() => setSelected(member.id)}
              />
            ))}
          </div>

          <button
            onClick={handleLogin}
            disabled={!selected}
            className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {selected ? `Sign in as ${members.find(m => m.id === selected)?.name}` : 'Select an account to continue'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            This is a demo environment. No real authentication required.
          </p>
        </div>
      </div>
    </div>
  );
};

const DemoAccountCard: React.FC<{
  member: Member;
  selected: boolean;
  onClick: () => void;
}> = ({ member, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
      selected
        ? 'border-indigo-500 bg-indigo-50'
        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
    }`}
  >
    <Avatar initials={member.avatar} size="md" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-gray-900 text-sm">{member.name}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
          {ROLE_LABELS[member.role]}
        </span>
        {member.status !== 'active' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            {member.status}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 truncate mt-0.5">{member.bio}</p>
    </div>
    <div className="text-right flex-shrink-0">
      <div className="text-xs font-semibold text-indigo-600">{member.reputationScore.toFixed(1)}</div>
      <div className="text-xs text-gray-400">rep</div>
    </div>
    {selected && (
      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )}
  </button>
);
