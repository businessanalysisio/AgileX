import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import type { BlockerStatus, ConditionalClass, Priority, TaskStatus } from '../types';
import { labelBlocker, labelClass, labelPriority, labelStatus } from '../services/format';

export function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Button({
  children,
  tone = 'primary',
  type = 'button',
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  tone?: 'primary' | 'ghost' | 'danger' | 'quiet';
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const tones = {
    primary: 'bg-teal-800 text-white hover:bg-teal-900 disabled:bg-stone-300',
    ghost: 'bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 disabled:text-stone-400',
    danger: 'bg-rose-700 text-white hover:bg-rose-800 disabled:bg-stone-300',
    quiet: 'bg-transparent text-teal-900 hover:bg-teal-50 disabled:text-stone-400',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx('px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed', tones[tone], className)}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block font-medium text-stone-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

const control = 'w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(control, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(control, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(control, 'resize-y min-h-20', props.className)} />;
}

export function PageHeader({ eyebrow, title, lede, actions }: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        {eyebrow && <div className="text-xs uppercase tracking-[0.16em] text-teal-800 font-semibold">{eyebrow}</div>}
        <h1 className="font-serif text-3xl text-stone-950 leading-tight">{title}</h1>
        {lede && <p className="text-sm text-stone-600 mt-1 max-w-2xl">{lede}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tone)}>{children}</span>;
}

export function StatusPill({ status }: { status: TaskStatus }) {
  const tones: Record<TaskStatus, string> = {
    not_started: 'bg-stone-100 text-stone-700',
    in_progress: 'bg-sky-100 text-sky-900',
    blocked: 'bg-rose-100 text-rose-900',
    in_review: 'bg-amber-100 text-amber-950',
    done: 'bg-emerald-100 text-emerald-900',
  };
  return <Pill tone={tones[status]}>{labelStatus(status)}</Pill>;
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const tones: Record<Priority, string> = {
    low: 'bg-stone-100 text-stone-600',
    medium: 'bg-stone-200 text-stone-800',
    high: 'bg-orange-100 text-orange-950',
    critical: 'bg-rose-100 text-rose-950',
  };
  return <Pill tone={tones[priority]}>{labelPriority(priority)}</Pill>;
}

export function BlockerPill({ status }: { status: BlockerStatus }) {
  const tones: Record<BlockerStatus, string> = {
    open: 'bg-rose-100 text-rose-900',
    in_progress: 'bg-amber-100 text-amber-950',
    resolved: 'bg-emerald-100 text-emerald-900',
    reopened: 'bg-rose-200 text-rose-950',
  };
  return <Pill tone={tones[status]}>{labelBlocker(status)}</Pill>;
}

export function ClassPill({ value }: { value: ConditionalClass }) {
  const tones: Record<ConditionalClass, string> = {
    unclassified: 'bg-stone-200 text-stone-800',
    applicable: 'bg-teal-100 text-teal-950',
    not_applicable: 'bg-stone-100 text-stone-500',
    needs_clarification: 'bg-amber-100 text-amber-950',
  };
  return <Pill tone={tones[value]}>{labelClass(value)}</Pill>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="border border-dashed border-stone-300 rounded-xl px-4 py-8 text-sm text-stone-500 text-center">{children}</div>;
}

export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-stone-200 rounded-2xl shadow-sm">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-100">
        <h2 className="font-semibold text-stone-900">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, onClick }: { label: string; value: React.ReactNode; hint?: string; onClick?: () => void }) {
  const inner = (
    <>
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className="font-serif text-3xl text-stone-950 mt-1">{value}</div>
      {hint && <div className="text-xs text-stone-500 mt-1">{hint}</div>}
    </>
  );
  if (!onClick) return <div className="bg-white border border-stone-200 rounded-2xl p-4">{inner}</div>;
  return (
    <button type="button" onClick={onClick} className="text-left bg-white border border-stone-200 rounded-2xl p-4 hover:border-teal-700">
      {inner}
    </button>
  );
}

export function AccessDenied({ what = 'this record' }: { what?: string }) {
  return (
    <div className="max-w-lg mx-auto mt-16 bg-white border border-rose-200 rounded-2xl p-8">
      <div className="text-xs uppercase tracking-[0.16em] text-rose-700 font-semibold">Access denied</div>
      <h1 className="font-serif text-3xl text-stone-950 mt-2">You cannot open {what}</h1>
      <p className="text-sm text-stone-600 mt-2">
        It is outside your authorized scope. No title, description, or other content is shown.
      </p>
    </div>
  );
}

export function ToastHost() {
  const { toast, dismiss } = useToast();
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);
  if (!toast) return null;
  const tones = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    error: 'bg-rose-50 border-rose-200 text-rose-950',
    info: 'bg-sky-50 border-sky-200 text-sky-950',
  };
  return (
    <button
      type="button"
      onClick={dismiss}
      className={cx('fixed bottom-5 right-5 z-50 max-w-sm border rounded-xl px-4 py-3 shadow-lg text-sm text-left', tones[toast.type])}
    >
      {toast.message}
    </button>
  );
}

function useToast() {
  const toast = useAppStore(s => s.toast);
  const dismiss = useAppStore(s => s.dismissToast);
  return { toast, dismiss };
}
