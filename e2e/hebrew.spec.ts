import { expect, test, type Page } from '@playwright/test'
import { DAGESH_GROUPS, WORDS } from '../src/subjects/hebrew/content/words'

// Plays full rounds through the real UI, using the content data to know the right answers.

const byEmoji = (emoji: string) => WORDS.find(w => w.emoji === emoji)!
const byText = (text: string) => WORDS.find(w => w.text === text)!
const NEXT_QUESTION_MS = 1300

async function startOnIsland(page: Page) {
  await page.goto('/')
  await page.getByLabel('שם').fill('נועה')
  await page.getByRole('button', { name: 'יאללה!' }).click()
  await page.getByRole('button', { name: /אי האותיות/ }).click()
}

/** Mark skills mastered directly in IndexedDB (idb-keyval's default store) to unlock later skills. */
async function master(page: Page, skillIds: string[]) {
  await page.evaluate(async ids => {
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open('keyval-store')
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const store = () => db.transaction('keyval', 'readwrite').objectStore('keyval')
    const profiles = await new Promise<{ id: string }[]>(res => { const r = store().get('profiles'); r.onsuccess = () => res(r.result) })
    const skills = Object.fromEntries(ids.map(id => [id, { rounds: [], mastered: true, bestStars: 3 }]))
    await new Promise(res => { const r = store().put({ skills, leitner: {}, stickers: [], totalStars: 0 }, `progress:${profiles[0]!.id}`); r.onsuccess = res })
  }, skillIds)
  await page.reload()
}

test('rhyme: a full round of picking the rhyming picture', async ({ page }) => {
  await startOnIsland(page)
  await page.getByRole('link', { name: /מה מתחרז/ }).click()
  for (let i = 0; i < 6; i++) {
    const target = byEmoji(await page.locator('.hb-prompt .hb-picture').innerText())
    const answer = WORDS.find(w => w.id !== target.id && w.rhyme === target.rhyme && w.rhyme)
    const rhymes = WORDS.filter(w => w.id !== target.id && w.rhyme === target.rhyme).map(w => w.emoji)
    expect(answer, target.text).toBeTruthy()
    for (const opt of await page.locator('.hb-opt').all()) {
      if (rhymes.includes((await opt.getAttribute('aria-label'))!)) { await opt.click(); break }
    }
    await page.waitForTimeout(NEXT_QUESTION_MS)
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('syllables: clapping with the keyboard', async ({ page }) => {
  await startOnIsland(page)
  await page.getByRole('link', { name: /מוחאים כפיים/ }).click()
  for (let i = 0; i < 6; i++) {
    const word = byText(await page.locator('.hb-word').first().innerText())
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    for (let c = 0; c < word.syllables.length; c++) await page.keyboard.press('Space')
    await expect(page.locator('.hb-clap-dot.on')).toHaveCount(word.syllables.length)
    await page.locator('.hb-actions .cta').click()
    await page.waitForTimeout(NEXT_QUESTION_MS)
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('dagesh: sorting cards into baskets with the keyboard', async ({ page }) => {
  await startOnIsland(page)
  await master(page, ['hebrew.letter-picture'])
  await page.goto('/#/play/hebrew/hebrew.dagesh/sort')
  for (let board = 0; board < 3; board++) {
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
    await page.waitForTimeout(NEXT_QUESTION_MS)
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
