# Backlog

Open work that is not a roadmap stage, so any agent (or the user, another day) can pick it up.
`CLAUDE.md` "Next steps" lists what comes first; this file holds the details. Remove an item when it is done.

## Waiting for the user

- **Push and merge** these branches in order: `stage8/coding` (coding island, spoken island names, the "אב" icon), then `stage7/parents` when it is built.
- **Play-test and approve** the clock, letters, reading, numbers, thinking, English and coding islands. After the clock is approved, delete `legacy/`.
- **Record in the studio** (`npm run dev` → `#/studio`):
  - Re-record these: `hebrew.word.afroax` (אֶפְרוֹחַ), `hebrew.word.anav` (עֵנָב) and `hebrew.word.axavish` (עַכָּבִישׁ, said "akavish"). Their old takes were removed. Also `hebrew.word.nora` (now נוּרָה), `hebrew.word.sear` (שֵׂעָר, not שַׂעַר), the letter ק if it was said "kof" (now קוּף), the kangaroo syllables (קֶנְ־גּוּ־רוּ), and דְּלַעַת if it was said "dal'at".
  - New phrases: `app.locked`, `app.oneMore`, `hebrew.ui.reset` ("סוֹפְרִים מֵחָדָשׁ"), the 7 island names (`app.island.*`), and the coding island (about 90).
  - English sounds and blends are optional. They are in their own studio tab.
- **Question for the user:** the coding island's hand-washing story opens with 👆 for "open the tap". Check it is clear to a child.

## Nikud audit against the Academy of the Hebrew Language: done 2026-11-10

All 738 lemmas in the four groups (letters, reading and English, numbers and clock, thinking) were searched on hebrew-academy.org.il. The files are in `docs/audit/nikud/`, and `count.sh` prints the status. Every finding was applied.

Words left as they are by choice, flagged for the user:
- **אַרְנָב:** the Academy prefers אַרְנָבוֹן for a rabbit.
- **לָבַשׁ צָעִיף:** the Academy suggests כָּרַךְ for a scarf.
- **בָּאג:** the Academy's word is תֶּקֶל.

When content changes, check new words the same way: WebSearch with `allowed_domains: ["hebrew-academy.org.il"]`. The page title shows the pointed form.

## Small follow-ups

- `src/subjects/coding/board.tsx` `RoboShufi`: the eye colors `#fff` and `#1f2a5c` are hard-coded, the same as in `Mascot.tsx`. Move both to theme tokens.
- **Coding island, Stage 8b (grades 3–6):** conditions, functions, variables, binary numbers, sorting and searching. Plan it after the user plays 8a.
- **Later stages:** Stage 5 (math grades 3–6), Stage 2b (letter tracing, print first), and GitHub Pages deployment (needs the user's approval).
