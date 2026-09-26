// Adapted from Magic UI (MIT) — https://magicui.design/docs/components/word-rotate
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../ui'

export function WordRotate({ words, duration = 2400, className }: { words: string[]; duration?: number; className?: string }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), duration)
    return () => clearInterval(id)
  }, [words, duration])

  return (
    <span className="relative inline-grid overflow-hidden pb-[0.12em] align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          className={cn('col-start-1 row-start-1', className)}
          initial={{ opacity: 0, y: '60%', filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: '0%', filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: '-60%', filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
