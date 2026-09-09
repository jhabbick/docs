#!/usr/bin/env node
/**
 * Overlay wedding-themed screenshot data on top of the PM db:seed fixtures.
 * Keeps PM test seeders unchanged. Run after `node ace db:seed`.
 */
import pg from 'pg'

const ALICE_UUID = 'b7e1a2e2-1c3a-4b2e-8e7a-1f2b3c4d5e6f'
const WEDDING_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const WELCOME_UUID = 'bc5ad890-4915-43e3-9b6f-33aea76dd2f6'
const DINNER_UUID = '0e037e80-6922-441a-b413-887a856a286b'
const BRUNCH_UUID = 'b3c4d5e6-f7a8-4b0c-8d2e-3f4a5b6c7d8e'
const HONEYMOON_UUID = 'c4d5e6f7-a8b9-4c1d-8e3f-4a5b6c7d8e9f'
const PETAL_UUID = 'f1e2d3c4-b5a6-4c7d-8e9f-0a1b2c3d4e5f'
const PETAL_PROJECT_VENDOR = 'f1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const WEDDING_CONVERSATION = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'

const PINE_LISTING = 'aa11bb22-cc33-4d44-8e55-667788990001'
const SAFFRON_LISTING = 'aa11bb22-cc33-4d44-8e55-667788990002'
const WILDER_LISTING = 'aa11bb22-cc33-4d44-8e55-667788990003'
const PINE_VENDOR = 'aa11bb22-cc33-4d44-8e55-667788990011'
const SAFFRON_VENDOR = 'aa11bb22-cc33-4d44-8e55-667788990012'
const WILDER_VENDOR = 'aa11bb22-cc33-4d44-8e55-667788990013'
const PINE_PV = 'aa11bb22-cc33-4d44-8e55-667788990021'
const SAFFRON_PV = 'aa11bb22-cc33-4d44-8e55-667788990022'
const WILDER_PV = 'aa11bb22-cc33-4d44-8e55-667788990023'
const PINE_WEDDING_PV = 'aa11bb22-cc33-4d44-8e55-667788990024'
const SAFFRON_WEDDING_PV = 'aa11bb22-cc33-4d44-8e55-667788990025'
const PETAL_THREAD = 'aa11bb22-cc33-4d44-8e55-667788990031'
const PETAL_DRAFT = 'aa11bb22-cc33-4d44-8e55-667788990041'

const charleston = JSON.stringify({
  postcode: '29401',
  locality: 'Charleston',
  region: 'SC',
  country: 'US',
  formatted_address: 'Charleston, SC 29401',
})
const charlestonSql = `'${charleston.replace(/'/g, "''")}'::jsonb`

const petalDraftBody = `Hi Petal & Stem,

We're getting married in Charleston on June 20 and would love to talk florals for a garden ceremony and candlelit reception — about 120 guests.

Could you share June availability and a rough range for ceremony arch, bridesmaid bouquets, and table arrangements?

Happy to send inspiration photos whenever it's useful.

Thank you,
Maya`
const petalDraftBodySql = `$body$\n${petalDraftBody}\n$body$`

const sql = `
UPDATE envoy_schema.users
SET
  full_name = 'Maya Hart',
  default_location = ${charlestonSql}
WHERE uuid = '${ALICE_UUID}';

UPDATE envoy_schema.projects SET
  title = 'Our Charleston Wedding',
  description = 'Garden ceremony and candlelit reception for 120 guests this June',
  location = ${charlestonSql},
  deadline = '2027-06-20',
  budget_amount = 45000,
  created_timestamp = NOW()
WHERE uuid = '${WEDDING_UUID}';

UPDATE envoy_schema.projects SET
  title = 'Welcome Party at The Watch',
  description = 'Sunset drinks the night before for out-of-town guests',
  location = ${charlestonSql},
  deadline = '2027-06-19',
  budget_amount = 8000,
  created_timestamp = NOW() - INTERVAL '1 day'
WHERE uuid = '${WELCOME_UUID}';

UPDATE envoy_schema.projects SET
  title = 'Rehearsal Dinner',
  description = 'Intimate dinner for family and the wedding party',
  location = ${charlestonSql},
  deadline = '2027-06-19',
  budget_amount = 12000,
  created_timestamp = NOW() - INTERVAL '2 days'
WHERE uuid = '${DINNER_UUID}';

UPDATE envoy_schema.projects SET
  title = 'Bridal Brunch',
  description = 'Morning-after brunch for the wedding party',
  location = ${charlestonSql},
  deadline = '2027-06-21',
  budget_amount = 4000,
  created_timestamp = NOW() - INTERVAL '3 days'
WHERE uuid = '${BRUNCH_UUID}';

UPDATE envoy_schema.projects SET
  title = 'Honeymoon in Positano',
  description = 'Week after the wedding — villa, travel, and a few packed days on the coast',
  location = ${charlestonSql},
  deadline = '2027-06-27',
  budget_amount = 15000,
  created_timestamp = NOW() - INTERVAL '4 days'
WHERE uuid = '${HONEYMOON_UUID}';

UPDATE envoy_schema.vendor_listings SET
  name = 'Petal & Stem',
  email = 'hello@petalandstem.co',
  categories = ARRAY['Florist']::text[],
  location = ${charlestonSql},
  website = 'https://petalandstem.co'
WHERE uuid = '${PETAL_UUID}';

INSERT INTO envoy_schema.vendor_listings (
  uuid, name, email, originator, owner_user_uuid, claim_status, is_active, categories, location, website
) VALUES
  (
    '${PINE_LISTING}', 'The Pine House', 'bookings@thepinehouse.co', 'CONSUMER',
    '${ALICE_UUID}', 'UNCLAIMED', true, ARRAY['Venue']::text[], ${charlestonSql}, 'https://thepinehouse.co'
  ),
  (
    '${SAFFRON_LISTING}', 'Saffron Table', 'events@saffrontable.co', 'CONSUMER',
    '${ALICE_UUID}', 'UNCLAIMED', true, ARRAY['Catering']::text[], ${charlestonSql}, 'https://saffrontable.co'
  ),
  (
    '${WILDER_LISTING}', 'Wilder Films', 'hello@wilderfilms.co', 'CONSUMER',
    '${ALICE_UUID}', 'UNCLAIMED', true, ARRAY['Photography']::text[], ${charlestonSql}, 'https://wilderfilms.co'
  )
ON CONFLICT (uuid) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  categories = EXCLUDED.categories,
  location = EXCLUDED.location,
  website = EXCLUDED.website,
  is_active = true;

INSERT INTO envoy_schema.vendors (uuid, user_uuid, vendor_listing_uuid, is_active, modified_by, created_timestamp, modified_timestamp)
VALUES
  ('${PINE_VENDOR}', '${ALICE_UUID}', '${PINE_LISTING}', true, 'docs-screenshots', NOW(), NOW()),
  ('${SAFFRON_VENDOR}', '${ALICE_UUID}', '${SAFFRON_LISTING}', true, 'docs-screenshots', NOW(), NOW()),
  ('${WILDER_VENDOR}', '${ALICE_UUID}', '${WILDER_LISTING}', true, 'docs-screenshots', NOW(), NOW())
ON CONFLICT (uuid) DO UPDATE SET is_active = true;

INSERT INTO envoy_schema.project_vendors (uuid, project_uuid, vendor_uuid, status, is_active)
VALUES
  ('${PINE_PV}', '${WELCOME_UUID}', '${PINE_VENDOR}', 1, true),
  ('${SAFFRON_PV}', '${DINNER_UUID}', '${SAFFRON_VENDOR}', 1, true),
  ('${WILDER_PV}', '${WEDDING_UUID}', '${WILDER_VENDOR}', 1, true),
  ('${PINE_WEDDING_PV}', '${WEDDING_UUID}', '${PINE_VENDOR}', 1, true),
  ('${SAFFRON_WEDDING_PV}', '${WEDDING_UUID}', '${SAFFRON_VENDOR}', 1, true)
ON CONFLICT (uuid) DO UPDATE SET is_active = true;

UPDATE envoy_schema.project_insights
SET insight_text = 'The Charleston wedding is a garden ceremony and candlelit reception for 120 guests on June 20.'
WHERE uuid = '9a100000-0000-4000-8000-000000000001';

UPDATE envoy_schema.conversation_turns
SET
  timestamp = NOW() - INTERVAL '20 minutes',
  contents = jsonb_build_object(
    'agentId', 'PLANNING',
    'userPrompt', 'Who should we book first for a June garden wedding in Charleston?',
    'modelResponse', 'Start with the venue, then florist and catering — those three set the date and the look. Petal & Stem is already on your contacts; I can draft a note asking about June 20 availability whenever you are ready.',
    'timestamp', '2027-04-10T15:00:00.000Z'
  )
WHERE uuid = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

INSERT INTO envoy_schema.conversation_turns (uuid, timestamp, contents, conversation_uuid)
VALUES (
  'aa11bb22-cc33-4d44-8e55-667788990051',
  NOW() - INTERVAL '18 minutes',
  jsonb_build_object(
    'agentId', 'PLANNING',
    'userPrompt', 'Yes — draft something warm to Petal & Stem about ceremony florals and table arrangements.',
    'modelResponse', 'Drafted. The note to Petal & Stem asks about June 20 availability and a range for the ceremony arch, bouquets, and tables. You can review it on the Outreach tab before you send.',
    'timestamp', '2027-04-10T15:02:00.000Z'
  ),
  '${WEDDING_CONVERSATION}'
)
ON CONFLICT (uuid) DO UPDATE SET
  contents = EXCLUDED.contents,
  timestamp = EXCLUDED.timestamp,
  conversation_uuid = EXCLUDED.conversation_uuid;

INSERT INTO envoy_schema.vendor_conversations (uuid, channel, user_id, vendor_uuid, project_vendor_uuid, created_timestamp)
SELECT '${PETAL_THREAD}', 'email', users.id, '${PETAL_UUID}', '${PETAL_PROJECT_VENDOR}', NOW()
FROM envoy_schema.users
WHERE users.uuid = '${ALICE_UUID}'
ON CONFLICT (uuid) DO UPDATE SET
  vendor_uuid = EXCLUDED.vendor_uuid,
  project_vendor_uuid = EXCLUDED.project_vendor_uuid;

INSERT INTO envoy_schema.outreach_drafts (
  uuid, project_vendor_uuid, vendor_conversation_uuid, subject, body, status
) VALUES (
  '${PETAL_DRAFT}',
  '${PETAL_PROJECT_VENDOR}',
  '${PETAL_THREAD}',
  'June 20 florals for our Charleston wedding',
  ${petalDraftBodySql},
  'draft'
)
ON CONFLICT (uuid) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  status = 'draft';
`

async function main() {
  const client = new pg.Client({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 55432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'envoy_docs_screenshots',
  })
  await client.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log('Wedding screenshot data applied.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
