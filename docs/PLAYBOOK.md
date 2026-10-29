# Playbook — how to do a task here

Mandatory for every agent and contributor. It defines the quality bar: a task is not done because the
code compiles; it is done when you have **seen it work** the way a child will use it.

## 1. Before you write code

1. Read `CLAUDE.md`, `docs/ARCHITECTURE.md`, and the spec for your task in `docs/specs/`.
   No approved spec → do not build; ask the planner.
2. Read the code you will touch **and** the matching part of the reference implementation
   (`src/subjects/clock/`). Copy its structure, naming and style.
3. Check the ownership rules in `CLAUDE.md`. If the task needs a change outside your directory, stop and
   write a request in `docs/requests/<date>-<topic>.md` (what you need, why, proposed API).
4. Write a short plan for yourself: files to add, functions and their signatures, tests, how you will verify.

## 2. While writing code

- **Pure first.** Domain logic and generators are pure functions with tests before any UI.
- **Use the contracts.** `defineGame`, `GameProps`, `say(id)`, `phrases[id]`, theme tokens. Don't invent parallel mechanisms.
- **Every user-visible behavior has a reason a child would care about.** Big targets (≥ 64px), one clear
  instruction, immediate feedback, no dead ends (every screen has a way back).
- **Mistakes are part of learning.** Wrong answer → `onAttempt(false)`, gentle feedback, the option stays
  visible but disabled. Never "wrong!", never lives, never a penalty timer for young grades.
- **Keyboard and touch are first-class.** Anything draggable also works with arrow keys; anything
  clickable is a real `<button>` (or has the right role) with an accessible name.
- **Comments explain *why*, not *what*.** Match the density of the surrounding code (low).
- **Hebrew content** is written carefully: correct gender agreement (hours and minutes are feminine:
  "שלוש", "עשר דקות"), correct nikud where children read, and checked against the cited curriculum source.

## 3. Verify — required, not optional

1. `npm run check` — lint, types, unit tests all green.
2. Unit tests cover, for every generator: the answer is reachable (among options / settable), no duplicate
   options, values inside the level's range, every phrase ID it emits exists, review items are honored.
   Loop over many seeds or over the full input space (the clock tests check all 720 times).
3. `npm run e2e` — your island's E2E test plays a full round through the real UI.
4. **Look at it.** Take screenshots (desktop 1280×860, and a narrow 390px width) of each new screen and
   game state and actually inspect them: layout, RTL direction, overlap, contrast, dark mode.
5. Try the unhappy paths by hand or in a test: wrong answers, the aid turning on, reload mid-way, keyboard only.

Bugs found this way in Stage 0–1 that compiled and passed unit tests:

| Bug | How it was caught | Lesson |
|---|---|---|
| `role="listitem"` on island buttons hid them from screen readers | E2E `getByRole('button')` failed | Never override a native role |
| Reload sent the child back to the profile picker | E2E reload step | Async load must finish before rendering routes |
| At 12:00 both clock hands overlap, so the hour hand can't be grabbed | E2E drag | Check interactive starting states, not just end states |
| Decorative map path didn't line up with mirrored RTL islands | Screenshot | Look at every screen in RTL |
| Parallel builders' worktrees started from `main`, not the feature branch with the contract files | Builders noticed missing `types.ts` | First command in a worktree: `git log -1` and compare with the commit in your brief; reset onto it if different |

## 4. Self-review before handing off

Read your own diff top to bottom as a reviewer would and answer each:

- [ ] Does it do exactly what the spec says — nothing missing, nothing extra?
- [ ] Any file touched outside my ownership? Any new dependency?
- [ ] Any `any`, `!` without a reason, unused code, debug leftovers, TODOs?
- [ ] Any hard-coded color, size, or Hebrew string that belongs in tokens / `phrases.ts` / `content/`?
- [ ] Any non-English text outside content files (DECISIONS D9)?
- [ ] Works in dark mode, RTL, keyboard-only, and at 390px width?
- [ ] Phrases: every ID exists, appears in the studio, and reads naturally aloud?
- [ ] Tests would fail if the logic were broken (not just "renders without crashing")?
- [ ] `CLAUDE.md` "Current state", `docs/ROADMAP.md` updated if status changed?

## 5. Report

End with a short, factual report: what was built, files changed, how it was verified (commands and their
results, screenshots looked at), what is **not** done or not verified, and any open question. If a test
fails or a step was skipped, say so plainly. Never claim something works without having run it.

## 6. Commit

Branch `island/<name>/<task>` (planner: `stage<N>/<topic>`). Small commits with English messages in the
imperative ("Add quarter-hour read game"). Never push to `main`, never force-push, never deploy without the user's approval.
