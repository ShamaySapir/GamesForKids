import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile } from './helpers'

// Grade 5 on the numbers island (docs/specs/math-grade5.md), played through the real UI. Soft locks (D19) let any
// skill be opened directly.

async function openGame(page: Page, game: RegExp) {
  await createProfile(page)
  await page.getByRole('button', { name: /אִי הַמִּסְפָּרִים/ }).click()
  await page.getByRole('link', { name: game }).click()
}

const smallestFactor = (n: number) => { for (let p = 2; p * p <= n; p++) if (n % p === 0) return p; return n }
const isPrime = (n: number) => n > 1 && smallestFactor(n) === n

test('factor tree: splitting by keyboard until only primes are left', async ({ page }) => {
  await openGame(page, /עֵץ גּוֹרְמִים/)
  for (let i = 0; i < 4; i++) {
    await atQuestion(page, i)
    while (!(await page.locator('.ft-eq').innerText())) {
      const leaf = Number(await page.locator('.ft-circle.cur').innerText())
      await page.keyboard.type(String(smallestFactor(leaf)))
      await page.keyboard.press('Enter')
    }
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('decimal columns: the points stay in line, digits from the right', async ({ page }) => {
  await openGame(page, /הַנְּקֻדּוֹת בְּשׁוּרָה/)
  for (let i = 0; i < 4; i++) {
    await atQuestion(page, i)
    const label = (await page.locator('.g3-col').getAttribute('aria-label'))!
    const [, a, op, b] = /([\d.]+) ([+−-]) ([\d.]+)/.exec(label)!
    const places = Math.max(...[a!, b!].map(s => (s.split('.')[1] ?? '').length))
    const result = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)
    await page.keyboard.type([...result.toFixed(places).replace('.', '')].reverse().join(''))
    await page.keyboard.press('Enter')
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('primes: sorting numbers into prime, composite and neither by tapping', async ({ page }) => {
  // Four rounds of eight numbers, two taps each: longer than the default 30 s.
  test.setTimeout(120_000)
  await openGame(page, /רִאשׁוֹנִי אוֹ פָּרִיק/)
  const bins = ['רִאשׁוֹנִי', 'פָּרִיק', 'לֹא זֶה וְלֹא זֶה']
  for (let i = 0; i < 4; i++) {
    await atQuestion(page, i)
    // Count the numbers only once the new question is on screen (the dots update before it renders).
    await expect(page.locator('.g3-pool .g3-chip:not(.ok)')).toHaveCount(8)
    for (let left = 8; left > 0; left--) {
      const chip = page.locator('.g3-pool .g3-chip').first()
      const n = Number(await chip.innerText())
      await chip.click()
      await page.getByRole('button', { name: bins[n === 1 ? 2 : isPrime(n) ? 0 : 1] }).click()
    }
    await page.getByRole('button', { name: 'בְּדִיקָה' }).click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
