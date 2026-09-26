// Synthesized typewriter sounds (no audio files). Kept deliberately quiet.
const KEY = 'mdify.sound'
let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* storage unavailable */ }
}

function audio(): AudioContext | null {
  if (!soundOn()) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    if (!noise) {
      noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate)
      const d = noise.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2)
    }
    return ctx.state === 'running' ? ctx : null
  } catch {
    return null
  }
}

/** One key strike. `strength` 0–1 scales loudness. */
export function keyStrike(strength = 1) {
  const a = audio()
  if (!a || !noise) return
  const t = a.currentTime
  const vol = 0.11 * strength * (0.8 + Math.random() * 0.4)

  const src = a.createBufferSource()
  src.buffer = noise
  src.playbackRate.value = 0.85 + Math.random() * 0.3
  const band = a.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1800 + Math.random() * 1400
  band.Q.value = 1.2
  const g = a.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  src.connect(band).connect(g).connect(a.destination)
  src.start(t)
  src.stop(t + 0.07)

  // the key bottoming out: a short, low thunk
  const osc = a.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(150 + Math.random() * 30, t)
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.03)
  const og = a.createGain()
  og.gain.setValueAtTime(0.05 * strength, t)
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
  osc.connect(og).connect(a.destination)
  osc.start(t)
  osc.stop(t + 0.05)
}

/** The end-of-line bell. */
export function bell() {
  const a = audio()
  if (!a) return
  const t = a.currentTime
  for (const [freq, vol] of [[2093, 0.035], [3140, 0.015], [4186, 0.008]] as const) {
    const osc = a.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = a.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
    osc.connect(g).connect(a.destination)
    osc.start(t)
    osc.stop(t + 1.4)
  }
}
