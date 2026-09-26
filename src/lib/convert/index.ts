import { kindOf, langOf, NATIVE_FALLBACK_KINDS } from '../formats'
import { htmlToMarkdown } from './html'

export interface ConvertResult {
  markdown: string
  engine: 'native' | 'browser'
}

function fence(content: string, lang: string): string {
  const ticks = content.match(/`{3,}/g)?.reduce((m, t) => Math.max(m, t.length + 1), 3) ?? 3
  const f = '`'.repeat(ticks)
  return `${f}${lang}\n${content.replace(/\s+$/, '')}\n${f}`
}

async function ipynbToMarkdown(file: File): Promise<string> {
  const nb = JSON.parse(await file.text())
  const lang = nb.metadata?.kernelspec?.language ?? 'python'
  return (nb.cells ?? [])
    .map((c: { cell_type: string; source: string | string[] }) => {
      const src = Array.isArray(c.source) ? c.source.join('') : c.source
      if (!src.trim()) return ''
      return c.cell_type === 'markdown' ? src.trim() : fence(src, c.cell_type === 'code' ? lang : '')
    })
    .filter(Boolean)
    .join('\n\n')
}

async function dataToMarkdown(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.ipynb')) return ipynbToMarkdown(file)
  const text = await file.text()
  if (file.name.toLowerCase().endsWith('.jsonl')) return fence(text, 'json')
  try {
    return fence(JSON.stringify(JSON.parse(text), null, 2), 'json')
  } catch {
    return fence(text, 'json')
  }
}

export async function convertInBrowser(file: File, onProgress?: (p: string) => void): Promise<string> {
  const kind = kindOf(file.name)
  switch (kind) {
    case 'pdf':
      return (await import('./pdf')).pdfToMarkdown(file, onProgress)
    case 'docx':
      return (await import('./office')).docxToMarkdown(file)
    case 'pptx':
      return (await import('./office')).pptxToMarkdown(file)
    case 'sheet':
      return (await import('./office')).sheetToMarkdown(file)
    case 'html':
      return htmlToMarkdown(file)
    case 'image':
      onProgress?.('Running OCR')
      return (await import('./ocr')).ocrImage(file)
    case 'data':
      return dataToMarkdown(file)
    case 'code':
      return fence(await file.text(), langOf(file.name))
    case 'text':
      return (await file.text()).trim()
    default:
      throw new Error('Unsupported file type')
  }
}

async function viaNative(file: File, onProgress?: (p: string) => void): Promise<string | null> {
  const bridge = window.mdify
  const path = bridge?.getPathForFile(file)
  if (!bridge || !path) return null
  onProgress?.('Native engine')
  const res = await bridge.convertNative(path).catch((e) => ({ error: String(e), markdown: undefined }))
  if (res.error) throw new Error(res.error)
  return res.markdown?.trim() || null
}

const tidy = (md: string) => md.replace(/\n{3,}/g, '\n\n').trim()

export async function convertFile(file: File, onProgress?: (p: string) => void): Promise<ConvertResult> {
  const kind = kindOf(file.name)
  if (kind === 'native') {
    const md = await viaNative(file, onProgress)
    if (!md) throw new Error('Nothing could be extracted')
    return { markdown: tidy(md), engine: 'native' }
  }
  let browserErr: unknown = null
  try {
    const md = tidy(await convertInBrowser(file, onProgress))
    if (md.length > 0) return { markdown: md, engine: 'browser' }
  } catch (e) {
    browserErr = e
  }
  // Desktop: retry with MarkItDown when the in-browser engine fails or comes back empty
  if (window.mdify && kind && NATIVE_FALLBACK_KINDS.has(kind)) {
    const md = await viaNative(file, onProgress).catch(() => null)
    if (md) return { markdown: tidy(md), engine: 'native' }
  }
  if (browserErr) throw browserErr
  throw new Error('No text found in this file')
}
