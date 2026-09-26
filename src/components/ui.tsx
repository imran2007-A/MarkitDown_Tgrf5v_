import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { extOf } from '../lib/formats'
import { inkOf } from '../lib/ink'

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function TextButton({ children, className, active, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...rest}
      className={cn(
        'label inline-flex items-center gap-1.5 py-1 text-pencil transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40',
        active && 'text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      className={cn('inline-grid size-7 place-items-center rounded-[3px] text-pencil transition-colors hover:bg-rule/60 hover:text-ink', className)}
    >
      {children}
    </button>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid min-w-[1.6em] place-items-center rounded-[3px] border border-rule-2 border-b-2 px-1 py-px font-mono text-[10px] leading-none text-ink-2">
      {children}
    </kbd>
  )
}

export function FileTag({ name, active }: { name: string; active?: boolean }) {
  const ext = (extOf(name) || 'file').slice(0, 4)
  const { color } = inkOf(name)
  return (
    <span
      className="inline-grid h-[18px] w-[38px] flex-none place-items-center rounded-[2px] border font-mono text-[9px] font-medium uppercase tracking-[0.08em] transition-colors"
      style={{ color, borderColor: `color-mix(in oklab, ${color} ${active ? 80 : 40}%, transparent)`, background: active ? `color-mix(in oklab, ${color} 14%, transparent)` : undefined }}
    >
      {ext}
    </span>
  )
}
