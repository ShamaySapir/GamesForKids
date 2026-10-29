# Research notes

Background gathered while planning (2026-10). Specs cite this file and the original sources.
Verify against the source before relying on a detail; curricula change.

## Israeli Ministry of Education curriculum

### Math (grade documents from 2006, still the base; 2025 guidance letter)

| Grade | Core topics |
|---|---|
| Gan | Number concepts, counting, comparing quantities; clock types and parts of the day |
| 1st | Numbers to 100, number line, odd/even, `<` `>` `=`; add/sub within 10, then 20, then whole tens; early ×/÷ within 20; length, polygons. **Clock: whole hours** (half hours for advanced pupils) |
| 2nd | Numbers to 1,000; column add/sub; ×/÷ intro, divisibility by 2/5/10, parentheses; **fractions ½ and ¼**; cm/m, area, weight. **Clock: hours, half and quarter hours, durations** |
| 3rd | Numbers to 10,000; **multiplication table to 10×10 by heart by year end**; column ×; division with remainder; order of operations; unit fractions; angles, parallel/perpendicular. **Clock: analog and digital to the minute**, seconds to days |
| 4th | Fractions formally, first operations; numbers to a million; long division; primes, divisibility by 3/6/9; powers; area and perimeter, box volume; calendar and time calculations; symmetry |
| 5th | Fractions and mixed numbers (simplify, expand, compare, add/sub); **decimals**; dividing by 2-digit numbers; average; quadrilaterals, heights, area |
| 6th | Fraction and decimal ×/÷, repeating decimals; **percent**; ratio, scale; solids, circle, volume |

About 20% of math time is geometry and measurement; word problems appear in every topic.
Sources: `https://meyda.education.gov.il/files/mazkirut_pedagogit/matematika/tochnyotlemud/kita1.pdf` … `kita6.pdf`;
`https://meyda.education.gov.il/files/Mazkirut_Pedagogit/math/primary-school/math2025/mafmar_yesodi2025.pdf`

### Hebrew (1st grade guidance, 2025–26)

- **Vowel order is not fixed nationally** ("varies between reading methods"). Ministry practice boards group:
  kamatz/patach/chataf-patach/shva → chirik → cholam → shuruk/kubutz → segol/tsere. Default to this; make it configurable.
- Required: all letters and vowel marks; אהו"י letters; same-sound letters ט/ת, ח/כ, ק/כ, ב/ו, ש/ס, א/ה/ע;
  dagesh pairs בּ/ב, כּ/כ, פּ/פ; final letters; writing each letter with correct stroke direction (rounded script).
- Phonological awareness: opening sound (צליל פותח), closing sound (צליל סוגר), segmenting and blending; rhyme and syllables in gan.
- Decoding: letter+vowel units blended into words (פִּי־צָה), then larger chunks by the end of 1st grade.
- Nikud is formally removed during 3rd grade.
- A new language curriculum for gan to 2nd grade is being published this school year — re-check before Stages 2–3.
Sources: `https://meyda.education.gov.il/files/Pop/0files/ivrit_hinuch_leshoni/Yesodi/horaa.pdf`;
`https://meyda.education.gov.il/files/Pop/0files/ivrit_hinuch_leshoni/Yesodi/tohnit-limudim-safa.pdf`;
`https://pop.education.gov.il/tchumey_daat/ivrit_chinhch_leshony/yesodi/pedagogy-hebrew-linguistic-education/teaching-hebrew-grade1`

### English (Curriculum 2020, elementary)

- Mandatory from 3rd grade. Pre-A1 (Pre-Foundation) in 3rd and early 4th: listening and speaking first,
  then alphabet knowledge and phonics, reading built sound → letter → fluency.
- A1: Band I Core I (4th to mid-5th), Core II (mid-5th to end of 6th). About 1,200 words by end of 6th.
- Word lists: the ministry's "Lexical Bands" Excel file, linked from the English elementary page. Use it as the word database.
- 10+ encounters are needed to master a word → spaced review (DECISIONS D7).
Sources: `https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/curriculum2020Elementary.pdf`;
`https://pop.education.gov.il/learning-plans/english/elementary/`

## Products we learn from (patterns only, never assets — CLAUDE.md)

| Product | Pattern we take |
|---|---|
| Khan Academy Kids | Guided path, adaptive difficulty, audio-first, collectible rewards, free with no ads |
| Teach Your Monster to Read | World map; each mini-game drills one skill; personal avatar |
| Matific (Israeli) | Short situation-based episodes mapped to the curriculum by grade |
| Endless Alphabet, Duolingo ABC | No failure state; short 2–5 minute lessons |
| Starfall | Click anything to hear it |
| Prodigy | Engagement from game framing (but avoid its paywall pressure) |

Gap in the market: Hebrew reading apps are small and few.

## Best practices (research-backed)

- Hirsh-Pasek et al. 2015 ("four pillars"): active (thinking, not just tapping), engaged without distracting
  extras, meaningful (real-life context), socially interactive. `https://www.psychologicalscience.org/publications/educational-apps.html`
- Mastery-based progression; spaced repetition (Leitner); immediate informative feedback; adaptive help;
  short sessions for young children; spoken instructions with replay for pre-readers; multi-sensory (trace + hear + say).

## Technical notes

- **Hebrew TTS:** iOS has a he-IL voice; Android Chrome may list he-IL yet fall back to English; desktop Chrome
  often has none (Windows has "Asaf"). Isolated letter sounds and syllables are unreliable → record them (DECISIONS D3).
  Offline neural options for pre-generating: Phonikud, HebTTS.
- **Letter tracing:** no open Hebrew stroke-order dataset exists; author SVG stroke paths for 27 forms and check
  direction plus rough path with generous tolerance. English printable tracing SVGs: `github.com/domsson/tracedletters`.
- **Fonts (OFL):** Rubik (UI, bundled via `@fontsource-variable/rubik`); Noto Sans Hebrew or Alef for text with nikud
  (most reliable mark placement — verify visually); Playpen Sans Hebrew for handwriting practice.
- **Images:** OpenMoji (CC BY-SA 4.0), Twemoji (CC BY 4.0), Noto Emoji (Apache 2.0). Record any use in `docs/CREDITS.md`.
