# Backlog

Open work that is not a roadmap stage, so any agent (or the user, another day) can pick it up.
`CLAUDE.md` "Next steps" lists what comes first; this file holds the details. Remove an item when it is done.

## Waiting for the user

- **Push and merge** these branches in order: `stage8/coding` (coding island, spoken island names, the "אב" icon), then `stage7/parents` when it is built.
- **Play-test and approve** the clock, letters, reading, numbers, thinking, English and coding islands. After the clock is approved, delete `legacy/`.
- **Record in the studio** (`npm run dev` → `#/studio`):
  - Re-record these: `hebrew.word.nora` (now נוּרָה), `hebrew.word.sear` (שֵׂעָר, not שַׂעַר), the letter ק if it was said "kof" (now קוּף), the kangaroo syllables (קֶנְ־גּוּ־רוּ), and דְּלַעַת if it was said "dal'at".
  - New phrases: `app.locked`, `app.oneMore`, `hebrew.ui.reset` ("סוֹפְרִים מֵחָדָשׁ"), the 7 island names (`app.island.*`), and the coding island (about 90).
  - English sounds and blends are optional. They are in their own studio tab.
- **Question for the user:** the coding island's hand-washing story opens with 👆 for "open the tap". Check it is clear to a child.

## Nikud audit against the Academy of the Hebrew Language

The user asked for every pointed word in the app to be checked against hebrew-academy.org.il.

- **How it works:** direct fetches return 403, but WebSearch with `allowed_domains: ["hebrew-academy.org.il"]` finds the dictionary pages, and each page title is the pointed form. The search quota is about 200 per turn, shared by all agents. Run at most two checkers at once.
- **Files:** `docs/audit/nikud/`, in four groups:
  - A: letters island
  - B: reading and English
  - C: numbers and clock
  - D: thinking island
- **What each group has:**
  - `<group>.tsv`: the tokens, each with its source location.
  - `<group>-checked.tsv`: one row per lemma, giving the Academy form or "no entry", the URL, or `NOT SEARCHED`.
  - `<group>-findings.tsv`: the problems found.
- **Status:** see the counts at the top of `docs/audit/nikud/README.md`.
- **Next step:** search the `NOT SEARCHED` rows, then apply the findings. Use the same nikud everywhere, because recordings are shared by identical text (`recordingId` in `src/core/audio/audio.ts`).
- **The coding island** was added after the audit split. It has had a full content review with Academy lookups, but it isn't in the four groups.

## Small follow-ups

- `src/subjects/coding/board.tsx` `RoboShufi`: the eye colors `#fff` and `#1f2a5c` are hard-coded, the same as in `Mascot.tsx`. Move both to theme tokens.
- **Coding island, Stage 8b (grades 3–6):** conditions, functions, variables, binary numbers, sorting and searching. Plan it after the user plays 8a.
- **Later stages:** Stage 5 (math grades 3–6), Stage 2b (letter tracing, print first), and GitHub Pages deployment (needs the user's approval).
