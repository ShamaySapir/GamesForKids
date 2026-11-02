import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile, master } from './helpers'

// Plays full rounds of the thinking island through the real UI.

async function open(page: Page, mastered: string[], link: RegExp) {
  await createProfile(page)
  await master(page, mastered)
  await page.getByRole('button', { name: /אִי הַחֲשִׁיבָה/ }).click()
  await page.getByRole('link', { name: link }).click()
}

test('odd one out: a round completes', async ({ page }) => {
  await open(page, [], /מִי שׁוֹנֶה/)
  // The difference is only visual, so try options until the right one is accepted.
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

test('memory: matching every pair by keyboard', async ({ page }) => {
  await open(page, [], /זִכָּרוֹן קָטָן/)
  for (let board = 0; board < 2; board++) {
    await atQuestion(page, board)
    const cards = page.locator('.tk-mem-card')
    await expect(cards).toHaveCount(6)
    // Flip cards two at a time, remember faces, then match known pairs — as a child would.
    const seen = new Map<number, string>()
    const flip = async (i: number) => {
      await cards.nth(i).focus()
      await page.keyboard.press('Enter')
      const face = await cards.nth(i).locator('.tk-mem-face').innerHTML()
      seen.set(i, face)
      return face
    }
    const done = () => page.locator('.tk-mem-card.found').count()
    for (let i = 0; i < 6 && (await done()) < 6; i += 2) {
      const a = await flip(i)
      const pairOfA = [...seen].find(([j, f]) => j !== i && f === a && j < i)
      if (pairOfA) { await flip(pairOfA[0]); await page.waitForTimeout(100); i--; continue }
      await flip(i + 1)
      await page.waitForTimeout(1000)
    }
    // Match whatever is left from memory.
    for (let guard = 0; (await done()) < 6 && guard < 10; guard++) {
      const open = new Set(await cards.evaluateAll(els => els.flatMap((e, k) => (e.classList.contains('found') ? [k] : []))))
      const rest = [...seen].filter(([k]) => !open.has(k))
      const pair = rest.find(([k, f]) => rest.some(([m, g]) => m !== k && g === f))
      if (!pair) break
      const other = rest.find(([m, g]) => m !== pair[0] && g === pair[1])!
      await flip(pair[0]); await flip(other[0]); await page.waitForTimeout(100)
    }
    await expect(page.locator('.tk-mem-card.found')).toHaveCount(6)
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('maze: walking to the goal with the arrow keys', async ({ page }) => {
  await open(page, ['think.where'], /מָבוֹךְ/)
  for (let round = 0; round < 3; round++) {
    await atQuestion(page, round)
    await expect(page.locator('.tk-maze-hero')).toHaveCount(1)
    // Read the grid from the page and walk the shortest path.
    const grid = await page.locator('.tk-maze-cell').evaluateAll(els => els.map(e => ({
      cell: e.getAttribute('data-cell')!, wall: e.classList.contains('wall'),
      hero: !!e.querySelector('.tk-maze-hero'), goal: !!e.querySelector('.tk-maze-goal'),
    })))
    const at = (s: string) => s.split(',').map(Number) as [number, number]
    const open = new Set(grid.filter(g => !g.wall).map(g => g.cell))
    const start = grid.find(g => g.hero)!.cell
    const goal = grid.find(g => g.goal)!.cell
    const prev = new Map<string, [string, string]>([[start, ['', '']]])
    const queue = [start]
    const moves: [string, number, number][] = [['ArrowUp', -1, 0], ['ArrowDown', 1, 0], ['ArrowLeft', 0, -1], ['ArrowRight', 0, 1]]
    while (queue.length) {
      const cur = queue.shift()!
      const [r, c] = at(cur)
      for (const [key, dr, dc] of moves) {
        const next = `${r + dr},${c + dc}`
        if (open.has(next) && !prev.has(next)) { prev.set(next, [cur, key]); queue.push(next) }
      }
    }
    const path: string[] = []
    for (let s = goal; s !== start; s = prev.get(s)![0]) path.unshift(prev.get(s)![1])
    await page.locator('.tk-maze').focus()
    for (const key of path) await page.keyboard.press(key)
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
