# Feature guide — how to build a feature, start to finish

The step-by-step process for adding anything to this app: an island, a skill, a game, a shared UI piece or an
app screen. Follow it in order whether or not you know the repo. Each phase ends with a **gate**: do not start
the next phase until it is met.

This guide is the *sequence*. The quality bar for each step is `docs/PLAYBOOK.md`; the contracts are in
`docs/ARCHITECTURE.md`; the rules are in `CLAUDE.md`. When they disagree, `CLAUDE.md` wins. Then ask the planner.

## 0. Classify the feature

Find your row before doing anything else. It decides who works on the feature, whether it needs a spec, and where the code goes.

| Kind of feature | Example | Spec + user approval | Who | Code lives in |
|---|---|---|---|---|
| New island or stage | English island, math grades 3–6 | Yes, full spec | Planner, builders, content, reviewer | `src/subjects/<island>/` plus a T0 contract |
| New skill or game in an existing island | A new clock game | Yes. Either a spec section added to the island's spec, or a short new spec | Planner, then a builder | `src/subjects/<island>/` |
| New app screen or app feature | Parents' page, settings | Yes, full spec | Planner, with builders for separable parts | `src/app/`, `src/core/`, `src/ui/` |
| Shared capability that islands need | A new `PickOption` kind, per-language speech | Covered by the spec that needs it, as its T0 | Planner only | `src/core/`, `src/ui/` |
| Content change | Fix nikud, add words | No. A request or user instruction is enough | Content agent | `phrases.ts`, `content/**` |
| Bug fix or small tweak | Wrong option layout | No | Whoever owns the files | The owning directory |

For content changes and bug fixes, skip to §4 (build) and §6 (verify). Everything else goes through every phase.

## 1. Orient

1. Read `CLAUDE.md`, `docs/PLAYBOOK.md` and `docs/ARCHITECTURE.md`. Then read `docs/ROADMAP.md` for this stage, and `docs/DECISIONS.md`.
2. Check the "Current state" table in `CLAUDE.md`. It tells you what already exists. Then look for a similar feature that has already been built, and copy its shape:
   - **Pick-one-answer games:** `src/ui/pick/` and `src/subjects/english/index.ts`.
   - **Custom interactive widgets:** `src/subjects/clock/Clock.tsx` and `src/subjects/math/games-line.tsx`.
   - **Ordering and building games:** `OrderGame` in `src/subjects/reading/games.tsx`.
   - **Original drawings:** `src/subjects/thinking/art/` and `registerArt`.
3. Start from an up-to-date `main` with a clean tree, then create the branch:
   - Planner: `stage<N>/<topic>`.
   - Builder: `island/<name>/<task>`.
   - Docs-only work: `docs/<topic>`.

**Gate:** you can say in one sentence what the feature does for the child, and which row of §0 it is.

## 2. Spec (planner)

1. Copy `docs/specs/TEMPLATE.md` to `docs/specs/<feature>.md`. Match the depth of `docs/specs/clock.md` and `docs/specs/english.md`.
2. **Curriculum basis.** Cite the ministry source for every skill. If `docs/RESEARCH.md` doesn't cover it, research it online and add your findings there. Copy only patterns and mechanics from commercial products, never their content.
3. **Skills table.** For each skill give:
   - an ID prefixed with the island,
   - the grade,
   - its prerequisites (`requires`),
   - its sticker,
   - its games.

   For each game, also write:
   - what the child sees, hears and does,
   - what counts as correct,
   - what happens on a mistake,
   - the `itemKey` format, and whether the game `accepts` review items.
4. **Prefer what exists.** Reuse `PickGame`, `OrderGame` and the `ObjectGroup` layouts before you propose a new component. Write "No new game components" in the spec when that's true.
5. **Tasks table.** Split the work so that **no two parallel tasks touch the same file**. Every task names:
   - its owner,
   - its exact files,
   - what it depends on.

   The usual split:

   | Task | Owner | What it covers |
   |---|---|---|
   | T0 | Planner | Contracts: `types.ts`, `ids.ts`, any core or UI change, a `comingSoon` skeleton |
   | T1 | Content | `content/**`, `phrases.ts` and `content.test.ts` |
   | T2 | Builder | `generators*.ts` and their tests |
   | T3 | Builder | New game components and their tests |
   | Last | Planner + reviewer | Wiring `index.ts`, E2E, screenshots |
6. **Acceptance criteria.** Write them as testable statements. Name the unit tests, the E2E rounds and the screenshots they need.
7. **Ask the user** short, specific questions about real choices only, for example "recorded or browser voice?" Put your recommendation first. Record each answer in the spec. Answers that are costly to reverse also go in `docs/DECISIONS.md` as a new entry; never edit an old entry.
8. Set **Status: Draft** and commit.

**Gate:** the user has approved the spec. Set **Status: Approved by user on YYYY-MM-DD**. No building before this.

## 3. Contract first — T0 (planner)

Parallel work is only safe once everything it shares is fixed. Before any builder starts:

1. Write the island's `types.ts` (content shapes and question types) and `ids.ts`:
   - `ids.ts` holds the phrase-ID helpers, plus a header comment that lists what each task exports. See `src/subjects/english/ids.ts`.
2. Make every core or UI change the spec needs, with tests. Then update `docs/ARCHITECTURE.md` if a contract changed.
3. Add a skeleton `index.ts` with `comingSoon: true` so the island shows on the map and the tree compiles.
4. Run `npm run check` **and** `npm run build`. A core change can pass the checks and still break the production build.
5. Commit, and write down the commit hash. It is the **base commit** for every builder.

**Gate:** check and build are green, and the contract is committed.

## 4. Build in parallel (builders and content)

1. The planner starts at most **three** agents at a time, each in its own worktree (`isolation: "worktree"`). Each one gets a brief written from the template below.
2. **The agent's first command** is `git log -1 --oneline`. If the result is not the base commit, the agent creates its branch from the base commit. Worktrees can start from `main`.
3. Each agent follows `docs/PLAYBOOK.md` §1–§2:
   - Write pure logic first, then the UI.
   - Generators use `ctx.rng` only.
   - Components call `onAttempt` once per try.
   - All text comes from `phrases[id]`.
   - Styles use theme tokens only.
4. If the agent needs something outside its files, it stops and writes a request in `docs/requests/YYYY-MM-DD-topic.md`. It never edits shared code.
5. **Never wire unmerged work into `src/`.** All islands load together, so one broken import breaks the whole app. Draft wiring stays outside `src/` until its inputs are merged.

### Brief template (the planner fills it in)

```
Role: builder | content. Follow .claude/agents/<role>.md and docs/PLAYBOOK.md.
Spec: docs/specs/<feature>.md, task T<n>: <one line>.
Base commit: <hash> on branch <stage branch>. First run `git log -1 --oneline`; if different, branch from <hash>.
Your branch: island/<name>/<task>.
You own exactly: <file list>. Do not edit anything else.
Contract to build on: <types.ts / ids.ts / core APIs, with paths>.
Imitate: <reference files>.
Tests you must add: <list, e.g. "every generator over ≥ 200 seeds: answer reachable, no duplicate options, phrases exist">.
Done: npm run check green, tests listed above pass, self-review (PLAYBOOK §4) done, committed.
Report: PLAYBOOK §5 — what you built, files, commands run and results, what is not done or unsure.
```

**Gate:** every task branch reports green `npm run check` and a full PLAYBOOK §5 report.

## 5. Review and merge (planner + reviewer)

Do these for each task branch, one branch at a time:

1. **Code review.** The reviewer follows `.claude/agents/reviewer.md`. It reads the full diff, runs `npm run check`, and reports must-fix findings before suggestions. Fix every must-fix finding.
2. **Full content review.** All child-facing text needs this, every item and not a sample. An Opus reviewer reads each item as a Hebrew or English editor and a teacher would, checking these points:
   - **Language:** grammar, gender agreement and nikud are correct.
   - **Answers:** exactly one right answer, and wrong options that are plausible.
   - **No give-aways:** the picture or hint does not reveal the answer.
   - **Real practice:** ask "could a child get this right without the skill?"
   - **Silent options:** in listening games, the options make no sound.
   Tests have never caught these problems; past reviews found 25–52 issues per island.
3. Merge with `git merge --no-ff` into the stage branch, using the message `Merge T<n>: <topic>`. Run `npm run check` again after **each** merge.
4. Delete the worktree after its branch is merged.

**Gate:** all tasks are merged and the check is green after the last merge.

## 6. Integrate and verify (planner + reviewer)

1. Wire `index.ts`: skills, games and phrases. Remove `comingSoon`.
2. Write `e2e/<island>.spec.ts`. Use the helpers in `e2e/helpers.ts`:
   - `createProfile` creates a profile.
   - `master` unlocks later skills.
   - `atQuestion` waits for each question.

   Each test plays a full round through the real UI, by keyboard where possible. Never wait a fixed time. The pattern is in `e2e/english.spec.ts`.
3. Run `npm run check`, then `npm run e2e`. Run `npm run e2e` twice: "N passed" must match the number of tests both times.
4. **Look at it.** Take screenshots of every new screen and game state:
   - desktop 1280×860 and 390px wide,
   - light and dark mode.

   Inspect the layout, RTL (and LTR for English), overlap, contrast and touch target size (64px or more). If a screenshot surprises you, check the DOM before you change any code.
5. Try the unhappy paths:
   - wrong answers, until the hint aid turns on,
   - keyboard only,
   - reload in the middle of a round,
   - dark mode.
6. Run `npm run dev`, open `#/studio`, and confirm that every new phrase is listed.

**Gate:** everything in the spec's acceptance criteria is checked, and you have seen it work.

## 7. Update the docs (same change, not later)

- `CLAUDE.md`: update the "Current state" row, "Current stage" and "Next steps".
- `docs/ROADMAP.md`: update the stage status.
- The spec: set the status to "Built, awaiting user play-test".
- `docs/ARCHITECTURE.md`: update it if a contract or a shared piece changed.
- `docs/DECISIONS.md`: add a new entry only for choices that are costly to reverse.
- `docs/PLAYBOOK.md`: if you hit a new kind of bug that tests missed, add a row to the lessons table.
- `docs/CREDITS.md`: list any new third-party asset with its license.

## 8. Hand off

1. Commit with small English commits in the imperative, for example `Finish the English island (Stage 6, T3)`.
2. **Do not push to `main`, force-push, or deploy.** The user pushes the branch, opens the PR and merges it.
3. Report to the user in a few lines:
   - what was built,
   - how it was verified (commands and results),
   - what is not done,
   - what the user should do next: play-test, and record phrases in the studio, with the count.
4. The feature is **done** only after the user has played it and approved it (Definition of Done in `CLAUDE.md`).

## Recipes

**A skill with a pick-one-answer game.** The generator returns a `PickQ`. `PickGame` renders it, and `accepts` enables review:

```ts
// generators.ts — pure, uses ctx.rng, honors ctx.avoid and ctx.review
export function colorQuestion(ctx: GenContext, words: readonly Word[]): PickQ { … }
export const colorAccepts = (words: readonly Word[]) => (key: string) => words.some(w => w.id === key)

// index.ts
{
  id: 'eng.colors', title: 'Colors', grade: 1, requires: [], sticker: '🎨',
  games: [defineGame({ id: 'color', title: 'אֵיזֶה צֶבַע?', icon: '🎨', component: PickGame,
    generate: ctx => colorQuestion(ctx, WORDS), accepts: colorAccepts(WORDS) })],
}
```

**A new game component.**
- Write it against `GameProps<YourQ>`, where `YourQ extends Question`.
- It owns per-question state only, and is remounted for each question.
- Call `onAttempt(false)` on each miss and `onAttempt(true)` once, then ignore further input.
- Use real `<button>` elements with meaningful accessible names. A name must never reveal the answer.
- Anything you can drag must also work with the arrow keys.
- Test it in `games-<name>.test.tsx`.
- Test mixed input sequences, for example a drag followed by a tap.

**Phrases.**
- Declare every spoken line in `phrases.ts`, with an ID prefixed by the island (`clock.q.read`).
- Build long lines from short blocks: `say(['clock.q.set', 'clock.h.3', 'clock.half'])`.
- English text goes in `englishPhrases`, which is spoken by the en-US voice.

**Generator tests.** Use the pattern in `src/subjects/clock/generators.test.ts`. Loop over 200 or more `seeded` seeds, or over the whole input space, and assert:
- the answer is among the options **and can be reached through the UI**,
- there are no duplicate options,
- values stay in range,
- every phrase ID exists,
- `avoid` and `review` are honored,
- no wrong option is also correct.
