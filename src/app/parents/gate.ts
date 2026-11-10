// The parents' gate (DECISIONS D18): a number written in plain Hebrew words, typed back as digits. A child in
// kindergarten to grade 2 can't read unpointed Hebrew and turn number words into digits; an adult needs a second.

const UNITS = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע']
const TENS = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים']

/** 21–99 in words, the way numbers are counted aloud: "שלושים ושמונה", "חמישים". */
export function numberWords(n: number): string {
  const tens = TENS[Math.floor(n / 10)]!
  const unit = UNITS[n % 10]!
  return unit ? `${tens} ו${unit}` : tens
}

export const gateNumber = (rng: () => number) => 21 + Math.floor(rng() * 79)
