# Screenshot inventory

Screenshots referenced in help center docs. Capture from https://app.hello-envoy.com (or local dev at http://localhost:8080).

Run from repo root (requires Playwright and a running Envoy app):

```bash
node scripts/capture-screenshots.mjs --base-url http://localhost:8080
```

## getting-started/

| File | Page | Notes |
|------|------|-------|
| `landing-intake.png` | `/` | Intake form with description + ZIP |
| `search-results-badges.png` | `/` | Results with Onboarded/Unverified badges |
| `registration-form.png` | `/register` | Create account + mailbox checkbox |
| `project-wizard.png` | `/onboarding/project` | Essentials step |
| `journey-overview.png` | — | Optional diagram (can use Mermaid in docs instead) |

## projects/

| File | Page | Notes |
|------|------|-------|
| `dashboard-empty.png` | `/dashboard` | No projects yet state |
| `dashboard-populated.png` | `/dashboard` | Recent projects list |
| `project-wizard.png` | `/dashboard` | New project wizard |
| `project-overview.png` | `/projects/:uuid` | Overview tab |
| `project-chat.png` | `/projects/:uuid` | Chat tab with messages |
| `contacts-page.png` | `/contacts` | Contacts directory |

## outreach/

| File | Page | Notes |
|------|------|-------|
| `new-message.png` | `/projects/:uuid` outreach tab | Compose draft |

## account/

| File | Page | Notes |
|------|------|-------|
| `email-connections.png` | `/account#email-accounts` | Connected Email Accounts |
| `vendor-pending.png` | `/vendor/pending` | Pro pending approval |
