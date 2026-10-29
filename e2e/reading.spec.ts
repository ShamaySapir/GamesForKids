import { expect, test, type Page } from '@playwright/test'
import { WORDS } from '../src/subjects/hebrew/content/words'
import { BOOKS } from '../src/subjects/reading/content/books'

// Plays full rounds of the reading island through the real UI, using content data to know the right answers.

const atQuestion = (page: Page, i: number) => expect(page.locator('.dot.done')).toHaveCount(i)

async function startWithMastered(page: Page, skillIds: string[]) {
  await page.goto('/')
  await page.getByLabel('שם').fill('נועה')
  await page.getByRole('button', { name: 'יאללה!' }).click()
  await page.getByRole('button', { name: /אִי הַקְּרִיאָה/ }).waitFor()
  await page.evaluate(async ids => {
    const db = await new Promise<IDBDatabase>(res => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => res(r.result) })
    const store = () => db.transaction('keyval', 'readwrite').objectStore('keyval')
    const profiles = await new Promise<{ id: string }[]>(res => { const r = store().get('profiles'); r.onsuccess = () => res(r.result) })
    const skills = Object.fromEntries(ids.map(id => [id, { rounds: [], mastered: true, bestStars: 3 }]))
    await new Promise(res => { const r = store().put({ skills, leitner: {}, stickers: [], totalStars: 0 }, `progress:${profiles[0]!.id}`); r.onsuccess = res })
  }, skillIds)
  await page.reload()
  await page.getByRole('button', { name: /אִי הַקְּרִיאָה/ }).click()
}

test('vowels: a round of hear-the-unit completes', async ({ page }) => {
  await startWithMastered(page, ['hebrew.letters-4'])
  await page.getByRole('link', { name: /אֵיפֹה כָּתוּב/ }).first().click()
  // The unit is only spoken, so try options until the right one is accepted.
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    await expect(page.locator('.hb-opt')).toHaveCount(4)
    for (const opt of await page.locator('.hb-opt').all()) {
      if (await opt.isDisabled()) continue
      await opt.click()
      if (await page.locator('.hb-opt.ok').count()) break
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
