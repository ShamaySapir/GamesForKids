# CLAUDE.md

Guidance for every agent (and human) working in this repo. This is a **living document**:
the "Current state" and "Next steps" sections must be updated in the same change that alters the system.

## Start here

1. Read this file, then **`docs/PLAYBOOK.md`** (how to do any task — mandatory) and `docs/ARCHITECTURE.md`.
2. Check "Current state" and "Next steps" below and `docs/ROADMAP.md` to see where the project is.
3. If you have a role (`planner`, `builder`, `content`, `reviewer`), read its file in `.claude/agents/`.

## Project in one paragraph

**Lomdim Vemsachakim** ("Learn & Play") is a free, playful learning web app for Israeli kids from
kindergarten (gan chova) to 6th grade. Subjects: telling time (clock), Hebrew (letters, sounds, nikud,
reading, writing), math (counting to percent), and English (ABC, phonics, vocabulary). Content follows
the Israeli Ministry of Education curriculum. The UI is Hebrew and RTL; Shufi the owl guides the child
across a world map of subject "islands". Runs fully client-side (no server), installable as a PWA,
computer-first with touch support.

## Language rule

- **All repo text is English**: code, identifiers, comments, docs, specs, commit messages.
- The only exception is **child-facing text** (spoken phrases, on-screen labels for kids, letters and words
  being taught). Spoken and content text lives in `phrases.ts` and `content/**`; short UI labels may sit in JSX.

## Current state

> Update whenever something lands. Keep it factual and short.

| Area | Status | Notes |
|---|---|---|
| Docs & process | ✅ | This file, `docs/PLAYBOOK.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `RESEARCH.md`, `specs/`, `.claude/agents/` |
| Tooling | ✅ | Vite 8, React 19, TS strict, ESLint, Vitest, Playwright, PWA. `npm run check` and `npm run e2e` green |
| Core | ✅ | Contracts, session, adaptive + Leitner, progress, IndexedDB store, audio with TTS fallback |
| UI & app shell | ✅ | Theme tokens + dark mode, owl mascot, profiles, world map, island path, play screen, sticker book |
| Clock island | ✅ built, ⏳ awaiting user play-test | 7 skills, 5 games; spec `docs/specs/clock.md` |
| Recording studio | ✅ dev-only | `#/studio` under `npm run dev`; 0 of 91 phrases recorded so far (TTS fallback in use) |
| Hebrew letters island | 🟡 building | Spec approved; T0 done (`src/subjects/hebrew/types.ts`, Noto Sans Hebrew, `.he-text`/`.he-letter`); T1–T3 in parallel |
| Math / English islands | ⬜ placeholders | `comingSoon` stubs in `src/subjects/*/index.ts` |
| Legacy prototype | 📦 `legacy/` | Reference only; delete once the user approves the clock island |
| Git | ✅ | Stage 0–1 merged to `main` (PR #1). Current work: `stage2/hebrew-letters-spec` |

Current stage: **Stage 1** awaiting the user's play-test; **Stage 2** building.

## Next steps

1. User plays the clock island and approves (or lists changes); user records phrases in the studio. Then delete `legacy/`.
2. Stage 2: finish T1–T3 (parallel), then T4 (wire `index.ts`, E2E, screenshots); user records ~250 phrases.
3. Set up GitHub Pages deployment (user approval needed).

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (studio at `#/studio`) |
| `npm run check` | Lint + typecheck + unit tests — must be green before any merge |
| `npm run e2e` | Build, serve, run Playwright tests in `e2e/` (first time: `npx playwright install chromium`) |
| `npm run build` | Production build into `dist/` (static, GitHub Pages) |

## Where to find things

| What | Where |
|---|---|
| How to do a task, quality bar, self-review | `docs/PLAYBOOK.md` |
| Architecture, contracts, adding an island | `docs/ARCHITECTURE.md` |
| Work stages and status | `docs/ROADMAP.md` |
| Decisions and why | `docs/DECISIONS.md` |
| Curriculum, prior art, technical research | `docs/RESEARCH.md` |
| What to build for an island | `docs/specs/<island>.md` (template + clock example) |
| Requests from builders to the planner | `docs/requests/` |
| Third-party assets and licenses | `docs/CREDITS.md` |
| Agent roles | `.claude/agents/` |
| Reference implementation | `src/subjects/clock/` |

## Team and roles

See D8 in `docs/DECISIONS.md`.

| Role | Model | Owns |
|---|---|---|
| `planner` | Opus | `src/core/**`, `src/ui/**`, `src/app/**`, config, `docs/**`. Writes specs, splits work, reviews, merges |
| `builder` (≤3 in parallel) | Sonnet | One task from an approved spec, in its own worktree and branch, only inside `src/subjects/<island>/**` |
| `content` | Sonnet | `src/subjects/<island>/phrases.ts` and `content/**` |
| `reviewer` | Opus | Reviews branches before merge; writes or fixes `e2e/<island>.spec.ts` |

## Workflow per island

1. Planner writes `docs/specs/<island>.md` from the template, at the depth of `docs/specs/clock.md`.
2. **The user approves the spec** before any building starts.
3. Builders and content agents work in parallel, each in an isolated git worktree, following `docs/PLAYBOOK.md`.
4. Each branch: `npm run check` + `npm run e2e` green → reviewer pass → planner merges, one branch at a time.
5. Planner updates "Current state", "Next steps" and `docs/ROADMAP.md`.
6. The user plays it and approves → release.

## Rules

### Ownership and conflicts
- ✅ A builder works only inside its island directory `src/subjects/<island>/`.
- ⛔ Builders do not edit `src/core`, `src/ui`, `src/app`, `package.json`, or config files. If the core is
  missing something, stop and file a request in `docs/requests/` for the planner.
- ✅ Islands and their phrases self-register via `import.meta.glob` — there is no shared list to edit.
- ⛔ Two tasks running in parallel never touch the same file. The planner guarantees this when splitting work.

### Code
- ✅ TypeScript strict. Build on the contracts in `src/core/engine/types.ts`; wrap games in `defineGame`.
- ⛔ No new npm dependency without planner approval.
- ⛔ No `any`. No direct `localStorage`/IndexedDB — only `src/core/storage/store.ts` touches storage.
- ⛔ No direct `speechSynthesis` or `new Audio()` — all audio goes through `say(phraseId)` in `src/core/audio/audio.ts`.
- ⛔ No hard-coded colors — use tokens from `src/ui/theme.css` (each has a dark-mode value).
- ✅ Every question generator has tests over many seeds: answer reachable, no duplicate options, values in range, phrases exist.
- ✅ Match the surrounding code's style, naming and (low) comment density.

### Children's content and experience
- ⛔ No network calls, analytics, ads, external links, chat, or personal data beyond a local name and avatar.
- ⛔ No negative messages ("wrong!", "you failed"), no lives, no penalty timers for kindergarten to 2nd grade. A mistake leads to a hint and another try.
- ✅ Every instruction has a phrase ID and can be replayed (click the owl). Touch targets ≥ 64px. Everything works by keyboard. Respect `prefers-reduced-motion`. Works in RTL and dark mode.
- ✅ Educational content matches the ministry curriculum, with the source cited in the spec. Hebrew read by children carries correct nikud.
- ⛔ Do not copy images, sounds or content from commercial products — only patterns and mechanics. Assets must be openly licensed and listed in `docs/CREDITS.md`.

### Decisions
- ✅ Decisions that are costly to reverse get a short entry in `docs/DECISIONS.md`. Routine choices don't.
- ⛔ Never rewrite an old entry; add a new one that replaces it.
- ✅ Builders and content agents ask the planner in `docs/requests/` instead of deciding alone.

### Git
- ✅ One branch per task: `island/<name>/<task>` (planner: `stage<N>/<topic>`). Small commits, English messages.
- ⛔ No direct pushes to `main`, no `--force`, no deploy without the user's approval.

## Definition of Done (a game or skill)

`npm run check` and `npm run e2e` green · generator tests over many seeds · an E2E test plays a full round ·
screenshots inspected (desktop + 390px, light + dark) · all phrases in `phrases.ts` and visible in the studio ·
works by keyboard · PLAYBOOK self-review done · the user played it and approved.
