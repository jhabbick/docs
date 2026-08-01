#!/usr/bin/env node
/**
 * Capture help center screenshots from a running Envoy app.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs --base-url http://127.0.0.1:18080
 *
 * Requires Playwright. Installs from envoy-project-management when available:
 *   cd ../envoy-project-management && npm i && npx playwright install chromium
 */
import { mkdir } from 'node:fs/promises'
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
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
  })
  const page = await context.newPage()
  const failures = []

  const shots = [
    {
      path: 'images/getting-started/landing-intake.png',
      run: async () => {
        await page.goto(appUrl('/'), { waitUntil: 'networkidle' })
        await page.getByLabel('What are you planning?').waitFor()
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
      run: async () => {
        await context.clearCookies()
        await page.goto(appUrl('/'), { waitUntil: 'networkidle' })
        await page.getByLabel('What are you planning?').fill(
          'Kitchen remodel with new cabinets, countertops, and electrical updates'
        )
        await page.getByLabel(/ZIP or postal code/i).fill('23220')
        await page.getByRole('button', { name: 'Search' }).click()
        await page.getByText('Contacts for your project').waitFor({ timeout: 45000 })
      },
    },
    {
      path: 'images/getting-started/project-wizard.png',
      run: async () => {
        await context.clearCookies()
        await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
        await page.goto(appUrl('/dashboard'), { waitUntil: 'networkidle' })
        await page.getByRole('button', { name: '+ New project' }).click()
        await page.getByRole('heading', { name: 'Essentials' }).waitFor()
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
        await section.scrollIntoViewIfNeeded()
        await section.waitFor()
        const box = await section.boundingBox()
        if (!box) throw new Error('Data & Privacy section not visible')
        await capture(page, join(root, 'images/account/data-privacy.png'), {
          clip: {
            x: Math.max(0, box.x - 8),
            y: Math.max(0, box.y - 8),
            width: Math.min(1280, box.width + 16),
            height: box.height + 16,
          },
        })
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
          fullName: 'Docs Empty User',
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
        await context.clearCookies()
        await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
        await page.goto(appUrl('/dashboard'), { waitUntil: 'networkidle' })
        await page.getByRole('button', { name: '+ New project' }).click()
        await page.getByRole('heading', { name: 'Essentials' }).waitFor()
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
        await page.getByText('Acme Corp', { exact: true }).waitFor()
      },
    },
    {
      path: 'images/outreach/new-message.png',
      run: async () => {
        await context.clearCookies()
        await login(page, { email: 'alice@example.com', password: 'hashedpassword1' })
        await page.goto(appUrl(`/projects/${PROJECT_ALPHA_UUID}`), { waitUntil: 'networkidle' })
        await page.getByRole('radio', { name: 'outreach' }).click({ force: true })
        await page.getByRole('radio', { name: 'outreach' }).waitFor()
        const newMessage = page.getByRole('button', { name: 'New message' }).first()
        if (await newMessage.isVisible().catch(() => false)) {
          await newMessage.click()
          await page.getByRole('button', { name: 'Create draft' }).click()
        }
        await page.getByRole('heading', { name: /Draft to Acme Corp/i }).waitFor({ timeout: 45000 })
      },
    },
    {
      path: 'images/account/vendor-pending.png',
      run: async () => {
        await context.clearCookies()
        const email = `docs-vendor-${Date.now()}@example.com`
        await registerUser(page, {
          fullName: 'Richmond Pro',
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
        await page.getByText(/Richmond Pro/).waitFor()
        await page.getByText(/What happens next/i).waitFor()
      },
    },
  ]

  for (const shot of shots) {
    const dest = join(root, shot.path)
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
          console.log(`⊘ ${shot.path}: skipped locally (reasoning-engine not running)`)
          continue
        }
      }

      const result = await shot.run()
      if (result !== 'handled') {
        await capture(page, dest)
      }
    } catch (err) {
      failures.push({ path: shot.path, error: err.message })
      console.warn(`✗ ${shot.path}: ${err.message}`)
    }
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
