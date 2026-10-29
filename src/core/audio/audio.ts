import type { PhraseMap, PhraseRef } from '../engine/types'

// All playback goes through this module (docs/DECISIONS.md D3).
// A recording at src/audio/he/<phraseId>.<ext> wins; otherwise Web Speech reads the phrase text.

const recordingFiles = import.meta.glob('/src/audio/he/*.{mp3,m4a,ogg,webm,wav}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

const phraseFiles = import.meta.glob(['/src/subjects/*/phrases.ts', '/src/app/phrases.ts'], {
  eager: true, import: 'phrases',
}) as Record<string, PhraseMap>

/** Phrase ID → recording URL. */
export const recordings: ReadonlyMap<string, string> = new Map(
  Object.entries(recordingFiles).map(([path, url]) => [path.replace(/^.*\/([^/]+)\.\w+$/, '$1'), url]),
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
