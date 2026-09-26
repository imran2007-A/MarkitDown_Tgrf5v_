// Adapted from Magic UI (MIT) — https://magicui.design/docs/components/magic-card
import { useCallback, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'motion/react'
import { cn } from '../ui'

interface Props {
  children?: ReactNode
  className?: string
  gradientSize?: number
  gradientColor?: string
  gradientOpacity?: number
  gradientFrom?: string
  gradientTo?: string
}

export function MagicCard({
  children,
  className,
  gradientSize = 220,
  gradientColor = 'rgb(139 92 246 / 0.12)',
  gradientOpacity = 1,
  gradientFrom = '#a78bfa',
  gradientTo = '#22d3ee',
}: Props) {
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - r.left)
    mouseY.set(e.clientY - r.top)
  }, [mouseX, mouseY])

  const onLeave = useCallback(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [mouseX, mouseY, gradientSize])

  const border = useMotionTemplate`
    linear-gradient(var(--color-surface) 0 0) padding-box,
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, var(--color-line-strong) 100%) border-box`
  const spot = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ background: border }}
      className={cn('group relative isolate overflow-hidden rounded-2xl border border-transparent', className)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-px z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spot, opacity: gradientOpacity }}
      />
      <div className="relative z-20">{children}</div>
    </motion.div>
  )
}
