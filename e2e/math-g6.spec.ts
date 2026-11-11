import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile } from './helpers'

// Grade 6 on the numbers island (docs/specs/math-grade6.md), played through the real UI. Soft locks (D19) let any
// skill be opened directly.

async function openGame(page: Page, game: RegExp) {
  await createProfile(page)
  await page.getByRole('button', { name: /אִי הַמִּסְפָּרִים/ }).click()
  await page.getByRole('link', { name: game }).click()
}

const heights = async (page: Page) =>
  Promise.all((await page.locator('[data-bar]').all()).map(async b => Number((await b.getAttribute('aria-label'))!.split(': ')[1])))

test('mean: levelling the bars by tapping, then checking', async ({ page }) => {
  test.setTimeout(120_000)
  await openGame(page, /מַשְׁוִים עַמּוּדוֹת/)
  for (let i = 0; i < 4; i++) {
    await atQuestion(page, i)
    await expect(page.locator('[data-bar]').first()).toBeVisible()
    // Move one block at a time from the tallest bar to the shortest until all are equal.
    for (let h = await heights(page); Math.max(...h) !== Math.min(...h); h = await heights(page)) {
      await page.locator(`[data-bar="${h.indexOf(Math.max(...h))}"]`).click()
      await page.locator(`[data-bar="${h.indexOf(Math.min(...h))}"]`).click()
    }
    await page.getByRole('button', { name: 'בְּדִיקָה' }).click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('circle: tapping the named part', async ({ page }) => {
  await openGame(page, /חֶלְקֵי הַמַּעְגָּל/)
  const names: Record<string, string> = { רַדְיוּס: 'radius', קֹטֶר: 'diameter', מֵיתָר: 'chord', קֶשֶׁת: 'arc' }
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const q = await page.locator('.pk-q').innerText()
    const part = Object.entries(names).find(([he]) => q.includes(he))![1]
    // A finger taps along the line; Playwright's click aims at the box centre, which for the radius lies on the
    // diameter, so fire the click on the part itself (the game delegates clicks by data-part).
    await page.getByRole('button', { name: Object.keys(names).find(he => names[he] === part)! }).first().dispatchEvent('click')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('percent: benchmark percents of a whole on the number pad', async ({ page }) => {
  await openGame(page, /אֲחוּזִים מִמִּסְפָּר/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const [, p, n] = /(\d+)% × ([\d,]+)/.exec(await page.locator('.pk-expr').innerText())!
    await page.keyboard.type(String((Number(p) * Number(n!.replace(/,/g, ''))) / 100))
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
