import { AnimatePresence, motion } from 'motion/react'

const INK_MASK = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='1 1 1 0.35 1 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function Stamp({ stamp }: { stamp: { id: number; label: string } | null }) {
  return (
    <div className="pointer-events-none absolute right-[8%] top-20 z-30" aria-live="polite">
      <AnimatePresence>
        {stamp && (
          <motion.div
            key={stamp.id}
            initial={{ scale: 2.4, rotate: -16, opacity: 0 }}
            animate={{ scale: 1, rotate: -9, opacity: 0.92 }}
            exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.5 } }}
            transition={{ type: 'spring', stiffness: 700, damping: 26, mass: 0.7 }}
            className="rounded-[3px] border-[3px] border-double border-vermilion px-4 py-1.5 font-mono text-[22px] font-semibold uppercase tracking-[0.22em] text-vermilion"
            style={{ maskImage: INK_MASK, WebkitMaskImage: INK_MASK }}
          >
            {stamp.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
