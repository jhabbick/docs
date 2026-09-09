#!/usr/bin/env node
/**
 * Start embedded Postgres, boot the local Envoy app, and capture all help center screenshots.
 */
import EmbeddedPostgres from 'embedded-postgres'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = join(__dirname, '..')
const pmRoot = join(docsRoot, '..', 'envoy-project-management')
const pgDataDir = join(docsRoot, '.screenshot-pg-data')
const pgPort = 55432

const dbEnv = {
  DB_HOST: '127.0.0.1',
  DB_PORT: String(pgPort),
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_DATABASE: 'envoy_docs_screenshots',
}

const appEnv = {
  ...dbEnv,
  NODE_ENV: 'development',
  APP_ENV: 'local',
  HOST: '127.0.0.1',
  PORT: '18080',
  APP_URL: 'http://127.0.0.1:18080',
  LOG_LEVEL: 'info',
  SESSION_DRIVER: 'cookie',
  APP_KEY: 'docs_screenshot_key_change_me_32chars',
  PASSWORD_AUTH_ENABLED: 'true',
  REASONING_ENGINE_URL: 'http://127.0.0.1:8081',
  REASONING_ENGINE_API_KEY: 'local',
  EMAIL_SERVICE_URL: 'http://127.0.0.1:8083',
  EMAIL_SERVICE_API_KEY: 'local',
  EMAIL_SYNC_WORKER_ENABLED: 'false',
  FOURSQUARE_PLACES_API_KEY: 'local',
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? pmRoot,
      env: { ...process.env, ...appEnv, ...options.env },
      stdio: options.stdio ?? 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0 || options.allowNonZero) resolve(code)
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
    return child
  })
}

async function waitForHealth(url, timeoutMs = 120000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${url}/health`)
      if (response.ok) return
    } catch {
      // keep waiting
    }
    await delay(1000)
  }
  throw new Error(`Timed out waiting for ${url}/health`)
}

async function ensurePortFree(port) {
  try {
    const { execSync } = await import('node:child_process')
    const output = execSync(`lsof -ti :${port} 2>/dev/null || true`, { encoding: 'utf8' }).trim()
    if (!output) return
    for (const pid of output.split('\n').filter(Boolean)) {
      console.log(`Stopping process ${pid} on port ${port}...`)
      process.kill(Number(pid), 'SIGTERM')
    }
    await delay(1000)
  } catch {
    // best effort
  }
}

async function ensurePmDependencies() {
  try {
    await readFile(join(pmRoot, 'node_modules', 'playwright', 'package.json'))
    return
  } catch {
    console.log('Installing envoy-project-management dependencies...')
    await run('npm', ['ci'], { cwd: pmRoot })
  }
}

async function ensureEnvFile() {
  const envPath = join(pmRoot, '.env')
  const lines = Object.entries(appEnv).map(([key, value]) => `${key}=${value}`)
  await writeFile(envPath, `${lines.join('\n')}\n`)
}

async function main() {
  await rm(pgDataDir, { recursive: true, force: true })
  await mkdir(pgDataDir, { recursive: true })

  console.log('Starting embedded Postgres...')
  const pg = new EmbeddedPostgres({
    databaseDir: pgDataDir,
    user: dbEnv.DB_USER,
    password: dbEnv.DB_PASSWORD,
    port: pgPort,
    persistent: false,
  })

  await pg.initialise()
  await pg.start()
  await pg.createDatabase(dbEnv.DB_DATABASE)

  let server
  try {
    await ensurePmDependencies()
    await ensureEnvFile()

    console.log('Running migrations and seeders...')
    await run('node', ['ace', 'migration:run'])
    await run('node', ['ace', 'db:seed'])

    console.log('Applying wedding screenshot data...')
    await run('node', [join(docsRoot, 'scripts', 'seed-screenshot-wedding-data.mjs')], {
      cwd: docsRoot,
      env: dbEnv,
    })

    console.log('Starting Envoy app on http://127.0.0.1:18080 ...')
    await ensurePortFree(18080)
    server = spawn('node', ['ace', 'serve', '--no-clear'], {
      cwd: pmRoot,
      env: { ...process.env, ...appEnv },
      stdio: 'pipe',
    })

    server.stdout.on('data', (chunk) => process.stdout.write(chunk))
    server.stderr.on('data', (chunk) => process.stderr.write(chunk))

    await waitForHealth('http://127.0.0.1:18080')

    console.log('Capturing screenshots...')
    await run('node', [join(docsRoot, 'scripts', 'capture-screenshots.mjs'), '--base-url', 'http://127.0.0.1:18080'], {
      cwd: docsRoot,
      stdio: 'inherit',
    })
  } finally {
    if (server) {
      server.kill('SIGTERM')
      await delay(1000)
      if (!server.killed) server.kill('SIGKILL')
    }
    try {
      await Promise.race([
        pg.stop(),
        delay(8000),
      ])
    } catch (error) {
      console.warn(`Postgres stop failed: ${error.message}`)
    }
    await delay(500)
    await rm(pgDataDir, { recursive: true, force: true }).catch((error) => {
      console.warn(`Could not remove Postgres data dir: ${error.message}`)
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
