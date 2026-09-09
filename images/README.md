# Screenshot inventory

Screenshots referenced in help center docs. Capture from https://app.hello-envoy.com (or local dev).

Each PNG has a dark-mode sibling named `*-dark.png`. Docs pages show the light file in light mode and the dark file in dark mode.

Run from repo root (requires Playwright and a running Envoy app with seeded data):

```bash
npm install -D playwright && npx playwright install chromium

# Public pages only (no local app required) — both themes:
node scripts/capture-screenshots.mjs --base-url https://app.hello-envoy.com --path getting-started

# All pages including Account, Chat, and consent (local dev required):
# PASSWORD_AUTH_ENABLED=true node ace serve --no-clear  # in envoy-project-management
node scripts/capture-screenshots.mjs --base-url http://127.0.0.1:18080

# One theme or one path:
node scripts/capture-screenshots.mjs --base-url http://127.0.0.1:18080 --scheme dark
node scripts/capture-screenshots.mjs --base-url https://app.hello-envoy.com --path search-results-badges
```

**Captured from production:** `search-results-badges.png` (and `-dark`) — public homepage search with the Charleston wedding intake. Recapture with `--base-url https://app.hello-envoy.com --path search-results-badges`.

**Requires local dev with seeded users:** Account, Chat, consent, dashboard, project workspace, contacts, outreach, and vendor pending screenshots. Run `npm run capture-screenshots:all` from the docs repo root (captures light and dark).

Playwright is resolved from `../envoy-project-management/node_modules/playwright` when not installed in this repo.

Dark captures set the app to **Dark** via `prefers-color-scheme` and `localStorage color-mode`.

`npm run capture-screenshots:all` overlays wedding-themed screenshot data after seed (Maya Hart planning **Our Charleston Wedding**, contacts like Petal & Stem). That overlay lives in `scripts/seed-screenshot-wedding-data.mjs` so PM test fixtures stay unchanged.

## getting-started/

| File | Dark | Page | Notes |
|------|------|------|-------|
| `landing-intake.png` | `landing-intake-dark.png` | `/` | Intake form with description + ZIP |
| `search-results-badges.png` | `search-results-badges-dark.png` | `/` | Results with Onboarded/Unverified badges |
| `registration-form.png` | `registration-form-dark.png` | `/register` | Create account + mailbox checkbox |
| `consent-preferences.png` | `consent-preferences-dark.png` | `/onboarding/consent` | Choose your data preferences |
| `project-wizard.png` | `project-wizard-dark.png` | `/dashboard` | New project wizard Essentials |
| `journey-overview.svg` | — | — | Unused placeholder |

## projects/

| File | Dark | Page | Notes |
|------|------|------|-------|
| `dashboard-empty.png` | `dashboard-empty-dark.png` | `/dashboard` | No projects yet state |
| `dashboard-populated.png` | `dashboard-populated-dark.png` | `/dashboard` | Recent projects list |
| `project-wizard.png` | `project-wizard-dark.png` | `/dashboard` | New project wizard Essentials |
| `project-overview.png` | `project-overview-dark.png` | `/projects/:uuid` | Overview tab |
| `project-chat.png` | `project-chat-dark.png` | `/projects/:uuid` | Chat tab |
| `contacts-page.png` | `contacts-page-dark.png` | `/contacts` | Contacts directory |

## outreach/

| File | Dark | Page | Notes |
|------|------|------|-------|
| `new-message.png` | `new-message-dark.png` | `/projects/:uuid` outreach tab | Compose draft |
| `attach-files.png` | `attach-files-dark.png` | `/projects/:uuid` outreach tab | Attach files drop zone and chips |

## account/

| File | Dark | Page | Notes |
|------|------|------|-------|
| `account-settings.png` | `account-settings-dark.png` | `/account` | Full Account page |
| `email-connections.png` | `email-connections-dark.png` | `/account#email-accounts` | Connected Email Accounts section |
| `data-privacy.png` | `data-privacy-dark.png` | `/account` | Data & Privacy section (cropped) |
| `default-location.png` | `default-location-dark.png` | `/account` | Default project location section (cropped) |
| `vendor-pending.png` | `vendor-pending-dark.png` | `/vendor/pending` | Pro pending approval |

## Legacy placeholders

Older docs referenced `.svg` placeholders in the same paths. Help center pages use `.png` light/dark pairs.
