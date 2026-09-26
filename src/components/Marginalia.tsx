import { useMemo } from 'react'
import type { Job } from '../lib/types'
import { docStats, outline } from '../lib/stats'
import { formatBytes } from '../lib/formats'
import { inkOf } from '../lib/ink'

function scrollToHeading(i: number) {
  const el = document.querySelector(`#sheet-scroll [data-h="${i}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el?.animate([{ color: 'var(--color-vermilion)' }, { color: '' }], { duration: 1400, easing: 'ease-out' })
}

export function Marginalia({ job, tokens, words }: { job: Job; tokens: number; words: number }) {
  const md = job.markdown ?? ''
  const items = useMemo(() => outline(md), [md])
  const stats = useMemo(() => docStats(md), [md])
  const ink = inkOf(job.name)
  const outBytes = new Blob([md]).size
  const saved = job.size > 0 && !job.restored ? Math.round((1 - outBytes / job.size) * 100) : null

  const facts: [string, string][] = [
    ['Source', `${ink.label} · ${job.restored ? 'archived' : formatBytes(job.size)}`],
    ['Markdown', formatBytes(outBytes) + (saved !== null && saved > 0 ? ` · ${saved}% lighter` : '')],
    ['Tokens', tokens.toLocaleString()],
    ['Words', words.toLocaleString()],
    ['Headings', String(stats.headings)],
    ['Tables', String(stats.tables)],
    ['Code blocks', String(stats.codeBlocks)],
    ['Links', String(stats.links)],
    ...(job.ms ? ([['Converted in', job.ms < 1000 ? `${Math.round(job.ms)} ms` : `${(job.ms / 1000).toFixed(1)} s`]] as [string, string][]) : []),
    ['Engine', job.restored ? '—' : job.engine === 'native' ? 'MarkItDown' : 'On-device'],
  ]

  return (
    <aside className="sticky top-10 w-[230px] space-y-10 self-start max-2xl:hidden" aria-label="Margin notes">
      {items.length > 1 && (
        <section>
          <h3 className="label mb-3 flex items-center gap-2 text-pencil">
            <span className="h-px w-4" style={{ background: ink.color }} /> Contents
          </h3>
          <ol className="max-h-[42vh] space-y-1.5 overflow-y-auto pr-2">
            {items.map((it, i) => (
              <li key={i} style={{ paddingLeft: (it.level - 1) * 12 }}>
                <button onClick={() => scrollToHeading(i)} className="text-left font-serif text-[14.5px] leading-snug text-ink-2 transition-colors hover:text-ink">
                  {it.text}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section>
        <h3 className="label mb-3 flex items-center gap-2 text-pencil">
          <span className="h-px w-4" style={{ background: ink.color }} /> Facts
        </h3>
        <dl className="divide-y divide-rule border-y border-rule">
          {facts.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 py-1.5">
              <dt className="font-mono text-[10.5px] text-faint">{k}</dt>
              <dd className="text-right font-mono text-[11px] tabular-nums text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </aside>
  )
}
