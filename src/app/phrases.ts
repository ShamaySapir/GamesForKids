import type { PhraseMap } from '../core/engine/types'

/** Child-facing phrases shared by all islands. */
export const phrases: PhraseMap = {
  'app.hello': 'שלום! אני שופי הינשוף. בואו נלמד ונשחק!',
  'app.who': 'מי משחק היום?',
  'app.replay': 'לחצו עליי כדי לשמוע שוב',
  'app.pickIsland': 'לאן נפליג היום? בחרו אי.',
  'app.pickSkill': 'בחרו משחק.',
  'app.soon': 'האי הזה עוד בבנייה. נגיע אליו בקרוב!',
  'app.startHere': 'כַּדַּאי לְהַתְחִיל מִכָּאן',
  // Shufi's line on an island with a recommendation: it points at the ⭐ badge rather than saying "here" with nothing there.
  'app.pickSkillStar': 'בַּחֲרוּ מִשְׂחָק. הַכּוֹכָב מַרְאֶה מֵאֵיפֹה כַּדַּאי לְהַתְחִיל.',
  'app.challengeTag': 'אֶתְגָּר',
  'app.challenge': 'זֶה קָצָת קָשֶׁה יוֹתֵר, אֶפְשָׁר לְנַסּוֹת!',
  'app.tryEasier': 'בּוֹאוּ נְנַסֶּה קֹדֶם מַשֶּׁהוּ קַל יוֹתֵר',
  'app.good.1': 'כל הכבוד!',
  'app.good.2': 'יפה מאוד!',
  'app.good.3': 'מצוין!',
  'app.good.4': 'בול!',
  'app.tryAgain': 'כמעט! נסו שוב.',
  'app.end.3': 'אלופים! שלושה כוכבים!',
  'app.end.2': 'כל הכבוד! עוד קצת ותגיעו לשלושה כוכבים.',
  'app.end.1': 'התחלה יפה! בואו ננסה שוב.',
  'app.mastered': 'וואו! קיבלתם מדבקה חדשה!',
  'app.oneMore': 'עוֹד סִבּוּב אֶחָד כָּזֶה וּמְקַבְּלִים מַדְבֵּקָה!',
  'app.stickers': 'אלבום המדבקות שלכם',
  // Island names, said when the mouse rests on an island on the map. Same text as each island's title (tested), so
  // the recording is shared; English Island is said in Hebrew for the Hebrew-speaking child.
  'app.island.clock': 'אִי הַשָּׁעוֹן',
  'app.island.hebrew': 'אִי הָאוֹתִיּוֹת',
  'app.island.reading': 'אִי הַקְּרִיאָה',
  'app.island.math': 'אִי הַמִּסְפָּרִים',
  'app.island.thinking': 'אִי הַחֲשִׁיבָה',
  'app.island.english': 'אִי הָאַנְגְּלִית',
  'app.island.coding': 'אִי הַתִּכְנוּת',
}
