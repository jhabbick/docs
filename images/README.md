# Screenshot inventory

Screenshots referenced in help center docs. Capture from https://app.hello-envoy.com (or local dev).

Run from repo root (requires Playwright and a running Envoy app with seeded data):

```bash
npm install -D playwright && npx playwright install chromium

# Public pages only (no local app required):
node scripts/capture-screenshots.mjs --base-url https://app.hello-envoy.com

# All pages including Account, Chat, and consent (local dev required):
# PASSWORD_AUTH_ENABLED=true node ace serve --no-clear  # in envoy-project-management
node scripts/capture-screenshots.mjs --base-url http://127.0.0.1:18080
```

**Captured from production (2026-08):** `landing-intake.png`, `registration-form.png`, `search-results-badges.png`

**Requires local dev with seeded users:** Account, Chat, consent, dashboard, project workspace, contacts, outreach, and vendor pending screenshots. Run `npm run capture-screenshots:all` from the docs repo root.

Playwright is resolved from `../envoy-project-management/node_modules/playwright` when not installed in this repo.

## getting-started/

| File | Page | Notes |
|------|------|-------|
| `landing-intake.png` | `/` | Intake form with description + ZIP |
| `search-results-badges.png` | `/` | Results with Onboarded/Unverified badges |
| `registration-form.png` | `/register` | Create account + mailbox checkbox |
| `consent-preferences.png` | `/onboarding/consent` | Choose your data preferences (login as bob@example.com without consent) |
| `project-wizard.png` | `/dashboard` | New project wizard Essentials step (title, description, location) |
| `journey-overview.svg` | — | Unused placeholder (How it works now uses `projects/project-overview.png`) |

## projects/

| File | Page | Notes |
|------|------|-------|
| `dashboard-empty.png` | `/dashboard` | No projects yet state |
| `dashboard-populated.png` | `/dashboard` | Recent projects list |
| `project-wizard.png` | `/dashboard` | New project wizard Essentials |
| `project-overview.png` | `/projects/:uuid` | Overview tab |
| `project-chat.png` | `/projects/:uuid` | Chat tab |
| `contacts-page.png` | `/contacts` | Contacts directory |

## outreach/

| File | Page | Notes |
|------|------|-------|
| `new-message.png` | `/projects/:uuid` outreach tab | Compose draft |
| `attach-files.png` | `/projects/:uuid` outreach tab | Attach files drop zone and chips |

## account/

| File | Page | Notes |
|------|------|-------|
| `account-settings.png` | `/account` | Full Account page |
| `email-connections.png` | `/account#email-accounts` | Connected Email Accounts section |
| `data-privacy.png` | `/account` | Data & Privacy section (cropped) |
| `default-location.png` | `/account` | Default project location section (cropped) |
| `vendor-pending.png` | `/vendor/pending` | Pro pending approval |

## Legacy placeholders

Older docs referenced `.svg` placeholders in the same paths. Help center pages updated in 2026-08 now use `.png` captures where listed above.
