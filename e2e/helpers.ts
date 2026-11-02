import { expect, type Page } from '@playwright/test'

/** Create a profile named נועה and wait for the world map. */
export async function createProfile(page: Page) {
  await page.goto('/')
  await page.getByLabel('שם').fill('נועה')
  await page.getByRole('button', { name: 'יאללה!' }).click()
  await page.getByRole('button', { name: /אי השעון/ }).waitFor()
}

/**
 * Mark skills mastered in IndexedDB (idb-keyval's default store) to unlock later skills, then reload.
 * Waits for the transaction to complete — resolving on the put request alone can lose the write on reload.
 */
export async function master(page: Page, skillIds: readonly string[]) {
  await page.evaluate(async ids => {
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open('keyval-store')
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const read = db.transaction('keyval').objectStore('keyval').get('profiles')
    const profiles = await new Promise<{ id: string }[]>(res => { read.onsuccess = () => res(read.result) })
    const skills = Object.fromEntries(ids.map(id => [id, { rounds: [], mastered: true, bestStars: 3 }]))
    const tx = db.transaction('keyval', 'readwrite')
    tx.objectStore('keyval').put({ skills, leitner: {}, stickers: [], totalStars: 0 }, `progress:${profiles[0]!.id}`)
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error) })
  }, skillIds)
  await page.reload()
}

/** Wait until the round has reached question `i` (fixed sleeps were flaky under load). */
export const atQuestion = (page: Page, i: number) => expect(page.locator('.dot.done')).toHaveCount(i)
