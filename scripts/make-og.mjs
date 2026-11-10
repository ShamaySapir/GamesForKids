// Renders scripts/og.html to public/og.png (1200×630), the link preview image (og:image). Run: node scripts/make-og.mjs
import { chromium } from '@playwright/test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(pathToFileURL(join(root, 'scripts/og.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(root, 'public/og.png') })
await browser.close()
