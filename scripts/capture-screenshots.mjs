#!/usr/bin/env node
/**
 * Capture help center screenshots from a running Envoy app.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs --base-url http://127.0.0.1:18080
 *   node scripts/capture-screenshots.mjs --base-url http://127.0.0.1:18080 --scheme dark
 *   node scripts/capture-screenshots.mjs --base-url https://app.hello-envoy.com --path search-results-badges
 *
 * Requires Playwright. Installs from envoy-project-management when available:
 *   cd ../envoy-project-management && npm i && npx playwright install chromium
 */
import { tmpdir } from 'node:os'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pmRoot = join(root, '..', 'envoy-project-management')

const args = process.argv.slice(2)
const baseUrlIndex = args.indexOf('--base-url')
const baseUrl = (baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : 'http://127.0.0.1:18080').replace(
  /\/$/,
  ''
)

const PROJECT_ALPHA_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const FEATURED_CONTACT = 'Petal & Stem'
const WEDDING_INTAKE =
  'Outdoor garden wedding for 120 guests in Charleston this June — ceremony, florist, catering, and photography'

function appUrl(path) {
  return new URL(path, `${baseUrl}/`).toString()
}

function isRedirect(status) {
  return status === 302 || status === 303
}

function isLoginRedirect(location) {
  if (!location) return false
  try {
    return new URL(location, baseUrl).pathname === '/login'
  } catch {
    return location.startsWith('/login')
  }
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    const require = createRequire(import.meta.url)
    const pmPlaywright = join(pmRoot, 'node_modules', 'playwright', 'index.mjs')
    return import(pathToFileURL(pmPlaywright).href)
  }
}

async function registerUser(page, { fullName, email, password, accountType = 'consumer' }) {
  const form = {
    fullName,
    email,
    password,
    passwordConfirmation: password,
  }
  if (accountType === 'vendor') form.accountType = 'vendor'

  const response = await page.request.post(appUrl('/register'), {
    form,
    maxRedirects: 0,
  })

  if (!isRedirect(response.status())) {
    throw new Error(`Registration failed for ${email} (status ${response.status()})`)
  }
}

async function login(page, { email, password, completeConsent = true }) {
  const response = await page.request.post(appUrl('/login'), {
    form: { email, password },
    maxRedirects: 0,
  })

  if (!isRedirect(response.status())) {
    throw new Error(`Login failed for ${email} (status ${response.status()})`)
  }
  if (isLoginRedirect(response.headers().location)) {
    throw new Error(
      `Login failed for ${email} — redirected to /login. Use local dev with seeded users (see images/README.md).`
    )
  }

  if (!completeConsent) return

  const consentResponse = await page.request.post(appUrl('/onboarding/consent'), {
    data: { termsAccepted: true, modelTrainingOptIn: false },
    maxRedirects: 0,
  })
  if (!consentResponse.ok() && !isRedirect(consentResponse.status())) {
    throw new Error(`Consent failed for ${email} (status ${consentResponse.status()})`)
  }
}

async function capture(page, dest, options = {}) {
  await mkdir(dirname(dest), { recursive: true })
  if (options.beforeScreenshot) await options.beforeScreenshot(page)
  if (options.waitFor) await page.waitForSelector(options.waitFor, { timeout: options.timeout ?? 30000 })
  if (options.waitForTimeout) await page.waitForTimeout(options.waitForTimeout)
  await page.screenshot({
    path: dest,
    fullPage: options.fullPage ?? false,
    ...(options.clip ? { clip: options.clip } : {}),
  })
  console.log(`✓ ${dest.replace(`${root}/`, '')}`)
}

async function captureSection(page, dest, section) {
  await section.scrollIntoViewIfNeeded()
  await section.waitFor()
  const box = await section.boundingBox()
  if (!box) throw new Error(`Section for ${dest} is not visible`)
  await capture(page, dest, {
    clip: {
      x: Math.max(0, box.x - 8),
      y: Math.max(0, box.y - 8),
      width: Math.min(1280, box.width + 16),
      height: box.height + 16,
    },
  })
}

function themedPath(path, scheme) {
  return scheme === 'dark' ? path.replace(/\.png$/, '-dark.png') : path
}

const pathFilterIndex = args.indexOf('--path')
const pathFilter = pathFilterIndex >= 0 ? args[pathFilterIndex + 1] : null
const schemesArgIndex = args.indexOf('--scheme')
const schemes = schemesArgIndex >= 0 ? [args[schemesArgIndex + 1]] : ['light', 'dark']

let currentDest = ''

async function loginAlice(page, context) {
  await context.clearCookies()
  await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
}

async function openNewProjectWizard(page) {
  await page.goto(appUrl('/dashboard'), { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('new-project-draft'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '+ New project' }).click()
  await page.getByRole('heading', { name: 'Essentials' }).waitFor()
  await page.getByPlaceholder('Enter project title').fill('Our Charleston Wedding')
  await page.getByPlaceholder('Describe your project...').fill(
    'Garden ceremony and candlelit reception for 120 guests this June'
  )
  await page.locator('#create-location').fill('29401')
}

async function openOutreachDraft(page) {
  await page.goto(appUrl(`/projects/${PROJECT_ALPHA_UUID}`), { waitUntil: 'networkidle' })
  await page.getByRole('radio', { name: 'outreach' }).click({ force: true })
  await page.getByRole('heading', { name: 'Inbox' }).waitFor()
  const seededThread = page.getByRole('button', { name: /June 20 florals/i }).first()
  await seededThread.waitFor({ timeout: 20000 })
  await seededThread.click()
  await page.getByRole('heading', { name: new RegExp(`Draft to ${FEATURED_CONTACT}`, 'i') }).waitFor()
  await page.getByLabel('Subject').waitFor()
  await page.waitForFunction(() => {
    const input = document.querySelector('label input[type="text"]')
    return Boolean(input && /June 20 florals/i.test(input.value || ''))
  })
}

async function main() {
  let chromium
  try {
    ;({ chromium } = await loadPlaywright())
  } catch (err) {
    console.error('Install Playwright in envoy-project-management:')
    console.error('  cd ../envoy-project-management && npm i && npx playwright install chromium')
    console.error(err.message)
    process.exit(1)
  }

  const browser = await chromium.launch()
  let context
  let page
  const failures = []

  const shots = [
    {
      path: 'images/getting-started/landing-intake.png',
      run: async () => {
        await page.goto(appUrl('/'), { waitUntil: 'networkidle' })
        await page.getByLabel('What are you planning?').fill(WEDDING_INTAKE)
        await page.getByLabel(/ZIP or postal code/i).fill('29401')
      },
    },
    {
      path: 'images/getting-started/registration-form.png',
      run: async () => {
        await page.goto(appUrl('/register'), { waitUntil: 'networkidle' })
        await page.locator('h2').waitFor()
      },
    },
    {
      path: 'images/getting-started/consent-preferences.png',
      run: async () => {
        await context.clearCookies()
        await login(page, {
          email: 'envoyryan@gmail.com',
          password: 'hashedpassword3',
          completeConsent: false,
        })
        await page.goto(appUrl('/onboarding/consent'), { waitUntil: 'networkidle' })
        await page.getByRole('heading', { name: 'Choose your data preferences' }).waitFor()
      },
    },
    {
      path: 'images/getting-started/search-results-badges.png',
      skipOnLocalWithoutReasoningEngine: true,
      fullPage: true,
      run: async () => {
        await context.clearCookies()
        await page.goto(appUrl('/'), { waitUntil: 'networkidle' })
        await page.getByLabel('What are you planning?').fill(WEDDING_INTAKE)
        await page.getByLabel(/ZIP or postal code/i).fill('29401')
        await page.getByRole('button', { name: 'Search' }).click()
        await page.getByText('Contacts for your project').waitFor({ timeout: 45000 })
        const readyOnly = page.getByLabel(/Only show contacts ready for outreach/i)
        if (await readyOnly.isChecked().catch(() => false)) {
          await readyOnly.uncheck()
          await page.getByText(/Florist|Flower Store|Cater/i).first().waitFor({ timeout: 20000 })
        }
        const badge = page.getByText(/Onboarded to Envoy|Unverified listing/i).first()
        if (await badge.isVisible().catch(() => false)) {
          await badge.scrollIntoViewIfNeeded()
        }
      },
    },
    {
      path: 'images/getting-started/project-wizard.png',
      run: async () => {
        await loginAlice(page, context)
        await openNewProjectWizard(page)
      },
    },
    {
      path: 'images/account/account-settings.png',
      run: async () => {
        await context.clearCookies()
        await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
        await page.goto(appUrl('/account'), { waitUntil: 'networkidle' })
        await page.getByRole('heading', { name: 'Account', level: 1 }).waitFor()
      },
    },
    {
      path: 'images/account/email-connections.png',
      run: async () => {
        await page.goto(appUrl('/account#email-accounts'), { waitUntil: 'networkidle' })
        await page.locator('#email-accounts').waitFor()
        await page.locator('#email-accounts').scrollIntoViewIfNeeded()
      },
    },
    {
      path: 'images/account/data-privacy.png',
      run: async () => {
        await page.goto(appUrl('/account'), { waitUntil: 'networkidle' })
        const section = page.locator('section').filter({ hasText: 'Data & Privacy' }).first()
        await captureSection(page, currentDest, section)
        return 'handled'
      },
    },
    {
      path: 'images/account/default-location.png',
      run: async () => {
        await page.goto(appUrl('/account'), { waitUntil: 'networkidle' })
        const section = page.locator('section').filter({ hasText: 'Default project location' }).first()
        await captureSection(page, currentDest, section)
        return 'handled'
      },
    },
    {
      path: 'images/projects/project-chat.png',
      run: async () => {
        await context.clearCookies()
        await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
        await page.goto(appUrl(`/projects/${PROJECT_ALPHA_UUID}`), { waitUntil: 'networkidle' })
        await page.getByRole('radio', { name: 'chat' }).click({ force: true })
        await page.getByPlaceholder('Type your message...').waitFor()
      },
    },
    {
      path: 'images/projects/dashboard-populated.png',
      run: async () => {
        await context.clearCookies()
        await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
        await page.goto(appUrl('/dashboard'), { waitUntil: 'networkidle' })
        await page.getByRole('heading', { name: /Jump back in/i }).waitFor()
      },
    },
    {
      path: 'images/projects/dashboard-empty.png',
      run: async () => {
        await context.clearCookies()
        const email = `docs-empty-${Date.now()}@example.com`
        await registerUser(page, {
          fullName: 'Sophie Wells',
          email,
          password: 'hashedpassword1',
        })
        await page.request.post(appUrl('/onboarding/consent'), {
          data: { termsAccepted: true, modelTrainingOptIn: false },
          maxRedirects: 0,
        })
        await page.goto(appUrl('/dashboard'), { waitUntil: 'networkidle' })
        await page.getByRole('heading', { name: 'No projects yet' }).waitFor()
      },
    },
    {
      path: 'images/projects/project-wizard.png',
      run: async () => {
        await loginAlice(page, context)
        await openNewProjectWizard(page)
      },
    },
    {
      path: 'images/projects/project-overview.png',
      run: async () => {
        await context.clearCookies()
        await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
        await page.goto(appUrl(`/projects/${PROJECT_ALPHA_UUID}`), { waitUntil: 'networkidle' })
        await page.getByRole('radio', { name: 'overview' }).waitFor()
        await page.getByRole('heading', { name: 'Project Details' }).waitFor()
      },
    },
    {
      path: 'images/projects/contacts-page.png',
      run: async () => {
        await context.clearCookies()
        await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
        await page.goto(appUrl('/contacts'), { waitUntil: 'networkidle' })
        await page.getByRole('heading', { name: 'Contacts', exact: true }).waitFor()
        await page.getByText(FEATURED_CONTACT, { exact: true }).waitFor()
      },
    },
    {
      path: 'images/outreach/new-message.png',
      run: async () => {
        await loginAlice(page, context)
        await openOutreachDraft(page)
      },
    },
    {
      path: 'images/outreach/attach-files.png',
      run: async () => {
        await loginAlice(page, context)
        await openOutreachDraft(page)
        const attachButton = page.getByRole('button', { name: 'Attach files' }).first()
        await attachButton.waitFor()
        const fixture = join(tmpdir(), 'ceremony-timeline.txt')
        await writeFile(
          fixture,
          'Ceremony at 5pm under the oaks, cocktail hour in the garden, dinner at 7.\n'
        )
        const fileInput = page.locator('input[id^="draft-attachment-input-"]').first()
        if (await fileInput.count()) {
          await fileInput.setInputFiles(fixture)
          const chip = page.getByText('ceremony-timeline.txt').first()
          await chip.waitFor({ timeout: 15000 }).catch(() => {})
          if (await chip.isVisible().catch(() => false)) {
            await chip.scrollIntoViewIfNeeded()
          }
        }
      },
    },
    {
      path: 'images/account/vendor-pending.png',
      run: async () => {
        await context.clearCookies()
        const email = `docs-vendor-${Date.now()}@example.com`
        await registerUser(page, {
          fullName: 'Lila Rose',
          email,
          password: 'hashedpassword1',
          accountType: 'vendor',
        })
        const consentResponse = await page.request.post(appUrl('/onboarding/consent'), {
          data: { termsAccepted: true, modelTrainingOptIn: false },
          maxRedirects: 0,
        })
        const location = consentResponse.headers().location
        if (location && !location.includes('/vendor/pending')) {
          throw new Error(`Expected /vendor/pending after vendor consent, got ${location}`)
        }
        await page.goto(appUrl('/vendor/pending'), { waitUntil: 'networkidle' })
        await page.getByRole('heading', { name: /on the list/i }).waitFor()
        await page.getByText(/Lila Rose/).waitFor()
        await page.getByText(/What happens next/i).waitFor()
      },
    },
  ]

  for (const scheme of schemes) {
    if (scheme !== 'light' && scheme !== 'dark') {
      throw new Error(`Unknown --scheme ${scheme}. Use light or dark.`)
    }

    context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: scheme,
    })
    await context.addInitScript((mode) => {
      localStorage.setItem('color-mode', mode)
    }, scheme)
    page = await context.newPage()
    // Local screenshot env has no email-sync queue. Outreach's initial POST /sync
    // 500s and never loads threads; serve the GET state payload instead.
    await page.route('**/api/projects/**/outreach/sync', async (route) => {
      const getUrl = route.request().url().replace(/\/sync$/, '')
      const response = await route.fetch({ url: getUrl, method: 'GET' })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: await response.text(),
      })
    })
    console.log(`\nCapturing ${scheme} screenshots...`)

    for (const shot of shots) {
      if (pathFilter && !shot.path.includes(pathFilter)) continue

      currentDest = join(root, themedPath(shot.path, scheme))
      try {
        if (shot.skipOnLocalWithoutReasoningEngine && baseUrl.includes('127.0.0.1')) {
          let reasoningReady = false
          try {
            const response = await fetch('http://127.0.0.1:8081/health')
            reasoningReady = response.ok
          } catch {
            reasoningReady = false
          }
          if (!reasoningReady) {
            console.log(`⊘ ${themedPath(shot.path, scheme)}: skipped locally (reasoning-engine not running)`)
            continue
          }
        }

        const result = await shot.run()
        if (result !== 'handled') {
          await capture(page, currentDest, { fullPage: shot.fullPage })
        }
      } catch (err) {
        failures.push({ path: themedPath(shot.path, scheme), error: err.message })
        console.warn(`✗ ${themedPath(shot.path, scheme)}: ${err.message}`)
      }
    }

    await context.close()
  }

  await browser.close()

  if (failures.length) {
    console.warn(`\n${failures.length} screenshot(s) failed. See images/README.md for manual capture notes.`)
    process.exitCode = 1
  } else {
    console.log('\nDone. See images/README.md for the full inventory.')
  }
}

main()
