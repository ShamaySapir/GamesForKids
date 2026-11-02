import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile, master } from './helpers'
import { WORDS } from '../src/subjects/hebrew/content/words'
import { BOOKS } from '../src/subjects/reading/content/books'

async function startWithMastered(page: Page, skillIds: string[]) {
  await createProfile(page)
  await master(page, skillIds)
  await page.getByRole('button', { name: /אִי הַקְּרִיאָה/ }).click()
}

// Plays full rounds of the reading island through the real UI, using content data to know the right answers.

test('vowels: a round of hear-the-unit completes', async ({ page }) => {
  await startWithMastered(page, ['hebrew.letters-4'])
  await page.getByRole('link', { name: /אֵיפֹה כָּתוּב/ }).first().click()
  // The unit is only spoken, so try options until the right one is accepted.
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    await expect(page.locator('.pk-opt')).toHaveCount(4)
    for (const opt of await page.locator('.pk-opt').all()) {
      if (await opt.isDisabled()) continue
      await opt.click()
      if (await page.locator('.pk-opt.ok').count()) break
    }
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})

test('build: placing a word\'s units by keyboard', async ({ page }) => {
  await startWithMastered(page, ['hebrew.letters-4', 'reading.vowels-a'])
  await page.getByRole('link', { name: /בּוֹנִים מִילָּה/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const emoji = (await page.locator('.rb-picture').innerText()).trim()
    const target = WORDS.find(w => w.emoji === emoji)
    expect(target, emoji).toBeTruthy()
    for (const syllable of target!.syllables) {
      // Exact name: 'נָ' must not match the 'נָה' tile.
      await page.getByRole('button', { name: syllable, exact: true }).first().focus()
      await page.keyboard.press('Enter')
    }
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('book: reading every page and answering the questions', async ({ page }) => {
  await startWithMastered(page, [])
  const book = BOOKS[0]!
  await page.getByRole('link', { name: book.title }).click()
  await page.locator('.rb-start').click()
  for (let p = 0; p < book.pages.length; p++) {
    await expect(page.locator('.rb-scene')).toHaveText(book.pages[p]!.scene)
    await page.locator('.rb-nav .cta').click()
  }
  for (const q of book.questions) {
    const right = q.options[q.answer]!
    await page.getByRole('button', { name: right.text ?? right.scene, exact: true }).click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
