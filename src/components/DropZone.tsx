import { useRef, useState, type DragEvent } from 'react'
import { FolderOpen, Files, ArrowDownToLine, Wand2 } from 'lucide-react'
import { cn, GhostButton, Kbd } from './ui'
import { FileIcon } from './FileIcon'
import { BorderBeam } from './magicui/BorderBeam'
import { Marquee } from './magicui/Marquee'

interface Props {
  compact?: boolean
  onFiles: (list: FileList) => void
  onDrop: (dt: DataTransfer) => void
  onSample?: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  folderInputRef: React.RefObject<HTMLInputElement | null>
}

const ROW_A = ['report.pdf', 'notes.docx', 'lecture.pptx', 'marks.xlsx', 'scan.png', 'data.csv', 'page.html', 'notebook.ipynb']
const ROW_B = ['app.py', 'index.tsx', 'main.go', 'config.json', 'Main.java', 'lib.rs', 'query.sql', 'archive.zip', ...(typeof window !== 'undefined' && window.mdify ? ['book.epub', 'mail.msg'] : [])]

function Pill({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-line bg-white/[0.025] py-1 pl-1 pr-3 text-xs text-muted">
      <span className="scale-75"><FileIcon name={name} size={15} /></span>
      <span className="-ml-1.5 font-mono">{name}</span>
    </span>
  )
}

export function DropZone({ compact, onFiles, onDrop, onSample, fileInputRef, folderInputRef }: Props) {
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
      <div className={cn('glow-inner relative flex flex-col items-center overflow-hidden text-center', compact ? 'gap-3 px-4 py-5' : 'gap-6 px-5 pb-8 pt-12 sm:px-8 sm:pt-14')}>
        {!over && <BorderBeam size={compact ? 70 : 160} duration={compact ? 7 : 9} />}
        {!over && !compact && <BorderBeam size={160} duration={9} delay={4.5} colorFrom="#22d3ee" colorTo="#a78bfa" />}
        {!compact && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(139_92_246/0.14),transparent)]" aria-hidden />
        )}

        {!compact && (
          <div className={cn('relative grid size-16 place-items-center rounded-2xl border border-line-strong bg-linear-to-b from-white/[0.09] to-white/[0.02] shadow-[0_8px_30px_-8px_rgb(139_92_246/0.5)] transition-transform duration-300', over && '-translate-y-1 scale-110')}>
            <ArrowDownToLine size={26} className={cn('text-violet transition-transform duration-300', over && 'translate-y-0.5')} strokeWidth={1.75} />
          </div>
        )}
        <div className="relative space-y-1.5">
          <p className={cn('font-semibold tracking-tight', compact ? 'text-sm' : 'text-lg sm:text-xl')}>
            {over ? 'Release to convert' : compact ? 'Drop more files or folders' : 'Drop files or folders here'}
          </p>
          {!compact && <p className="text-sm text-muted">Everything converts on your device. Nothing is uploaded.</p>}
        </div>
        <div className="relative flex flex-wrap items-center justify-center gap-2">
          <GhostButton onClick={() => fileInputRef.current?.click()} className={compact ? 'h-8 text-xs' : ''}>
            <Files size={15} /> Choose files
          </GhostButton>
          <GhostButton onClick={() => folderInputRef.current?.click()} className={compact ? 'h-8 text-xs' : ''}>
            <FolderOpen size={15} /> Choose folder
          </GhostButton>
          {!compact && onSample && (
            <button onClick={onSample} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-violet transition-colors hover:bg-violet/10">
              <Wand2 size={14} /> Try a sample
            </button>
          )}
        </div>
        {!compact && (
          <>
            <div className="relative w-full max-w-2xl [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]" aria-label="Supported formats">
              <Marquee pauseOnHover className="[--duration:38s]">{ROW_A.map((n) => <Pill key={n} name={n} />)}</Marquee>
              <Marquee pauseOnHover reverse className="[--duration:44s]">{ROW_B.map((n) => <Pill key={n} name={n} />)}</Marquee>
            </div>
            <p className="relative hidden items-center gap-1.5 text-xs text-faint sm:flex">
              <Kbd>Ctrl</Kbd><Kbd>O</Kbd> files <span className="mx-1">·</span> <Kbd>Ctrl</Kbd><Kbd>Shift</Kbd><Kbd>O</Kbd> folder <span className="mx-1">·</span> paste <span className="mx-1">·</span> <Kbd>?</Kbd> shortcuts
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
