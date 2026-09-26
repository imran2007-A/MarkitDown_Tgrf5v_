import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { OutFile } from '../lib/export'
import { canPickDirectory, downloadIndividually, downloadText, downloadZip, mergeWithToc, saveToFolder } from '../lib/export'
import { cn } from './ui'
import { useToast } from './Toaster'

export function ExportMenu({ files, name, onDone }: { files: OutFile[]; name: string; onDone: (label: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        const hit = itemsRef.current.find((it) => it.key === e.key.toUpperCase())
        if (hit && !e.ctrlKey && !e.metaKey) { e.preventDefault(); e.stopPropagation(); hit.action() }
        else if (e.key === 'Escape') setOpen(false)
      } else if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', close, true)
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', close, true) }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e' && files.length) { e.preventDefault(); setOpen((o) => !o) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [files.length])

  const run = async (fn: () => Promise<string | null>) => {
    setOpen(false)
    try {
      const label = await fn()
      if (label) onDone(label)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed', 'err')
    }
  }

  const n = files.length
  const itemsRef = useRef<{ key: string; action: () => void }[]>([])
  const items = [
    { key: 'M', title: 'One merged file', desc: 'With a table of contents. Best for AI chats.', action: () => run(async () => { downloadText(mergeWithToc(files, name), `${name}.md`); return 'Merged' }) },
    { key: 'Z', title: 'Zip archive', desc: 'Separate files, folder structure kept.', action: () => run(async () => { await downloadZip(files, name); return 'Zipped' }) },
    { key: 'I', title: 'Individual files', desc: `${n} separate downloads.`, action: () => run(async () => { await downloadIndividually(files); return 'Saved' }) },
    ...(canPickDirectory()
      ? [{ key: 'F', title: 'Into a folder…', desc: 'Write the .md files where you choose.', action: () => run(async () => { const r = await saveToFolder(files); return r ? 'Filed' : null }) }]
      : []),
  ]

  itemsRef.current = items

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!n}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'group flex h-10 w-full items-center justify-between rounded-[3px] border px-3.5 transition-colors disabled:opacity-40',
          open ? 'border-vermilion bg-vermilion/10' : 'border-rule-2 hover:border-ink-2',
        )}
      >
        <span className="font-serif text-[16px] italic text-ink">Export {n === 1 ? 'this file' : `all ${n} files`}</span>
        <span className="label flex items-center gap-2 text-pencil">
          ⌃E <span className={cn('inline-block transition-transform duration-300', open ? 'rotate-45 text-vermilion' : 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5')}>↗</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 14, rotate: -1.2, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, rotate: 0.8, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="sheet grain absolute bottom-full left-0 right-0 z-40 mb-2 origin-bottom-left rounded-[3px] py-1.5 lg:-right-8"
          >
            {items.map((it) => (
              <button
                key={it.key}
                role="menuitem"
                onClick={it.action}
                className="group grid w-full grid-cols-[22px_1fr] gap-x-2 px-3.5 py-2.5 text-left transition-colors hover:bg-paper-2"
              >
                <span className="label pt-1 text-faint group-hover:text-vermilion">{it.key}</span>
                <span>
                  <span className="block font-serif text-[16px] text-ink">{it.title}</span>
                  <span className="block font-mono text-[10.5px] text-pencil">{it.desc}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
