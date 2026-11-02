# Spec: English island (English Island)

- **Status:** Built, awaiting user play-test. Approved by user on 2026-11-02
- **Stage:** 6 (docs/ROADMAP.md)
- **Relies on:** DECISIONS D3, D6, D7, D8, D11, D14 · docs/RESEARCH.md § "English, elementary — detail"

## Goal

Pre-A1 to early A1 (grade 3 to grade 4, with listening games open from grade 1 as optional exposure): the child understands
spoken English words and classroom chunks, hears English sounds, knows the letters by name, sound and shape in both cases,
and starts decoding simple words and sentences — the order the ministry's Pre-Foundation and Building Blocks programs set.
Instructions stay in Hebrew (allowed by the guide); everything English is said in English.

## Curriculum basis

Listening/speaking first, then phonological awareness, then letters (names, sounds, shapes; upper and lower case together),
then decoding (closed syllables like *cat*, then *sh/ch/th*, then silent-e), then short sentences. Item formats mirror the
guide: pick the picture for a spoken word, rhyme, first sound, onset + rime blending, letter by name/sound, word ↔ picture,
minimal pairs for sounds Hebrew speakers confuse (b/p, v/w, ee/i). **The ministry's Lexical Bands file is not copied**
(all rights reserved): our word list is our own, common, picturable words in the spirit of Pre-Band I and Core I.

## Skills

| # | ID | Title | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|---|
| 1 | `eng.words-1` | Words: colors & numbers | 1 | — | 🎨 | hear-pick |
| 2 | `eng.words-2` | Words: animals & food | 1 | — | 🐶 | hear-pick |
| 3 | `eng.words-3` | Words: me, family & school | 1 | — | 🎒 | hear-pick |
| 4 | `eng.chunks` | Hello, how are you? | 3 | — | 👋 | chunk-picture, answer |
| 5 | `eng.sounds` | Sounds | 3 | words-2 | 👂 | rhyme, first-sound, blend |
| 6 | `eng.letters` | ABC | 3 | — | 🔤 | find-letter, big-small, letter-sound |
| 7 | `eng.first-letter` | First letter | 3 | letters, sounds | 🅰️ | picture-letter |
| 8 | `eng.cvc` | Read: cat, dog, sun | 3 | first-letter | 📖 | read-picture, build |
| 9 | `eng.pairs` | Listen carefully: b/p, v/w, ee/i | 4 | sounds | 🎧 | minimal-pairs |
| 10 | `eng.digraphs` | sh, ch, th | 4 | cvc | 🐑 | read-picture, build |
| 11 | `eng.magic-e` | Magic e: cap → cape | 4 | cvc | 🪄 | read-picture, which-word |
| 12 | `eng.sight` | Sight words | 4 | cvc | 👀 | hear-word |
| 13 | `eng.sentences` | Read a sentence | 4 | cvc, sight | 📜 | sentence-picture |

### Details

1–3. **Words by ear.** Hear a word (English), pick its picture of 4. Topic sets of ~15–25 words each; distractors from the
   same topic. Item key: word ID (Leitner).
4. **Chunks.** chunk-picture: hear "What's your name?" / "Good morning!" / "Thank you!", pick the matching picture situation.
   answer: hear a question, pick the fitting answer of 3 short English replies (read aloud on 🔊), e.g. "How old are you?" →
   "I'm eight." No speech recognition — speaking is practised by repeating, not graded.
5. **Sounds (oral, no letters).** rhyme: which picture rhymes with *cat* (hat / dog / sun). first-sound: which picture starts
   like *ball*. blend: hear /k/ + /at/, pick the picture (cat).
6. **Letters.** find-letter: hear a letter name, pick it of 4 (b/d/p/q and m/n look-alikes as distractors). big-small: match a
   capital to its lowercase. letter-sound: hear a sound, pick the letter.
7. **First letter.** See a picture (hear the word), pick its first letter of 4.
8. **CVC words.** read-picture: read *cat*, pick its picture of 4 (distractors share letters: *cap, cut, bat*). build: picture +
   shuffled letter tiles, place them **left to right**.
9. **Minimal pairs.** Hear *pig* or *big*, pick the picture; pairs chosen for Hebrew speakers (b/p, v/w, ee/i).
10–11. Same mechanics with *ship, chip, thumb…* and *cap/cape, kit/kite, hop/hope* (which-word: hear the word, pick its spelling of 2).
12. **Sight words.** Hear *the, is, I, you, my, and, it, in, on, a, he, she, we, said, was, they…*, pick it of 4 written words.
13. **Sentences.** Read "The cat is on the bed.", pick the picture of 3 (scenes share objects, differ in meaning).

## Language and direction (T0)

- Phrases may be English: a phrase value can be `{ text, lang: 'en-US' }`; `say()` uses the right TTS voice per part, so a Hebrew
  instruction followed by an English word works in one call.
- Text options, word/sentence prompts and order tiles get a direction: English is shown **left to right** in an English reading
  font (Andika — single-storey *a* and *g* like school print), never inside RTL text.
- `OrderQ` gets `direction: 'ltr'` so the first slot is on the left for English words.

## Audio

English is spoken by the browser voice (en-US), as the user chose (D17). Isolated sounds ("buh") and blends can't be said
exactly by a browser voice, so they are written as approximations and offered in the studio for optional recording.
Hebrew instructions are recorded like the other islands.

## Content (`content/`, by the content agent)

~120 original words across topics (colors, numbers 1–10, animals, food, body, family, school, toys, clothes, actions), each with
one unambiguous emoji; ~25 chunks with picture situations and answers; rhyme families; CVC (≥ 40), digraph (≥ 15), magic-e
pairs (≥ 12), minimal pairs (≥ 15), sight words (~30), sentences (≥ 25). Spelled correctly, American spelling, picturable.

## Acceptance criteria

- Content test: counts, unique emoji, CVC words truly consonant-vowel-consonant, minimal pairs differ in one sound, magic-e pairs
  differ only by the final e, rhymes truly rhyme, sentences only use taught words.
- Generator tests over ≥ 200 seeds; no distractor also correct (two rhyming pictures; two pictures starting with the same sound).
- `say` test: mixed Hebrew + English sequence picks the right voice per part.
- E2E: a words round, a letters round, a CVC build round (tiles left to right) by keyboard.
- Screenshots: English text is LTR in the English font, inside the RTL page, desktop + 390px, light + dark.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | Phrase language in core audio + studio; direction for text/word/sentence prompts and order tiles; English font; english types + IDs; skeleton | planner | `src/core/audio/**`, `src/ui/pick/**`, `src/subjects/reading/{types,games}.*`, `src/subjects/english/{types,ids}.ts` | — |
| T1 | Words, chunks, phonics sets, sentences, phrases + content test | content | `src/subjects/english/content/**`, `phrases.ts`, `content.test.ts` | T0 |
| T2 | Generators for all 13 skills + tests | builder | `generators.ts`, tests | T0 |
| T3 | Wire `index.ts`, E2E, screenshots, review | planner + reviewer | `index.ts`, `e2e/english.spec.ts` | T1, T2 |

No new game components: everything uses `PickGame` and `OrderGame`.

## Out of scope

Speech recognition, grammar drills, writing/tracing (Stage 2b covers tracing), Band I Core II (grades 5–6), reading longer texts.
