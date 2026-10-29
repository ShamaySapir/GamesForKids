import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { hasHebrewVoice, phrases, recordings, say } from '../../core/audio/audio'
import './studio.css'

// Dev-only page for recording phrases (docs/DECISIONS.md D3, D10); excluded from production builds.
// Chrome/Edge: pick the repo's src/audio/he folder once and recordings are written straight into it.
// Other browsers: each recording downloads; move the files into src/audio/he/.

interface DirHandle {
  getFileHandle(name: string, opts: { create: boolean }): Promise<{ createWritable(): Promise<{ write(b: Blob): Promise<void>; close(): Promise<void> }> }>
}
type DirPicker = (opts?: { mode?: 'readwrite'; id?: string }) => Promise<DirHandle>

const EXT = 'webm'

export default function Studio() {
  const ids = useMemo(() => Object.keys(phrases).sort(), [])
  const [filter, setFilter] = useState<'missing' | 'all'>('missing')
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [recording, setRecording] = useState<string | null>(null)
  const [dir, setDir] = useState<DirHandle | null>(null)
  const [error, setError] = useState('')
  const rec = useRef<MediaRecorder | null>(null)

  const has = (id: string) => recordings.has(id) || !!saved[id]
  const shown = ids.filter(id => filter === 'all' || !has(id))
  const done = ids.filter(has).length
  const picker = (window as unknown as { showDirectoryPicker?: DirPicker }).showDirectoryPicker

  const chooseDir = async () => {
    try { setDir(await picker!({ mode: 'readwrite', id: 'audio-he' })) } catch { /* cancelled */ }
  }

  const store = async (id: string, blob: Blob) => {
    const name = `${id}.${EXT}`
    if (dir) {
      const w = await (await dir.getFileHandle(name, { create: true })).createWritable()
      await w.write(blob)
      await w.close()
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      a.click()
    }
    setSaved(s => ({ ...s, [id]: URL.createObjectURL(blob) }))
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
        await store(id, new Blob(chunks, { type: r.mimeType }))
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
    const url = saved[id]
    if (url) void new Audio(url).play()
    else void say(id)
  }

  return (
    <div dir="ltr" className="studio">
      <header className="top">
        <h1>🎙️ Recording studio</h1>
        <Link className="pill" to="/">Back to app</Link>
      </header>
      <p className="sub">{done} / {ids.length} phrases recorded · Hebrew TTS voice on this device: {hasHebrewVoice() ? 'yes' : 'no'}</p>
      <div className="studio-bar">
        {picker
          ? <button className="pill" onClick={chooseDir}>{dir ? '✅ Saving into chosen folder' : '📁 Choose src/audio/he folder'}</button>
          : <span>Files will download — move them into <code>src/audio/he/</code>.</span>}
        <label><input type="radio" checked={filter === 'missing'} onChange={() => setFilter('missing')} /> Missing</label>
        <label><input type="radio" checked={filter === 'all'} onChange={() => setFilter('all')} /> All</label>
      </div>
      {error && <p className="studio-err">{error}</p>}
      <table>
        <thead><tr><th>ID</th><th>Text</th><th>Status</th><th /></tr></thead>
        <tbody>
          {shown.map(id => (
            <tr key={id} className={recording === id ? 'rec' : undefined}>
              <td><code>{id}</code></td>
              <td dir="rtl" className="studio-text">{phrases[id]}</td>
              <td>{has(id) ? '✅' : '—'}</td>
              <td className="studio-actions">
                <button className="pill" onClick={() => toggle(id)} disabled={!!recording && recording !== id}>
                  {recording === id ? '⏹ Stop' : '⏺ Record'}
                </button>
                <button className="pill" onClick={() => play(id)}>▶</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
