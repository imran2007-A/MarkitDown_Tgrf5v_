import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Clock, Trash2, X, History as HistoryIcon } from 'lucide-react'
import type { HistoryEntry } from '../lib/types'
import { clearHistory, listHistory, removeHistory } from '../lib/history'
import { formatTokens } from '../lib/tokens'
import { GhostButton, IconButton } from './ui'

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
          <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label="History"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-line bg-surface/95 backdrop-blur-xl"
          >
            <header className="flex items-center gap-2 border-b border-line px-5 py-4">
              <HistoryIcon size={16} className="text-violet" />
              <h2 className="flex-1 text-sm font-semibold">History</h2>
              <IconButton label="Close" onClick={onClose}><X size={16} /></IconButton>
            </header>
            <div className="flex-1 overflow-y-auto p-3">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted">
                  <Clock size={22} className="text-faint" />
                  Your conversions will appear here.
                  <span className="text-xs text-faint">Stored only on this device.</span>
                </div>
              ) : (
                <ul className="space-y-1">
                  {items.map((h) => (
                    <li key={h.id} className="group flex items-center gap-2 rounded-xl border border-transparent p-2.5 transition-colors hover:border-line hover:bg-white/[0.03]">
                      <button className="min-w-0 flex-1 text-left" onClick={() => { onRestore(h); onClose() }}>
                        <p className="truncate text-sm font-medium">{h.title}</p>
                        <p className="text-xs text-faint">
                          {timeAgo(h.createdAt)} · {h.fileCount} {h.fileCount === 1 ? 'file' : 'files'} · {formatTokens(h.tokens)} tokens
                        </p>
                      </button>
                      <IconButton label="Delete" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={async () => { await removeHistory(h.id); setItems((x) => x.filter((i) => i.id !== h.id)) }}>
                        <Trash2 size={14} />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <footer className="border-t border-line p-3">
                <GhostButton className="w-full justify-center text-err/90" onClick={async () => { await clearHistory(); setItems([]) }}>
                  <Trash2 size={14} /> Clear all
                </GhostButton>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
