import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Check, CircleSlash, RotateCw, X } from 'lucide-react'
import type { Job } from '../lib/types'
import { formatBytes } from '../lib/formats'
import { formatTokens } from '../lib/tokens'
import { FileIcon } from './FileIcon'
import { Comet, cn, IconButton } from './ui'

interface Props {
  jobs: Job[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onRetry: (id: string) => void
}

export function JobList({ jobs, selectedId, onSelect, onRemove, onRetry }: Props) {
  return (
    <ul className="flex flex-col gap-1" role="listbox" aria-label="Files">
      <AnimatePresence initial={false}>
        {jobs.map((j) => {
          const selectable = j.status === 'done'
          const selected = j.id === selectedId
          return (
            <motion.li
              key={j.id}
              layout="position"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.18 }}
              role="option"
              aria-selected={selected}
              tabIndex={selectable ? 0 : -1}
              onClick={() => selectable && onSelect(j.id)}
              onKeyDown={(e) => { if (selectable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(j.id) } }}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl border px-2.5 py-2 transition-colors',
                selected ? 'border-violet/30 bg-violet/[0.07]' : 'border-transparent hover:bg-white/[0.035]',
                selectable ? 'cursor-pointer' : 'cursor-default',
                j.status === 'skipped' && 'opacity-50',
              )}
            >
              {selected && <span className="absolute inset-y-2 -left-px w-0.5 rounded-full bg-gradient-to-b from-violet to-cyan" aria-hidden />}
              <FileIcon name={j.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-fg/95" title={j.relPath}>{j.name}</p>
                <p className="truncate text-[11px] text-faint">
                  {j.status === 'converting' ? (
                    <span className="shimmer-text">{j.progress ?? 'Converting'}…</span>
                  ) : j.status === 'error' ? (
                    <span className="text-err/90">{j.error}</span>
                  ) : j.status === 'skipped' ? (
                    'Unsupported type · skipped'
                  ) : (
                    <>
                      {j.relPath !== j.name && <span>{j.relPath.slice(0, -j.name.length - 1)} · </span>}
                      {formatBytes(j.size)}
                      {j.tokens != null && <> · {formatTokens(j.tokens)} tokens</>}
                      {j.engine === 'native' && <span className="text-violet/80"> · native</span>}
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-none items-center">
                {j.status === 'converting' && <Comet size={16} />}
                {j.status === 'queued' && <span className="size-1.5 rounded-full bg-faint" title="Queued" />}
                {j.status === 'done' && <Check size={15} className="text-ok group-hover:hidden" />}
                {j.status === 'skipped' && <CircleSlash size={14} className="text-faint group-hover:hidden" />}
                {j.status === 'error' && (
                  <>
                    <AlertTriangle size={15} className="text-err group-hover:hidden" />
                    <IconButton label="Retry" className="hidden size-7 group-hover:inline-flex" onClick={(e) => { e.stopPropagation(); onRetry(j.id) }}>
                      <RotateCw size={13} />
                    </IconButton>
                  </>
                )}
                {j.status !== 'converting' && (
                  <IconButton label={`Remove ${j.name}`} className="hidden size-7 group-hover:inline-flex group-focus-within:inline-flex" onClick={(e) => { e.stopPropagation(); onRemove(j.id) }}>
                    <X size={14} />
                  </IconButton>
                )}
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
