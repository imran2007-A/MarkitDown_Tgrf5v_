import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function GalaxyButton({ children, busy, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button {...rest} data-busy={busy} className={cn('galaxy-btn', className)}>
      <span className="gb-inner">
        <span className="gb-label">{children}</span>
        <span className="gb-sizer" aria-hidden>{children}</span>
        <span className="gb-blur" aria-hidden />
      </span>
    </button>
  )
}

export function SparkleButton({ children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={cn('sparkle-btn', className)}>
      <span className="spark" aria-hidden />
      <span className="backdrop" aria-hidden />
      <svg className="sparkle size-[1.1em]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M14.187 8.096L15 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L21.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09L15 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L8.25 12l2.846-.813a4.5 4.5 0 003.09-3.09z" />
        <path d="M6 14.25l-.259 1.035a3.375 3.375 0 01-2.456 2.456L2.25 18l1.035.259a3.375 3.375 0 012.456 2.456L6 21.75l.259-1.035a3.375 3.375 0 012.456-2.456L9.75 18l-1.035-.259a3.375 3.375 0 01-2.456-2.456z" />
        <path d="M6.5 4l-.197.592a1.125 1.125 0 01-.712.711L5 5.5l.591.197c.336.112.6.376.712.712L6.5 7l.197-.591a1.125 1.125 0 01.712-.712L8 5.5l-.591-.197a1.125 1.125 0 01-.712-.711z" />
      </svg>
      <span>{children}</span>
    </button>
  )
}

export function Comet({ size = 16 }: { size?: number }) {
  return (
    <span className="comet" style={{ ['--size' as string]: `${size}px` }} role="status" aria-label="Converting">
      <i />
    </span>
  )
}

export function IconButton({ label, children, className, active, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-white/[0.08] text-fg',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3.5 text-sm font-medium text-fg/90 transition-all hover:border-line-strong hover:bg-white/[0.06] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted">{children}</kbd>
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'violet' | 'ok' | 'warn' | 'err' }) {
  const tones = {
    default: 'border-line text-muted bg-white/[0.03]',
    violet: 'border-violet/25 text-violet bg-violet/10',
    ok: 'border-ok/25 text-ok bg-ok/10',
    warn: 'border-warn/25 text-warn bg-warn/10',
    err: 'border-err/25 text-err bg-err/10',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', tones[tone])}>{children}</span>
}
