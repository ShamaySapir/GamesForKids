import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { numberWords } from '../src/app/parents/gate'
import { createProfile } from './helpers'

// The parents' page through the real UI (docs/specs/parents.md): gate, settings, practice list, backup.

/** Reads the number written in words and types it, as a parent would. */
async function passGate(page: Page) {
  await page.goto('/#/parents')
  const words = await page.locator('.pr-gate-words').innerText()
  const n = Array.from({ length: 79 }, (_, i) => 21 + i).find(k => numberWords(k) === words.trim())
  expect(n, words).toBeDefined()
  await page.getByLabel('המספר').fill(String(n))
  await page.getByRole('button', { name: 'כניסה' }).click()
  await expect(page.getByRole('heading', { name: 'דף הורים' })).toBeVisible()
}

test('the gate opens only on the right number, and asks a new one after a wrong answer', async ({ page }) => {
  await createProfile(page)
  await page.goto('/#/profiles')
  await page.getByRole('link', { name: /לַהוֹרִים/ }).click()
  const first = await page.locator('.pr-gate-words').innerText()
  const n = Array.from({ length: 79 }, (_, i) => 21 + i).find(k => numberWords(k) === first.trim())!
  await page.getByLabel('המספר').fill(String(n === 99 ? 21 : n + 1))
  await page.getByRole('button', { name: 'כניסה' }).click()
  await expect(page.getByRole('heading', { name: 'דף הורים' })).toHaveCount(0)
  await expect(page.getByLabel('המספר')).toHaveValue('')
  await passGate(page)
})

test('a settings change persists after a reload', async ({ page }) => {
  await createProfile(page)
  await passGate(page)
  const speak = page.getByRole('checkbox', { name: /השמעה אוטומטית/ })
  const before = await speak.isChecked()
  await speak.click()
  await expect(page.getByRole('status').filter({ hasText: 'נשמר' })).toBeVisible()
  await page.reload()
  await passGate(page)
  await expect(page.getByRole('checkbox', { name: /השמעה אוטומטית/ })).toBeChecked({ checked: !before })
})

test('a missed item shows under "what to practise"', async ({ page }) => {
  await createProfile(page)
  await page.getByRole('button', { name: /אִי הַשָּׁעוֹן/ }).click()
  await page.getByRole('link', { name: /אֵיזֶה מָחוֹג/ }).click()
  for (let i = 0; i < 6; i++) {
    await expect(page.locator('.dot.done')).toHaveCount(i)
    const prompt = await page.locator('.clock-q').innerText()
    const right = prompt.includes('הַקָּצָר') ? 'מחוג השעות' : 'מחוג הדקות'
    const wrong = right === 'מחוג השעות' ? 'מחוג הדקות' : 'מחוג השעות'
    if (i === 0) await page.getByRole('button', { name: wrong }).locator('circle').click()
    await page.getByRole('button', { name: right }).locator('circle').click()
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
  await passGate(page)
  const practice = page.locator('.pr-practice')
  await expect(practice).toContainText('מַכִּירִים אֶת הַמְּחוֹגִים')
})

test('a backup restores a deleted child', async ({ page }) => {
  await createProfile(page)
  await passGate(page)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'שמור גיבוי' }).click()
  const file = await (await download).path()
  expect(JSON.parse(await readFile(file, 'utf8'))).toMatchObject({ app: 'lomdim-vemsachakim', version: 1, profiles: [{ name: 'נועה' }] })

  await page.getByRole('button', { name: 'מחק ילד' }).click()
  await page.getByLabel('השם לאישור').fill('נועה')
  await page.getByRole('alertdialog').getByRole('button', { name: 'מחק ילד' }).click()
  await expect(page.getByRole('tab', { name: /נועה/ })).toHaveCount(0)

  await page.locator('.pr-file input[type=file]').setInputFiles(file)
  await expect(page.getByRole('alertdialog')).toContainText('נועה')
  await page.getByRole('alertdialog').getByRole('button', { name: 'שחזר' }).click()
  await expect(page.getByRole('tab', { name: /נועה/ })).toBeVisible()
})
