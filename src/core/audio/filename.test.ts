import { describe, expect, it } from 'vitest'
import { fileOfPhrase, phraseOfFile } from './filename'

describe('recording file names', () => {
  it('keeps ASCII IDs as they are', () => {
    expect(fileOfPhrase('think.seq.fried-egg.0')).toBe('think.seq.fried-egg.0')
  })

  it('writes Hebrew letters and nikud as code points, in order, and reads them back', () => {
    for (const id of ['hebrew.letter.א', 'hebrew.cv.בַּ', 'hebrew.cv.שָׁ', 'reading.unit.b-a']) {
      const file = fileOfPhrase(id)
      expect(file).toMatch(/^[\w.~-]+$/)
      expect(phraseOfFile(file)).toBe(id)
    }
    expect(fileOfPhrase('hebrew.letter.א')).toBe('hebrew.letter.~05d0')
  })
})
