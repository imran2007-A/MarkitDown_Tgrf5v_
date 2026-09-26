// Adapted from Magic UI (MIT) — https://magicui.design/docs/components/border-beam
import { motion, type MotionStyle } from 'motion/react'
import { cn } from '../ui'

interface Props {
  size?: number
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
  className?: string
  reverse?: boolean
  borderWidth?: number
}

export function BorderBeam({ className, size = 120, delay = 0, duration = 8, colorFrom = '#a78bfa', colorTo = '#22d3ee', reverse = false, borderWidth = 1 }: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
      style={{ '--border-beam-width': `${borderWidth}px` } as React.CSSProperties}
    >
      <motion.div
        className={cn('absolute aspect-square bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent', className)}
        style={{ width: size, offsetPath: `rect(0 auto auto 0 round ${size}px)`, '--color-from': colorFrom, '--color-to': colorTo } as MotionStyle}
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: reverse ? ['100%', '0%'] : ['0%', '100%'] }}
        transition={{ repeat: Infinity, ease: 'linear', duration, delay: -delay }}
      />
    </div>
  )
}
