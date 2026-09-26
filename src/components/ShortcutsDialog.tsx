import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Keyboard, X } from 'lucide-react'
import { IconButton, Kbd } from './ui'

const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

const GROUPS: { title: string; items: [string, string[]][] }[] = [
  { title: 'Add', items: [['Choose files', [mod, 'O']], ['Choose a folder', [mod, 'Shift', 'O']], ['Paste files', [mod, 'V']]] },
  { title: 'Output', items: [['Copy for AI', ['C']], ['Download .md', ['D']], ['Download .md', [mod, 'S']], ['Next / previous file', ['↓', '↑']]] },
  { title: 'General', items: [['History', [mod, 'H']], ['Show shortcuts', ['?']], ['Close panel', ['Esc']]] },
]

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="glass w-full max-w-md rounded-3xl bg-raised p-2 shadow-2xl shadow-black/60"
          >
            <header className="flex items-center gap-2 px-4 pb-2 pt-3">
              <Keyboard size={16} className="text-violet" />
              <h2 className="flex-1 text-sm font-semibold">Keyboard shortcuts</h2>
              <IconButton label="Close" onClick={onClose}><X size={16} /></IconButton>
            </header>
            <div className="space-y-1 px-2 pb-2">
              {GROUPS.map((g) => (
                <section key={g.title} className="rounded-2xl border border-line bg-black/20 p-3">
                  <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-faint">{g.title}</h3>
                  <ul className="space-y-2">
                    {g.items.map(([label, keys]) => (
                      <li key={label + keys.join()} className="flex items-center justify-between text-sm">
                        <span className="text-fg/85">{label}</span>
                        <span className="flex gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
