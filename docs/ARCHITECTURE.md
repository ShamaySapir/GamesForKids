# Architecture

How the app is put together, and the contracts every island builds on. Read this before writing code.
The clock island (`src/subjects/clock/`) is the reference implementation: when in doubt, do what it does.

## Layers

```
src/
  main.tsx                  entry: font, theme, <App/>
  app/                      shell — planner-owned
    App.tsx                 routes (HashRouter); profile guard; dev-only studio route
    islands.ts              discovers islands via import.meta.glob — there is no list to edit
    phrases.ts              child-facing phrases shared by all islands (praise, greetings)
    TopBar.tsx, screens/    profile picker, world map, island path, play screen, sticker book
  core/                     platform — planner-owned, no React except where noted
    engine/types.ts         THE CONTRACTS: IslandDef, SkillDef, GameDef, Question, GameProps, defineGame
    engine/session.ts       pure round state machine: startSession → attempt → advance → done
    engine/random.ts        rng helpers; seeded() for deterministic tests
    adaptive/adaptive.ts    stars, mastery, adaptive aid, Leitner boxes (thresholds: DECISIONS D7)
    progress/progress.ts    pure: applyRound(progress, round) → new progress, stars, sticker
    storage/store.ts        zustand store; the ONLY module that touches IndexedDB
    audio/audio.ts          say(phraseId), sfx; the ONLY module that plays sound
  ui/                       shared visual pieces — planner-owned
    theme.css               all design tokens (colors, radius, tap size) + base classes
    Mascot.tsx              Shufi the owl: moods, speech bubble, click to replay
  subjects/<island>/        one folder per island — builder-owned
  tools/studio/             dev-only recording studio
  audio/he/                 recordings, named <phraseId>.<ext>
e2e/                        Playwright tests
legacy/                     original prototype, reference only, never imported
```

## The contracts (`src/core/engine/types.ts`)

```
IslandDef  { id, order, title, icon, color, skills: SkillDef[], phrases, comingSoon? }
SkillDef   { id, title, grade, requires: skillId[], sticker, games: GameDef[] }
GameDef<Q> { id, title, icon, generate: (ctx) => Q, component: (GameProps<Q>) => JSX, accepts?, roundLength? }
Question<A>{ itemKey, answer: A, say: PhraseRef }
GameProps<Q>{ question: Q, aid: boolean, onAttempt(correct: boolean) }
```

- **Island** = a subject on the map. **Skill** = one curriculum step with a grade, prerequisites and a sticker.
  **Game** = one mechanic (multiple choice, drag, match…) that practices a skill. A skill can have several games.
- **`generate(ctx)`** is a *pure* function: given `ctx.rng`, `ctx.avoid` (item keys already asked this
  round) and an optional `ctx.review` item, it returns a question. No React, no `Math.random` — use `ctx.rng`.
- **`itemKey`** identifies *what is being practiced* (`"3:30"`, `"בּ"`, `"7x8"`). It drives de-duplication
  within a round and Leitner review across rounds. Two questions about the same fact must share a key.
- **`accepts(key)`** lets the engine hand a due review item to the generator. Implement it when item keys
  are meaningful facts (clock times, letters, math facts); omit it for games whose keys are not reusable.
- **`component`** renders one question. It owns per-question UI state only; it is remounted for every
  question. It calls `onAttempt(false)` for each wrong try and `onAttempt(true)` once when solved, then
  ignores further input. It never decides when the round ends, never awards stars, never stores anything.
- **`defineGame({...})`** type-checks the game against its own question type. Always wrap games with it.

## A round, end to end

1. `PlayScreen` finds island → skill → game from the URL and checks `isUnlocked`.
2. It collects due review items for this skill (`dueItems` filtered by `game.accepts`).
3. `startSession` asks the generator for the first question (`ROUND_LENGTH` = 6, or `game.roundLength`).
4. If the profile has `autoSpeak`, `say(question.say)` speaks the instruction. The owl replays it on click.
5. The game calls `onAttempt`. A miss: `attempt(s, false)` → "try again" feedback, aid turns on after 2 misses
   in a row. A hit: praise, then `advance` after 1.1s.
6. When done: `recordRound` → `applyRound` updates stars, mastery, Leitner boxes and stickers, and saves.

## Audio (`src/core/audio/audio.ts`, DECISIONS D3)

- Every spoken line is a phrase ID declared in `src/subjects/<island>/phrases.ts` (or `src/app/phrases.ts`).
  IDs are prefixed with the island ID: `clock.q.read`.
- `say('clock.q.read')` or `say(['clock.q.set', 'clock.h.3', 'clock.half'])`. Recordings in `src/audio/he/`
  win; missing parts fall back to Web Speech (he-IL), joined into one utterance.
- Compose long phrases from short blocks (see `timePhrase` in `subjects/clock/time.ts`) so the number of
  recordings stays small.
- Show text from `phrases[id]` rather than repeating the Hebrew string in JSX.

## Storage (`src/core/storage/store.ts`, DECISIONS D2)

`useStore` holds profiles, the current profile and its `Progress`. Persistence is IndexedDB via
`idb-keyval`, wrapped so failures (private mode) never break play. Games never read or write storage.

## Adding an island — step by step

Use `src/subjects/clock/` as the model. File layout:

```
src/subjects/<island>/
  index.ts            export const island: IslandDef      ← discovered automatically
  phrases.ts          export const phrases: PhraseMap     ← discovered automatically
  content/*.ts        data: word lists, scenes, letter tables (child-facing text lives here)
  <domain>.ts         pure domain logic (like clock/time.ts)
  generators.ts       pure question generators + question types
  games.tsx           game components
  <Widget>.tsx        interactive widgets (like clock/Clock.tsx)
  *.css               island styles, using theme tokens only
  *.test.ts           unit tests next to the code
```

1. Replace the placeholder `index.ts` (it has `comingSoon: true`) once the first skill is playable.
2. Write domain logic and generators as pure functions first, with tests (`seeded` rng).
3. Write game components against `GameProps<YourQ>`; reuse theme classes (`opt`, `cta`, `card`, `pill`).
4. Declare every phrase; run the app and open `#/studio` to see them listed.
5. Add an E2E test in `e2e/<island>.spec.ts` that plays a full round.

## Styling

- Colors only from tokens in `src/ui/theme.css`; every token has a dark-mode value. Island accent = `--<island>` token.
- Base classes: `card`, `tile`, `pill`, `cta`, `opt`/`opts`, `dots`, `fb`, `digi` (forces LTR for digits like `3:30`).
- The app is RTL. Use logical properties (`inset-inline-start`, `margin-inline-end`), never `left`/`right`
  for layout. Anything with digits, times or math must be wrapped in `.digi` or `dir="ltr"`.
- SVG geometry is direction-neutral: set `direction: ltr` on the SVG (as `Clock` does).

## Tooling

| Command | What it runs |
|---|---|
| `npm run dev` | Vite dev server (studio available at `#/studio`) |
| `npm run check` | ESLint + `tsc -b` (strict) + Vitest — must be green before merging |
| `npm run e2e` | Builds, serves on :4173, runs Playwright (`e2e/`) |
| `npm run build` | Static production build with PWA service worker into `dist/` |

ESLint enforces some rules mechanically: no `any`, no `localStorage` / `speechSynthesis` / `new Audio()`
outside `core/audio`, `core/storage` and the studio, and the React hooks rules (including purity: no
`Date.now()` or `Math.random()` during render — use a `useState` initializer or an event handler).
