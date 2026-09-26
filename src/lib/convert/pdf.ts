import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { ocrImage } from './ocr'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

interface Line { y: number; x: number; h: number; text: string }

const BULLET = /^[•◦▪▫●○■□‣⁃∙·\-–]\s*/
const NUMBERED = /^(\d{1,3}|[a-zA-Z])[.)]\s+/

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

function toLines(items: TextItem[]): Line[] {
  const lines: Line[] = []
  const sorted = items
    .filter((i) => i.str.trim() || i.hasEOL)
    .map((i) => ({ x: i.transform[4], y: i.transform[5], h: Math.abs(i.transform[3]) || i.height, str: i.str, w: i.width }))
    .sort((a, b) => b.y - a.y || a.x - b.x)

  for (const it of sorted) {
    if (!it.str.trim()) continue
    const last = lines[lines.length - 1]
    if (last && Math.abs(last.y - it.y) < Math.max(2, it.h * 0.45)) {
      last.text += (last.text.endsWith(' ') || it.str.startsWith(' ') ? '' : ' ') + it.str
      last.h = Math.max(last.h, it.h)
      last.x = Math.min(last.x, it.x)
    } else {
      lines.push({ y: it.y, x: it.x, h: it.h, text: it.str })
    }
  }
  return lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text)
}

function linesToMarkdown(lines: Line[], bodySize: number): string {
  const out: string[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) out.push(para.join(' ').replace(/(\w)- (\w)/g, '$1$2'))
    para = []
  }
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const prev = lines[i - 1]
    const gap = prev ? prev.y - l.y : 0
    const ratio = bodySize ? l.h / bodySize : 1
    const shortLine = l.text.length < 90

    if (ratio >= 1.6 && shortLine) { flush(); out.push(`# ${l.text}`); continue }
    if (ratio >= 1.25 && shortLine) { flush(); out.push(`## ${l.text}`); continue }
    if (ratio >= 1.08 && shortLine && /[A-Za-z]/.test(l.text) && !/[.,;]$/.test(l.text)) { flush(); out.push(`### ${l.text}`); continue }

    if (BULLET.test(l.text)) { flush(); out.push(`- ${l.text.replace(BULLET, '')}`); continue }
    if (NUMBERED.test(l.text) && l.text.length < 200) { flush(); out.push(l.text.replace(NUMBERED, (m) => `${m.trim().replace(')', '.')} `)); continue }

    const lastOut = out[out.length - 1]
    if (!para.length && lastOut?.startsWith('- ') && gap > 0 && gap < l.h * 1.6 && l.x > (prev?.x ?? 0) + 4) {
      out[out.length - 1] = `${lastOut} ${l.text}`
      continue
    }
    if (prev && gap > l.h * 1.7) flush()
    para.push(l.text)
  }
  flush()
  const isItem = (s: string) => /^(- |\d+\. )/.test(s)
  return out.reduce((acc, cur, i) => acc + (i === 0 ? '' : isItem(cur) && isItem(out[i - 1]) ? '\n' : '\n\n') + cur, '')
}

async function renderPageToBlob(page: pdfjs.PDFPageProxy): Promise<Blob> {
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
  return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'))
}

const MAX_OCR_PAGES = 40

export async function pdfToMarkdown(file: File, onProgress?: (p: string) => void): Promise<string> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pages: { lines: Line[]; page: pdfjs.PDFPageProxy }[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    onProgress?.(`Reading page ${n}/${doc.numPages}`)
    const page = await doc.getPage(n)
    const content = await page.getTextContent()
    pages.push({ lines: toLines(content.items as TextItem[]), page })
  }

  const allLines = pages.flatMap((p) => p.lines)
  const charCount = allLines.reduce((s, l) => s + l.text.length, 0)

  if (charCount < doc.numPages * 20) {
    const parts: string[] = []
    const limit = Math.min(doc.numPages, MAX_OCR_PAGES)
    for (let i = 0; i < limit; i++) {
      onProgress?.(`Scanned PDF · OCR page ${i + 1}/${limit}`)
      const blob = await renderPageToBlob(pages[i].page)
      parts.push(await ocrImage(blob))
    }
    if (doc.numPages > limit) parts.push(`> OCR stopped after ${limit} pages.`)
    return parts.join('\n\n---\n\n')
  }

  const weighted: number[] = []
  for (const l of allLines) for (let k = 0; k < Math.min(l.text.length, 200); k += 10) weighted.push(Math.round(l.h * 10) / 10)
  const bodySize = median(weighted)

  const repeated = new Map<string, number>()
  for (const p of pages) {
    const edge = [p.lines[0], p.lines[p.lines.length - 1]].filter(Boolean)
    for (const l of edge) {
      const key = l.text.replace(/\d+/g, '#')
      repeated.set(key, (repeated.get(key) ?? 0) + 1)
    }
  }
  const threshold = pages.length >= 3 ? Math.ceil(pages.length * 0.6) : Infinity
  const PAGE_NO = /^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i
  const isChrome = (l: Line, i: number, arr: Line[]) =>
    PAGE_NO.test(l.text) || ((i === 0 || i === arr.length - 1) && (repeated.get(l.text.replace(/\d+/g, '#')) ?? 0) >= threshold)

  return pages
    .map((p) => linesToMarkdown(p.lines.filter((l, i, arr) => !isChrome(l, i, arr)), bodySize))
    .filter(Boolean)
    .join('\n\n')
}
