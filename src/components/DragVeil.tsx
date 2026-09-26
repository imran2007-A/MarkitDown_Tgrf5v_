import { AnimatePresence, motion } from 'motion/react'

const FAN = [
  { rotate: -11, x: -70, delay: 0.04 },
  { rotate: 8, x: 64, delay: 0.08 },
  { rotate: -1.5, x: 0, delay: 0 },
]

export function DragVeil({ active, count }: { active: boolean; count: number }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-desk/85 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.05 } }}
        >
          <div className="relative h-[300px] w-[230px]">
            {FAN.map((f, i) => (
              <motion.div
                key={i}
                className="sheet grain absolute inset-0 rounded-[2px]"
                initial={{ y: 160, rotate: 0, x: 0, opacity: 0 }}
                animate={{ y: 0, rotate: f.rotate, x: f.x, opacity: 1 }}
                exit={{ y: 40, scale: 0.6, opacity: 0, rotate: 0, x: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: f.delay }}
              >
                {i === FAN.length - 1 && (
                  <div className="flex h-full flex-col justify-between p-6">
                    <span className="label text-vermilion">Incoming</span>
                    <p className="font-serif text-[34px] italic leading-none text-ink">Let go.</p>
                    <span className="label text-pencil">{count > 0 ? `${count} ${count === 1 ? 'item' : 'items'}` : 'Files'} → Markdown</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
