import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile, master } from './helpers'

async function startWithMastered(page: Page, skillIds: string[]) {
  await createProfile(page)
  await master(page, skillIds)
  await page.getByRole('button', { name: /אִי הַמִּסְפָּרִים/ }).click()
}

// Plays full rounds of the numbers island through the real UI.

test('count: how many objects, a full round', async ({ page }) => {
  await startWithMastered(page, [])
  await page.getByRole('link', { name: /כַּמָּה יֵשׁ/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    // The objects group is labelled with its count.
    const count = await page.locator('.pk-prompt [role=img]').getAttribute('aria-label')
    await page.getByRole('button', { name: count!, exact: true }).click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('within 20: solving on the number pad with the keyboard', async ({ page }) => {
  await startWithMastered(page, ['math.count-10', 'math.stories-10', 'math.splits-10'])
  await page.getByRole('link', { name: /כַּמָּה זֶה/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const expr = (await page.locator('.pk-expr').innerText()).replace('−', '-')
    const [, a, op, b] = /(\d+) ([+-]) (\d+)/.exec(expr)!
    const answer = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)
    await page.keyboard.type(String(answer))
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('number line: dragging the marker to the target', async ({ page }) => {
  await startWithMastered(page, ['math.numerals-10', 'math.count-100'])
  await page.getByRole('link', { name: /שִׂימוּ עַל הַקַּו/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const target = Number(await page.locator('.ml-stage .pk-expr').innerText())
    const slider = page.getByRole('slider')
    const min = Number(await slider.getAttribute('aria-valuemin'))
    const max = Number(await slider.getAttribute('aria-valuemax'))
    const box = (await page.locator('.ml-svg').boundingBox())!
    // Lines are laid out with 40px before min and 52px after max (games-line.tsx).
    const xFor = (v: number) => box.x + 40 + ((v - min) / (max - min)) * (box.width - 92)
    const from = (await slider.boundingBox())!
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(xFor(target), from.y + from.height / 2, { steps: 10 })
    await page.mouse.up()
    await page.locator('.ml-check').click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

const GRADE1 = ['math.count-10', 'math.numerals-10', 'math.stories-10', 'math.count-100', 'math.number-line', 'math.splits-10', 'math.within-20', 'math.tens']

test('place value: building numbers by keyboard', async ({ page }) => {
  await startWithMastered(page, GRADE1)
  await page.getByRole('link', { name: /בּוֹנִים מִסְפָּר/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const n = Number(await page.locator('.pv-show').innerText())
    const cols = page.locator('.pv-col')
    const digits = String(n).padStart(await cols.count(), '0').split('').map(Number)
    // Columns are laid out hundreds → ones, left to right.
    for (let c = 0; c < digits.length; c++) {
      await cols.nth(c).focus()
      for (let k = 0; k < digits[c]!; k++) await page.keyboard.press('ArrowUp')
    }
    await page.locator('.pv-actions .cta').click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('within 100: a round of two-digit exercises', async ({ page }) => {
  await startWithMastered(page, [...GRADE1, 'math.place-value'])
  await page.getByRole('link', { name: /תַּרְגִּילִים עַד 100/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const expr = (await page.locator('.pk-expr').innerText()).replace('−', '-')
    const [, a, op, b] = /(\d+) ([+-]) (\d+)/.exec(expr)!
    await page.keyboard.type(String(op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)))
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('divide: sharing items equally by dragging', async ({ page }) => {
  await startWithMastered(page, [...GRADE1, 'math.facts-20', 'math.times'])
  await page.getByRole('link', { name: /מְחַלְּקִים לַצַּלָּחוֹת/ }).click()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const plates = page.locator('.sh-plate')
    await expect(plates.first()).toBeVisible()
    const count = await plates.count()
    const pile = page.locator('.sh-pile .sh-item')
    // One item by drag, the rest by tapping plates in turn (regression: a tap right after a drag was ignored).
    const from = (await pile.first().boundingBox())!
    const to = (await plates.first().boundingBox())!
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 })
    await page.mouse.up()
    for (let k = 1; (await pile.count()) > 0; k++) {
      const before = await pile.count()
      await page.locator('.sh-dish').nth(k % count).click()
      await expect(pile).toHaveCount(before - 1)
    }
    await page.locator('.sh-stage .cta').click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
