import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../core/storage/store'
import type { Grade } from '../../core/engine/types'
import { Mascot } from '../../ui/Mascot'

const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦄', '🐙', '🐶', '🐱', '🐰', '🦁', '🐨']
const GRADES = ['גן חובה', 'כיתה א׳', 'כיתה ב׳', 'כיתה ג׳', 'כיתה ד׳', 'כיתה ה׳', 'כיתה ו׳']

export function ProfileScreen() {
  const { profiles, selectProfile, createProfile } = useStore()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(profiles.length === 0)

  const choose = async (id: string) => {
    await selectProfile(id)
    navigate('/')
  }

  return (
    <>
      <Mascot mood="happy" line={adding ? "app.hello" : "app.who"} />
      {adding
        ? <NewProfile onCancel={profiles.length ? () => setAdding(false) : undefined} onSave={async p => { await createProfile(p); navigate('/') }} />
        : (
          <div className="grid" style={{ marginTop: 24 }}>
            {profiles.map(p => (
              <button key={p.id} className="tile" onClick={() => choose(p.id)}>
                <span className="ic">{p.avatar}</span>
                <div><b>{p.name}</b><small>{GRADES[p.grade]}</small></div>
              </button>
            ))}
            <button className="tile" onClick={() => setAdding(true)}>
              <span className="ic">➕</span><div><b>ילד/ה חדש/ה</b></div>
            </button>
          </div>
        )}
    </>
  )
}

interface NewProfileProps {
  onSave: (p: { name: string; avatar: string; grade: Grade; autoSpeak: boolean }) => void
  onCancel?: () => void
}

function NewProfile({ onSave, onCancel }: NewProfileProps) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0]!)
  const [grade, setGrade] = useState<Grade>(1)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSave({ name: name.trim(), avatar, grade, autoSpeak: grade <= 2 })
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginTop: 24, display: 'grid', gap: 18 }}>
      <label className="field">שם
        <input value={name} onChange={e => setName(e.target.value)} maxLength={20} autoFocus />
      </label>
      <div className="field">
        <span>בחרו דמות</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} role="radiogroup">
          {AVATARS.map(a => (
            <button type="button" key={a} role="radio" aria-checked={a === avatar} className="icon-btn"
              style={{ width: 64, height: 64, fontSize: 34, borderColor: a === avatar ? 'var(--abc)' : undefined }}
              onClick={() => setAvatar(a)}>{a}</button>
          ))}
        </div>
      </div>
      <label className="field">כיתה
        <select value={grade} onChange={e => setGrade(Number(e.target.value) as Grade)}>
          {GRADES.map((g, i) => <option key={g} value={i}>{g}</option>)}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="cta" disabled={!name.trim()}>יאללה!</button>
        {onCancel && <button type="button" className="pill" onClick={onCancel}>ביטול</button>}
      </div>
    </form>
  )
}
