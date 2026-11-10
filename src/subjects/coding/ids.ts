// Phrase-ID contract between content (T1), generators + art (T2) and ProgramGame (T3). T1 declares every ID below.
//
// Content exports (T1), passed into generators by index.ts (T4):
//   content/stories.ts   STORIES: readonly Story[]          ≥ 10 (3–4 steps each)
//   content/boards.ts    FOLLOW: readonly FollowItem[]      ≥ 12 (open 4×4, 2–4 moves)
//                        LEVELS: readonly Level[]           ≥ 15 (4×4 open → 5×5 with walls, shortest 2–7 moves)
//                        DEBUG: readonly DebugItem[]        ≥ 12 (≥ 3 of each bug kind)
//                        REPEAT_LEVELS: readonly Level[]    ≥ 12 (6×6, long straight runs, maxCards set)
//   content/patterns.ts  MOVES: Readonly<Record<string, string>>  emoji → its phrase key ('👏' → 'clap')
//                        PATTERNS: readonly MovePattern[]   ≥ 10 (unit of 2–3 moves, times 2–4)

/** A story step's caption ("מְשַׁפְשְׁפִים"); n = the step's index in `steps`. */
export const stepPhrase = (story: string, n: number) => `code.step.${story}.${n}`
/** The caption of a story's wrong step. */
export const wrongPhrase = (story: string) => `code.wrong.${story}`
/** The caption of one of a story's two steps that don't belong (offered with the missing step). */
export const otherPhrase = (story: string, n: 0 | 1) => `code.other.${story}.${n}`
/** A dance move's name ("מוֹחֲאִים כַּף"), by its MOVES key. */
export const movePhrase = (key: string) => `code.move.${key}`

export const C = {
  steps: 'code.q.steps', //         "סַדְּרוּ אֶת הַשְּׁלַבִּים לְפִי הַסֵּדֶר"
  bug: 'code.q.bug', //             "אֵיזֶה שָׁלָב לֹא בְּסֵדֶר?"
  missing: 'code.q.missing', //     "אֵיזֶה שָׁלָב חָסֵר?"
  follow: 'code.q.follow', //       "לְאָן שׁוּפִי יַגִּיעַ?"
  program: 'code.q.program', //     "בְּנוּ תָּכְנִית שֶׁתָּבִיא אֶת שׁוּפִי לַתַּפּוּחַ"
  debug: 'code.q.debug', //         "יֵשׁ בָּאג בַּתָּכְנִית! מִצְאוּ אוֹתוֹ וְתַקְּנוּ"
  loop: 'code.q.loop', //           "אֵיזוֹ לוּלָאָה עוֹשָׂה אֶת אוֹתוֹ הַדָּבָר?"
  repeat: 'code.q.repeat', //       "בְּנוּ תָּכְנִית קְצָרָה. הִשְׁתַּמְּשׁוּ בְּ'חֲזֹר'"
  hintFollow: 'code.hint.follow', // "עִקְבוּ אַחֲרֵי הַחִצִּים אֶחָד אַחֲרֵי הַשֵּׁנִי"
  hintPath: 'code.hint.path', //     "רְאוּ אֶת הַשְּׁבִיל הַמְּנֻקָּד"
  hintRepeat: 'code.hint.repeat', // "כַּמָּה פְּעָמִים הוֹלְכִים לְאוֹתוֹ כִּוּוּן?"
  full: 'code.fb.full', //           "אֵין יוֹתֵר מָקוֹם. נַסּוּ 'חֲזֹר'"
  run: 'code.ui.run', //             "סַע!"
  erase: 'code.ui.erase', //         "מְחִיקָה"
  repeatCard: 'code.ui.repeat', //   "חֲזֹר"
  times: 'code.ui.times', //         "פְּעָמִים"
  up: 'code.dir.up', //              "לְמַעְלָה"
  down: 'code.dir.down', //          "לְמַטָּה"
  left: 'code.dir.left', //          "שְׂמֹאלָה"
  right: 'code.dir.right', //        "יָמִינָה"
} as const
