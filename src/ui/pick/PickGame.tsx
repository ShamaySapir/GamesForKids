import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { phrases, say } from '../../core/audio/audio'
import type { GameProps, PhraseRef } from '../../core/engine/types'
import { ArtView } from './art'
import { MathText, mathLabel } from './MathText'
import { Objects } from './Objects'
import { SayButton } from './SayButton'
import type { PickOption, PickPrompt, PickQ } from './types'
import './pick.css'

// Shared by all islands (DECISIONS D14). Remounted by PlayScreen for every question.
// Options speak only through their own 🔊 button, never on hover (user's choice) — except questions marked
// `hoverSays`, whose options are sounds shown as a speaker.
const HOVER_SAY_MS = 350

function PromptView({ prompt }: { prompt: PickPrompt }) {
  const { picture, letter, word, sentence, objects, expr, art } = prompt
  const en = prompt.lang === 'en'
  const textCls = en ? 'en-text' : 'he-text'
  const dir = en ? 'ltr' : 'rtl'
  return (
    <div className="pk-prompt">
      {picture && <div className="pk-picture" aria-hidden="true">{picture}</div>}
      {letter && <div className={`${en ? 'en-letter' : 'he-letter'} pk-big-letter`} dir={dir}>{letter}</div>}
      {word && (
        <div className={`${textCls} pk-word`} dir={dir}>
          {word.blank === 'start' && <span className="pk-blank" aria-label="_">_</span>}
          <span>{word.text}</span>
          {word.blank === 'end' && <span className="pk-blank" aria-label="_">_</span>}
        </div>
      )}
      {sentence && (
        <div className="pk-word-row">
          <p className={`${textCls} pk-sentence`} dir={dir}>{sentence.text}</p>
          {sentence.say && <SayButton id={sentence.say} />}
        </div>
      )}
      {objects && (
        <div className="pk-groups">
          {objects.map((g, i) => <Objects key={i} group={g} />)}
        </div>
      )}
      {expr && <div className="pk-expr digi" dir="ltr"><MathText text={expr} /></div>}
      {art && (
        // Patterns read in the page's direction (RTL): the first item is on the right.
        <div className="pk-art-row">{art.map((a, i) => <ArtView key={i} art={a} size={prompt.artSize ?? (art.length > 4 ? 72 : 120)} />)}</div>
      )}
    </div>
  )
}

type Speaking = Extract<PickOption, { say?: PhraseRef }>

/** Options can be silent (e.g. pictures whose sentence would give the answer away): `say` absent or empty. */
const hasSay = (o: PickOption): o is Speaking & { say: PhraseRef } =>
  'say' in o && !!o.say && (typeof o.say === 'string' || o.say.length > 0)

function optionFace(o: PickOption, speaker = false) {
  if (speaker && o.kind === 'sound') return <span className="pk-emoji" aria-hidden="true">🔊</span>
  switch (o.kind) {
    case 'picture': return o.caption
      ? <><span className="pk-emoji" aria-hidden="true">{o.emoji}</span><span className="he-text pk-caption">{o.caption}</span></>
      : <span className="pk-emoji" aria-hidden="true">{o.emoji}</span>
    case 'sound': return o.label === undefined
      ? <span className="he-text pk-opt-name">{phrases[o.say]}</span>
      : o.label.length > 2
        ? <span className="he-text pk-opt-name">{o.label}</span>
        : <span className="he-letter pk-opt-letter">{o.label}</span>
    case 'text': return o.lang === 'en'
      ? <span className="en-text pk-opt-name" dir="ltr">{o.label}</span>
      : <span className="he-text pk-opt-name" dir="rtl">{o.label}</span>
    case 'number': return <span className={`pk-opt-number digi${o.label.length >= 4 && !o.label.includes('/') ? ' long' : ''}`} dir="ltr"><MathText text={o.label} /></span>
    case 'objects': return <Objects group={o.group} size={30} />
    case 'art': return <ArtView art={o.art} size={96} />
    case 'letter': return <span className={`${o.lang === 'en' ? 'en-letter' : 'he-letter'} pk-opt-letter`} dir={o.lang === 'en' ? 'ltr' : undefined}>{o.label}</span>
  }
}

function optionLabel(o: PickOption): string {
  switch (o.kind) {
    case 'picture': return o.caption ?? o.emoji
    case 'sound': return o.label ?? phrases[o.say] ?? ''
    case 'objects': return `${o.group.count}`
    case 'art': {
      // A silhouette must not announce what it is: that is the answer.
      if (o.art.props?.silhouette) return '?'
      const ref = o.say ?? o.art.say
      return typeof ref === 'string' ? (phrases[ref] ?? o.art.name) : o.art.name
    }
    case 'number': return mathLabel(o.label)
    default: return o.label
  }
}

export function PickGame({ question, aid, onAttempt }: GameProps<PickQ>) {
  const [wrong, setWrong] = useState<string[]>([])
  const [right, setRight] = useState(false)
  const hinted = useRef(false)
  const hover = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverEnd = () => { if (hover.current) clearTimeout(hover.current) }
  useEffect(() => hoverEnd, [])
  const hoverStart = (e: ReactPointerEvent, o: PickOption) => {
    if (!question.hoverSays || e.pointerType !== 'mouse' || !hasSay(o)) return
    hoverEnd()
    const ref = o.say
    hover.current = setTimeout(() => void say(ref), HOVER_SAY_MS)
  }

  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const choose = (id: string) => {
    if (right || wrong.includes(id)) return
    const ok = id === question.answer
    if (ok) setRight(true)
    else setWrong(w => [...w, id])
    onAttempt(ok)
  }

  return (
    <div className={`pk-stage${question.hoverSays ? ' pk-hover-says' : ''}`}>
      <p className="pk-q">{phrases[question.instruction]}</p>
      <PromptView prompt={question.prompt} />
      {aid && question.aidArt && (
        <div className="pk-art-row pk-aid-art">{question.aidArt.map((a, i) => <ArtView key={i} art={a} size={question.prompt.artSize ?? 120} />)}</div>
      )}
      {aid && question.hint && (
        <button type="button" className="pill pk-hint" aria-label="🔊" onClick={() => void say(question.hint as PhraseRef)}>💡 🔊</button>
      )}
      <div className="opts pk-opts">
        {question.options.map(o => {
          const cls = right && o.id === question.answer ? ' ok' : wrong.includes(o.id) ? ' bad' : ''
          return (
            <div key={o.id} className="pk-opt-wrap" onPointerEnter={e => hoverStart(e, o)} onPointerLeave={hoverEnd}>
              <button type="button" className={`opt pk-opt pk-opt-${o.kind}${cls}`} disabled={wrong.includes(o.id)}
                aria-label={optionLabel(o)} onClick={() => choose(o.id)}>
                {optionFace(o, question.hoverSays)}
              </button>
              {hasSay(o) && <SayButton id={o.say} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
