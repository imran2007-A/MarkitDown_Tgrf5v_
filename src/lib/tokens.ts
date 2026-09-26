type Counter = (text: string) => number

let counter: Counter | null = null
let loading: Promise<Counter> | null = null

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export async function countTokens(text: string): Promise<number> {
  if (counter) return counter(text)
  loading ??= import('gpt-tokenizer').then((m) => (counter = m.countTokens))
  return (await loading)(text)
}

export const CONTEXT_WINDOWS = [
  { name: 'ChatGPT (free)', tokens: 8_000 },
  { name: 'GPT-4o', tokens: 128_000 },
  { name: 'Claude', tokens: 200_000 },
  { name: 'Gemini', tokens: 1_000_000 },
]

export function formatTokens(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}
