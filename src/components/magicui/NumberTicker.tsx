// Adapted from Magic UI (MIT) — https://magicui.design/docs/components/number-ticker
import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring } from 'motion/react'
import { cn } from '../ui'

export function NumberTicker({ value, format = (n) => Math.round(n).toLocaleString('en-US'), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(value)
  const spring = useSpring(motionValue, { damping: 40, stiffness: 180 })

  useEffect(() => { motionValue.set(value) }, [motionValue, value])
  useEffect(() => spring.on('change', (v) => { if (ref.current) ref.current.textContent = format(v) }), [spring, format])

  return <span ref={ref} className={cn('inline-block tabular-nums', className)}>{format(value)}</span>
}
