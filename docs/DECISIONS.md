# Decisions

Short log of decisions that are costly to reverse: architecture, dependencies, core contracts,
pedagogy, privacy. Not every choice belongs here. Newest at the bottom.
To change a decision, add a new entry that says which one it replaces; do not rewrite old entries.

Format: `D<N> · date · who decided` — the decision, then why in one line.

---

**D1 · 2026-10-29 · user** — Rebuild the static prototype as Vite + React + TypeScript PWA, deployed statically.
Why: many games and parallel builders need typed contracts; offline play; no server.

**D2 · 2026-10-29 · user** — Local child profiles (name + avatar) in IndexedDB. No server, accounts, analytics or network calls.
Why: children's privacy and nothing to host.

**D3 · 2026-10-29 · user** — The user records audio. Every phrase has an ID; `say(id)` plays the recording if present, else Web Speech TTS. An internal studio page lists and records phrases.
Why: browser Hebrew TTS is unreliable, especially for letter sounds and syllables.

**D4 · 2026-10-29 · user** — MVP is the clock island: reading an analog clock and dragging hands to set a time.

**D5 · 2026-10-29 · user** — Owl mascot, world map of subject islands, sticker rewards. Computer-first (mouse + keyboard), touch supported.

**D6 · 2026-10-29 · planner** — Content follows the Israeli Ministry of Education curriculum; each spec cites its source.
Clock: gan parts of the day · 1st whole hours · 2nd half/quarter · 3rd to the minute.

**D7 · 2026-10-29 · planner** — Mastery: a skill is mastered after two rounds at ≥80% first-try. Missed items return via a Leitner review queue.

**D8 · 2026-10-29 · user** — Opus planner owns shared code and specs; up to 3 Sonnet builders work in parallel worktrees, each only inside `src/subjects/<island>/`. Islands self-register via `import.meta.glob`, so no shared registry file.

**D9 · 2026-10-29 · user** — All repo text in English. Only child-facing content (Hebrew phrases and words) is in another language, kept in content files.

**D10 · 2026-10-29 · user** — The recording studio (`#/studio`) exists only in dev builds (`npm run dev`), not on the published site.
Why: no server means no real admin login, and recordings must be saved into the repo anyway.

**D11 · 2026-10-29 · planner** — An island may import another island's content, types and game components read-only
(the reading island reuses the letters island's words, `PickGame` and phrases). The owning island stays the only
place they are edited; contract changes go through the planner.
Why: avoids duplicating 190 words with nikud and a tested component; keeps one source of truth.

**D12 · 2026-10-29 · user** — The studio saves recordings through a dev-server endpoint (`scripts/studio-plugin.ts`)
straight into `src/audio/he/`, one file per phrase (a new take replaces the old). Replaces the folder picker / Downloads flow.
Why: recordings were landing in Downloads while the studio showed ✅; this works in every browser and ✅ means a real file.

**D13 · 2026-10-29 · user** — Letter tracing (Stage 2b) starts with print letters (דפוס); cursive (כתב) may follow later.
Why: the user's choice; print matches the letters children see in books and in the app.
