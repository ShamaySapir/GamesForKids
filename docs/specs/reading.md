# Spec: Reading island (אי הקריאה)

- **Status:** Approved by user on 2026-10-29 — in progress
- **Stage:** 3 (docs/ROADMAP.md)
- **Relies on:** DECISIONS D3, D6, D7, D8, D11 · docs/RESEARCH.md § "Nikud and reading, 1st–2nd grade"
- **Builds on:** the letters island (`src/subjects/hebrew/`) — its words, letters, types and `PickGame`

## Goal

1st–2nd grade. The child learns to read the nikud signs, blends units into words, reads words, sentences and
very short stories with understanding, and listens to read-along books with each word highlighted as it is read.

## Curriculum basis

- Nikud order is **not binding** in the ministry documents, so the five vowel skills are **not chained** to each
  other: a child (or parent) can follow whatever order their school's reading method uses. Default suggested order
  on screen: a → i → o → u → e.
- Units are letter + sign (שִׁ) and letter + vowel letter (שִׁי); both spellings of a sound are taught together.
- Decoding path: unit → word → sentence → short text, always checked for meaning ("not reading for the sake of practice").
- Item formats mirror the ministry's: word→picture, sentence→picture, cloze, ordering sentences into a story, missing unit.
- Read-along books follow the curriculum's call for shared reading and its digital guidance (narration + word highlighting).
- **Excluded:** the timed 45-second fluency list — timers are not allowed for grades ≤ 2 (CLAUDE.md).

## Skills

| # | ID | Title (child-facing) | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|---|
| 1 | `reading.vowels-a` | קָמָץ וּפַתָּח | 1 | hebrew.letters-4 | 🅰️ | hear-unit, see-unit |
| 2 | `reading.vowels-i` | חִירִיק | 1 | hebrew.letters-4 | 🍦 | hear-unit, see-unit |
| 3 | `reading.vowels-o` | חוֹלָם | 1 | hebrew.letters-4 | 🍩 | hear-unit, see-unit |
| 4 | `reading.vowels-u` | שׁוּרוּק וְקֻבּוּץ | 1 | hebrew.letters-4 | 🦉 | hear-unit, see-unit |
| 5 | `reading.vowels-e` | צֵירֵה וּסֶגּוֹל | 1 | hebrew.letters-4 | 🥚 | hear-unit, see-unit |
| 6 | `reading.build` | בּוֹנִים מִילָּה | 1 | vowels-a | 🧱 | build |
| 7 | `reading.word-picture` | קוֹרְאִים מִילָּה | 1 | vowels-a | 📖 | read-word, picture-word |
| 8 | `reading.sentences` | קוֹרְאִים מִשְׁפָּט | 1 | word-picture | 📜 | sentence-picture |
| 9 | `reading.cloze` | הַמִּילָּה הַחֲסֵרָה | 2 | sentences | 🧩 | cloze |
| 10 | `reading.story-order` | מְסַדְּרִים סִפּוּר | 2 | sentences | 🗂️ | order |
| 11 | `reading.books` | סִפְרִיָּה | 1–2 | — | 📚 | one game per book |

Child-facing titles carry nikud because this island's readers are learning it.

### Skill details

1–5. **Vowels.** Each skill covers one vowel sound and all its spellings: a = ַ ָ (and final ָה), i = ִ ִי,
   o = ֹ וֹ, u = ֻ וּ, e = ֵ ֶ ֵי. Units are generated from the letters with a distinct sound (no א/ע/ה as
   onsets in this skill; בּ כּ פּ with dagesh; שׁ and שׂ distinct).
   - **hear-unit:** hear a unit ("מָ"); pick it from 4 written units. Distractors: the same letter with other vowels
     (from this vowel's neighbours), and the same vowel on look-alike letters (ב/כ, ד/ר, ה/ח/ת…).
   - **see-unit:** see a big written unit; three colored buttons (🔴 🟢 🔵), each with a 🔊 under it that plays a
     unit's sound; clicking the colored button answers. Distractors as above. *Two spellings of one sound are never both options.*
   - Item key: unit sound, e.g. `m-a`. Aid: the owl says "מֵם וְקָמָץ – מָ".
6. **Build a word.** A picture and its word's units as shuffled tiles (each tile plays its sound); the child places
   them right-to-left into slots (click a tile, or drag; keyboard: Tab + Enter). Uses the letters island's `syllables`.
   Wrong tile → shakes and returns (`onAttempt(false)` once per wrong placement). Item key: word ID.
7. **Word ↔ picture.** read-word: see a word with nikud, pick its picture of 4 (RAMA word reading). picture-word: see a
   picture, pick its written word of 3, where distractors differ by one unit or one sign (דָּג / דֹּב / דַּף) —
   precision, not guessing. Item key: word ID. Aid: the word is read aloud.
8. **Sentence → picture.** Read a short sentence (3–5 words, full nikud), pick the picture of 3. Pictures are
   1–3 emoji scenes; distractors share the subject or the object but not the meaning (🐱💤 vs 🐱🍼 vs 🐶💤).
9. **Cloze.** A sentence with one missing word; pick the word of 3 that makes sense. Distractors are real words of
   the same kind that don't fit the meaning, plus homophone pairs where the curriculum calls for them (עַל/אֶל).
10. **Story order.** Three sentences of a mini story, shuffled; order them 1-2-3 (same tile mechanic as build).
11. **Books.** A library of short original read-along books. A book is one "question": the child pages through it
    (each page: emoji illustration + 1–3 lines with nikud; 🔊 reads the page with each word highlighted as it is
    spoken; tapping a word reads that word), then answers 3 comprehension questions (pick a picture or a sentence).
    Each wrong answer is `onAttempt(false)`; finishing is `onAttempt(true)`. Round length 1. Item key: book ID.

## Games (mechanics)

| Component | Where | Used by |
|---|---|---|
| `PickGame` | reused from `src/subjects/hebrew/games.tsx`, extended in T0 with `text` options and a `sentence` prompt | 1–5, 7, 8, 9 |
| `OrderGame` | new, `src/subjects/reading/games.tsx` | 6 (unit tiles → word), 10 (sentences → story) |
| `BookGame` | new, `src/subjects/reading/games.tsx` | 11 |

## Core addition (T0): narration with word highlighting

`narrate(id, text, onWord)` in `src/core/audio/audio.ts`: plays the phrase and calls `onWord(i)` as word *i* of
`text` is spoken.
- **Recording present:** word times are estimated in proportion to word length over the recording's duration
  (good enough for short pages; a tap-along timing tool in the studio can come later).
- **No recording:** Web Speech `boundary` events give the character index → word index; if the voice sends no
  boundary events, the same proportional estimate over the utterance is used.
- Reading speed is adjustable (normal / slow) in the book reader.

## Data model (`src/subjects/reading/types.ts`, T0)

```ts
type Vowel = 'a' | 'i' | 'o' | 'u' | 'e'
interface Unit { key: string /* 'm-a' */; sound: SoundId; vowel: Vowel; spellings: string[] /* ['מַ','מָ'] */ }
interface Sentence { id: string; text: string /* nikud */; scene: string /* emoji */; tags: string[] /* subject/action/object */ }
interface Cloze { id: string; text: string /* with ___ */; answer: string; wrong: [string, string] }
interface Story { id: string; sentences: [string, string, string] /* sentence texts, in order */; scene: string }
interface Page { text: string; scene: string }
interface Book { id: string; title: string; pages: Page[]; questions: { prompt: string; options: { text?: string; scene?: string }[]; answer: number }[] }
```

## Content (`src/subjects/reading/content/`, by the content agent)

- `units.ts`: generated from the letters island's `LETTERS`: every distinct consonant sound × 5 vowels, with all spellings.
- `sentences.ts`: ≥ 40 sentences, 3–5 words, everyday and funny, each with an unambiguous emoji scene; tagged so
  distractor scenes can share a subject or object without matching.
- `cloze.ts`: ≥ 30 items. `stories.ts`: ≥ 12 three-sentence stories.
- `books.ts`: **5 original books**, 5–6 pages each, one per vowel stage (book 1 uses mostly קמץ/פתח words, book 5 uses all),
  warm and funny, with Shufi the owl as a recurring character; 3 comprehension questions per book. Original text only —
  no retelling of published books.
- All text with full, correct nikud; reuse the letters island's words where possible.
- `content.test.ts` checks: counts; every sentence/story/book word has nikud on every letter that needs it;
  emoji scenes are unique per sentence; cloze answers are not among the wrong options; books' vowel range matches their stage.

## Phrases and recordings

IDs: `reading.unit.<key>` (≈ 95: 19 sounds × 5 vowels), `reading.sentence.<id>` (≥ 40), `reading.cloze.<id>` (≥ 30, read
with "מָה" in place of the gap), `reading.story.<id>.<n>` (≥ 36), `reading.book.<id>.<page>` (≈ 28 pages) and
`reading.book.<id>.q<n>` (15), `reading.q.*` (~12). Words reuse the letters island's `hebrew.word.*`.
Estimate: **≈ 260 recordings**, most of them sentences (2–4 s) and pages (5–10 s): about 20 minutes of audio, ~1.5 hours in the studio.
Units (`reading.unit.*`) are listed first in the studio — TTS cannot say them.

## Acceptance criteria

- Content test passes. Generator tests over ≥ 200 seeds: answer among options; no distractor is also correct
  (two spellings of the same sound; two pictures matching the sentence; two words that fit the gap); phrases exist.
- `narrate` unit test with fake timers: word callbacks in order, last word reached at the end, stop cancels callbacks.
- E2E: one vowel round (hear-unit), one build round by keyboard, and one full book (all pages + 3 questions).
- Screenshots of every game and of the book reader (desktop + 390px, light + dark); highlighted word clearly visible in both themes.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | `narrate` + test; reading types; `PickGame` text option + sentence prompt; island skeleton; `--read` token; DECISIONS D11 | planner | `src/core/audio/**`, `src/subjects/reading/types.ts`, `src/subjects/hebrew/{types,games}.tsx`, `src/ui/theme.css` | — |
| T1 | Units, sentences, cloze, stories, 5 books, phrases + content test | content | `src/subjects/reading/content/**`, `phrases.ts`, `content.test.ts` | T0 |
| T2 | Generators for skills 1–10 and book questions + tests (fixtures) | builder A | `generators.ts`, `generators.test.ts` | T0 |
| T3 | `OrderGame`, `BookGame` + styles + tests | builder B | `games.tsx`, `reading.css`, `games.test.tsx` | T0 |
| T4 | Wire `index.ts`, E2E, screenshots, docs | planner + reviewer | `index.ts`, `e2e/reading.spec.ts` | T1–T3 |

## Out of scope

Timed fluency, speech recognition (the app cannot hear the child read), reading without nikud (grade 3),
morphology (prefixes/roots) — candidate for a later stage, tap-along word timing in the studio.
