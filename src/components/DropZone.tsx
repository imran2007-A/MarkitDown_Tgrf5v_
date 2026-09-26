import { useRef, useState, type DragEvent } from 'react'
import { FolderOpen, Files, ArrowDownToLine } from 'lucide-react'
import { DESKTOP_FORMAT_GROUPS, FORMAT_GROUPS } from '../lib/formats'
import { cn, GhostButton, Kbd } from './ui'

interface Props {
  compact?: boolean
  onFiles: (list: FileList) => void
  onDrop: (dt: DataTransfer) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  folderInputRef: React.RefObject<HTMLInputElement | null>
}

export function DropZone({ compact, onFiles, onDrop, fileInputRef, folderInputRef }: Props) {
  const [over, setOver] = useState(false)
  const depth = useRef(0)

  const handlers = {
    onDragEnter: (e: DragEvent) => { e.preventDefault(); depth.current++; setOver(true) },
    onDragLeave: (e: DragEvent) => { e.preventDefault(); if (--depth.current <= 0) { depth.current = 0; setOver(false) } },
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDrop: (e: DragEvent) => { e.preventDefault(); depth.current = 0; setOver(false); onDrop(e.dataTransfer) },
  }

  return (
    <div className="glow-frame" data-active={over} {...handlers}>
      <div className="glow-bg blur" aria-hidden />
      <div className="glow-bg" aria-hidden />
      <div className={cn('glow-inner flex flex-col items-center text-center', compact ? 'gap-3 px-4 py-5' : 'gap-6 px-6 py-12 sm:py-16')}>
        {!compact && (
          <div className={cn('relative grid size-16 place-items-center rounded-2xl border border-line-strong bg-gradient-to-b from-white/[0.08] to-white/[0.02] transition-transform duration-300', over && 'scale-110')}>
            <ArrowDownToLine size={26} className="text-violet" strokeWidth={1.75} />
            <span className="absolute -inset-px rounded-2xl bg-gradient-to-b from-violet/20 to-transparent opacity-60 blur-md" aria-hidden />
          </div>
        )}
        <div className="space-y-1.5">
          <p className={cn('font-semibold tracking-tight', compact ? 'text-sm' : 'text-lg sm:text-xl')}>
            {over ? 'Release to convert' : compact ? 'Drop more files or folders' : 'Drop files or folders here'}
          </p>
          {!compact && <p className="text-sm text-muted">Everything converts on your device. Nothing is uploaded.</p>}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <GhostButton onClick={() => fileInputRef.current?.click()} className={compact ? 'h-8 text-xs' : ''}>
            <Files size={15} /> Choose files
          </GhostButton>
          <GhostButton onClick={() => folderInputRef.current?.click()} className={compact ? 'h-8 text-xs' : ''}>
            <FolderOpen size={15} /> Choose folder
          </GhostButton>
        </div>
        {!compact && (
          <>
            <div className="flex max-w-xl flex-wrap justify-center gap-1.5">
              {[...FORMAT_GROUPS, ...(window.mdify ? DESKTOP_FORMAT_GROUPS : [])].map((g) => (
                <span key={g.label} className="rounded-full border border-line bg-white/[0.02] px-2.5 py-1 text-[11px] text-muted" title={g.exts}>
                  <span className="text-fg/80">{g.label}</span> <span className="text-faint">· {g.exts}</span>
                </span>
              ))}
            </div>
            <p className="hidden items-center gap-1.5 text-xs text-faint sm:flex">
              <Kbd>Ctrl</Kbd><Kbd>O</Kbd> files <span className="mx-1">·</span> <Kbd>Ctrl</Kbd><Kbd>Shift</Kbd><Kbd>O</Kbd> folder <span className="mx-1">·</span> or paste
            </p>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = '' }} />
      <input
        ref={folderInputRef}
        type="file"
        hidden
        {...({ webkitdirectory: '', directory: '' } as object)}
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
