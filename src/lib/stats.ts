export interface DocStats {
  headings: number
  tables: number
  codeBlocks: number
  links: number
  listItems: number
  sections: number
}

export function docStats(md: string): DocStats {
  const noCode = md.replace(/```[\s\S]*?```/g, '')
  return {
    headings: (noCode.match(/^#{1,6} /gm) ?? []).length,
    tables: (noCode.match(/^\|?\s*:?-{3,}:?\s*\|/gm) ?? []).length,
    codeBlocks: (md.match(/^```/gm) ?? []).length / 2,
    links: (noCode.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length,
    listItems: (noCode.match(/^\s*(?:[-*+]|\d+\.) /gm) ?? []).length,
    sections: (noCode.match(/^## /gm) ?? []).length,
  }
}

export interface OutlineItem {
  level: number
  text: string
}

export function outline(md: string): OutlineItem[] {
  const noCode = md.replace(/```[\s\S]*?```/g, '')
  return Array.from(noCode.matchAll(/^(#{1,3}) (.+)$/gm)).map((m) => ({
    level: m[1].length,
    text: m[2].replace(/[*_`[\]]/g, '').replace(/\(.*?\)/g, '').trim(),
  }))
}

export function titleOf(md: string, fallback: string): string {
  const h = md.match(/^#{1,2} (.+)$/m)?.[1]
  return h ? h.replace(/[*_`]/g, '').trim() : fallback
}

// Lifetime ledger: a per-device tally shown on the home desk
export interface Ledger {
  files: number
  tokens: number
  bytesIn: number
  bytesOut: number
  since: number
}

const KEY = 'mdify.ledger.v1'

export function readLedger(): Ledger {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* storage unavailable */ }
  return { files: 0, tokens: 0, bytesIn: 0, bytesOut: 0, since: Date.now() }
}

export function addToLedger(delta: Omit<Ledger, 'since'>): Ledger {
  const cur = readLedger()
  const next = {
    files: cur.files + delta.files,
    tokens: cur.tokens + delta.tokens,
    bytesIn: cur.bytesIn + delta.bytesIn,
    bytesOut: cur.bytesOut + delta.bytesOut,
    since: cur.since,
  }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  return next
}
