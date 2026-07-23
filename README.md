# Envoy Help Center

Mintlify documentation for [Envoy](https://app.hello-envoy.com) — plan any project, line up the contacts, and send outreach from your own inbox.

## Preview locally

```bash
npm i -g mint
mint dev
```

Open http://localhost:3000

## Branch

Consumer help center content is built on the **`version2`** branch.

## Structure

| Path | Content |
|------|---------|
| `docs.json` | Mintlify config and navigation |
| `index.mdx` | Help center home |
| `help-center/` | All consumer documentation |
| `snippets/` | Reusable Mintlify snippets |
| `images/` | Screenshots (see `images/README.md`) |
| `resources/` | Marketing comparisons and blog |

## Screenshots

With the Envoy app running locally:

```bash
node scripts/capture-screenshots.mjs --base-url http://localhost:8080
```

## Publishing

Changes deploy via the [Mintlify GitHub app](https://dashboard.mintlify.com) when pushed to the connected branch.
