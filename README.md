# Oli's Islands (Learn & Play)

Playful learning games for Israeli kids from kindergarten to 6th grade: telling time, Hebrew,
math and English. Hebrew RTL UI, an owl guide, and a world map of subject islands.
Runs fully in the browser with no server. Progress is saved locally on each device.

- What exists today and the rules for contributing: [`CLAUDE.md`](CLAUDE.md)
- How to build a feature, step by step: [`docs/FEATURE-GUIDE.md`](docs/FEATURE-GUIDE.md)
- Work stages and status: [`docs/ROADMAP.md`](docs/ROADMAP.md)
- Decisions and why they were made: [`docs/DECISIONS.md`](docs/DECISIONS.md)

## Working on another computer

### 1. Install once

- **Git**, with access to `git@github.com:ShamaySapir/GamesForKids.git` (add the computer's SSH key to GitHub).
- **Node.js 22 LTS or newer** (Vite needs ≥ 20.19 or ≥ 22.12). Check with `node -v`.
- **Claude Code** (optional, for working with the agents), signed in to your account.

### 2. Get the code

```sh
git clone git@github.com:ShamaySapir/GamesForKids.git
cd GamesForKids
npm ci                       # installs the exact versions from package-lock.json
npx playwright install       # only needed for end-to-end tests
```

If the work you want is on a branch, switch to it: `git switch <branch>`. List branches with `git branch -a`.

### 3. Run

```sh
npm run dev      # dev server, open the printed http://localhost URL
npm run check    # lint + typecheck + unit tests, must pass before merging
npm run e2e      # end-to-end tests (Playwright)
npm run build    # production build into dist/
```

### 4. Before switching computers

Commit and push your work, then pull on the other computer:

```sh
git add -A && git commit -m "..." && git push    # on the computer you are leaving
git pull                                          # on the computer you are moving to
```

Anything not pushed stays on the old computer only.

### What does *not* move with the repo

- **Kids' progress and profiles** live in each browser's local storage. They don't sync between computers.
- **Claude Code's personal memory and plan files** (under `~/.claude/` on each computer) are local.
  Everything the agents need to continue is in the repo: `CLAUDE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`.
  Starting Claude Code in the repo folder loads `CLAUDE.md` automatically.
- **Audio recordings** move only once they are committed to `src/audio/he/`.

## Audio recordings

Every spoken phrase has an ID. A recording at `src/audio/he/<phrase-id>.<mp3|m4a|ogg|webm|wav>` is
played if it exists; otherwise the browser's text-to-speech reads the phrase. With `npm run dev` running, open
`http://localhost:5173/#/studio` to see which phrases are still missing and record them. Each recording is saved straight into
`src/audio/he/` (a new take replaces the old one); commit the files to keep them. The studio is dev-only and is
not part of the published site.

## Project layout

```
src/
  app/        app shell, routes, screens, shared phrases
  core/       engine contracts, adaptive logic, progress, storage, audio
  ui/         theme tokens, owl mascot
  subjects/   one folder per island (clock, hebrew, math, english), each self-registering
  tools/      recording studio
  audio/he/   recordings, named by phrase ID
legacy/       original static prototype, kept for reference until the clock island fully replaces it
docs/         roadmap, decisions, specs
```

## Deploying

The site is live at **https://shamaysapir.github.io/GamesForKids/** (GitHub Pages, free). DECISIONS D20 has the details.

- **Every pull request** runs lint, types, unit tests and the Playwright E2E tests (`.github/workflows/ci-cd.yml`). If a test fails, its report is attached to the run.
- **Every merge to `main`** runs the same checks again and, only if all of them pass, builds and deploys the site. There is no separate deploy step: merging is deploying.
- **Speed:**
  - `node_modules` is cached by the lockfile (`.github/actions/deps`), so `npm ci` runs only when dependencies change.
  - The Playwright browser is cached by its version.
  - E2E runs on 4 workers.
  - The build the E2E tests ran against is the one that gets deployed.
  - Changes that touch only docs or `*.md` files skip the pipeline.
- **One-time setup** for a new copy of the repo, or after a settings mistake: run `scripts/setup-pages.sh`. You need the GitHub CLI logged in as a repo admin. The script enables Pages for the workflow and sets the repo's homepage link.
- **Custom domain, later:**
  1. Buy the domain.
  2. Add `public/CNAME` containing the domain name.
  3. Point the domain's DNS at GitHub Pages: a `CNAME` record to `shamaysapir.github.io`, or GitHub's `A` records for an apex domain.
  4. Run `CUSTOM_DOMAIN=your.domain scripts/setup-pages.sh`.

  No code change is needed, because the build uses a relative base path and hash routing.
- **What is public:** the whole app, including the recordings in `src/audio/he/`. The recording studio is never part of the build.
