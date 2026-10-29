import type { Sentence } from '../types'

// Present tense, 3–5 words, one emoji scene each. Tags: who does what. The generator picks distractor scenes that
// share exactly one tag with the target, so many sentences share a subject or an action on purpose.
const s = (who: string, does: string, text: string, scene: string, what?: string): Sentence => ({
  id: `${who}-${does}`,
  text,
  scene,
  tags: what ? { who, does, what } : { who, does },
})

export const SENTENCES: readonly Sentence[] = [
  // sleeping
  s('cat', 'sleep', 'הֶחָתוּל יָשֵׁן הַרְבֵּה', '🐱💤'),
  s('dog', 'sleep', 'הַכֶּלֶב יָשֵׁן עַל הַכִּסֵּא', '🐶💤🪑', 'chair'),
  s('bear', 'sleep', 'הַדֹּב יָשֵׁן כָּל הַחֹרֶף', '🐻❄️💤', 'winter'),
  s('baby', 'sleep', 'הַתִּינוֹק יָשֵׁן בְּשֶׁקֶט', '👶💤'),
  s('lion', 'sleep', 'הָאַרְיֵה יָשֵׁן הַרְבֵּה', '🦁💤'),
  // eating
  s('cat', 'eat', 'הֶחָתוּל אוֹכֵל דָּג', '🐱🐟', 'fish'),
  s('dog', 'eat', 'הַכֶּלֶב אוֹכֵל עֶצֶם', '🐶🦴', 'bone'),
  s('monkey', 'eat', 'הַקּוֹף אוֹכֵל בָּנָנָה', '🐒🍌', 'banana'),
  s('rabbit', 'eat', 'הָאַרְנֶבֶת אוֹכֶלֶת גֶּזֶר', '🐇🥕', 'carrot'),
  s('horse', 'eat', 'הַסּוּס אוֹכֵל תַּפּוּחַ', '🐴🍎', 'apple'),
  s('boy', 'eat', 'הַיֶּלֶד אוֹכֵל פִּיצָה', '👦🍕', 'pizza'),
  s('girl', 'eat', 'הַיַּלְדָּה אוֹכֶלֶת גְּלִידָה', '👧🍦', 'ice-cream'),
  s('bear', 'eat', 'הַדֹּב אוֹכֵל דְּבַשׁ', '🐻🍯', 'honey'),
  s('cow', 'eat', 'הַפָּרָה אוֹכֶלֶת עֵשֶׂב', '🐄🌱', 'grass'),
  s('baby', 'eat', 'הַתִּינוֹק אוֹכֵל לֶחֶם', '👶🍞', 'bread'),
  // drinking
  s('elephant', 'drink', 'הַפִּיל שׁוֹתֶה מַיִם', '🐘💧', 'water'),
  s('cat', 'drink', 'הֶחָתוּל שׁוֹתֶה חָלָב', '🐱🥛', 'milk'),
  s('baby', 'drink', 'הַתִּינוֹק שׁוֹתֶה חָלָב', '👶🥛', 'milk'),
  s('cow', 'drink', 'הַפָּרָה שׁוֹתָה מַיִם', '🐄💧', 'water'),
  // singing
  s('bird', 'sing', 'הַצִּפּוֹר שָׁרָה שִׁיר', '🐦🎵'),
  s('rooster', 'sing', 'הַתַּרְנְגוֹל שָׁר בַּבֹּקֶר', '🐓🌅'),
  s('dog', 'sing', 'הַכֶּלֶב שָׁר שִׁיר', '🐶🎤'),
  s('girl', 'sing', 'הַיַּלְדָּה שָׁרָה שִׁיר', '👧🎶'),
  // running
  s('dog', 'run', 'הַכֶּלֶב רָץ בַּשָּׂדֶה', '🐶🌾', 'field'),
  s('boy', 'run', 'הַיֶּלֶד רָץ מַהֵר', '👦💨'),
  s('fox', 'run', 'הַשּׁוּעָל רָץ מַהֵר', '🦊💨'),
  s('lion', 'run', 'הָאַרְיֵה רָץ בַּשָּׂדֶה', '🦁🌾', 'field'),
  // jumping
  s('monkey', 'jump', 'הַקּוֹף קוֹפֵץ עַל הָעֵץ', '🐒🌳', 'tree'),
  s('rabbit', 'jump', 'הָאַרְנֶבֶת קוֹפֶצֶת בַּשָּׂדֶה', '🐇🌾', 'field'),
  s('frog', 'jump', 'הַצְּפַרְדֵּעַ קוֹפֶצֶת אֶל הַבְּרֵכָה', '🐸💦', 'pool'),
  // swimming
  s('fish', 'swim', 'הַדָּג שׂוֹחֶה בַּיָּם', '🐟🌊', 'sea'),
  s('dog', 'swim', 'הַכֶּלֶב שׂוֹחֶה בַּיָּם', '🐶🌊', 'sea'),
  s('boy', 'swim', 'הַיֶּלֶד שׂוֹחֶה בַּיָּם', '👦🌊', 'sea'),
  // flying
  s('bird', 'fly', 'הַצִּפּוֹר עָפָה בַּשָּׁמַיִם', '🐦☁️', 'sky'),
  s('butterfly', 'fly', 'הַפַּרְפַּר עָף עַל פֶּרַח', '🦋🌸', 'flower'),
  s('bee', 'fly', 'הַדְּבוֹרָה עָפָה אֶל הַפֶּרַח', '🐝🌸', 'flower'),
  s('owl', 'fly', 'הַיַּנְשׁוּף עָף בַּלַּיְלָה', '🦉🌙', 'night'),
  // dancing and laughing
  s('bear', 'dance', 'הַדֹּב רוֹקֵד וְשָׁר', '🐻🕺🎶'),
  s('girl', 'dance', 'הַיַּלְדָּה רוֹקֶדֶת בְּשִׂמְחָה', '👧💃'),
  s('elephant', 'dance', 'הַפִּיל רוֹקֵד בְּשִׂמְחָה', '🐘🕺'),
  s('baby', 'laugh', 'הַתִּינוֹק צוֹחֵק בְּקוֹל', '👶😂'),
  s('boy', 'laugh', 'הַיֶּלֶד צוֹחֵק בְּקוֹל', '👦😂'),
  // reading, drawing, playing
  s('girl', 'read', 'הַיַּלְדָּה קוֹרֵאת סֵפֶר', '👧📖', 'book'),
  s('boy', 'read', 'הַיֶּלֶד קוֹרֵא סֵפֶר', '👦📖', 'book'),
  s('owl', 'read', 'הַיַּנְשׁוּף קוֹרֵא סֵפֶר', '🦉📚', 'book'),
  s('boy', 'draw', 'הַיֶּלֶד מְצַיֵּר בַּיִת', '👦🖍️🏠', 'house'),
  s('girl', 'draw', 'הַיַּלְדָּה מְצַיֶּרֶת שֶׁמֶשׁ', '👧🖍️☀️', 'sun'),
  s('boy', 'play', 'הַיֶּלֶד מְנַגֵּן גִּיטָרָה', '👦🎸', 'guitar'),
  s('monkey', 'play', 'הַקּוֹף מְנַגֵּן גִּיטָרָה', '🐒🎸', 'guitar'),
]
