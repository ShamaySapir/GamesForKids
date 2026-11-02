// Phrase-ID contract between art (T1), content (T2), generators (T3) and games (T4).
// T2 declares every ID below in phrases.ts.
//
// Content exports (T2), passed into generators by index.ts (T5):
//   content/odd.ts        ODD_SETS: readonly OddSet[]           ≥ 30 (≥ 6 per `by`)
//   content/twins.ts      TWIN_SETS: readonly TwinSet[]         ≥ 12
//   content/shadows.ts    SHADOW_SETS: readonly ShadowSet[]     ≥ 20
//   content/patterns.ts   PATTERNS: readonly PatternDef[]       ≥ 6 per repeat kind (AB, AAB, ABB, ABC) + ≥ 6 grow
//   content/where.ts      WHERE_SCENES: readonly WhereScene[]   ≥ 6 per position word
//   content/memory.ts     MEMORY_THEMES: readonly MemoryTheme[] ≥ 6
//   content/symmetry.ts   SYMMETRY_ITEMS: readonly SymmetryItem[] ≥ 12
//   content/sequences.ts  SEQUENCES: readonly SequenceSet[]     ≥ 12
//   content/sorting.ts    SORT_BOARDS: readonly SortBoard[]     ≥ 12
//   content/missing.ts    MISSING_ITEMS: readonly MissingItem[] ≥ 12
//   content/differences.ts DIFF_SCENES: readonly DiffScene[]    ≥ 8
//   content/mazes.ts      MAZES: readonly MazeDef[]             ≥ 10

/** The name of a catalog drawing ("כֶּלֶב"), for hover/🔊 on art options. */
export const artPhrase = (name: string) => `think.art.${name}`
/** The question of a where-scene, said whole ("אֵיפֹה הַכַּדּוּר? מִתַּחַת לַשֻּׁלְחָן"). */
export const wherePhrase = (id: string) => `think.where.${id}`
/** One step of a sequence ("זוֹרְעִים זֶרַע"). */
export const sequencePhrase = (id: string, n: number) => `think.seq.${id}.${n}`
/** A sorting basket label ("פֵּרוֹת"). */
export const binPhrase = (boardId: string, bin: 0 | 1) => `think.bin.${boardId}.${bin}`

export const T = {
  oddOne: 'think.q.oddOne', //         "מִי שׁוֹנֶה מִכֻּלָּם?"
  twin: 'think.q.twin', //             "מִצְאוּ אֶת הַתְּמוּנָה שֶׁזֵּהָה בְּדִיּוּק"
  shadow: 'think.q.shadow', //         "שֶׁל מִי הַצֵּל הַזֶּה?"
  shadowOf: 'think.q.shadowOf', //     "אֵיזֶה צֵל שַׁיָּךְ לַתְּמוּנָה?"
  pattern: 'think.q.pattern', //       "מָה בָּא אַחַר כָּךְ?"
  memory: 'think.q.memory', //         "מִצְאוּ זוּגוֹת שֶׁל קְלָפִים זֵהִים"
  symmetry: 'think.q.symmetry', //     "אֵיזֶה חֵצִי מַשְׁלִים אֶת הַצִּיּוּר?"
  symGrid: 'think.q.symGrid', //       "הַשְׁלִימוּ אֶת הַצַּד הַשֵּׁנִי כְּמוֹ בְּמַרְאָה"
  sequence: 'think.q.sequence', //     "סַדְּרוּ: מָה קָרָה קֹדֶם?"
  sorting: 'think.q.sorting', //       "שִׂימוּ כָּל תְּמוּנָה בַּסַּל הַמַּתְאִים"
  missing: 'think.q.missing', //       "מָה חָסֵר בַּצִּיּוּר?"
  differences: 'think.q.differences', // "מִצְאוּ אֶת הַהֶבְדֵּלִים"
  notHere: 'think.q.notHere', //       "לֹא כָּאן, נַסּוּ שׁוּב"
  foundAll: 'think.q.foundAll', //     "מְצָאתֶם אֶת כֻּלָּם!"
  maze: 'think.q.maze', //             "עִזְרוּ לַגִּבּוֹר לְהַגִּיעַ לַמַּטָּרָה"
  check: 'think.ui.check', //          "בְּדִיקָה"
  reset: 'think.ui.reset', //          "מֵהַתְחָלָה"
} as const
