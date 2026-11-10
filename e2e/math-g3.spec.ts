import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile, passGate } from './helpers'

// Grade 3 on the numbers island (docs/specs/math-grade3.md), played through the real UI. Soft locks (D19) let any
// skill be opened directly, so nothing needs mastering first.

async function openGame(page: Page, game: RegExp) {
  await createProfile(page)
  await page.getByRole('button', { name: /אִי הַמִּסְפָּרִים/ }).click()
  await page.getByRole('link', { name: game }).click()
}

test('column: adding and subtracting to 10,000 by keyboard, ones first', async ({ page }) => {
  await openGame(page, /בִּמְאֻנָּךְ/)
  for (let i = 0; i < 4; i++) {
    await atQuestion(page, i)
    const label = (await page.locator('.g3-col').getAttribute('aria-label'))!
    const [, a, op, b] = /(\d+) ([+-]) (\d+)/.exec(label)!
    const answer = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)
    // The child writes the result from the ones column leftward.
    await page.keyboard.type([...String(answer)].reverse().join(''))
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('remainder: picking "quotient, remainder" for a division', async ({ page }) => {
  await openGame(page, /כַּמָּה וְכַמָּה נִשְׁאָר/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const [, n, d] = /(\d+) : (\d+)/.exec(await page.locator('.pk-expr').innerText())!
    const q = Math.floor(Number(n) / Number(d))
    const r = Number(n) % Number(d)
    await page.getByRole('button', { name: new RegExp(`^${q}, \\S+ ${r}$`) }).click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('angles: a full round, trying again after a miss', async ({ page }) => {
  await openGame(page, /אֵיזוֹ זָוִית/)
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    // The drawing is the question, so try the names in turn: a miss leaves the others to pick.
    for (const name of ['זָוִית חַדָּה', 'זָוִית יְשָׁרָה', 'זָוִית קֵהָה', 'זָוִית שְׁטוּחָה']) {
      if ((await page.locator('.dot.done').count()) > i) break
      const option = page.getByRole('button', { name, exact: true })
      if (await option.isEnabled()) await option.click()
      await page.waitForTimeout(150)
    }
  }
  await expect(page.locator('.pop').first()).toBeVisible()
})

test('arena: a timed sprint keeps a personal record and shows it to parents', async ({ page }) => {
  await page.clock.install()
  await openGame(page, /זִירַת הַכֶּפֶל/)
  await page.getByRole('button', { name: 'מַתְחִילִים!' }).click()
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.sprint-count')).toHaveText(`✓ ${i}`)
    const [, a, b] = /(\d+) × (\d+)/.exec(await page.locator('.pk-expr').innerText())!
    await page.keyboard.type(String(Number(a) * Number(b)))
    await page.keyboard.press('Enter')
    await page.clock.runFor(500)
  }
  await page.clock.runFor(61_000)
  await expect(page.getByTestId('sprint-score')).toHaveText('עֲנִיתֶם נָכוֹן עַל 3 תַּרְגִּילִים!')
  await expect(page.getByText('שִׂיא חָדָשׁ!')).toBeVisible()

  await passGate(page)
  await page.locator('.pr-island summary', { hasText: 'אִי הַמִּסְפָּרִים' }).click()
  await expect(page.getByText('שיא בזירת הכפל: 3')).toBeVisible()
})
