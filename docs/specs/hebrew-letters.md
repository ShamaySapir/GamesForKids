# Spec: Hebrew letters island (אי האותיות)

- **Status:** Approved by user on 2026-10-29 — in progress
- **Stage:** 2 (docs/ROADMAP.md)
- **Relies on:** DECISIONS D2, D3, D6, D7, D8 · docs/RESEARCH.md § "Hebrew letters and phonological awareness"
- **Reference implementation:** `src/subjects/clock/`

## Goal

Kindergarten (ages 4–6) to 1st grade. The child hears and plays with the sounds of words (rhyme, syllables,
opening and closing sounds), learns the 22 letters by name and sound, the five final letters, the same-sound
letters and the dagesh/shin-dot pairs. Reading with nikud is Stage 3; handwriting/tracing is Stage 2b (below).

## Curriculum basis

Follows the ministry's gan–2nd grade language curriculum and its required-goals file ([C], [G] in RESEARCH.md):

- Gan 4–5: rhyme, syllable segmentation and blending, opening syllable.
- Gan 5–6: opening consonant+vowel, opening consonant, closing consonant, letter names matched to shapes.
- 1st grade: all letters, finals, same-sound letters, בּ/ב כּ/כ פּ/פ שׁ/שׂ.
- Item formats mirror the ministry's RAMA 1st-grade test so practice matches how children are assessed.
- Where the ministry leaves a choice open (letter order), we use alphabetical groups for letter names and
  "continuous sounds first" for opening sounds, as [G] p.18 recommends.
- Digital guidance ([C] p.157–160): short, focused, large fonts, wide letter spacing, immediate feedback.

## Skills

| # | ID | Title (child-facing) | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|---|
| 1 | `hebrew.rhyme` | מילים מתחרזות | Gan | — | 🎵 | pick |
| 2 | `hebrew.syllables` | מוחאים כפיים להברות | Gan | — | 👏 | clap |
| 3 | `hebrew.opening-cv` | איך המילה מתחילה? | Gan | syllables | 🔍 | pick |
| 4 | `hebrew.opening-sound` | הצליל הפותח | Gan | opening-cv | 👂 | pick |
| 5 | `hebrew.closing-sound` | הצליל הסוגר | Gan | opening-sound | 🎯 | pick |
| 6 | `hebrew.letters-1` | אותיות א–ה | Gan | — | 🐣 | pick ×2 |
| 7 | `hebrew.letters-2` | אותיות ו–י | Gan | letters-1 | 🐥 | pick ×2 |
| 8 | `hebrew.letters-3` | אותיות כ–ס | Gan | letters-2 | 🐤 | pick ×2 |
| 9 | `hebrew.letters-4` | אותיות ע–ת | Gan | letters-3 | 🦜 | pick ×2 |
| 10 | `hebrew.letter-picture` | אות ותמונה | 1 | letters-4, opening-sound | 🖼️ | pick ×2 |
| 11 | `hebrew.finals` | אותיות סופיות | 1 | letter-picture | 🏁 | pick ×2 |
| 12 | `hebrew.same-sound` | אותיות שנשמעות אותו דבר | 1 | letter-picture | 👯 | pick |
| 13 | `hebrew.dagesh` | עם נקודה ובלי נקודה | 1 | letter-picture | ⚫ | sort |

### Skill details

1. **Rhyme.** Hear a word (with its picture); pick the picture that rhymes, 1 of 3. Distractors share the
   opening sound or the topic, not the ending. Item key: target word ID. Aid: the shared ending is spoken again ("…דוּר, כַּדּוּר").
2. **Syllables.** Hear a word with its picture; clap (tap the drum or press Space) once per syllable, then Check.
   Words of 1–4 syllables, spoken syllable by syllable when the aid is on. Item key: word ID.
3. **Opening consonant+vowel.** Hear a unit such as "סִי"; pick the picture whose word starts with it, 1 of 4 (RAMA 2c).
   Distractors start with the same consonant and a different vowel, or a different consonant and the same vowel.
4. **Opening sound.** Hear a consonant sound; pick the picture whose word starts with it, 1 of 4 (RAMA 2a).
   Level A: continuous sounds only (ש ז ס ל ר מ נ ח); level B after a first mastered round: all consonant sounds.
   Words starting with א/ע/ה (vowel-initial) are excluded. Item key: sound ID.
5. **Closing sound.** See a picture and hear its word; pick its last sound, 1 of 3 sound buttons (each shows the
   letter and plays the sound) (RAMA 2b). Only words ending in a consonant sound.
6–9. **Letter names, in four alphabetical groups.** Game A "find the letter": hear a letter's name, pick it from 4
   (distractors include its look-alikes: ב/כ, ד/ר, ה/ח/ת, ו/ז/ן, ג/נ, ס/ם, ע/צ). Game B "what's its name": see a
   big letter, pick its name from 3 spoken buttons. Name or sound wording follows [C] p.74: the owl says
   "זו האות מֵם, והיא אומרת מְ". Item key: letter.
10. **Letter ↔ picture.** Game A: see a letter, pick the picture whose word starts with its sound (like the
    prototype). Game B: see a picture, pick its first letter from 4. Uses same-sound pairs only after skill 12.
11. **Finals.** Game A: see a regular letter, pick its final form (and the reverse). Game B: a picture and its
    word missing the last letter; pick the regular or final form.
12. **Same-sound letters.** A picture and its word with nikud missing its first letter; pick between the
    same-sound letters (ט/ת, כ/ח, ס/שׂ, ב/ו, א/ע/ה, כּ/ק). Item key: word ID.
13. **Dagesh and shin dot.** Sort 6 spoken picture-words into two baskets: בּ vs ב, כּ vs כ, פּ vs פ, שׁ vs שׂ
    (one pair per board). Mouse: drag or click card then basket; keyboard: Tab to a card, ← → to a basket, Enter.
    Round = 3 boards. Item key: board pair + word IDs.

## Games (mechanics)

Three components, shared by all skills:

| Component | Child does | Correct when | Notes |
|---|---|---|---|
| `PickGame` | Hears/sees a prompt (picture, letter, word with a blank, or a sound) and picks one option (picture, letter, or 🔊 sound button) | Picks the right option | Like the clock's read game: wrong option shakes and is disabled. Every picture/sound option can be replayed (hover or a small 🔊) |
| `ClapGame` | Taps a drum once per syllable, sees dots fill, presses Check | Tap count = syllables | Reset button; aid speaks the word syllable by syllable |
| `SortGame` | Moves 6 cards into 2 baskets | All cards in the right basket | A wrong drop returns the card and counts as a miss; `onAttempt(true)` once the board is done |

Text with nikud is shown in Noto Sans Hebrew at ≥ 40px with wide letter spacing (DECISIONS / RESEARCH: fonts).
Big letters are ≥ 96px.

## Data model (`src/subjects/hebrew/types.ts`, written by the planner first)

```ts
type SoundId = 'b' | 'v' | 'g' | 'd' | 'z' | 'x' | 't' | 'y' | 'k' | 'l' | 'm' | 'n' | 's' | 'p' | 'f' | 'ts' | 'r' | 'sh' | 'h'
interface Letter { char: string; name: string /* phrase ID */; sound?: SoundId; final?: string; lookAlike: string[] }
interface Word {
  id: string            // 'kadur'
  text: string          // 'כַּדּוּר' (full nikud)
  emoji: string         // '⚽'
  syllables: string[]   // ['כַּ', 'דּוּר'] — joined equals text
  opening: string       // first consonant+vowel unit with nikud: 'כַּ'
  first: SoundId | null // null when vowel-initial (א/ע/ה)
  last: SoundId | null  // null when ending in a vowel
  rhyme?: string        // rhyme group ID: 'ur'
}
```

## Content (`content/`, by the content agent)

- `letters.ts`: 22 letters + 5 finals, in alphabetical order, with names, sounds and look-alikes.
- `words.ts`: **at least 120 words**, each picturable by one unambiguous emoji, familiar to a 5-year-old,
  with correct nikud and syllables. Coverage: every consonant sound opens ≥ 4 words; ≥ 25 words end in a
  consonant sound; ≥ 12 rhyme groups of ≥ 2 words; ≥ 6 words for each of בּ ב כּ כ פּ פ שׁ שׂ; ≥ 4 words for
  each same-sound letter; 1–4 syllables, mostly 2–3.
- A test (`content.test.ts`) checks all of the above mechanically, plus: syllables join to the text, `opening`
  is a prefix of the text, every emoji is unique, every phrase referenced exists.

## Phrases and recordings

IDs: `hebrew.word.<id>`, `hebrew.letter.<char>` (name), `hebrew.sound.<soundId>`, `hebrew.cv.<unit>`,
`hebrew.syl.<wordId>` (word said syllable by syllable), `hebrew.q.*` (instructions).
Estimate: ~120 words + ~40 syllable-by-syllable words + 27 letter names + 19 sounds + ~25 opening units +
~15 instructions ≈ **250 short recordings** (~10 minutes of audio, ~1 hour in the studio).
Browser TTS cannot say isolated sounds ("מְ") reliably, so skills 4, 5 and the sound buttons need recordings
before release; the studio should list `hebrew.sound.*` and `hebrew.cv.*` first.

## Acceptance criteria

- `content.test.ts` passes (coverage numbers above).
- `generators.test.ts` over ≥ 200 seeds per generator: answer among options, no duplicate options, distractors
  never also correct (e.g. two rhyming options, two pictures with the same opening sound), every phrase exists,
  review items honored, vowel-initial words never used for opening sound.
- `e2e/hebrew.spec.ts`: plays a full round of rhyme (pick), syllables (clap, by keyboard) and dagesh (sort, by keyboard).
- Screenshots of every game, desktop + 390px, light + dark, inspected; nikud renders correctly in Chrome and Safari.
- The island replaces the `comingSoon` placeholder and appears on the map; stickers appear in the album.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | Types, Noto Sans Hebrew font + `.he-text` / `.he-letter` classes, island skeleton | planner | `src/subjects/hebrew/types.ts`, `src/ui/theme.css`, `package.json`, `src/main.tsx` | — |
| T1 | Letters, words, rhymes, phrases + content test | content | `src/subjects/hebrew/content/**`, `phrases.ts`, `content.test.ts` | T0 |
| T2 | Pure generators for all 13 skills + tests (use small fixtures, not T1's data) | builder A | `generators.ts`, `generators.test.ts` | T0 |
| T3 | `PickGame`, `ClapGame`, `SortGame` + styles | builder B | `games.tsx`, `hebrew.css` | T0 |
| T4 | Wire skills in `index.ts`, E2E test, screenshots | planner + reviewer | `index.ts`, `e2e/hebrew.spec.ts` | T1–T3 |

T1, T2 and T3 run in parallel; they share only `types.ts`, which is fixed in T0.

## Out of scope (later)

- **Stage 2b – letter tracing:** no official stroke-order chart exists; strokes would be authored by hand for
  27 forms, and 1st grade teaches both print and cursive (emphasis on cursive). Needs its own spec and a decision on which script first.
- Syllable deletion (כפתור − כף), phonetic spelling, reading with nikud (Stage 3).
