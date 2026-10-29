import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { narrate, phrases, raw, say, sfx, stop } from '../../core/audio/audio'
import type { GameProps, PhraseRef } from '../../core/engine/types'
import { R, bookQuestionPhrase, bookTitlePhrase, pagePhrase } from './ids'
import type { BookQ, BookQuestion, OrderQ, Tile } from './types'
import './reading.css'

// Components keep per-question state; PlayScreen remounts them via `key` on each new question.

const DRAG_THRESHOLD = 8
const SHAKE_MS = 450
const NEXT_QUESTION_MS = 900
const SLOW_RATE = 0.75

/** Small replay button. Always a separate control, so playing a sound never answers or selects. */
function SayButton({ id, className = '' }: { id: PhraseRef; className?: string }) {
  return (
    <button type="button" className={`rb-say ${className}`} aria-label="🔊" onClick={() => void say(id)}>🔊</button>
  )
}

/* ---------- OrderGame ---------- */

interface Drag { id: string; sx: number; sy: number; dx: number; dy: number; moved: boolean }

export function OrderGame({ question, onAttempt }: GameProps<OrderQ>) {
  const { tiles, answer, layout } = question
  const [placed, setPlaced] = useState<string[]>([])
  const [shake, setShake] = useState<string | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [live, setLive] = useState('')
  const slots = useRef<(HTMLElement | null)[]>([])
  const suppressClick = useRef(false)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current) }, [])

  const byId = new Map(tiles.map(t => [t.id, t]))
  const done = placed.length === answer.length
  const loose = tiles.filter(t => !placed.includes(t.id))

  const place = (tile: Tile) => {
    if (done) return
    if (tile.id === answer[placed.length]) {
      const next = [...placed, tile.id]
      setPlaced(next)
      setLive(tile.text)
      sfx.tick()
      if (next.length === answer.length) onAttempt(true)
    } else {
      setShake(tile.id)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShake(null), SHAKE_MS)
      onAttempt(false)
    }
  }

  const click = (tile: Tile) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    place(tile)
  }

  const overSlot = (x: number, y: number) => slots.current.some(el => {
    const r = el?.getBoundingClientRect()
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  })

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, tile: Tile) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ id: tile.id, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false })
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.sx
    const dy = e.clientY - drag.sy
    setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD })
  }
  const onUp = (e: ReactPointerEvent, tile: Tile) => {
    if (!drag) return
    const { moved } = drag
    setDrag(null)
    if (!moved) return
    suppressClick.current = true
    if (overSlot(e.clientX, e.clientY)) place(tile)
  }

  const slotView = (i: number) => {
    const tile = placed[i] ? byId.get(placed[i]) : undefined
    const cls = tile ? ' filled' : i === placed.length && !done ? ' next' : ''
    return (
      <div key={i} ref={el => { slots.current[i] = el }} className={`rb-slot${cls}${done ? ' ok' : ''}`}>
        {layout === 'sentences' && <span className="rb-num" aria-hidden="true">{i + 1}</span>}
        {tile && <span className={`he-text ${layout === 'units' ? 'rb-unit' : 'rb-line'}`} dir="rtl">{tile.text}</span>}
      </div>
    )
  }

  return (
    <div className="rb-stage">
      <p className="rb-q">{phrases[question.instruction]}</p>
      {question.picture && <div className="rb-picture" aria-hidden="true">{question.picture}</div>}
      <div className={`rb-slots rb-slots-${layout}`}>{answer.map((_, i) => slotView(i))}</div>
      {done && layout === 'units' && (
        <div className="he-text rb-assembled" dir="rtl">{placed.map(id => byId.get(id)?.text).join('')}</div>
      )}
      <div className={`rb-tray rb-tray-${layout}`}>
        {loose.map(t => {
          const dragging = drag?.id === t.id && drag.moved
          return (
            <div key={t.id} className={`rb-tile-wrap${dragging ? ' dragging' : ''}`}
              style={dragging && drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}>
              <button type="button" className={`opt rb-tile${shake === t.id ? ' bad' : ''}`}
                onClick={() => click(t)} onPointerDown={e => onDown(e, t)} onPointerMove={onMove}
                onPointerUp={e => onUp(e, t)} onPointerCancel={() => setDrag(null)}>
                <span className={`he-text ${layout === 'units' ? 'rb-unit' : 'rb-line'}`} dir="rtl">{t.text}</span>
              </button>
              <SayButton id={t.say} />
            </div>
          )
        })}
      </div>
      <p className="rb-live" role="status" aria-live="polite">{live}</p>
    </div>
  )
}

/* ---------- BookGame ---------- */

interface PageProps {
  bookId: string
  index: number
  text: string
  scene: string
  slow: boolean
}

/** One page. Keyed by page index so the highlight resets when the page changes. */
function BookPage({ bookId, index, text, scene, slow }: PageProps) {
  const [word, setWord] = useState<number | null>(null)
  const run = useRef(0)
  useEffect(() => () => { run.current++; stop() }, [])

  const toggle = () => {
    if (word !== null) {
      run.current++
      stop()
      setWord(null)
      return
    }
    const mine = ++run.current
    void narrate(pagePhrase(bookId, index), i => { if (mine === run.current) setWord(i) }, slow ? SLOW_RATE : 1)
      .then(() => { if (mine === run.current) setWord(null) })
  }
  const tap = (w: string) => {
    run.current++
    setWord(null)
    void say(raw(w))
  }

  return (
    <>
      <div className="rb-scene" aria-hidden="true">{scene}</div>
      <p className="he-text rb-text" dir="rtl">
        {text.split(/\s+/).filter(Boolean).map((w, i) => (
          <button key={i} type="button" className={`rb-word${word === i ? ' hl' : ''}`} onClick={() => tap(w)}>{w}</button>
        ))}
      </p>
      <button type="button" className={`rb-read${word !== null ? ' on' : ''}`} aria-label="🔊" aria-pressed={word !== null} onClick={toggle}>🔊</button>
    </>
  )
}

function QuestionView({ bookId, index, question, last, onWrong, onRight }: {
  bookId: string; index: number; question: BookQuestion; last: boolean; onWrong: () => void; onRight: () => void
}) {
  const [wrong, setWrong] = useState<number[]>([])
  const [right, setRight] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const choose = (i: number) => {
    if (right || wrong.includes(i)) return
    if (i !== question.answer) {
      setWrong(w => [...w, i])
      onWrong()
      return
    }
    setRight(true)
    sfx.good()
    if (last) onRight()
    else timer.current = setTimeout(onRight, NEXT_QUESTION_MS)
  }

  return (
    <div className="rb-stage">
      <p className="rb-q">{phrases[R.questions]}</p>
      <div className="rb-word-row">
        <p className="he-text rb-prompt" dir="rtl">{question.prompt}</p>
        <SayButton id={bookQuestionPhrase(bookId, index)} />
      </div>
      <div className="opts rb-opts">
        {question.options.map((o, i) => {
          const cls = right && i === question.answer ? ' ok' : wrong.includes(i) ? ' bad' : ''
          return (
            <button key={i} type="button" className={`opt rb-opt${cls}`} disabled={wrong.includes(i)}
              aria-label={o.text ?? o.scene} onClick={() => choose(i)}>
              {o.scene && <span className="rb-opt-scene" aria-hidden="true">{o.scene}</span>}
              {o.text && <span className="he-text rb-opt-text" dir="rtl">{o.text}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BookGame({ question, onAttempt }: GameProps<BookQ>) {
  const { book } = question
  const pages = book.pages.length
  // 0 = cover, 1..pages = pages, pages+1.. = comprehension questions
  const [step, setStep] = useState(0)
  const [slow, setSlow] = useState(false)
  const finished = useRef(false)

  const go = (to: number) => { stop(); setStep(to) }

  const finish = () => {
    if (finished.current) return
    finished.current = true
    onAttempt(true)
  }

  if (step === 0) {
    return (
      <div className="rb-stage rb-cover">
        <div className="rb-scene" aria-hidden="true">{book.cover}</div>
        <div className="rb-word-row">
          <h2 className="he-text rb-title" dir="rtl">{book.title}</h2>
          <SayButton id={bookTitlePhrase(book.id)} />
        </div>
        <button type="button" className="cta rb-start" onClick={() => go(1)}>{phrases[R.readBook]}</button>
      </div>
    )
  }

  if (step <= pages) {
    const i = step - 1
    const page = book.pages[i]
    if (!page) return null
    return (
      <div className="rb-stage">
        <BookPage key={i} bookId={book.id} index={i} text={page.text} scene={page.scene} slow={slow} />
        <button type="button" className={`pill rb-slow${slow ? ' on' : ''}`} aria-pressed={slow} onClick={() => setSlow(s => !s)}>🐢 {phrases[R.slow]}</button>
        <div className="rb-nav">
          <button type="button" className="pill rb-navbtn" onClick={() => go(step - 1)}>
            <span aria-hidden="true">→</span> {phrases[R.back]}
          </button>
          <span className="rb-pages digi" role="status" aria-label={`${step} / ${pages}`}>{step} / {pages}</span>
          <button type="button" className="cta rb-navbtn" onClick={() => go(step + 1)}>
            {phrases[i === pages - 1 ? R.questions : R.next]} <span aria-hidden="true">←</span>
          </button>
        </div>
      </div>
    )
  }

  const q = step - pages - 1
  const current = book.questions[q]
  if (!current) return null
  const last = q === book.questions.length - 1
  return (
    <QuestionView key={q} bookId={book.id} index={q} question={current} last={last}
      onWrong={() => onAttempt(false)} onRight={() => (last ? finish() : go(step + 1))} />
  )
}
