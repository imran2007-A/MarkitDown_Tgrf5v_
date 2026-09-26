// Adapted from Magic UI (MIT) — https://magicui.design/docs/components/blur-fade
import { motion, type MotionProps } from 'motion/react'
import type { ReactNode } from 'react'

interface Props extends MotionProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  offset?: number
  blur?: string
}

export function BlurFade({ children, className, delay = 0, duration = 0.5, offset = 10, blur = '8px', ...props }: Props) {
  return (
    <motion.div
      initial={{ y: offset, opacity: 0, filter: `blur(${blur})` }}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{ delay: 0.04 + delay, duration, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
