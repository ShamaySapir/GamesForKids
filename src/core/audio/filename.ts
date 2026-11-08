// Recording file names for phrase IDs. IDs may hold Hebrew letters and nikud ("hebrew.letter.א", "hebrew.cv.בַּ"); file
// names must not: file systems and git normalize combining marks differently, which would break the lookup. So every
// character outside [A-Za-z0-9_.-] is written as ~ and its 4-digit hex code point, in order.

export const fileOfPhrase = (id: string) =>
  id.replace(/[^\w.-]/g, c => `~${c.codePointAt(0)!.toString(16).padStart(4, '0')}`)

export const phraseOfFile = (name: string) =>
  name.replace(/~([0-9a-f]{4})/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
