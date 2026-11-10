# Spec: Coding island (אִי הַתִּכְנוּת)

- **Status:** Built, awaiting user play-test. Approved by user on 2026-11-10
- **Stage:** 8a (docs/ROADMAP.md). Stage 8b, for grades 3–6, follows after the user plays 8a.
- **Relies on:** DECISIONS D3, D6, D7, D11, D14 · docs/RESEARCH.md § "Computer science, K–2" (added with this spec)

## Goal

This stage is for kindergarten to 2nd grade. By the end of it the child knows that:
- an **algorithm** is an exact list of steps in an order;
- a **program** is an algorithm a machine follows;
- a **bug** is a wrong step that you find and fix;
- a **loop** is a step you repeat instead of writing it again.

The child plans a path and builds a program from arrow cards. The child runs it, watches it, and fixes it. There is no reading of code; everything is pictures, arrows and spoken instructions.

## Curriculum basis

- **Ministry of Education, kindergarten "חשיבה מחשובית":**
  - What it covers:
    - sequences of actions
    - recognising patterns
    - planning
    - spatial orientation
    - problem solving
  - How it teaches: physical games in the gan and screen environments such as ScratchJr.
  - Sources: pop.education.gov.il/kindergarten/topics/computational-thinking and the "הייטק בגנים" guide (meyda.education.gov.il/files/PreSchool/hitech/ogdan_ganim.pdf).
- **Ministry elementary track "חשיבה מחשובית ורובוטיקה":** grades 3–6, the basis for Stage 8b (pop.education.gov.il, computer-science-software-engineering-cyber/elementary).
- **CSTA K–12 standards, level 1A (K–2):**
  - model daily processes by creating and following algorithms (AP-08);
  - decompose the steps of a problem into a precise sequence (AP-11);
  - debug errors in an algorithm or program that includes sequences and simple loops (AP-14);
  - create programs with visual instructions, with no text (AP-10).
- **Prior art.** We copy patterns, never assets:
  - Picture books (*Hello Ruby*; *First Steps in Coding: What's an Algorithm?*) present an algorithm as a recipe and a bug as a step to fix.
  - Bee-Bot, Cubetto and CodeMonkey Jr all use the same loop: put arrow cards in a strip → run → watch the character → fix → add "repeat".
- **Our choice:** absolute arrows ↑ ↓ ← → (Bee-Bot style). Turning left or right depends on the robot's facing, which is hard before age 7, so turns wait for 8b.

## Skills

| # | ID | Title (child-facing) | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|---|
| 1 | `code.steps` | מָה קֹדֶם? | −1 | — | 🪥 | order |
| 2 | `code.bug-steps` | מָה לֹא בְּסֵדֶר? | 0 | steps | 🐞 | pick-bug |
| 3 | `code.follow` | לְאָן הוּא יַגִּיעַ? | 0 | — | 🗺️ | follow |
| 4 | `code.arrows` | מְתַכְנְתִים צַעַד צַעַד | 1 | follow | 🤖 | program |
| 5 | `code.debug` | מְתַקְּנִים בָּאג | 1 | arrows, bug-steps | 🔧 | fix |
| 6 | `code.patterns` | מָה חוֹזֵר? | 2 | arrows | 🔁 | pick-loop |
| 7 | `code.repeat` | חוֹזְרִים עַל זֶה | 2 | patterns | 🌀 | program-repeat |

### Details

1. **What comes first?** An everyday algorithm, shown as 3–4 picture cards in a mixed order: brushing teeth, making a sandwich, planting a seed, washing hands, getting dressed, crossing the road. The child puts them in order (`OrderGame`, RTL). Every story has exactly one sensible order.
   - Unlike the thinking island's 3-step sequences, these are procedures: steps the child *does*.
   - Item key: the story ID.
   - Aid: the first card is placed.
2. **What's wrong?** The same stories, in order, with one step that is wrong or missing:
   - a wrong step: socks over the shoes; toothpaste after brushing;
   - a missing step, shown as an empty frame with "?".

   The child picks the bad step, or picks the missing card from 3. This is debugging without a screen. Item key: `bug:<story>`.
3. **Where will it get to?** A small board, 4×4 with no walls. Oli sits on a square, and above the board is a program of 2–4 arrow cards. The child picks the square where Oli ends up, out of 3 highlighted squares.
   - The wrong squares are typical mistakes:
     - one arrow left out;
     - one arrow taken the wrong way round;
     - the arrows read right to left.
   - Item key: the board and program.
   - Aid: Oli's path is drawn step by step.
4. **Programming step by step.** A board with Oli, a goal (🍎), and walls from 5×5 boards on. The child builds a program from ↑ ↓ ← → cards in a strip, then presses ▶.
   - Oli walks one step per card.
   - Reaching the goal is correct.
   - Stopping elsewhere or bumping a wall is a miss (`onAttempt(false)`). Oli goes back to the start, the card where things went wrong is highlighted, and the program stays so the child can edit it. Only the first run of each board counts toward first-try accuracy.
   - Any program that reaches the goal is accepted, not only the shortest one.
   - Levels: 4×4 open boards with paths of 2–4 steps, then 5×5 with walls and paths of 4–7.
   - Aid: a ghost path (the shortest one).
   - Item key: the board ID.
5. **Fix the bug.** The board comes with a program that is already filled in, with exactly one wrong card: a wrong direction, an extra card, or a missing card.
   - The child taps the wrong card to remove it or change it, then runs the program.
   - Correct when the program reaches the goal and differs from the buggy one in exactly one place.
   - Item key: `debug:<board>`.
6. **What repeats?** A program or a "dance" of picture moves (👏👏🦶👏👏🦶👏👏🦶). The child picks the loop that matches, out of 3: "repeat ×3 [👏👏🦶]", "repeat ×2 […]", "repeat ×3 [👏🦶]". This connects patterns, which they already know from the thinking island, to loops. Item key: the pattern ID.
7. **Repeat it.** Boards with long straight runs, such as →→→→↓↓↓↓. The program strip has a card limit: 4 cards on a 6×6 board, so the program only fits with a loop. A "repeat ×N" card holds 1–2 arrows, and N goes from 2 to 5 with a tap.
   - Correct as in skill 4.
   - The aid shows the plain arrow path, and suggests "→ ×4".

## Games (mechanics)

| Game | Component | Notes |
|---|---|---|
| order | `OrderGame` (reading island) | Picture tiles with a spoken one-word caption on 🔊; RTL order, first step on the right |
| pick-bug, follow, pick-loop | `PickGame` | Board pictures are a registered art kit (`registerArt`): board, arrows, Oli, goal. Options are silent unless they have a 🔊 |
| program, fix, program-repeat | **`ProgramGame`** (new, island-only) | See below |

**ProgramGame:**
- **Layout:**
  - The board (an SVG grid, LTR like the maze).
  - Below it, a card palette: ↑ ↓ ← → and, in skill 7, "repeat".
  - Then the program strip, which reads LTR like a line of code, as with the existing rule for digits and English.
  - Then ▶ "run" and 🗑 "erase last". All controls are at least 64px.
- **Input:**
  - Tap a palette card to add it to the end of the strip.
  - Tap a strip card to remove it (in skill 5, tapping it cycles its direction).
  - Keyboard:
    - arrow keys add a card;
    - Backspace removes the last card;
    - Enter runs the program;
    - Tab reaches every card.
  - Drag is optional and not required.
- **Run:**
  - Oli moves one cell every 400 ms. With `prefers-reduced-motion`, Oli jumps.
  - The strip card that is running is highlighted.
  - A wall bump stops the run with a soft "bonk" (`sfx`) and shows no negative text.
  - The result follows the rules in Details 4.
- **Simulator** (`program.ts`, pure): `run(board, program) → { path, end, stoppedAt?, reachedGoal }`. A "repeat" card expands into its steps.
  - It is the single source of truth for the component, the generators and the tests.
  - `shortest(board)` (a BFS) gives the ghost path and checks that every board is solvable.
- Boards use the maze row format (`MazeDef` in the thinking island): `#` wall, `.` path, `S` start, `G` goal.

## Phrases

Instructions (about 12), for example:
- "סַדְּרוּ אֶת הַשְּׁלַבִּים לְפִי הַסֵּדֶר"
- "מָה לֹא בְּסֵדֶר?"
- "לְאָן אוֹלִי יַגִּיעַ?"
- "בְּנוּ תָּכְנִית שֶׁתָּבִיא אֶת אוֹלִי לַתַּפּוּחַ"
- "מִצְאוּ אֶת הַבָּאג וְתַקְּנוּ"
- "אֵיזוֹ לוּלָאָה מַתְאִימָה?"
- "נַסּוּ לְהִשְׁתַּמֵּשׁ בְּ'חֲזֹר'"

Feedback:
- "אוֹלִי נִתְקַע בַּקִּיר, נְתַקֵּן?"
- "כִּמְעַט! בּוֹאוּ נְתַקֵּן אֶת הַצַּעַד הַזֶּה"

Story step captions: about 8 stories × 4 steps, reusing words already recorded where the text matches (shared recordings). Total: **about 60–80 new phrases to record**. No English.

## Content data (`content/`, by the content agent)

- `stories.ts`: ≥ 10 everyday algorithms with 3–4 steps (emoji + caption). Each has one wrong-step and one missing-step variant, and every wrong step is plausible.
- `boards.ts`:
  - follow: ≥ 12 boards with programs;
  - program levels: ≥ 15 boards (4×4 → 5×5);
  - debug: ≥ 12 boards with a buggy program;
  - repeat: ≥ 12 boards on 6×6 with long runs.
- `patterns.ts`: ≥ 10 move patterns with loop options.
- All original, with no images from commercial products. The art kit (board, arrows, apple) is our own SVG.

## Acceptance criteria

- **Simulator tests:**
  - walls stop the run;
  - repeat expands correctly;
  - every board is solvable;
  - `shortest` is minimal (checked against a brute-force search on small boards).
- **Content test:**
  - each story has a single order;
  - each bug variant differs by exactly one step;
  - each debug program has exactly one wrong card and becomes correct when that card is fixed;
  - each repeat board can't be solved within the card limit without a loop.
- **Generator tests over ≥ 200 seeds:**
  - the answer can be reached through the UI;
  - no duplicate options;
  - no wrong "follow" square equals the right one;
  - every phrase exists.
- **ProgramGame tests:**
  - adding, removing and running with mouse and keyboard;
  - a miss keeps the strip and highlights the stopping card;
  - only one `onAttempt(true)`.
- **E2E:**
  - a story order round;
  - building a program by keyboard and running it to the goal;
  - one fix-the-bug round.
- **Screenshots** on desktop and at 390px, light and dark, checking:
  - the RTL page with an LTR board and strip;
  - the failure state;
  - reduced motion.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | Types, IDs, the `program.ts` simulator (+ tests) and the `board.tsx` drawing (shared by T2 and T3), a `comingSoon` skeleton, the `--code` token, the seven-island map, a RESEARCH section | planner | `src/subjects/coding/{types,ids,index,program,board}.*`, `src/ui/theme.css`, `src/app/screens/MapScreen.tsx`, `docs/RESEARCH.md` | spec approved |
| T1 | Stories, boards, patterns, phrases + content test | content | `content/**`, `phrases.ts`, `content.test.ts` | T0 |
| T2 | Generators for the 7 skills + tests; the art kit (board, program row, story strip) for pick questions | builder | `generators.ts`, `generators.test.ts`, `art.tsx` | T0 |
| T3 | `ProgramGame` + tests | builder | `games-program.tsx`, `games-program.test.tsx`, `coding.css` | T0 (`program.ts`, `board.tsx`) |
| T4 | Wire `index.ts`, E2E, screenshots, full content review | planner + reviewer | `index.ts`, `e2e/coding.spec.ts` | T1–T3 |

## Out of scope (Stage 8b, grades 3–6)

- turning left/right with facing;
- conditions ("if there's a wall");
- events;
- functions (a reusable block);
- variables;
- binary numbers (cards 1-2-4-8);
- sorting (comparing on a balance scale);
- searching ("guess the number" by halving);
- shortest paths.

Also out of scope: text code and any online sharing.

## User decisions (2026-11-10)

1. **Name and icon:** "אִי הַתִּכְנוּת" 🤖. Approved.
2. **Character on the board:** Oli, dressed as a "programmer". He wears a small robot helmet with an antenna, drawn as an SVG variant of the owl in the island's art kit. We picked the helmet over glasses because it stays readable at board-cell size (about 56px). Glasses remain a fallback.
3. **"מָה קֹדֶם?"** starts at pre-kindergarten (Grade −1), like the thinking island.
