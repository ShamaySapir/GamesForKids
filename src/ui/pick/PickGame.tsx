import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { phrases, say } from '../../core/audio/audio'
import type { GameProps, PhraseRef } from '../../core/engine/types'
import { ArtView } from './art'
import { Objects } from './Objects'
import { SayButton } from './SayButton'
import type { PickOption, PickPrompt, PickQ } from './types'
import './pick.css'

// Shared by all islands (DECISIONS D14). Remounted by PlayScreen for every question.

const HOVER_SAY_MS = 400

function PromptView({ prompt }: { prompt: PickPrompt }) {
  const { picture, letter, word, sentence, objects, expr, art } = prompt
  return (
    <div className="pk-prompt">
      {picture && <div className="pk-picture" aria-hidden="true">{picture}</div>}
      {letter && <div className="he-letter pk-big-letter">{letter}</div>}
      {word && (
        <div className="he-text pk-word" dir="rtl">
          {word.blank === 'start' && <span className="pk-blank" aria-label="_">_</span>}
          <span>{word.text}</span>
          {word.blank === 'end' && <span className="pk-blank" aria-label="_">_</span>}
        </div>
      )}
      {sentence && (
        <div className="pk-word-row">
          <p className="he-text pk-sentence" dir="rtl">{sentence.text}</p>
          {sentence.say && <SayButton id={sentence.say} />}
        </div>
      )}
      {objects && (
        <div className="pk-groups">
          {objects.map((g, i) => <Objects key={i} group={g} />)}
        </div>
      )}
      {expr && <div className="pk-expr digi" dir="ltr">{expr}</div>}
      {art && (
        // Patterns read in the page's direction (RTL): the first item is on the right.
        <div className="pk-art-row">{art.map((a, i) => <ArtView key={i} art={a} size={art.length > 4 ? 72 : 120} />)}</div>
      )}
    </div>
  )
}

type Speaking = Extract<PickOption, { say?: PhraseRef }>

/** Options can be silent (e.g. pictures whose sentence would give the answer away): `say` absent or empty. */
const hasSay = (o: PickOption): o is Speaking & { say: PhraseRef } =>
  'say' in o && !!o.say && (typeof o.say === 'string' || o.say.length > 0)

function optionFace(o: PickOption) {
  switch (o.kind) {
    case 'picture': return <span className="pk-emoji" aria-hidden="true">{o.emoji}</span>
    case 'sound': return o.label === undefined
      ? <span className="he-text pk-opt-name">{phrases[o.say]}</span>
      : <span className="he-letter pk-opt-letter">{o.label}</span>
    case 'text': return <span className="he-text pk-opt-name" dir="rtl">{o.label}</span>
    case 'number': return <span className="pk-opt-number digi" dir="ltr">{o.label}</span>
    case 'objects': return <Objects group={o.group} size={30} />
    case 'art': return <ArtView art={o.art} size={96} />
    case 'letter': return <span className="he-letter pk-opt-letter">{o.label}</span>
  }
}

function optionLabel(o: PickOption): string {
  switch (o.kind) {
    case 'picture': return o.emoji
    case 'sound': return o.label ?? phrases[o.say] ?? ''
    case 'objects': return `${o.group.count}`
    case 'art': return o.id
    default: return o.label
  }
}

export function PickGame({ question, aid, onAttempt }: GameProps<PickQ>) {
  const [wrong, setWrong] = useState<string[]>([])
  const [right, setRight] = useState(false)
  const hover = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hinted = useRef(false)

  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])
  useEffect(() => () => { if (hover.current) clearTimeout(hover.current) }, [])

  const choose = (id: string) => {
    if (right || wrong.includes(id)) return
    const ok = id === question.answer
    if (ok) setRight(true)
    else setWrong(w => [...w, id])
    onAttempt(ok)
  }
  const hoverStart = (e: ReactPointerEvent, o: PickOption) => {
    if (e.pointerType !== 'mouse' || !hasSay(o)) return
    const ref = o.say
    hover.current = setTimeout(() => void say(ref), HOVER_SAY_MS)
  }
  const hoverEnd = () => { if (hover.current) clearTimeout(hover.current) }

  return (
    <div className="pk-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <PromptView prompt={question.prompt} />
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
                {optionFace(o)}
              </button>
              {hasSay(o) && <SayButton id={o.say} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
