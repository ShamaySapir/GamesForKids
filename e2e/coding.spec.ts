import { expect, test, type Page } from '@playwright/test'
import { STORIES } from '../src/subjects/coding/content/stories'
import { atQuestion, createProfile, master } from './helpers'

// Plays full rounds of the coding island through the real UI (docs/specs/coding.md).

type Dir = 'up' | 'down' | 'left' | 'right'
const DIRS: Dir[] = ['up', 'down', 'left', 'right']
const STEP: Record<Dir, [number, number]> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }
const KEY: Record<Dir, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
const ARROW: Record<string, Dir> = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' }

async function open(page: Page, mastered: string[], link: RegExp) {
  await createProfile(page)
  await master(page, mastered)
  await page.getByRole('button', { name: /אִי הַתִּכְנוּת/ }).click()
  await page.getByRole('link', { name: link }).first().click()
}

/** Reads the drawn board: free/wall cells, and where Oli and the apple are. */
async function readBoard(page: Page) {
  return page.locator('.cd-play svg.cd-board').evaluate(el => {
    const svg = el as unknown as SVGSVGElement
    const cells = [...svg.querySelectorAll('rect.cd-free, rect.cd-wall')] as SVGRectElement[]
    const size = cells[0]!.width.baseVal.value + 4
    const at = (x: number, y: number) => [Math.floor(y / size), Math.floor(x / size)] as [number, number]
    const cols = Math.round(svg.viewBox.baseVal.width / size)
    const rows = cells.length / cols
    const walls = cells.filter(c => c.classList.contains('cd-wall')).map(c => at(c.x.baseVal.value + 2, c.y.baseVal.value + 2).join(','))
    // Screen boxes, mapped back into the board's own units (getBBox would ignore Oli's transform).
    const box = svg.getBoundingClientRect()
    const scale = svg.viewBox.baseVal.width / box.width
    const centre = (el: Element) => {
      const r = el.getBoundingClientRect()
      return at((r.x + r.width / 2 - box.x) * scale, (r.y + r.height / 2 - box.y) * scale)
    }
    return { rows, cols, walls, start: centre(svg.querySelector('g')!), goal: centre(svg.querySelector('text')!) }
  })
}

type Read = Awaited<ReturnType<typeof readBoard>>
const free = (b: Read, [r, c]: [number, number]) => r >= 0 && c >= 0 && r < b.rows && c < b.cols && !b.walls.includes(`${r},${c}`)

function walk(b: Read, dirs: readonly Dir[]): boolean {
  let at = b.start
  for (const d of dirs) {
    const next: [number, number] = [at[0] + STEP[d][0], at[1] + STEP[d][1]]
    if (!free(b, next)) return false
    at = next
  }
  return at[0] === b.goal[0] && at[1] === b.goal[1]
}

function shortest(b: Read): Dir[] {
  const seen = new Map<string, Dir[]>([[b.start.join(','), []]])
  const queue: [number, number][] = [b.start]
  while (queue.length) {
    const at = queue.shift()!
    const path = seen.get(at.join(','))!
    if (at[0] === b.goal[0] && at[1] === b.goal[1]) return path
    for (const d of DIRS) {
      const next: [number, number] = [at[0] + STEP[d][0], at[1] + STEP[d][1]]
      if (free(b, next) && !seen.has(next.join(','))) { seen.set(next.join(','), [...path, d]); queue.push(next) }
    }
  }
  throw new Error('board not solvable')
}

test('what comes first: a story-ordering round completes', async ({ page }) => {
  await open(page, [], /מָה קֹדֶם/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    await expect(page.locator('.rb-tile').first()).toBeVisible()
    const shown = await page.locator('.rb-tile').allInnerTexts()
    const story = STORIES.find(s => s.steps.length === shown.length && s.steps.every(st => shown.some(t => t.trim() === st.emoji)))
    expect(story, shown.join(' ')).toBeTruthy()
    // Exact text: a step can be two emoji (🪥🦷) that contain another step's emoji (🪥).
    for (const step of story!.steps) await page.locator('.rb-tile').filter({ hasText: new RegExp(`^${step.emoji}$`, 'u') }).first().click()
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})

test('programming step by step: building programs by keyboard reaches the apple every time', async ({ page }) => {
  await open(page, ['code.follow'], /מְתַכְנְתִים/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    await expect(page.locator('.cd-play svg')).toBeVisible()
    const board = await readBoard(page)
    await page.locator('.cd-play').focus()
    for (const d of shortest(board)) await page.keyboard.press(KEY[d])
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible({ timeout: 15000 })
})

test('fix the bug: one edit to the given program makes Oli reach the apple', async ({ page }) => {
  await open(page, ['code.follow', 'code.steps', 'code.bug-steps', 'code.arrows'], /מְתַקְּנִים בָּאג/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    await expect(page.locator('.cd-strip .cd-card').first()).toBeVisible()
    const board = await readBoard(page)
    // A card shows its order number before the arrow.
    const program = (await page.locator('.cd-strip .cd-card').allInnerTexts()).map(t => ARROW[t.replace(/\d+/g, '').trim()]!)
    const turn = program.flatMap((d, at) => DIRS.filter(x => x !== d).map(x => ({ at, to: x })))
      .find(({ at, to }) => walk(board, program.map((d, k) => (k === at ? to : d))))
    const remove = program.findIndex((_, at) => walk(board, program.filter((_, k) => k !== at)))
    const add = DIRS.find(d => walk(board, [...program, d]))
    const cards = page.locator('.cd-strip .cd-card')
    if (turn) {
      const clicks = (DIRS.indexOf(turn.to) - DIRS.indexOf(program[turn.at]!) + 4) % 4
      for (let k = 0; k < clicks; k++) await cards.nth(turn.at).click()
    } else if (remove >= 0) {
      for (let k = 0; k < 4; k++) await cards.nth(remove).click()
      await page.locator('.cd-erase').click()
    } else {
      expect(add, 'a one-card fix exists').toBeTruthy()
      await page.locator('.cd-pal').nth(DIRS.indexOf(add!)).click()
    }
    await page.locator('.cd-run').click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible({ timeout: 15000 })
})
