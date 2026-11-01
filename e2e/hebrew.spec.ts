import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile, master } from './helpers'
import { DAGESH_GROUPS, WORDS } from '../src/subjects/hebrew/content/words'

// Plays full rounds through the real UI, using the content data to know the right answers.

async function startOnIsland(page: Page) {
  await createProfile(page)
  await page.getByRole('button', { name: /אי האותיות/ }).click()
}

const byEmoji = (emoji: string) => WORDS.find(w => w.emoji === emoji)!
const byText = (text: string) => WORDS.find(w => w.text === text)!
/** Wait for the round to reach question i (fixed sleeps were flaky under parallel load). */

/** Mark skills mastered directly in IndexedDB (idb-keyval's default store) to unlock later skills. */

test('rhyme: a full round of picking the rhyming picture', async ({ page }) => {
  await startOnIsland(page)
  await page.getByRole('link', { name: /מה מתחרז/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const target = byEmoji(await page.locator('.pk-prompt .pk-picture').innerText())
    const answer = WORDS.find(w => w.id !== target.id && w.rhyme === target.rhyme && w.rhyme)
    const rhymes = WORDS.filter(w => w.id !== target.id && w.rhyme === target.rhyme).map(w => w.emoji)
    expect(answer, target.text).toBeTruthy()
    for (const opt of await page.locator('.pk-opt').all()) {
      if (rhymes.includes((await opt.getAttribute('aria-label'))!)) { await opt.click(); break }
    }
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('syllables: clapping with the keyboard', async ({ page }) => {
  await startOnIsland(page)
  await page.getByRole('link', { name: /מוחאים כפיים/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const word = byText(await page.locator('.pk-word').first().innerText())
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    for (let c = 0; c < word.syllables.length; c++) await page.keyboard.press('Space')
    await expect(page.locator('.hb-clap-dot.on')).toHaveCount(word.syllables.length)
    await page.locator('.hb-actions .cta').click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('dagesh: sorting cards into baskets with the keyboard', async ({ page }) => {
  await startOnIsland(page)
  await master(page, ['hebrew.letter-picture'])
  await page.goto('/#/play/hebrew/hebrew.dagesh/sort')
  for (let board = 0; board < 3; board++) {
    await atQuestion(page, board)
    await expect(page.locator('.hb-card')).toHaveCount(6)
    const bins = await page.locator('.hb-basket-label').evaluateAll(els => els.map(e => e.getAttribute('aria-label')!))
    for (let n = 0; n < 6; n++) {
      const card = page.locator('.hb-card').first()
      const word = byText(await card.locator('.hb-chip-text').innerText())
      const bin = bins.findIndex(label => (DAGESH_GROUPS as Record<string, readonly string[]>)[label]?.includes(word.id))
      await card.focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press(bin === 0 ? 'ArrowRight' : 'ArrowLeft')
      await page.keyboard.press('Enter')
    }
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
