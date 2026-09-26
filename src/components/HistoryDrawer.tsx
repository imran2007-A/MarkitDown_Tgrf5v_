import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import type { HistoryEntry } from '../lib/types'
import { clearHistory, listHistory, removeHistory } from '../lib/history'
import { formatTokens } from '../lib/tokens'
import { IconButton, TextButton } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  onRestore: (entry: HistoryEntry) => void
}

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

export function HistoryDrawer({ open, onClose, onRestore }: Props) {
  const [items, setItems] = useState<HistoryEntry[]>([])

  useEffect(() => {
    if (open) listHistory().then(setItems)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-desk/70 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label="Archive"
            initial={{ x: '105%', rotate: 2 }}
            animate={{ x: 0, rotate: 0 }}
            exit={{ x: '105%', rotate: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="sheet grain fixed inset-y-3 right-3 z-50 flex w-[calc(100%-1.5rem)] max-w-[400px] origin-top-right flex-col rounded-[2px]"
          >
            <header className="flex items-start px-7 pb-4 pt-7">
              <div className="flex-1">
                <p className="label text-vermilion">Archive</p>
                <h2 className="mt-2 font-serif text-[30px] italic leading-none text-ink">Earlier pages</h2>
              </div>
              <IconButton label="Close" onClick={onClose}><X size={16} /></IconButton>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-3">
              {items.length === 0 ? (
                <p className="px-4 pt-10 font-serif text-[17px] italic text-pencil">Nothing filed yet. Converted pages land here, on this device only.</p>
              ) : (
                <ul>
                  {items.map((h, i) => (
                    <motion.li
                      key={h.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.03 }}
                      className="group flex items-center gap-2 border-b border-rule px-4 py-3.5 last:border-0"
                    >
                      <button className="min-w-0 flex-1 text-left" onClick={() => { onRestore(h); onClose() }}>
                        <p className="truncate font-serif text-[17px] text-ink-2 transition-colors group-hover:text-ink">{h.title}</p>
                        <p className="mt-0.5 font-mono text-[10.5px] text-faint">
                          {timeAgo(h.createdAt)} · {h.fileCount} {h.fileCount === 1 ? 'file' : 'files'} · {formatTokens(h.tokens)} tok
                        </p>
                      </button>
                      <IconButton label="Delete" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={async () => { await removeHistory(h.id); setItems((x) => x.filter((it) => it.id !== h.id)) }}>
                        <X size={14} />
                      </IconButton>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <footer className="border-t border-rule px-7 py-4">
                <TextButton className="hover:text-vermilion" onClick={async () => { await clearHistory(); setItems([]) }}>Burn the archive</TextButton>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
