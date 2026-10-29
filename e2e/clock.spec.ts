import { expect, test, type Page } from '@playwright/test'

// Full flow: profile → map → clock island → round → stars → reload keeps progress.

async function createProfile(page: Page) {
  await page.goto('/')
  await page.getByLabel('שם').fill('נועה')
  await page.getByRole('button', { name: 'יאללה!' }).click()
  await expect(page.getByRole('button', { name: /אי השעון/ })).toBeVisible()
}

test('a child can create a profile, play a round, and keep progress after reload', async ({ page }) => {
  await createProfile(page)
  await page.getByRole('button', { name: /אי השעון/ }).click()
  await page.getByRole('link', { name: /איזה מחוג/ }).click()

  // "Which hand?" — read the prompt and click the matching hand, six times.
  for (let i = 0; i < 6; i++) {
    // Wait for the round to reach question i rather than sleeping: fixed delays were flaky under load.
    await expect(page.locator('.dot.done')).toHaveCount(i)
    const prompt = await page.locator('.clock-q').innerText()
    const hand = prompt.includes('הקצר') ? 'מחוג השעות' : 'מחוג הדקות'
    await page.getByRole('button', { name: hand }).click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
  await expect(page.locator('.stars')).toHaveText('⭐ 3')

  await page.reload()
  await expect(page.locator('.stars')).toHaveText('⭐ 3')
})

test('clock hands can be set by dragging and by keyboard', async ({ page }) => {
  await createProfile(page)
  await page.getByRole('button', { name: /אי השעון/ }).click()
  await page.getByRole('link', { name: /כוונו את השעון/ }).first().click()

  const clock = page.locator('svg.clock')
  const box = (await clock.boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const hour = page.getByRole('slider', { name: 'מחוג השעות' })

  // Set games start at 9:00 with the hands apart. Drag the hour hand to 3 o'clock.
  const tip = (await hour.locator('circle').boundingBox())!
  await page.mouse.move(tip.x + tip.width / 2, tip.y + tip.height / 2)
  await page.mouse.down()
  await page.mouse.move(cx + box.width * 0.2, cy, { steps: 8 })
  await page.mouse.up()
  await expect(hour).toHaveAttribute('aria-valuetext', 'שלוש')

  // Keyboard: one step forward.
  await hour.focus()
  await page.keyboard.press('ArrowUp')
  await expect(hour).toHaveAttribute('aria-valuetext', 'ארבע')
})
