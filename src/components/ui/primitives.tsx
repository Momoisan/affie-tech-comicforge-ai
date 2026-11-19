'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: 'cf-gradient-btn font-semibold shadow-sm',
      secondary:
        'bg-[var(--cf-surface-2)] text-[var(--cf-text)] border border-[var(--cf-border)] hover:border-[#00D9FF]/60',
      outline:
        'bg-transparent text-[var(--cf-text)] border border-[var(--cf-border)] hover:bg-[var(--cf-surface-2)]',
      ghost: 'bg-transparent text-[var(--cf-muted)] hover:text-[var(--cf-text)] hover:bg-[var(--cf-surface-2)]',
      danger: 'bg-rose-600/90 text-white hover:bg-rose-600 font-medium',
      accent: 'bg-[#FACC15] text-[#090D1A] hover:bg-[#eab308] font-semibold',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'min-h-[40px] sm:min-h-[34px] px-3 text-xs rounded-lg',
      md: 'min-h-[44px] px-4 text-sm rounded-xl',
      lg: 'min-h-[48px] px-5 text-sm rounded-xl',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] motion-reduce:transition-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D9FF]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('glass-card rounded-2xl p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function Badge({
  className,
  variant = 'default',
  children,
}: {
  className?: string;
  variant?: 'default' | 'cyan' | 'yellow' | 'indigo' | 'success' | 'danger';
  children: React.ReactNode;
}) {
  const styles = {
    default: 'bg-[var(--cf-surface-2)] text-[var(--cf-muted)] border-[var(--cf-border)]',
    cyan: 'bg-[#00D9FF]/15 text-[#00D9FF] border-[#00D9FF]/35',
    yellow: 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/40',
    indigo: 'bg-[#6366F1]/15 text-[#818CF8] border-[#6366F1]/40',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/35',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('block text-xs font-semibold uppercase tracking-wider text-[var(--cf-muted)] mb-1.5', className)}
    >
      {children}
    </label>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full min-h-[44px] sm:min-h-[40px] rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] px-3.5 text-sm text-[var(--cf-text)] placeholder:text-[var(--cf-muted)]/70 focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-3.5 text-sm text-[var(--cf-text)] placeholder:text-[var(--cf-muted)]/70 focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full min-h-[44px] sm:min-h-[40px] rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] px-3 text-sm text-[var(--cf-text)] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <Card className="w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-[var(--cf-text)]">{title}</h3>
        <p className="text-sm text-[var(--cf-muted)]">{description}</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
