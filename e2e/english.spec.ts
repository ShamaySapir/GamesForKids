import { expect, test, type Page } from '@playwright/test'
import { WORDS } from '../src/subjects/english/content/words'
import { atQuestion, createProfile, master } from './helpers'

// Plays full rounds of the English island through the real UI.

async function open(page: Page, mastered: string[], link: RegExp) {
  await createProfile(page)
  await master(page, mastered)
  await page.getByRole('button', { name: /English Island/ }).click()
  await page.getByRole('link', { name: link }).first().click()
}

/** The word is only spoken, so try options until the right one is accepted; the round must still complete. */
async function playByTrying(page: Page, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await atQuestion(page, i)
    await expect(page.locator('.pk-opt').first()).toBeVisible()
    for (const opt of await page.locator('.pk-opt').all()) {
      if (await opt.isDisabled()) continue
      await opt.click()
      if (await page.locator('.pk-opt.ok').count()) break
    }
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
}

test('words by ear: a round completes', async ({ page }) => {
  await open(page, [], /שׁוֹמְעִים וּבוֹחֲרִים/)
  await playByTrying(page)
})

test('letters: a find-the-letter round completes, letters shown left to right in the English font', async ({ page }) => {
  await open(page, [], /אֵיפֹה הָאוֹת/)
  await expect(page.locator('.pk-opt .en-letter').first()).toBeVisible()
  await playByTrying(page)
})

test('CVC: building words left to right by keyboard', async ({ page }) => {
  await open(page, ['eng.words-2', 'eng.letters', 'eng.sounds', 'eng.first-letter'], /בּוֹנִים מִילָּה/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const emoji = (await page.locator('.rb-picture').innerText()).trim()
    const word = WORDS.find(w => w.emoji === emoji)!
    expect(word, emoji).toBeTruthy()
    for (const letter of word.word) {
      await page.getByRole('button', { name: letter, exact: true }).first().focus()
      await page.keyboard.press('Enter')
    }
    // The first slot is on the left: the word reads left to right.
    const slots = await page.locator('.rb-slot').evaluateAll(els => els.map(e => ({ x: e.getBoundingClientRect().x, t: e.textContent ?? '' })))
    const sorted = [...slots].sort((a, b) => a.x - b.x).map(s => s.t.trim()).join('')
    expect(sorted).toBe(word.word)
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
