'use client';

import {forwardRef} from 'react';
import {cn} from '@/lib/utils';

export const Label = ({children}: {children: React.ReactNode}) => (
  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">{children}</label>
);

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({className, ...props}, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/70 focus:bg-white/8',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({className, ...props}, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/70 focus:bg-white/8',
        className,
      )}
      {...props}
    />
  ),
);

Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({className, ...props}, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[112px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/70 focus:bg-white/8',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

export function Button({
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary' | 'secondary'}) {
  return (
    <button
      className={cn(
        'rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary'
          ? 'bg-emerald-400 text-black hover:bg-emerald-300'
          : 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
        className,
      )}
      {...props}
    />
  );
}
