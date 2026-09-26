import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { Job } from '../lib/types'
import { kindOf } from '../lib/formats'

const MAX_PDF_PAGES = 24
const MAX_TEXT = 200_000

function PdfPages({ file }: { file: File }) {
  const host = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Rendering pages…')
  useEffect(() => {
    let cancelled = false
    const el = host.current!
    el.innerHTML = ''
    import('../lib/convert/pdf').then(({ renderPdfPages }) =>
      renderPdfPages(file, MAX_PDF_PAGES, (canvas, n, total) => {
        canvas.className = 'orig-page'
        canvas.setAttribute('aria-label', `Page ${n}`)
        el.appendChild(canvas)
        setStatus(n === Math.min(total, MAX_PDF_PAGES) ? (total > MAX_PDF_PAGES ? `First ${MAX_PDF_PAGES} of ${total} pages` : `${total} ${total === 1 ? 'page' : 'pages'}`) : `Page ${n} of ${total}…`)
      }, () => cancelled),
    ).catch(() => setStatus('This PDF could not be previewed'))
    return () => { cancelled = true }
  }, [file])
  return (
    <>
      <p className="label mb-3 text-pencil">{status}</p>
      <div ref={host} className="space-y-4" />
    </>
  )
}

function ImageView({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <img src={url} alt={file.name} className="orig-page w-full" />
}

function AsyncHtml({ load, className }: { load: () => Promise<string>; className: string }) {
  const [html, setHtml] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    load().then((h) => alive && setHtml(DOMPurify.sanitize(h))).catch(() => alive && setHtml('<p>Preview unavailable.</p>'))
    return () => { alive = false }
  }, [load])
  if (html === null) return <p className="label text-pencil">Opening original…</p>
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

function Slides({ markdown }: { markdown: string }) {
  const slides = markdown.split(/\n---\n/).filter((s) => s.trim())
  return (
    <div className="space-y-4">
      {slides.map((s, i) => (
        <div key={i} className="orig-slide">
          <span className="orig-slide-no">{String(i + 1).padStart(2, '0')}</span>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(s.replace(/^## Slide \d+:?\s*/m, '## '), { async: false }) as string) }} />
        </div>
      ))}
    </div>
  )
}

function RawText({ file }: { file: File }) {
  const [text, setText] = useState('')
  useEffect(() => { file.text().then((t) => setText(t.length > MAX_TEXT ? t.slice(0, MAX_TEXT) + '\n…' : t)) }, [file])
  return <pre className="orig-raw">{text}</pre>
}

export function OriginalView({ job }: { job: Job }) {
  const kind = kindOf(job.name)
  const file = job.file
  const docx = useMemo(() => async () => (await (await import('mammoth')).convertToHtml({ arrayBuffer: await file.arrayBuffer() })).value, [file])
  const sheet = useMemo(() => async () => {
    const XLSX = await import('xlsx')
    const text = /\.(csv|tsv)$/i.test(file.name)
    const wb = text ? XLSX.read(await file.text(), { type: 'string' }) : XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' })
    return wb.SheetNames.map((n) => `<h4>${n.replace(/</g, '&lt;')}</h4>${XLSX.utils.sheet_to_html(wb.Sheets[n], { header: '', footer: '' })}`).join('')
  }, [file])

  if (job.restored) return <p className="orig-empty">The original isn't kept in the archive, only the Markdown.</p>

  switch (kind) {
    case 'pdf': return <PdfPages file={file} />
    case 'image': return <ImageView file={file} />
    case 'docx': return <div className="orig-paper"><AsyncHtml load={docx} className="orig-doc" /></div>
    case 'sheet': return <div className="orig-paper"><AsyncHtml load={sheet} className="orig-sheet" /></div>
    case 'pptx': return <Slides markdown={job.markdown ?? ''} />
    case 'html': return <HtmlFrame file={file} />
    case 'code': case 'data': case 'text': return <RawText file={file} />
    default: return <p className="orig-empty">No visual preview for this kind of file.</p>
  }
}

function HtmlFrame({ file }: { file: File }) {
  const [src, setSrc] = useState('')
  useEffect(() => { file.text().then(setSrc) }, [file])
  return <iframe title={file.name} sandbox="" srcDoc={src} className="orig-page h-[75vh] w-full bg-white" />
}
