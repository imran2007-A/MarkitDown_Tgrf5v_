export type Kind = 'pdf' | 'docx' | 'pptx' | 'sheet' | 'html' | 'image' | 'data' | 'code' | 'text' | 'archive' | 'native'

const CODE_LANG: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', java: 'java', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp',
  go: 'go', rs: 'rust', rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin', kts: 'kotlin',
  scala: 'scala', dart: 'dart', lua: 'lua', r: 'r', m: 'objectivec', sql: 'sql', sh: 'bash',
  bash: 'bash', zsh: 'bash', ps1: 'powershell', bat: 'batch', css: 'css', scss: 'scss', less: 'less',
  vue: 'vue', svelte: 'svelte', astro: 'astro', yaml: 'yaml', yml: 'yaml', toml: 'toml', ini: 'ini',
  env: 'bash', dockerfile: 'dockerfile', gradle: 'groovy', xml: 'xml', svg: 'xml', graphql: 'graphql',
  proto: 'protobuf', ex: 'elixir', exs: 'elixir', hs: 'haskell', clj: 'clojure', sol: 'solidity',
}

const KIND_BY_EXT: Record<string, Kind> = {
  pdf: 'pdf', docx: 'docx', pptx: 'pptx',
  xlsx: 'sheet', xls: 'sheet', xlsm: 'sheet', ods: 'sheet', csv: 'sheet', tsv: 'sheet',
  html: 'html', htm: 'html', xhtml: 'html',
  png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', bmp: 'image', gif: 'image',
  json: 'data', jsonl: 'data', ipynb: 'data',
  txt: 'text', md: 'text', markdown: 'text', rst: 'text', log: 'text', tex: 'text',
  zip: 'archive',
  epub: 'native', msg: 'native',
}

export const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', '.next', '.nuxt', 'out', '.cache',
  '__pycache__', '.venv', 'venv', '.idea', '.vscode', 'target', 'coverage', '.turbo', '.gradle',
])

const SPECIAL_NAMES: Record<string, string> = { dockerfile: 'dockerfile', makefile: 'makefile', license: 'text', readme: 'text' }

export function extOf(name: string): string {
  const lower = name.toLowerCase()
  if (SPECIAL_NAMES[lower]) return lower
  const i = lower.lastIndexOf('.')
  return i > 0 ? lower.slice(i + 1) : ''
}

export function kindOf(name: string): Kind | null {
  const ext = extOf(name)
  if (KIND_BY_EXT[ext] === 'native') return typeof window !== 'undefined' && window.mdify ? 'native' : null
  if (KIND_BY_EXT[ext]) return KIND_BY_EXT[ext]
  if (CODE_LANG[ext] || ext === 'makefile') return 'code'
  return null
}

export function langOf(name: string): string {
  const ext = extOf(name)
  return CODE_LANG[ext] ?? (ext === 'makefile' ? 'makefile' : ext)
}

export const NATIVE_FALLBACK_KINDS = new Set<Kind>(['pdf', 'docx', 'pptx', 'sheet', 'html'])

export const FORMAT_GROUPS: { label: string; exts: string }[] = [
  { label: 'PDF', exts: 'pdf' },
  { label: 'Word', exts: 'docx' },
  { label: 'PowerPoint', exts: 'pptx' },
  { label: 'Excel', exts: 'xlsx · xls · csv' },
  { label: 'Images', exts: 'png · jpg · webp' },
  { label: 'Web', exts: 'html' },
  { label: 'Data', exts: 'json · ipynb' },
  { label: 'Code', exts: '60+ languages' },
  { label: 'Zip', exts: 'zip' },
]

export const DESKTOP_FORMAT_GROUPS = [{ label: 'E-books', exts: 'epub' }, { label: 'Outlook', exts: 'msg' }]

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 ** 2).toFixed(1)} MB`
}
