# Spec: Parents' page (דַּף הוֹרִים)

- **Status:** Draft, awaiting user approval
- **Stage:** 7 (docs/ROADMAP.md)
- **Relies on:** DECISIONS D2 (local only, no server), D7 (mastery), D3 (audio)

## Goal

Give a parent one place, on the device, to see:
- how each child is doing,
- what to practise with them,
- the child's settings.

The parent can also move all progress to another computer. Nothing leaves the device unless the parent saves a backup file themselves.

## Who it is for, and the gate

- The page is for adults. It uses plain Hebrew without nikud. Nothing on it is spoken and it needs no recordings.
- **Entry:** a small "לַהוֹרִים" button (👪) on the profile picker screen. There is no entry in the top bar, so children don't wander in.
- **Parent gate:** before the page opens, the parent answers a two-digit addition question by typing the number, for example "כמה זה 14 + 27?". Children under 7 can't solve it, and reading the question is not enough.
  - It is a gate, not security, the same pattern as Apple's "parental gate" in kids' apps.
  - It is asked once per visit.
  - A wrong answer shows a new question with no message.

## Sections

1. **Child tabs.** One tab per profile, showing the avatar and name.
2. **Summary** for the selected child:
   - stars, stickers, and skills mastered out of the total;
   - the date they last played;
   - rounds played in the last 7 days. These come from `rounds[].at` and need no new data.
3. **Islands.** One row per island with a progress bar of mastered skills. Opening a row lists its skills. Each skill shows:
   - its status: נשלט ✅, בתרגול (1/2 good rounds, best stars), עוד לא התחיל, or נעול 🔒 (with what unlocks it);
   - its grade;
   - the date it was last played.
4. **What to practise.** Items the child missed recently, taken from the Leitner queue: box 0 or 1, missed at least once. They are grouped by skill, and the most-missed skills come first. Examples: "שעון – רבע לארבע", "אותיות – ט / ת", "חשבון – 8 + 5".
   - Each island can describe its item keys for adults (see Contract).
   - Where an island has no description, the row shows only the skill and a count: "3 פריטים לתרגול".
   - There is also a "how to practise at home" sentence per island, for example: "לקרוא שעון יחד בזמנים קבועים ביום".
5. **Settings** for the selected child:
   - name, avatar, grade;
   - "השמעה אוטומטית של הוראות" (`autoSpeak`).

   Two actions, each behind a confirmation dialog that asks the parent to type the child's name:
   - **אפס התקדמות** clears that child's progress;
   - **מחק ילד** deletes the child.
6. **Backup.**
   - "שמור גיבוי" downloads one JSON file with every profile and its progress, named `lomdim-backup-YYYY-MM-DD.json`.
   - "שחזר מגיבוי" reads such a file. Before it replaces anything, it shows what it found ("2 ילדים: נועה, כרמל") and asks the parent to confirm.
   - A malformed file is rejected with a plain message, and nothing is changed.

## Contract changes (T0, planner)

- **Store actions** (`src/core/storage/store.ts`): `updateProfile(id, patch)`, `deleteProfile(id)`, `resetProgress(id)`, `exportAll()` → a backup object, and `importAll(backup)`.
  - All of them stay the only code that touches storage, and all are covered by unit tests.
  - Backups carry a `version: 1` field, and import validates the file's shape before writing anything.
- **Pure helpers** (`src/core/progress/report.ts`):
  - `skillStatus(progress, skill, isUnlocked)`;
  - `practiceItems(progress, islands)`, which returns skill IDs, item keys, Leitner boxes and miss counts;
  - `summary(progress, now)`.
- **`SkillDef.describeItem?: (itemKey) => string | undefined`** is an optional adult-readable label for an item key (in `src/core/engine/types.ts`). Islands opt in.
- **Route:** `#/parents` behind the gate.
- **Profile load:** when there are several profiles, keep the last selected child on reload instead of always going back to the picker. This fixes a play-test complaint. A small `lastProfile` key in storage holds it.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | Store actions + backup format, `report.ts` helpers, `describeItem` contract, route and gate, last-profile, tests | planner | `src/core/**`, `src/app/App.tsx`, tests | spec approved |
| T1 | `ParentsScreen` (tabs, summary, islands, practice, settings, backup), styles | planner | `src/app/parents/**` | T0 |
| T2 | `describeItem` + home-practice sentence for clock and math | builder | `src/subjects/{clock,math}/index.ts` | T0 |
| T3 | `describeItem` + home-practice sentence for hebrew, reading, english, thinking, coding | builder | `src/subjects/{hebrew,reading,english,thinking,coding}/index.ts` | T0 |
| T4 | E2E (gate, a settings change, practice list after a missed round, backup download then restore) and screenshots | planner + reviewer | `e2e/parents.spec.ts` | T1–T3 |

T2 and T3 only add a property to each island's `index.ts`, so they don't touch the same files.

## Acceptance criteria

- **Unit tests:**
  - every store action, including that a deleted child's progress key is removed;
  - an export/import round trip is identical;
  - malformed, wrong-version and empty backups are rejected without writing;
  - `report.ts` gets status, practice ordering and the 7-day count right on fixed fixtures.
- **E2E:**
  - the gate blocks a wrong answer and opens on the right one;
  - changing autoSpeak persists after a reload;
  - after a round with a mistake, the item shows under "What to practise";
  - a backup downloads, and restoring it after "delete child" brings the child back.
- **Screenshots** on desktop and at 390px, light and dark, of every section and of the gate.
- **No network calls.** The backup is a local file download and upload only.

## Out of scope

- Accounts, sync, or sending reports by email or WhatsApp.
- Choosing the order of the nikud vowels. The reading island follows the ministry order. Changing it would change the reading content and its tests, so it stays a later option.
- Time limits and screen-time controls.

## Open questions for the user

1. Is a two-digit addition question a good enough gate, or would you prefer a different one (for example, hold a button for 3 seconds)?
2. Should "What to practise" appear for every island, or only clock, letters and math in the first version?
