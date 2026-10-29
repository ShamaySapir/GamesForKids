import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { hasHebrewVoice, phrases, recordings, say } from '../../core/audio/audio'
import './studio.css'

// Dev-only page for recording phrases (docs/DECISIONS.md D3, D10, D12); excluded from production builds.
// Each recording is sent to the dev server (scripts/studio-plugin.ts), which writes src/audio/he/<id>.<ext> and
// replaces any earlier take; ✅ appears only after the server confirms the file was written.

// Phrases TTS can't say reliably (isolated sounds, syllables, units) are listed first.
const PRIORITY = [/\.sound\./, /\.cv\./, /\.unit\./, /\.syl\./]
const rank = (id: string) => { const i = PRIORITY.findIndex(r => r.test(id)); return i < 0 ? PRIORITY.length : i }

export default function Studio() {
  const ids = useMemo(() => Object.keys(phrases).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)), [])
  const [filter, setFilter] = useState<'missing' | 'all'>('missing')
  const [recording, setRecording] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  // Takes saved during this visit, played from memory: the file keeps its name, so the browser would replay the old one.
  const [fresh, setFresh] = useState<Record<string, string>>({})
  const rec = useRef<MediaRecorder | null>(null)

  const has = (id: string) => recordings.has(id) || !!fresh[id]
  const shown = ids.filter(id => filter === 'all' || !has(id))
  const done = ids.filter(has).length

  const save = async (id: string, blob: Blob) => {
    setSaving(id)
    try {
      const res = await fetch(`/__studio/save?id=${encodeURIComponent(id)}`, {
        method: 'POST', headers: { 'Content-Type': blob.type }, body: blob,
      })
      if (!res.ok) throw new Error(await res.text())
      setFresh(f => ({ ...f, [id]: URL.createObjectURL(blob) }))
    } catch (e) {
      setError(`Not saved: ${(e as Error).message}`)
    } finally {
      setSaving(null)
    }
  }

  const toggle = async (id: string) => {
    if (rec.current) {
      rec.current.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      const r = new MediaRecorder(stream)
      const chunks: Blob[] = []
      r.ondataavailable = e => chunks.push(e.data)
      r.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        rec.current = null
        setRecording(null)
        await save(id, new Blob(chunks, { type: r.mimeType.split(';')[0] }))
      }
      rec.current = r
      setRecording(id)
      setError('')
      r.start()
    } catch (e) {
      setError(`Microphone unavailable: ${(e as Error).message}`)
    }
  }

  const play = (id: string) => {
    if (fresh[id]) void new Audio(fresh[id]).play()
    else void say(id)
  }

  return (
    <div dir="ltr" className="studio">
      <header className="top">
        <h1>🎙️ Recording studio</h1>
        <Link className="pill" to="/">Back to app</Link>
      </header>
      <p className="sub">
        {done} / {ids.length} phrases recorded · saved to <code>src/audio/he/</code> · a new take replaces the old one ·
        Hebrew TTS voice on this device: {hasHebrewVoice() ? 'yes' : 'no'}
      </p>
      <div className="studio-bar">
        <label><input type="radio" checked={filter === 'missing'} onChange={() => setFilter('missing')} /> Missing</label>
        <label><input type="radio" checked={filter === 'all'} onChange={() => setFilter('all')} /> All</label>
      </div>
      {error && <p className="studio-err" role="alert">⚠️ {error}</p>}
      <table>
        <thead><tr><th>ID</th><th>Text</th><th>Status</th><th /></tr></thead>
        <tbody>
          {shown.map(id => (
            <tr key={id} className={recording === id ? 'rec' : undefined}>
              <td><code>{id}</code></td>
              <td dir="rtl" className="studio-text">{phrases[id]}</td>
              <td>{saving === id ? '⏳' : has(id) ? '✅' : '—'}</td>
              <td className="studio-actions">
                <button className="pill" onClick={() => toggle(id)} disabled={(!!recording && recording !== id) || !!saving}>
                  {recording === id ? '⏹ Stop' : has(id) ? '⏺ Re-record' : '⏺ Record'}
                </button>
                <button className="pill" onClick={() => play(id)} title="Plays the latest take, otherwise TTS">▶</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
