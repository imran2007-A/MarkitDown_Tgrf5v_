// Adapted from Magic UI (MIT) — https://magicui.design/docs/components/marquee
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../ui'

interface Props extends ComponentPropsWithoutRef<'div'> {
  reverse?: boolean
  pauseOnHover?: boolean
  repeat?: number
  children: ReactNode
}

export function Marquee({ className, reverse = false, pauseOnHover = false, repeat = 4, children, ...props }: Props) {
  return (
    <div {...props} className={cn('group flex gap-(--gap) overflow-hidden p-1 [--duration:40s] [--gap:0.5rem]', className)}>
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          className={cn(
            'animate-marquee flex shrink-0 flex-row justify-around gap-(--gap)',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
            reverse && '[animation-direction:reverse]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
