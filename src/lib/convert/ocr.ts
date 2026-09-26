import type { Worker } from 'tesseract.js'

let workerPromise: Promise<Worker> | null = null

function getWorker(): Promise<Worker> {
  const base = new URL('ocr/', document.baseURI).href
  workerPromise ??= import('tesseract.js').then(({ createWorker }) =>
    createWorker('eng', 1, { workerPath: `${base}worker.min.js`, corePath: base, langPath: base, gzip: true, workerBlobURL: false }),
  )
  workerPromise.catch(() => { workerPromise = null })
  return workerPromise
}

export async function ocrImage(image: Blob): Promise<string> {
  const worker = await getWorker()
  const { data } = await worker.recognize(image)
  return data.text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
}
