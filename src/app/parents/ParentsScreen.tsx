import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GRADE_NAMES, gradeName, gradeShort, type Grade } from '../../core/engine/types'
import { emptyProgress, type Progress } from '../../core/progress/progress'
import { practiceItems, skillStatus, summary, type SkillState } from '../../core/progress/report'
import { parseBackup, type Backup } from '../../core/storage/backup'
import { useStore, type Profile } from '../../core/storage/store'
import { islands } from '../islands'
import { AVATARS } from '../screens/ProfileScreen'
import { gateNumber, numberWords } from './gate'
import './parents.css'

// The parents' page (docs/specs/parents.md, DECISIONS D18): for adults, plain Hebrew without nikud, nothing spoken.
// It reads each child's progress through the store's export, so it never touches storage itself.

const date = (t?: number) => (t ? new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' }).format(t) : '—')

// Soft locks (D19): 'locked' only means earlier skills aren't mastered yet; the child can still play it.
const STATE: Record<SkillState, string> = { mastered: 'נשלט ✅', practising: 'בתרגול', new: 'עוד לא התחיל', locked: 'עוד לא התחיל (אחרי שלבים קודמים)' }

function Gate({ onPass }: { onPass: () => void }) {
  const [n, setN] = useState(() => gateNumber(Math.random))
  const [typed, setTyped] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (Number(typed) === n) onPass()
    else { setN(gateNumber(Math.random)); setTyped('') }
  }
  return (
    <form className="card pr-gate" onSubmit={submit}>
      <h1>לַהוֹרִים</h1>
      <p>כדי להמשיך, כתבו את המספר בספרות:</p>
      <p className="pr-gate-words">{numberWords(n)}</p>
      <label className="field">המספר
        <input inputMode="numeric" pattern="[0-9]*" dir="ltr" value={typed} onChange={e => setTyped(e.target.value.replace(/\D/g, ''))} autoFocus />
      </label>
      <div className="pr-row">
        <button className="cta" disabled={!typed}>כניסה</button>
        <Link className="pill" to="/profiles">ביטול</Link>
      </div>
    </form>
  )
}

/** A confirmation that asks for the child's name, for actions that can't be undone. */
function Confirm({ name, label, onYes, onNo }: { name: string; label: string; onYes: () => void; onNo: () => void }) {
  const [typed, setTyped] = useState('')
  return (
    <div className="pr-confirm" role="alertdialog" aria-label={label}>
      <p>{label}: אי אפשר לבטל. כדי לאשר, כתבו את השם <b>{name}</b>.</p>
      <input value={typed} onChange={e => setTyped(e.target.value)} aria-label="השם לאישור" autoFocus />
      <div className="pr-row">
        <button type="button" className="pill pr-danger" disabled={typed.trim() !== name} onClick={onYes}>{label}</button>
        <button type="button" className="pill" onClick={onNo}>ביטול</button>
      </div>
    </div>
  )
}

function Settings({ child }: { child: Profile }) {
  const { updateProfile, deleteProfile, resetProgress } = useStore()
  const [confirm, setConfirm] = useState<'reset' | 'delete' | null>(null)
  const [done, setDone] = useState('')
  // Say "saved" only once storage has it, so a parent who closes the app right away keeps the change.
  const save = (patch: Partial<Omit<Profile, 'id'>>) => { setDone(''); void updateProfile(child.id, patch).then(() => setDone('נשמר ✓')) }
  return (
    <section className="card pr-section" aria-labelledby="pr-settings">
      <h2 id="pr-settings">הגדרות של {child.name}</h2>
      <label className="field">שם
        <input defaultValue={child.name} maxLength={20} onBlur={e => { const v = e.target.value.trim(); if (v && v !== child.name) save({ name: v }) }} />
      </label>
      <div className="field">
        <span>דמות</span>
        <div className="pr-avatars" role="radiogroup" aria-label="דמות">
          {AVATARS.map(a => (
            <button type="button" key={a} role="radio" aria-checked={a === child.avatar} className={`icon-btn${a === child.avatar ? ' on' : ''}`}
              onClick={() => save({ avatar: a })}>{a}</button>
          ))}
        </div>
      </div>
      <label className="field">כיתה
        <select value={child.grade} onChange={e => save({ grade: Number(e.target.value) as Grade })}>
          {GRADE_NAMES.map((g, i) => <option key={g} value={i - 1}>{g}</option>)}
        </select>
      </label>
      <label className="pr-check">
        <input type="checkbox" checked={child.autoSpeak} onChange={e => save({ autoSpeak: e.target.checked })} />
        השמעה אוטומטית של הוראות (מומלץ לילדים שעוד לא קוראים)
      </label>
      <p className="pr-done" role="status">{done}</p>
      <div className="pr-row">
        <button type="button" className="pill" onClick={() => setConfirm('reset')}>אפס התקדמות</button>
        <button type="button" className="pill pr-danger" onClick={() => setConfirm('delete')}>מחק ילד</button>
      </div>
      {confirm && (
        <Confirm name={child.name} label={confirm === 'reset' ? 'אפס התקדמות' : 'מחק ילד'} onNo={() => setConfirm(null)}
          onYes={() => { void (confirm === 'reset' ? resetProgress(child.id) : deleteProfile(child.id)); setConfirm(null); setDone(confirm === 'reset' ? 'ההתקדמות אופסה' : '') }} />
      )}
    </section>
  )
}

function BackupBox() {
  const { exportAll, importAll } = useStore()
  const [found, setFound] = useState<Backup | null>(null)
  const [msg, setMsg] = useState('')
  const download = async () => {
    const b = await exportAll()
    const url = URL.createObjectURL(new Blob([JSON.stringify(b, null, 1)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `olis-islands-backup-${new Date(b.savedAt).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('הגיבוי נשמר בתיקיית ההורדות.')
  }
  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let data: unknown = null
    try { data = JSON.parse(await file.text()) } catch { /* not JSON */ }
    const b = parseBackup(data)
    setFound(b)
    setMsg(b ? '' : 'הקובץ הזה אינו גיבוי תקין של האפליקציה. לא שונה דבר.')
  }
  return (
    <section className="card pr-section" aria-labelledby="pr-backup">
      <h2 id="pr-backup">גיבוי והעברה למחשב אחר</h2>
      <p className="pr-mute">הגיבוי הוא קובץ במחשב שלכם. הוא לא נשלח לשום מקום.</p>
      <div className="pr-row">
        <button type="button" className="pill" onClick={() => void download()}>שמור גיבוי</button>
        <label className="pill pr-file">שחזר מגיבוי<input type="file" accept="application/json,.json" onChange={e => void pick(e)} /></label>
      </div>
      {found && (
        <div className="pr-confirm" role="alertdialog" aria-label="שחזור">
          <p>נמצאו {found.profiles.length} ילדים: {found.profiles.map(p => p.name).join(', ')} (מ־{date(found.savedAt)}). השחזור יחליף את כל ההתקדמות שבמכשיר.</p>
          <div className="pr-row">
            <button type="button" className="pill pr-danger" onClick={() => { void importAll(found).then(() => setMsg('השחזור הושלם.')); setFound(null) }}>שחזר</button>
            <button type="button" className="pill" onClick={() => setFound(null)}>ביטול</button>
          </div>
        </div>
      )}
      <p className="pr-done" role="status">{msg}</p>
    </section>
  )
}

function Report({ child }: { child: Profile }) {
  const { exportAll, markKnown } = useStore()
  const current = useStore(s => s.current)
  const live = useStore(s => s.progress)
  const [stored, setStored] = useState<Progress | null>(null)
  const [now] = useState(() => Date.now())
  // The current child's progress is live in the store; others are read through the store's export.
  useEffect(() => {
    let alive = true
    void exportAll().then(b => { if (alive) setStored(b.progress[child.id] ?? emptyProgress()) })
    return () => { alive = false }
  }, [child.id, exportAll])
  const know = (skillId: string, known: boolean) =>
    void markKnown(child.id, skillId, known).then(() => exportAll()).then(b => setStored(b.progress[child.id] ?? emptyProgress()))
  const progress = current?.id === child.id ? live : stored
  if (!progress) return null
  const sum = summary(progress, islands, now)
  const practice = practiceItems(progress, islands)

  return (
    <>
      <section className="card pr-section pr-summary" aria-label="סיכום">
        <div><b>{sum.mastered}/{sum.skills}</b><small>מיומנויות נשלטו</small></div>
        <div><b>⭐ {sum.stars}</b><small>כוכבים</small></div>
        <div><b>{sum.stickers}</b><small>מדבקות</small></div>
        <div><b>{sum.roundsThisWeek}</b><small>סבבים ב־7 ימים</small></div>
        <div><b>{date(sum.lastPlayed)}</b><small>שיחק לאחרונה</small></div>
      </section>

      <section className="card pr-section" aria-labelledby="pr-practice">
        <h2 id="pr-practice">מה לתרגל</h2>
        {practice.length === 0
          ? <p className="pr-mute">אין כרגע פריטים לתרגול. כל מה שנשאל לאחרונה נענה נכון.</p>
          : (
            <ul className="pr-practice">
              {practice.map(({ island, skill, items }) => {
                const labels = items.map(k => skill.describeItem?.(k)).filter((l): l is string => !!l)
                return (
                  <li key={skill.id}>
                    <b>{island.icon} {skill.title}</b>
                    <span>{labels.length ? labels.join(' · ') : `${items.length} פריטים לתרגול`}</span>
                    {island.homeTip && <small>{island.homeTip}</small>}
                  </li>
                )
              })}
            </ul>
          )}
      </section>

      <section className="card pr-section" aria-labelledby="pr-islands">
        <h2 id="pr-islands">איים ומיומנויות</h2>
        {islands.filter(i => !i.comingSoon).map(island => {
          const done = island.skills.filter(s => progress.skills[s.id]?.mastered).length
          return (
            <details key={island.id} className="pr-island" style={{ ['--c' as string]: `var(${island.color})` }}>
              <summary>
                <span>{island.icon} {island.title}</span>
                <span className="pr-bar" role="img" aria-label={`${done} מתוך ${island.skills.length}`}>
                  <i style={{ width: `${(done / Math.max(1, island.skills.length)) * 100}%` }} />
                </span>
                <small>{done}/{island.skills.length}</small>
              </summary>
              <table className="pr-skills">
                <thead><tr><th>מיומנות</th><th>כיתה</th><th>מצב</th><th>אחרון</th><th /></tr></thead>
                <tbody>
                  {island.skills.map(skill => {
                    const r = skillStatus(progress, skill)
                    const note = r.byParent ? ' (סומן ע״י הורה)' : r.state === 'practising' ? ` (${r.good}/2 סבבים טובים, ${'⭐'.repeat(r.bestStars)})` : ''
                    return (
                      <tr key={skill.id} className={`pr-${r.state}`}>
                        <td>{skill.title}</td><td>{gradeShort(skill.grade)}</td><td>{STATE[r.state]}{note}</td><td>{date(r.lastPlayed)}</td>
                        <td>
                          {r.state !== 'mastered' && <button type="button" className="pill pr-small" onClick={() => know(skill.id, true)}>כבר יודע ✓</button>}
                          {r.byParent && <button type="button" className="pill pr-small" onClick={() => know(skill.id, false)}>בטל</button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </details>
          )
        })}
      </section>
    </>
  )
}

export function ParentsScreen() {
  const profiles = useStore(s => s.profiles)
  const current = useStore(s => s.current)
  const [open, setOpen] = useState(false)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const child = profiles.find(p => p.id === pickedId) ?? profiles.find(p => p.id === current?.id) ?? profiles[0]

  if (!open) return <Gate onPass={() => setOpen(true)} />
  return (
    <div className="pr" dir="rtl">
      <header className="top">
        <h1>דף הורים</h1>
        <Link className="pill" to="/profiles">🏠 <span>חזרה</span></Link>
      </header>
      {profiles.length === 0 && <p className="card pr-mute">עוד אין ילדים באפליקציה. אפשר לשחזר מגיבוי.</p>}
      {child && (
        <>
          <div className="pr-tabs" role="tablist" aria-label="ילדים">
            {profiles.map(p => (
              <button key={p.id} type="button" role="tab" aria-selected={p.id === child.id} className={`pill${p.id === child.id ? ' on' : ''}`}
                onClick={() => setPickedId(p.id)}>{p.avatar} {p.name} <small>{gradeName(p.grade)}</small></button>
            ))}
          </div>
          <Report key={child.id} child={child} />
          <Settings key={`s${child.id}`} child={child} />
        </>
      )}
      <BackupBox />
    </div>
  )
}
