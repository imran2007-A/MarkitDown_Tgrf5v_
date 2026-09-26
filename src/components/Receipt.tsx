import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { SaveReceipt } from '../lib/export'
import { Kbd } from './ui'

interface Props {
  receipt: (SaveReceipt & { verb: string }) | null
  onClose: () => void
  onNewBatch: () => void
}

export function Receipt({ receipt, onClose, onNewBatch }: Props) {
  const primary = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!receipt) return
    setTimeout(() => primary.current?.focus(), 80)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [receipt, onClose])

  return (
    <AnimatePresence>
      {receipt && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-desk/70 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ y: 120, rotate: 4, opacity: 0 }}
            animate={{ y: 0, rotate: -1, opacity: 1 }}
            exit={{ y: 60, rotate: 2, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 230, damping: 21 }}
            className="sheet grain relative w-full max-w-[440px] rounded-[2px] px-8 pb-7 pt-8"
            style={{ boxShadow: 'inset 3px 0 0 0 var(--color-sage)' }}
          >
            <motion.span
              aria-hidden
              initial={{ scale: 2.2, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: -10, opacity: 0.9 }}
              transition={{ type: 'spring', stiffness: 600, damping: 22, delay: 0.25 }}
              className="absolute right-6 top-6 rounded-[3px] border-[3px] border-double border-sage px-2.5 py-0.5 font-mono text-[13px] font-semibold uppercase tracking-[0.2em] text-sage"
            >
              {receipt.verb}
            </motion.span>
            <p className="label text-sage">Receipt</p>
            <h2 id="receipt-title" className="mt-3 pr-24 font-serif text-[30px] italic leading-[1.1] text-ink">
              {receipt.count === 1 ? 'Your page is saved.' : `${receipt.count} pages are saved.`}
            </h2>
            <dl className="mt-6 space-y-3 border-y border-rule py-4">
              <div>
                <dt className="label text-faint">File</dt>
                <dd className="mt-1 break-all font-serif text-[16px] text-ink-2">{receipt.title}</dd>
              </div>
              <div>
                <dt className="label text-faint">Saved to</dt>
                <dd className="mt-1 break-all font-mono text-[12px] leading-relaxed text-ink-2">{receipt.where}</dd>
              </div>
            </dl>
            <div className="mt-6 space-y-2">
              <button
                ref={primary}
                onClick={onNewBatch}
                className="group flex h-11 w-full items-center justify-between rounded-[3px] border border-ink-2 bg-ink px-4 text-desk transition-colors hover:bg-white"
              >
                <span className="font-serif text-[17px] italic">Back to the desk</span>
                <span className="label opacity-60">↵ new batch</span>
              </button>
              <div className="flex gap-2">
                {receipt.path && (
                  <button
                    onClick={() => window.mdify?.revealInFolder(receipt.path!)}
                    className="h-10 flex-1 rounded-[3px] border border-rule-2 font-serif text-[15px] text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
                  >
                    Show in folder
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="h-10 flex-1 rounded-[3px] border border-rule-2 font-serif text-[15px] text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
                >
                  Keep working
                </button>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 font-mono text-[10.5px] text-faint">
              Your pages stay in the Archive <Kbd>Ctrl</Kbd><Kbd>H</Kbd>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
