import JSZip from 'jszip'
import { htmlFragmentToMarkdown } from './html'

export function mdTable(rows: string[][]): string {
  const width = Math.max(...rows.map((r) => r.length))
  if (!rows.length || !width) return ''
  const clean = (v: string) => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>').trim()
  const norm = rows.map((r) => Array.from({ length: width }, (_, i) => clean(r[i] ?? '')))
  const [head, ...body] = norm
  return [
    `| ${head.map((h, i) => h || `Column ${i + 1}`).join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n')
}

export async function docxToMarkdown(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const { value } = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    {
      convertImage: mammoth.images.imgElement(async () => ({ src: '' })),
      styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh", "p[style-name='Quote'] => blockquote:fresh"],
    },
  )
  return htmlFragmentToMarkdown(value).replace(/!\[\]\(\)/g, '').trim()
}

export async function sheetToMarkdown(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const isText = /\.(csv|tsv)$/i.test(file.name)
  const wb = isText
    ? XLSX.read(await file.text(), { type: 'string', raw: true, FS: file.name.toLowerCase().endsWith('.tsv') ? '\t' : undefined })
    : XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array', cellDates: true })

  const parts: string[] = []
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1, defval: '', raw: false, blankrows: false })
    while (rows.length && rows[rows.length - 1].every((c) => !String(c).trim())) rows.pop()
    if (!rows.length) continue
    let lastCol = 0
    for (const r of rows) r.forEach((c, i) => { if (String(c).trim()) lastCol = Math.max(lastCol, i) })
    const trimmed = rows.map((r) => r.slice(0, lastCol + 1).map(String))
    if (!isText || wb.SheetNames.length > 1) parts.push(`## ${name}`)
    parts.push(mdTable(trimmed))
  }
  return parts.join('\n\n')
}

const byNumber = (a: string, b: string) => Number(a.match(/(\d+)\.xml$/)?.[1]) - Number(b.match(/(\d+)\.xml$/)?.[1])

function paragraphsOf(el: Element): { text: string; level: number }[] {
  return Array.from(el.getElementsByTagName('a:p'))
    .map((p) => {
      const text = Array.from(p.getElementsByTagName('a:t')).map((t) => t.textContent ?? '').join('')
      const lvl = Number(p.getElementsByTagName('a:pPr')[0]?.getAttribute('lvl') ?? 0)
      return { text: text.trim(), level: lvl }
    })
    .filter((p) => p.text)
}

function tableOf(tbl: Element): string {
  const rows = Array.from(tbl.getElementsByTagName('a:tr')).map((tr) =>
    Array.from(tr.getElementsByTagName('a:tc')).map((tc) => paragraphsOf(tc).map((p) => p.text).join(' ')),
  )
  return mdTable(rows)
}

export async function pptxToMarkdown(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const parser = new DOMParser()
  const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort(byNumber)
  const out: string[] = []

  for (const [i, path] of slides.entries()) {
    const xml = parser.parseFromString(await zip.file(path)!.async('string'), 'application/xml')
    let title = ''
    const body: string[] = []

    for (const sp of Array.from(xml.getElementsByTagName('p:sp'))) {
      const ph = sp.getElementsByTagName('p:ph')[0]?.getAttribute('type') ?? ''
      const paras = paragraphsOf(sp)
      if (!paras.length) continue
      if ((ph === 'title' || ph === 'ctrTitle') && !title) {
        title = paras.map((p) => p.text).join(' ')
      } else if (ph === 'subTitle') {
        body.push(`*${paras.map((p) => p.text).join(' ')}*`)
      } else if (paras.length === 1 && paras[0].text.length < 120 && ph !== 'body') {
        body.push(paras[0].text)
      } else {
        body.push(paras.map((p) => `${'  '.repeat(p.level)}- ${p.text}`).join('\n'))
      }
    }
    for (const tbl of Array.from(xml.getElementsByTagName('a:tbl'))) body.push(tableOf(tbl))

    const notesPath = `ppt/notesSlides/notesSlide${path.match(/(\d+)\.xml$/)![1]}.xml`
    const rels = zip.file(path.replace('slides/', 'slides/_rels/') + '.rels')
    if (rels && (await rels.async('string')).includes('notesSlide') && zip.file(notesPath)) {
      const notesXml = parser.parseFromString(await zip.file(notesPath)!.async('string'), 'application/xml')
      const notes = Array.from(notesXml.getElementsByTagName('p:sp'))
        .filter((sp) => sp.getElementsByTagName('p:ph')[0]?.getAttribute('type') === 'body')
        .flatMap((sp) => paragraphsOf(sp).map((p) => p.text))
      if (notes.length) body.push(`> **Notes:** ${notes.join(' ')}`)
    }

    out.push(`## Slide ${i + 1}${title ? `: ${title}` : ''}\n\n${body.join('\n\n')}`.trim())
  }
  return out.join('\n\n---\n\n')
}
