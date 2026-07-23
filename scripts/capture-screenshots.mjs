#!/usr/bin/env node
/**
 * Capture help center screenshots from a running Envoy app.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs --base-url http://localhost:8080
 *
 * Requires: npx playwright (uses playwright from envoy-project-management if available)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const args = process.argv.slice(2)
const baseUrlIndex = args.indexOf('--base-url')
const baseUrl = baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : 'http://localhost:8080'

const shots = [
  { path: 'images/getting-started/landing-intake.png', url: '/', waitFor: '#blurb' },
  { path: 'images/getting-started/registration-form.png', url: '/register', waitFor: 'h2' },
  { path: 'images/projects/dashboard-empty.png', url: '/dashboard', auth: true },
  { path: 'images/account/email-connections.png', url: '/account', auth: true },
  { path: 'images/account/vendor-pending.png', url: '/vendor/pending', auth: true },
]

async function main() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('Install Playwright: npm i -D playwright && npx playwright install chromium')
    process.exit(1)
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  for (const shot of shots) {
    const dest = join(root, shot.path)
    await mkdir(dirname(dest), { recursive: true })
    try {
      await page.goto(`${baseUrl}${shot.url}`, { waitUntil: 'networkidle', timeout: 15000 })
      if (shot.waitFor) await page.waitForSelector(shot.waitFor, { timeout: 10000 })
      await page.screenshot({ path: dest, fullPage: shot.fullPage ?? false })
      console.log(`✓ ${shot.path}`)
    } catch (err) {
      console.warn(`✗ ${shot.path}: ${err.message}`)
      await writeFile(
        join(dirname(dest), '.missing'),
        `${shot.path} — capture manually from ${baseUrl}${shot.url}\n`
      )
    }
  }

  await browser.close()
  console.log('\nDone. See images/README.md for the full inventory.')
}

main()
