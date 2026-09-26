import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { IconButton, Kbd } from './ui'

const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

const GROUPS: { title: string; items: [string, string[]][] }[] = [
  { title: 'Add', items: [['Choose files', [mod, 'O']], ['Choose a folder', [mod, 'Shift', 'O']], ['Paste files', [mod, 'V']]] },
  { title: 'Output', items: [['Copy for AI', ['C']], ['Save .md', ['D']], ['Read · source · compare', ['Tab']], ['Export all', [mod, 'E']], ['Next / previous page', ['↓', '↑']]] },
  { title: 'General', items: [['Find anything', [mod, 'K']], ['Archive', [mod, 'H']], ['This sheet', ['?']], ['Close', ['Esc']]] },
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
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-desk/80 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 60, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -0.6 }}
            exit={{ opacity: 0, y: 30, rotate: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="sheet grain w-full max-w-md rounded-[2px] px-8 pb-8 pt-7"
          >
            <header className="flex items-start gap-2 pb-4">
              <h2 className="flex-1 font-serif text-[28px] italic leading-none text-ink">Shortcuts</h2>
              <IconButton label="Close" onClick={onClose}><X size={16} /></IconButton>
            </header>
            <div className="space-y-6">
              {GROUPS.map((g) => (
                <section key={g.title}>
                  <h3 className="label mb-2 border-b border-rule pb-1.5 text-vermilion">{g.title}</h3>
                  <ul className="space-y-2">
                    {g.items.map(([label, keys]) => (
                      <li key={label + keys.join()} className="flex items-center justify-between font-serif text-[16px]">
                        <span className="text-ink-2">{label}</span>
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
