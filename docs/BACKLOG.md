# Backlog

Open work that is not a roadmap stage, so any agent (or the user, another day) can pick it up.
`CLAUDE.md` "Next steps" lists what comes first; this file holds the details. Remove an item when it is done.

## Waiting for the user

- **Push and merge** these branches in order: `stage8/coding` (coding island, spoken island names, the "אב" icon), then `stage7/parents` when it is built.
- **Play-test and approve** the clock, letters, reading, numbers, thinking, English and coding islands. After the clock is approved, delete `legacy/`.
- **Record in the studio** (`npm run dev` → `#/studio`):
  - **The mascot is now אוֹלִי (D21).** Re-record the 25 phrases that say his name: `app.hello`, `clock.day.wake`, and the read-along books (titles, pages and questions of butterfly, elephant, winter, kindergarten and key). They show as missing in the studio.
  - Re-record these: `hebrew.word.afroax` (אֶפְרוֹחַ), `hebrew.word.anav` (עֵנָב) and `hebrew.word.axavish` (עַכָּבִישׁ, said "akavish"). Their old takes were removed. Also the winter book's page 3 and its first question (`reading.book.winter.2` and `.q0`: "חָבַשׁ כּוֹבַע וְכָרַךְ צָעִיף"). Also `hebrew.word.nora` (now נוּרָה), `hebrew.word.sear` (שֵׂעָר, not שַׂעַר), the letter ק if it was said "kof" (now קוּף), the kangaroo syllables (קֶנְ־גּוּ־רוּ), and דְּלַעַת if it was said "dal'at".
  - Coding island phrases rewritten on 2026-11-10: every story caption now says what its picture shows, plus story titles (`code.story.*`), new instructions, `code.ui.add`, `code.ui.program` and `code.ui.pickArrow`. Record these after the stories changed, not before.
  - Re-record `reading.q.seeUnit` (now "אֵיךְ קוֹרְאִים אֶת זֶה? שִׁמְעוּ כָּל רַמְקוֹל וּבַחֲרוּ."); the old take was removed.
  - New phrases: `app.pickSkillStar`, `app.startHere`, `app.challengeTag`, `app.challenge`, `app.tryEasier`, `app.oneMore`, `hebrew.ui.reset` ("סוֹפְרִים מֵחָדָשׁ"), the 7 island names (`app.island.*`), and the coding island (about 90).
  - English sounds and blends are optional. They are in their own studio tab.
  - **Math grade 3 (Stage 5a):** the 18 number blocks to 10,000 (`math.k.2–9`, `math.andh.1–9`, `math.n.10000`), about 40 grade 3 instructions, hints, angle and triangle names (`math.q.*`, `math.hint.*`, `math.angle.*`, `math.ui.*`), and the arena lines (`app.sprint.*`). Word problems and the arena's score sentence are read by the browser voice; nothing to record for them.
- **Question for the user:** the coding island's hand-washing story opens with 👆 for "open the tap". Check it is clear to a child.

## Nikud audit against the Academy of the Hebrew Language: done 2026-11-10

All 738 lemmas in the four groups (letters, reading and English, numbers and clock, thinking) were searched on hebrew-academy.org.il. The files are in `docs/audit/nikud/`, and `count.sh` prints the status. Every finding was applied.

Words left as they are by choice, flagged for the user:
- **אַרְנָב:** the Academy prefers אַרְנָבוֹן for a rabbit.
- **בָּאג:** the Academy's word is תֶּקֶל.

When content changes, check new words the same way: WebSearch with `allowed_domains: ["hebrew-academy.org.il"]`. The page title shows the pointed form.

## Small follow-ups

- **Clock island, `clock.digital` (grade 3, user's choice 2026-11-10):** digital 12- and 24-hour time and durations in whole hours and minutes (new curriculum G3 p.18–19, docs/RESEARCH.md). A small spec addendum to `docs/specs/clock.md`, then one builder.
- **Link preview image:** `public/og.png` is rendered from `scripts/og.html` with `node scripts/make-og.mjs`. Re-render after changing the owl or the title.
- `src/subjects/coding/board.tsx` `RoboOli`: the eye colors `#fff` and `#1f2a5c` are hard-coded, the same as in `Mascot.tsx`. Move both to theme tokens.
- **Coding island, Stage 8b (grades 3–6):** conditions, functions, variables, binary numbers, sorting and searching. Plan it after the user plays 8a.
- **Later stages:** Stage 5b–5d (math grades 4–6, one per spec, D23), Stage 2b (letter tracing, print first).
