# Documentation project instructions

## About this project

- Mintlify documentation site for the **Envoy** consumer product
- Configuration: `docs.json`
- Consumer help center content: `help-center/`
- Reusable snippets: `snippets/`
- Screenshots: `images/`

## Terminology

Use UI labels exactly as they appear in the app:

| Use this | Not this |
|----------|----------|
| **Contacts** | vendors (in consumer-facing docs) |
| **Pro** | vendor account (when referring to account type) |
| **Outreach** | email service / inbox sync |
| **Connected Email Accounts** | OAuth / inbox authorization |
| **Dashboard** | home page |
| **Overview**, **Chat**, **Outreach** | project tabs (capitalize) |

**Contacts** are service providers — not personal address-book entries.

## Product URLs

- App: https://app.hello-envoy.com
- Contact: https://app.hello-envoy.com/contact
- Privacy: https://app.hello-envoy.com/privacy
- Terms: https://app.hello-envoy.com/terms

## Style

- Active voice, second person ("you")
- Sentence case for headings
- Bold UI labels: Click **New message**
- Lead with outcome, then steps
- Avoid engineering terms (reasoning engine, OAuth, API)

## Do not document

- Email-and-password sign-in or registration (not supported — Google and Outlook only)
- Billing/subscriptions UI (not in product yet)
- Admin features
- Analytics/reporting dashboards
- Approved Pro workspace (pending UI)
- Standalone `/inbox/emails` viewer (not in main nav)

## Content structure

| Folder | Purpose |
|--------|---------|
| `help-center/get-started/` | Onboarding funnel |
| `help-center/projects/` | Dashboard and project workspace |
| `help-center/contacts/` | Contact discovery and directory |
| `help-center/outreach/` | Email draft, send, reply |
| `help-center/account/` | Settings |
| `help-center/troubleshooting/` | Self-service support |
| `help-center/pros/` | Service provider registration |

## Screenshots

Capture from the running app using `scripts/capture-screenshots.mjs`. See `images/README.md` for the full inventory.
