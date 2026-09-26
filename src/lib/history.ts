import { createStore, del, entries, set, clear } from 'idb-keyval'
import type { HistoryEntry } from './types'

const store = createStore('mdify', 'history')
const LIMIT = 50

export async function listHistory(): Promise<HistoryEntry[]> {
  const all = await entries<string, HistoryEntry>(store)
  return all.map(([, v]) => v).sort((a, b) => b.createdAt - a.createdAt)
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  await set(entry.id, entry, store)
  const all = await listHistory()
  for (const old of all.slice(LIMIT)) await del(old.id, store)
}

export const removeHistory = (id: string) => del(id, store)
export const clearHistory = () => clear(store)
