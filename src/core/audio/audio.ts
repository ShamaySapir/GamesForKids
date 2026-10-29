import type { PhraseMap, PhraseRef } from '../engine/types'

// All playback goes through this module (docs/DECISIONS.md D3).
// A recording at src/audio/he/<phraseId>.<ext> wins; otherwise Web Speech reads the phrase text.

const recordingFiles = import.meta.glob('/src/audio/he/*.{mp3,m4a,ogg,webm,wav}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

const phraseFiles = import.meta.glob(['/src/subjects/*/phrases.ts', '/src/app/phrases.ts'], {
  eager: true, import: 'phrases',
}) as Record<string, PhraseMap>

// In dev a re-recorded take keeps its file name, so the browser would replay a cached copy: bust it per page load.
const devBust = import.meta.env.DEV ? `?t=${Date.now()}` : ''

/** Phrase ID → recording URL. */
export const recordings: ReadonlyMap<string, string> = new Map(
  Object.entries(recordingFiles).map(([path, url]) => [path.replace(/^.*\/([^/]+)\.\w+$/, '$1'), url + devBust]),
)

/** Every phrase declared in the app, by ID. */
export const phrases: PhraseMap = Object.assign({}, ...Object.values(phraseFiles))

/** Text-only phrase for runtime content that has no ID (e.g. a child's name). */
export const raw = (text: string) => `raw:${text}`

const textOf = (id: string) => (id.startsWith('raw:') ? id.slice(4) : (phrases[id] ?? id))

let current: HTMLAudioElement | null = null
let token = 0

export function stop() {
  token++
  current?.pause()
  current = null
  try { speechSynthesis.cancel() } catch { /* no speech support */ }
}

function hebrewVoice(): SpeechSynthesisVoice | undefined {
  try { return speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('he')) } catch { return undefined }
}

export const hasHebrewVoice = () => !!hebrewVoice()

function speakText(text: string): Promise<void> {
  return new Promise(resolve => {
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'he-IL'
      u.rate = 0.9
      const voice = hebrewVoice()
      if (voice) u.voice = voice
      u.onend = u.onerror = () => resolve()
      speechSynthesis.speak(u)
    } catch { resolve() }
  })
}

function playUrl(url: string): Promise<void> {
  return new Promise(resolve => {
    const a = new Audio(url)
    current = a
    a.onended = a.onerror = () => resolve()
    a.play().catch(() => resolve())
  })
}

/** Speak a phrase or a sequence. Interrupts anything already playing. */
export async function say(ref: PhraseRef): Promise<void> {
  stop()
  const mine = token
  const ids = typeof ref === 'string' ? [ref] : ref
  // Consecutive unrecorded parts are read as one utterance so TTS keeps natural intonation.
  let pending: string[] = []
  const flush = async () => {
    if (pending.length) await speakText(pending.join(' '))
    pending = []
  }
  for (const id of ids) {
    if (mine !== token) return
    const url = recordings.get(id)
    if (url) {
      await flush()
      if (mine !== token) return
      await playUrl(url)
    } else pending.push(textOf(id))
  }
  if (mine === token) await flush()
}

/* ---------- narration with word highlighting (read-along books) ---------- */

const NIKUD = /[֑-ׇ]/g
const TTS_MS_PER_LETTER = 90
const TICK_MS = 50

/** Fraction of the phrase at which each word starts, weighted by letter count (nikud ignored). */
export function wordStarts(text: string): number[] {
  const weights = text.split(/\s+/).filter(Boolean).map(w => w.replace(NIKUD, '').length + 1)
  const total = weights.reduce((a, b) => a + b, 0)
  let acc = 0
  return weights.map(w => { const start = acc / total; acc += w; return start })
}

/** Index of the word being spoken at `fraction` (0–1) of the phrase. */
export const wordAt = (starts: readonly number[], fraction: number) =>
  Math.max(0, starts.findLastIndex(s => s <= fraction))

/** Character offset → word index, for Web Speech boundary events. */
export function wordAtChar(text: string, charIndex: number): number {
  const wordStartChars = [...text.matchAll(/\S+/g)].map(m => m.index)
  return Math.max(0, wordStartChars.findLastIndex(start => start <= charIndex))
}

/**
 * Read a phrase aloud and report which word is being spoken. With a recording, word times are estimated in
 * proportion to word length; with TTS, boundary events are used when the voice sends them.
 * `rate` < 1 reads slower. Interrupted by `stop()` or any other playback.
 */
export async function narrate(id: string, onWord: (index: number) => void, rate = 1): Promise<void> {
  stop()
  const mine = token
  const text = textOf(id)
  const starts = wordStarts(text)
  let last = -1
  const report = (i: number) => {
    if (mine === token && i !== last) onWord((last = i))
  }
  report(0)
  const url = recordings.get(id)
  if (url) {
    const a = new Audio(url)
    a.playbackRate = rate
    current = a
    const timer = setInterval(() => { if (a.duration) report(wordAt(starts, a.currentTime / a.duration)) }, TICK_MS)
    await new Promise<void>(resolve => {
      a.onended = a.onerror = () => resolve()
      a.play().catch(() => resolve())
    })
    clearInterval(timer)
  } else {
    await new Promise<void>(resolve => {
      try {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'he-IL'
        u.rate = 0.9 * rate
        const voice = hebrewVoice()
        if (voice) u.voice = voice
        // Estimate by time until the voice proves it sends word boundaries.
        let boundaries = false
        const t0 = Date.now()
        const estimate = (TTS_MS_PER_LETTER * text.replace(NIKUD, '').length) / rate
        const timer = setInterval(() => { if (!boundaries) report(wordAt(starts, Math.min(1, (Date.now() - t0) / estimate))) }, TICK_MS)
        u.onboundary = e => { if (e.name === 'word') { boundaries = true; report(wordAtChar(text, e.charIndex)) } }
        u.onend = u.onerror = () => { clearInterval(timer); resolve() }
        speechSynthesis.speak(u)
      } catch { resolve() }
    })
  }
  report(starts.length - 1)
}

/* ---------- sound effects (synthesized, ported from the prototype) ---------- */

let ctx: AudioContext | null = null

function tone(freq: number, duration = 0.15, delay = 0) {
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = freq
    g.gain.value = 0.12
    o.connect(g)
    g.connect(ctx.destination)
    const start = ctx.currentTime + delay
    o.start(start)
    o.stop(start + duration)
  } catch { /* audio unavailable */ }
}

export const sfx = {
  good: () => { tone(660); tone(880, 0.2, 0.12) },
  oops: () => tone(220, 0.25),
  tick: () => tone(1200, 0.03),
  win: () => { tone(660); tone(880, 0.2, 0.12); tone(1040, 0.25, 0.3) },
}
