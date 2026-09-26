import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

let td: TurndownService | null = null

export function turndown(): TurndownService {
  if (td) return td
  td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    hr: '---',
  })
  td.use(gfm)
  td.remove(['script', 'style', 'noscript', 'iframe', 'canvas', 'form', 'button'])
  td.remove((node) => node.nodeName.toLowerCase() === 'svg')
  td.addRule('dataImages', {
    filter: (node) => node.nodeName === 'IMG' && (node.getAttribute('src') ?? '').startsWith('data:'),
    replacement: (_c, node) => {
      const alt = (node as HTMLElement).getAttribute('alt')
      return alt ? `*[image: ${alt}]*` : ''
    },
  })
  td.addRule('emptyLinks', {
    filter: (node) => node.nodeName === 'A' && !node.textContent?.trim(),
    replacement: () => '',
  })
  return td
}

// GFM tables need a header row; promote the first row and flatten cell paragraphs
export function normalizeTables(root: ParentNode) {
  root.querySelectorAll('table').forEach((table) => {
    const doc = table.ownerDocument
    if (!table.querySelector('th')) {
      const first = table.querySelector('tr')
      first?.querySelectorAll('td').forEach((td) => {
        const th = doc.createElement('th')
        th.innerHTML = td.innerHTML
        td.replaceWith(th)
      })
    }
    table.querySelectorAll('td p, th p').forEach((p) => {
      p.replaceWith(doc.createTextNode(` ${p.textContent ?? ''} `))
    })
  })
}

export function tidyMarkdown(md: string): string {
  return md
    .replace(/^(\s*)([-*+])\s{2,}/gm, '$1$2 ')
    .replace(/^(\s*)(\d+\.)\s{2,}/gm, '$1$2 ')
    .replace(/^(#{1,6} \d+)\\\./gm, '$1.')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function htmlFragmentToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  normalizeTables(doc.body)
  return tidyMarkdown(turndown().turndown(doc.body.innerHTML))
}

export function htmlStringToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const main = doc.querySelector('main, article') ?? doc.body
  doc.querySelectorAll('nav, footer, header[role="banner"], aside').forEach((n) => {
    if (!main.contains(n) || main === doc.body) n.remove()
  })
  normalizeTables(main)
  const title = doc.title?.trim()
  const md = tidyMarkdown(turndown().turndown(main.innerHTML ?? ''))
  const hasH1 = /^# /m.test(md)
  return (title && !hasH1 ? `# ${title}\n\n` : '') + md
}

export async function htmlToMarkdown(file: File): Promise<string> {
  return htmlStringToMarkdown(await file.text())
}
