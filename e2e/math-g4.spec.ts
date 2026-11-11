import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile } from './helpers'

// Grade 4 on the numbers island (docs/specs/math-grade4.md), played through the real UI. Soft locks (D19) let any
// skill be opened directly.

async function openGame(page: Page, game: RegExp) {
  await createProfile(page)
  await page.getByRole('button', { name: /אִי הַמִּסְפָּרִים/ }).click()
  await page.getByRole('link', { name: game }).click()
}

const placeParts = (n: number) => [...String(n)].flatMap((d, i, s) => (d === '0' ? [] : [Number(d) * 10 ** (s.length - 1 - i)]))

test('area model: each part, then the total, by keyboard', async ({ page }) => {
  await openGame(page, /מוֹדֶל הַשֶּׁטַח/)
  for (let i = 0; i < 4; i++) {
    await atQuestion(page, i)
    const [, a, b] = /(\d+) × (\d+)/.exec((await page.locator('.g4-area').getAttribute('aria-label'))!)!
    // Cells are filled row by row (b's parts), each row across a's parts; Enter moves on, and on the total it checks.
    for (const r of placeParts(Number(b))) for (const c of placeParts(Number(a))) {
      await page.keyboard.type(String(r * c))
      await page.keyboard.press('Enter')
    }
    await page.keyboard.type(String(Number(a) * Number(b)))
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('fractions: typing a sum on the fraction pad (an equivalent answer counts)', async ({ page }) => {
  await openGame(page, /אוֹתוֹ מְכַנֶּה/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const expr = (await page.locator('.pk-expr [aria-label]').first().getAttribute('aria-label'))!
    const [, a, d, op, c] = /(\d+) חלקי (\d+) ([+−-]) (\d+) חלקי \d+/.exec(expr)!
    const num = op === '+' ? Number(a) + Number(c) : Number(a) - Number(c)
    // Typed as one improper fraction: the whole box stays empty (0) and the value is compared, not the form.
    await page.getByRole('button', { name: /^מוֹנֶה/ }).click()
    await page.keyboard.type(String(num))
    await page.getByRole('button', { name: /^מְכַנֶּה/ }).click()
    await page.keyboard.type(d!)
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('shade: tapping parts of a shape to show a fraction', async ({ page }) => {
  await openGame(page, /צוֹבְעִים שֶׁבֶר/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const show = (await page.locator('.g4-stage [aria-label*="חלקי"]').first().getAttribute('aria-label'))!
    const [, n] = /(\d+) חלקי (\d+)/.exec(show)!
    for (let k = 1; k <= Number(n); k++) await page.locator('[aria-pressed]').nth(k - 1).click()
    await page.getByRole('button', { name: 'בְּדִיקָה' }).click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('quadrilaterals: a full round, trying again after a miss', async ({ page }) => {
  await openGame(page, /אֵיךְ קוֹרְאִים לוֹ/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    for (const name of ['רִבּוּעַ', 'מַלְבֵּן', 'מְעֻיָּן', 'מַקְבִּילִית', 'טְרַפֵּז']) {
      if ((await page.locator('.dot.done').count()) > i) break
      const option = page.getByRole('button', { name, exact: true })
      if ((await option.count()) && await option.isEnabled()) await option.click()
      await page.waitForTimeout(150)
    }
  }
  await expect(page.locator('.pop').first()).toBeVisible()
})
