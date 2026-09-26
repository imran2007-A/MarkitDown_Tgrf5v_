import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Columns2, Download, Eye, PencilLine, FileText } from 'lucide-react'
import type { Job } from '../lib/types'
import { countTokens, CONTEXT_WINDOWS, formatTokens } from '../lib/tokens'
import { downloadText, mdPath } from '../lib/export'
import { cn, GhostButton, SparkleButton } from './ui'
import { useToast } from './Toaster'

const Editor = lazy(() => import('./Editor'))

type View = 'preview' | 'edit' | 'split'

interface Props {
  job: Job
  onEdit: (id: string, markdown: string) => void
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function Preview({ markdown }: { markdown: string }) {
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(markdown, { async: false, gfm: true }) as string), [markdown])
  return <article className="md-preview mx-auto max-w-3xl px-5 py-6 sm:px-8" dangerouslySetInnerHTML={{ __html: html }} />
}

function TokenMeter({ tokens }: { tokens: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs tabular-nums text-fg/90">{formatTokens(tokens)}</span>
      <span className="text-xs text-faint">tokens</span>
      <div className="hidden items-center gap-1 md:flex">
        {CONTEXT_WINDOWS.map((c) => {
          const fits = tokens <= c.tokens
          return (
            <span
              key={c.name}
              title={`${c.name}: ${formatTokens(c.tokens)} context — ${fits ? 'fits' : 'too long'}`}
              className={cn('rounded-md border px-1.5 py-0.5 text-[10px]', fits ? 'border-ok/20 bg-ok/[0.07] text-ok/90' : 'border-err/20 bg-err/[0.07] text-err/90')}
            >
              {c.name.split(' ')[0]}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function OutputPanel({ job, onEdit }: Props) {
  const [view, setView] = useState<View>(() => (window.innerWidth >= 1280 ? 'split' : 'preview'))
  const markdown = job.markdown ?? ''
  const debounced = useDebounced(markdown, 200)
  const [tokens, setTokens] = useState(job.tokens ?? 0)
  const toast = useToast()

  useEffect(() => {
    let alive = true
    countTokens(debounced).then((n) => alive && setTokens(n))
    return () => { alive = false }
  }, [debounced])

  const words = useMemo(() => (debounced.match(/\S+/g) ?? []).length, [debounced])

  const copyForAI = async () => {
    const wrapped = `<document path="${job.relPath}">\n${markdown}\n</document>`
    await navigator.clipboard.writeText(wrapped)
    toast(`Copied ${formatTokens(tokens)} tokens — paste into any AI chat`)
  }

  const views: { id: View; label: string; Icon: typeof Eye }[] = [
    { id: 'preview', label: 'Preview', Icon: Eye },
    { id: 'edit', label: 'Edit', Icon: PencilLine },
    { id: 'split', label: 'Split', Icon: Columns2 },
  ]

  return (
    <section className="glass flex h-full min-h-[60vh] flex-col overflow-hidden rounded-3xl lg:min-h-0" aria-label="Output">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FileText size={15} className="flex-none text-violet" />
          <h2 className="truncate text-sm font-medium" title={job.relPath}>{mdPath(job.name)}</h2>
        </div>
        <div className="flex items-center rounded-xl border border-line bg-black/20 p-0.5" role="tablist">
          {views.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={cn(
                'h-7 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium transition-colors',
                view === id ? 'bg-white/[0.09] text-fg shadow-sm' : 'text-muted hover:text-fg',
                id === 'split' ? 'hidden xl:inline-flex' : 'inline-flex',
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className={cn('absolute inset-0 grid', view === 'split' ? 'grid-cols-2 divide-x divide-line' : 'grid-cols-1')}>
          {view !== 'preview' && (
            <div className="min-h-0 overflow-hidden">
              <Suspense fallback={<div className="p-6 text-sm text-faint">Loading editor…</div>}>
                <Editor value={markdown} onChange={(v) => onEdit(job.id, v)} />
              </Suspense>
            </div>
          )}
          {view !== 'edit' && (
            <div className="min-h-0 overflow-y-auto">
              <Preview markdown={debounced} />
            </div>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
        <TokenMeter tokens={tokens} />
        <span className="hidden text-xs text-faint sm:inline">· {words.toLocaleString()} words</span>
        <div className="ml-auto flex items-center gap-2">
          <GhostButton onClick={() => downloadText(markdown, mdPath(job.name))} aria-label="Download .md">
            <Download size={14} /> <span className="hidden sm:inline">Download</span>
          </GhostButton>
          <SparkleButton onClick={copyForAI}>Copy for AI</SparkleButton>
        </div>
      </footer>
    </section>
  )
}
