# Roadmap

Work stages, in order. Each stage ends with a demo the user plays and approves.
Status legend: ⬜ not started · 🟡 in progress · ✅ done.
Update this file (and the "Current state" table in `CLAUDE.md`) whenever a stage or task changes status.

## Stage 0 – Foundation ✅

Sequential, done by the planner alone, because it defines the contracts builders depend on.

| Task | Status | Output |
|---|---|---|
| Process docs | ✅ | `CLAUDE.md`, `docs/PLAYBOOK.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `RESEARCH.md`, `specs/TEMPLATE.md`, `.claude/agents/` |
| Move legacy prototype out of the root | ✅ | `legacy/` |
| Tooling: Vite + React + TS strict, ESLint, Vitest, Playwright, PWA | ✅ | config files, `npm run check`, `npm run e2e` |
| Core contracts and round engine | ✅ | `src/core/engine/` |
| Profiles + progress storage (IndexedDB) | ✅ | `src/core/storage/`, `src/core/progress/` |
| Audio: recording by phrase ID with TTS fallback, SFX | ✅ | `src/core/audio/` |
| Adaptive aid + mastery + Leitner review | ✅ | `src/core/adaptive/` |
| Theme tokens, owl mascot, world map, sticker book | ✅ | `src/ui/`, `src/app/screens/` |
| Island self-registration | ✅ | `src/app/islands.ts` |

## Stage 1 – Clock island (MVP) 🟡

| Task | Status |
|---|---|
| Spec `docs/specs/clock.md` | ✅ |
| SVG clock: draggable hands (mouse, touch, keyboard), snapping, visual aids, ghost hands | ✅ |
| `timePhrase` / spoken Hebrew times from 74 building blocks | ✅ |
| 7 skills, 5 games (hands, read, set, match, owl's day) | ✅ |
| Recording studio (dev-only, `#/studio`) | ✅ |
| Unit tests (19) and E2E tests (2) | ✅ |
| User play-test and approval | ⏳ |
| User records the 91 phrases | ⏳ |
| Merge to `main` | ✅ PR #1 |
| Delete `legacy/`, deploy to GitHub Pages | ⏳ needs user approval |

## Stage 2 – Hebrew: letters (kindergarten – 1st grade) ✅ built
Spec approved 2026-10-29: `docs/specs/hebrew-letters.md`. T0 ✅ · T1 content ✅ · T2 generators ✅ · T3 games ✅ (built in parallel) · T4 wiring + E2E + screenshots ✅ · user play-test ⏳ · 324 recordings ⏳.

Letter ↔ picture, opening/closing sound, rhyme and syllables, final letters, same-sound letters,
dagesh pairs, letter tracing with hand-authored SVG stroke paths.

## Stage 3 – Hebrew: nikud and reading (1st – 2nd grade) ✅ built
Spec approved 2026-10-29: `docs/specs/reading.md`. T0 ✅ · T1 content ✅ (full Hebrew review, 25 findings fixed) · T2 ✅ · T3 ✅ · T4 wiring + E2E + screenshots ✅ · user play-test ⏳ · recordings ⏳.

Configurable vowel order, letter+vowel syllables, blending into words, reading words and sentences
with pictures, dictation by dragging letters.
**Read-along books:** a book is split into pages; each page is recorded in the studio (page-level recording
mode) and words are highlighted while the page is read. Needs a long-recording mode and word timings in the studio.

## Stage 4 – Math: kindergarten – 2nd grade ⬜
Counting and comparing, number line, add/subtract to 10 → 20 → 100, place value, ten-frames, ½ and ¼, length.

## Stage 5 – Math: 3rd – 6th grade ⬜
Multiplication table arena + Leitner, division with remainder, order of operations, fractions, decimals,
percent and ratio, area / perimeter / volume, word problems.

## Stage 6 – English (mainly 3rd grade and up) ⬜
Pre-Foundation: listening, ABC, phonics, CVC words; then vocabulary from the ministry's Lexical Bands list.

## Stage 7 – Parents' page ⬜
Local progress summary per profile, mastered vs. needs-practice skills, settings.

From Stage 2 onward the planner writes the spec, the user approves it, and up to three builders work in parallel.
