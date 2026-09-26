import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Files, FileStack, FolderDown, FolderArchive } from 'lucide-react'
import type { OutFile } from '../lib/export'
import { canPickDirectory, downloadIndividually, downloadText, downloadZip, mergeWithToc, saveToFolder } from '../lib/export'
import { GalaxyButton, cn } from './ui'
import { useToast } from './Toaster'

export function ExportMenu({ files, name }: { files: OutFile[]; name: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', close)
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', close) }
  }, [open])

  const run = async (fn: () => Promise<string | null>) => {
    setOpen(false)
    try {
      const msg = await fn()
      if (msg) toast(msg)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed', 'err')
    }
  }

  const items = [
    {
      Icon: FileStack, title: 'One merged .md', desc: 'Single file with table of contents — best for AI chats',
      action: () => run(async () => { downloadText(mergeWithToc(files, name), `${name}.md`); return 'Merged file downloaded' }),
    },
    {
      Icon: FolderArchive, title: 'Zip archive', desc: 'Separate .md files, folder structure kept',
      action: () => run(async () => { await downloadZip(files, name); return 'Zip downloaded' }),
    },
    {
      Icon: Files, title: 'Individual files', desc: `${files.length} separate downloads`,
      action: () => run(async () => { await downloadIndividually(files); return `${files.length} files downloaded` }),
    },
    ...(canPickDirectory()
      ? [{
          Icon: FolderDown, title: 'Save to folder…', desc: 'Write .md files into a folder you choose',
          action: () => run(async () => { const r = await saveToFolder(files); return r ? `Saved ${r.written} files to ${r.where}` : null }),
        }]
      : []),
  ]

  return (
    <div ref={ref} className="relative">
      <GalaxyButton onClick={() => setOpen((o) => !o)} disabled={!files.length} aria-haspopup="menu" aria-expanded={open}>
        Export {files.length} {files.length === 1 ? 'file' : 'files'} <ChevronDown size={15} className={cn('transition-transform', open && 'rotate-180')} />
      </GalaxyButton>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="glass absolute bottom-full right-0 z-40 mb-3 w-80 origin-bottom-right rounded-2xl bg-raised p-1.5 shadow-2xl shadow-black/60"
          >
            {items.map(({ Icon, title, desc, action }) => (
              <button key={title} role="menuitem" onClick={action} className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06]">
                <span className="mt-0.5 grid size-8 flex-none place-items-center rounded-lg border border-line bg-gradient-to-b from-violet/15 to-cyan/5">
                  <Icon size={15} className="text-violet" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-xs text-muted">{desc}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
