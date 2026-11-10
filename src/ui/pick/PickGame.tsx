import { useEffect, useRef, useState } from 'react'
import { phrases, say } from '../../core/audio/audio'
import type { GameProps, PhraseRef } from '../../core/engine/types'
import { ArtView } from './art'
import { Objects } from './Objects'
import { SayButton } from './SayButton'
import type { PickOption, PickPrompt, PickQ } from './types'
import './pick.css'

// Shared by all islands (DECISIONS D14). Remounted by PlayScreen for every question.
// Options speak only through their own 🔊 button, never on hover (user's choice: sound only when asked for).

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
    case 'picture': return o.caption
      ? <><span className="pk-emoji" aria-hidden="true">{o.emoji}</span><span className="he-text pk-caption">{o.caption}</span></>
      : <span className="pk-emoji" aria-hidden="true">{o.emoji}</span>
    case 'sound': return o.label === undefined
      ? <span className="he-text pk-opt-name">{phrases[o.say]}</span>
      : <span className="he-letter pk-opt-letter">{o.label}</span>
    case 'text': return o.lang === 'en'
      ? <span className="en-text pk-opt-name" dir="ltr">{o.label}</span>
      : <span className="he-text pk-opt-name" dir="rtl">{o.label}</span>
    case 'number': return <span className="pk-opt-number digi" dir="ltr">{o.label}</span>
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
    default: return o.label
  }
}

export function PickGame({ question, aid, onAttempt }: GameProps<PickQ>) {
  const [wrong, setWrong] = useState<string[]>([])
  const [right, setRight] = useState(false)
  const hinted = useRef(false)

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
            <div key={o.id} className="pk-opt-wrap">
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
