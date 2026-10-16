# Production Audit

**Status: NOT READY for real customer data.** Repository-level fixes and checks are complete, but the Supabase migration has not been applied or exercised against the live project, the PIN login is still vulnerable to fresh anonymous identities, and Vercel production settings/logs were not accessible.

## Architecture and data flow

- Vite serves a React 19/TypeScript single-page application. `/` is customer ordering; `/admin` and legacy `/u804` enter a Supabase-verified staff gate.
- The customer menu is currently static frontend data in `src/data/mockProducts.ts`.
- Customer checkout calls `public.create_customer_order`; its database trigger validates customer data and quantities, looks up prices in `private.menu_products`, calculates totals, allocates the token, and returns the canonical inserted row.
- Staff reads, updates, deletes, and Realtime events are intended to be limited by staff-session RLS. Realtime subscriptions are cleaned up and refetch a paginated snapshot after subscribing/reconnecting.
- There is no application server/API route; browser requests use the Supabase publishable key with RLS and narrowly granted RPCs.

## Audit checklist

| Severity | Finding | Outcome |
|---|---|---|
| HIGH | `verify_staff_pin(NULL)` could bypass SQL three-valued input checks and create a staff session. | Fixed in `supabase_schema.sql` and tested by a SQL-contract regression check. Not yet verified on live Postgres. |
| HIGH | Public order inserts trusted browser-provided prices, totals, names, and status. | Replaced with a server-side catalog/validation trigger and atomic `create_customer_order` RPC. Direct table INSERT is revoked. Requires applying the migration. |
| HIGH | A short PIN with anonymous sign-in can be attacked by creating fresh anonymous identities; per-identity lockout is not a global rate limit. | Documented as a production blocker. Use a real staff identity provider or server-side IP/device rate limiter before real data. |
| HIGH | Staff session and RLS migration status, Auth settings, Vault hash, and Realtime state are unknown on the connected Supabase project. | Unverified: dashboard requires sign-in unavailable in this workspace. |
| HIGH | Public deployment secrets/configuration and production Vercel logs/settings are inaccessible. | Unverified: no claim that Vercel production was tested. The public Supabase key is expected in the frontend; never use a service-role key there. |
| MEDIUM | Existing `orders` table lacked `order_number`; `CREATE TABLE IF NOT EXISTS` did not upgrade it, causing the reported SQL failure. | Full schema now adds/backfills current fields and preserves legacy product details. Migration remains unapplied/unexecuted. |
| MEDIUM | Documented `/admin` route was not recognized by the app or explicitly rewritten on Vercel. Unknown routes fell back to customer view. | App now recognizes `/admin`, preserves `/u804`, shows not-found for unknown paths; `vercel.json` rewrites `/admin`. Local preview route checks passed; Vercel itself not tested. |
| MEDIUM | `ACCEPTED` tickets were grouped with new tickets and could be completed directly; accept action was not wired. | Separate NEW and ACCEPTED queues and counters; ACCEPT and COMPLETE match the intended transitions. |
| MEDIUM | Realtime snapshots were unbounded and failed staff actions could be silent or unhandled. | Paginated snapshot fetch/reconciliation and visible staff action errors added. Live disconnect/reconnect was not tested. |
| MEDIUM | Concurrent staff actions could apply stale transitions. | Updates now include expected prior status and require a returned affected row. Live multi-session conflict test remains outstanding. |
| MEDIUM | Build had no automated tests. | Added nine Node regression contract tests. These inspect source/SQL contracts; they are not database integration tests. |
| LOW | Receipt contained prototype wording and a duplicated pickup instruction. | Removed. |
| LOW | Receipt/history operations sort by creation time and purge by status. | Added indexes for these observed queries. Query plans and large production data volumes are unverified. |

## Routes and interaction checks

- `/`: customer menu rendered 11 items; a local browser smoke test added Corn Pizza, opened cart/review, showed the expected ₹109 total, and removed the test item without submitting an order.
- `/admin`: local production preview displayed the PIN gate, not dashboard content.
- `/u804`: local production preview displayed the same PIN gate.
- `/not-a-route`: local production preview rendered the not-found screen.
- Vercel rewrite config is valid JSON; no live Vercel request/log inspection was available.
- Staff queue changes compile and have source-contract coverage; no authenticated dashboard or database workflow was available for live UI testing.

## Validation run

- `npm test`: 9 passed, 0 failed. Coverage is static regression assertions for PIN NULL handling, order RPC grants, server-side pricing, staff RLS, migration ordering, routing, replay safety, conditional status changes, and paginated Realtime refresh.
- `npm run build`: passed (`tsc -b` and Vite production bundle).
- `npm run lint`: no errors; one existing `react(only-export-components)` warning for the exported hook in `src/context/OrderContext.tsx`.
- `npm audit --audit-level=high`: 0 vulnerabilities across dependencies.
- `vercel.json` and `package.json` JSON parsing: passed.
- `git diff --check`: passed at audit review.
- SQL execution/syntax against PostgreSQL: not run; `psql` was unavailable. No production SQL was executed.
- Supabase persistence/RLS/Auth/Realtime and the required two-session create/update/delete/reconnect/conflict tests: not run because authenticated project access was unavailable.

## Remaining risks and assumptions

- **Do not use this deployment for real customer data yet.** First apply and review `supabase_schema.sql` against the actual legacy table definition, then test it in a staging Supabase project. The script modifies table columns/constraints, policies, functions, triggers, and indexes; it is not destructive by intent but may lock a large live table while altering/indexing it.
- Replace the previously committed PIN with a new secret. The old value remains in Git history even though it is no longer in application code.
- Add a real staff auth provider or globally rate-limited server endpoint. Supabase anonymous identities can be created repeatedly; per-user PIN lockout does not stop distributed guessing.
- `private.menu_products` is the database price authority while `src/data/mockProducts.ts` drives display prices. Keep both catalogs synchronized or move menu reads to an authorized database endpoint before changing prices/availability.
- Anonymous checkout can still be spammed through the public RPC. Add CAPTCHA-aware server validation/rate limiting and abuse monitoring before launch.
- `CustomerDetailsModal` retains the customer's name/phone in browser localStorage for convenience. Review retention/consent requirements; it is not a shared order store.
- Order history currently loads all records in pages into memory. Paging avoids the REST response cap but is not a user-facing paginated/archive query for very large volumes.
- Confirm Vercel production/preview environment variables point to the intended Supabase project and that public schemas, anonymous auth settings, CAPTCHA/rate limits, Vault secret, and Realtime publication match the migration.
- Realtime across two authenticated staff sessions, customer inserts, staff mutation propagation, deletes, expired sessions, and network recovery must be exercised against staging before launch.

## Safe deployment checklist

1. Rotate the exposed PIN; configure only its bcrypt hash in Supabase Vault.
2. Back up the database and inspect the live `public.orders` columns, types, constraints, row count, and existing policies. Do not run the migration blindly on production.
3. Apply the reviewed migration in a staging Supabase project first. Verify it succeeds against the actual legacy schema, and test invalid/tampered order payloads and `verify_staff_pin(NULL)`.
4. Test anon checkout, staff login/logout/expiry, unauthorized SELECT/UPDATE/DELETE denial, Realtime authorization, simultaneous state transitions, and retry behavior in two independent sessions.
5. Configure stronger staff authentication and global checkout/login abuse controls. Avoid CAPTCHA settings until the UI supplies a valid CAPTCHA token.
6. Set Vercel production and preview Supabase URL/publishable-key values; ensure no service-role key is exposed. Confirm `/admin` rewrites on the deployed domain.
7. Deploy to preview, inspect browser network/console and Vercel logs, then approve production rollout.
8. Verify production order placement, staff queue transitions, refresh persistence, Realtime propagation, and rollback/monitoring before announcing availability.
