import type { SequenceSet } from '../types'

// Each process has one natural order that a 5-year-old knows from life.
export const SEQUENCES: readonly SequenceSet[] = [
  { id: 'chick', steps: ['🥚', '🐣', '🐥'] },
  { id: 'tree', steps: ['🌰', '🌱', '🌳'] },
  { id: 'rain', steps: ['☁️', '🌧️', '🌈'] },
  { id: 'sunflower', steps: ['🌰', '🌱', '🌻'] },
  { id: 'fried-egg', steps: ['🥚', '🍳', '😋'] },
  { id: 'bedtime', steps: ['🛁', '👕', '😴'] },
  { id: 'ages', steps: ['👶', '👦', '👨', '👴'] },
  { id: 'butterfly', steps: ['🥚', '🐛', '🦋'] },
  { id: 'house', steps: ['🧱', '🏗️', '🏠'] },
  { id: 'drawing', steps: ['📄', '✏️', '🖼️'] },
  { id: 'gan', steps: ['⏰', '🎒', '🏫'] },
  { id: 'trip', steps: ['🧳', '✈️', '🏖️'] },
  { id: 'shoes', steps: ['🧦', '👟', '🏃'] },
]

/** What the owl says for each step, in order (index = step index, so SEQUENCE_TEXT[id][n] is sequencePhrase(id, n)). */
export const SEQUENCE_TEXT: Readonly<Record<string, readonly string[]>> = {
  chick: ['בֵּיצָה', 'הָאֶפְרוֹחַ בּוֹקֵעַ', 'אֶפְרוֹחַ קָטָן'],
  tree: ['זֶרַע', 'נֶבֶט קָטָן', 'עֵץ גָּדוֹל'],
  rain: ['עָנָן', 'יוֹרֵד גֶּשֶׁם', 'קֶשֶׁת בַּשָּׁמַיִם'],
  sunflower: ['זֶרַע', 'נֶבֶט קָטָן', 'חַמָּנִית גְּדוֹלָה'],
  'fried-egg': ['בֵּיצָה', 'מְטַגְּנִים אֶת הַבֵּיצָה', 'אוֹכְלִים'],
  bedtime: ['מִתְרַחֲצִים', 'מִתְלַבְּשִׁים', 'הוֹלְכִים לִישֹׁן'],
  ages: ['תִּינוֹק', 'יֶלֶד', 'אַבָּא', 'סַבָּא'],
  butterfly: ['בֵּיצָה', 'זַחַל', 'פַּרְפַּר'],
  house: ['לְבֵנִים', 'בּוֹנִים', 'בַּיִת גָּמוּר'],
  drawing: ['דַּף רֵיק', 'מְצַיְּרִים', 'צִיּוּר מוּכָן'],
  gan: ['מִתְעוֹרְרִים', 'לוֹקְחִים תִּיק', 'הוֹלְכִים לַגַּן'],
  trip: ['אוֹרְזִים מִזְוָדָה', 'טָסִים בְּמָטוֹס', 'נֶהֱנִים בַּחוֹף'],
  shoes: ['גַּרְבַּיִם', 'נַעֲלַיִם', 'רָצִים'],
}
