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
