# Spec: Clock island

- **Status:** Done (Stage 1 MVP). Scope approved by the user with the project plan on 2026-10-29.
- **Stage:** 1 (docs/ROADMAP.md)
- **Relies on:** DECISIONS D3, D4, D5, D6, D7 · docs/RESEARCH.md § Math

This spec is also the worked example of `TEMPLATE.md`.

## Goal

Kindergarten to 3rd grade. The child learns the two hands, then reads and sets an analog clock in steps:
whole hours → half → quarter → every 5 minutes → every minute, plus daily-routine times.

## Curriculum basis

Gan: parts of the day and clock types · 1st: whole hours · 2nd: half and quarter hours, durations ·
3rd: analog and digital to the minute (ministry math curriculum, grades 1–3).
Durations and digital↔spoken conversion are out of scope for the MVP (DECISIONS D4).

## Skills

| ID | Title | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|
| `clock.hands` | מכירים את המחוגים | Gan | — | 🦉 | hands, set (hour hand only) |
| `clock.hours` | שעות עגולות | 1 | hands | 🕐 | read, set |
| `clock.half` | וחצי | 1 | hours | 🌗 | read, set |
| `clock.day` | היום של שופי | 1 | half | 🌞 | day |
| `clock.quarter` | רבע ורבע ל… | 2 | half | 🍕 | read, set, match |
| `clock.five` | כל חמש דקות | 2 | quarter | 🚀 | read, set, match |
| `clock.minute` | כל דקה | 3 | five | 🏆 | read, set |

Levels (`LEVELS` in `time.ts`): allowed minute values and drag snapping —
hours `[0]`/15, half `[0,30]`/15, quarter `[0,15,30,45]`/15, five `0,5…55`/5, minute `0…59`/1.

Visual aid (after 2 misses in a row, removed after 5 correct in a row): minute numbers around the face,
shaded half; in "read" a hint line; in "set" the target digital time and a faded "ghost" of the correct hands.

Distractors target typical mistakes: hands swapped (3:30 → 6:15), right hour/wrong minutes, right minutes/next hour.

## Games

| Game | Child sees / does | Correct when | itemKey | Review |
|---|---|---|---|---|
| hands | A clock; "click the short hand" / "the long hand" | Clicks that hand (mouse, or Tab + Enter) | `hour@3:30` | no |
| read | A clock and 4 options (digital + spoken text) | Picks the matching time | `3:30` | yes |
| set | "Set the clock to half past three"; drags hands (or Tab + arrows), presses Check | Hands show the time (12-hour) | `3:30` | yes |
| match | 4 clocks and 4 digital cards; pick a clock then a card | All 4 pairs matched (round = 3 boards) | sorted keys | no |
| day | A scene (🌅 "Shufi wakes up at seven") and a clock to set | As in set | `day.wake` | no |

Set games start at 9:00 (3:00 if the answer is 9:00) so the hands never overlap at the start.

## Phrases

57 building blocks (12 hours, 12 "to" hours, 29 minute counts, 4 connectors), 8 instructions/hints,
9 day scenes = 74 clock phrases, plus 17 shared app phrases. `timePhrase(t)` composes:
`0` "שלוש" · `15` "שלוש ורבע" · `30` "שלוש וחצי" · `45` "רבע לארבע" · `<30` "עשר דקות אחרי שלוש" · `>30` "עשר דקות לארבע".

## Content data

`content/day.ts`: 9 daily-routine scenes at whole and half hours.

## Acceptance criteria (all met)

- `time.test.ts`: every one of the 720 times maps to existing phrases; spoken forms as above; options contain
  the answer exactly once, no duplicates, all within the level; drag and keyboard math across 12.
- `generators.test.ts`: read/set/day/hand/match invariants, review honored, set start hands ≥ 45° apart.
- `e2e/clock.spec.ts`: profile → map → island → full "hands" round → 3 stars → reload keeps stars;
  hour hand set by mouse drag and by keyboard.

## Out of scope

Durations ("how long until…"), 24-hour notation, digital↔spoken conversion, seconds.
