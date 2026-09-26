// Adapted from Magic UI (MIT) — https://magicui.design/docs/components/animated-shiny-text
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../ui'

export function ShinyText({ children, className, shimmerWidth = 90 }: { children: ReactNode; className?: string; shimmerWidth?: number }) {
  return (
    <span
      style={{ '--shiny-width': `${shimmerWidth}px` } as CSSProperties}
      className={cn(
        'animate-shiny-text bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat',
        'bg-linear-to-r from-transparent via-white/90 via-50% to-transparent',
        className,
      )}
    >
      {children}
    </span>
  )
}
