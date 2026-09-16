# VELOOP Rewards — Referral Backend

Secure backend for the VELOOP Rewards referral program: referral attribution,
server-verified ad-watch progress, an idempotent reward ledger, and layered
anti-fraud protection. Built to sit behind the existing
[`veloop-referral-redesign`](https://github.com/Abhi0abhi0/veloop-referral-redesign)
frontend without changing its UI.

## Important context about this repo

The referenced frontend repository is a **pure UI project with no backend,
database, or authentication of any kind** — every stat, reward, and referral
value it shows comes from a static `dummyData.js`. This backend was built
from scratch to replace that dummy data. Because no auth system previously
existed, a minimal JWT-based auth (register/login) is included here purely
to unblock referral attribution and testing — if VELOOP already has a
production identity system elsewhere, swap `authService`/`authController`
for a verifier against that system's tokens; nothing else in the referral
logic depends on how identity is established.

## Architecture

```
backend/
├── src/
│   ├── controllers/      # HTTP layer: parses req, calls a service, shapes the response
│   ├── services/         # All business logic lives here
│   │   ├── authService.js
│   │   ├── referralService.js       # attribution, dashboard, list, progress, spam summary
│   │   ├── milestoneService.js      # THE milestone/reward engine (single source of truth)
│   │   ├── rewardService.js         # atomic, idempotent ledger + balance credit
│   │   ├── adEventService.js        # verified ad-completion processing
│   │   ├── adVerificationService.js # swappable ad-provider abstraction
│   │   ├── fraudDetectionService.js # layered risk scoring
│   │   ├── deviceRiskService.js     # device-hash bookkeeping
│   │   └── auditLogService.js
│   ├── middleware/        # auth, validation, rate limiting, error handling
│   ├── models/            # Sequelize models (see Database Schema below)
│   ├── routes/
│   ├── utils/              # emailMask, referralCode, deviceRisk, errors
│   ├── docs/referrals.yaml # OpenAPI path definitions
│   ├── config/
│   ├── app.js              # Express app assembly (security middleware, routes)
│   └── server.js           # entrypoint
├── migrations/              # Sequelize CLI migrations (source of truth for schema)
├── seeders/                 # reward-configuration seed data
└── tests/                   # Jest + Supertest, run against a real Postgres DB
```

### Why Sequelize instead of Prisma

Prisma's CLI needs to download platform-specific engine binaries from
`binaries.prisma.sh` at `generate`/`migrate` time. In network-restricted
build/CI environments (and in some hosting sandboxes) that domain isn't
reachable, which silently breaks the whole pipeline. Sequelize is pure
npm/JS with no binary fetch step, and gives the same guarantees this system
actually needs: real transactions, row locks, and DB-level unique
constraints.

## The reward flow, end to end

```
Verified ad-completion event (adVerificationService)
  → AdEvent row created (unique eventId → duplicate delivery is a no-op)
  → ReferralProgress.eligibleAdsWatched += 1   (never client-writable)
  → milestoneService.evaluateAndAward(referralId)
      - locks the Referral row (SELECT ... FOR UPDATE)
      - reads active RewardConfiguration rows (backend-controlled)
      - for each milestone reached: rewardService.creditReward(...)
          - ledger row (RewardTransaction, unique idempotencyKey)
            + balance increment
            happen in ONE transaction
      - referral flips to SUCCESSFUL once the final ad milestone is hit,
        which also fires the +20 XP "successful referral" reward
```

Two independent layers make this idempotent:
1. `ReferralReward` has a unique constraint on `(referralId, milestone, rewardType)`
   — a milestone can physically only be awarded once.
2. `RewardTransaction.idempotencyKey` is unique — even a retried/duplicated
   HTTP request for the same logical reward can't double-credit a balance.

**Assumption worth flagging:** the assignment's reward table lists
"successful referral → +20 XP" both as a standalone row and, separately, as
something that happens "when the final required milestone is reached." This
implementation treats XP as fired when the referred user crosses the final
configured ad-watch milestone (35 by default) and the referral becomes
`SUCCESSFUL` — not on registration. `RewardConfiguration` stores this as a
`milestone = 0` row, so if the intended behavior is actually "XP on
registration," it's a one-line change in `milestoneService.evaluateAndAward`
without touching anything else.

## Database schema

| Table | Purpose |
|---|---|
| `users` | referral code (backend-generated, unique), password hash, cached balances |
| `user_devices` | HMAC-derived device hashes seen per user (fraud signal) |
| `referrals` | referrer/referred pair; `referredUserId` is **UNIQUE** → immutable attribution |
| `referral_progress` | derived `eligibleAdsWatched`, never client-writable |
| `referral_rewards` | one row per milestone; unique `(referralId, milestone, rewardType)` |
| `reward_transactions` | append-only ledger; unique `idempotencyKey`; source of truth for balances |
| `ad_events` | verified ad-completion events; unique `eventId` |
| `spam_records` | internal fraud evidence — never exposed directly to clients |
| `audit_logs` | `REFERRAL_CREATED`, `SELF_REFERRAL_DETECTED`, `MILESTONE_REACHED`, `REWARD_CREDITED`, etc. |
| `reward_configurations` | backend-controlled milestone → reward mapping |

Full definitions: `migrations/20260907000000-initial-schema.js`.

## Anti-fraud approach

`fraudDetectionService.evaluateReferralRisk` combines signals rather than
trusting any one of them:

- **Device history** — has this device hash been seen on a *different*
  account before? (strongest signal)
- **Device ↔ referrer match** — is the referred user's device the same one
  the referrer account has used? (near-certain self-referral)
- **IP/network** — a coarse `/24`-equivalent note, weighted low and never
  sufficient alone (shared IPs are common and legitimate)

Risk score → verdict:
- `< 31` → `CLEAR` → referral proceeds as `PENDING`
- `31–60` → `REVIEW` → referral created as `FRAUD_REVIEW`, earns nothing
- `≥ 61` → `BLOCK` → referral recorded as `SPAM`, request rejected with
  `SELF_REFERRAL_DETECTED` and (only when a confident associated account
  exists) a masked email

Device identity itself (`utils/deviceRisk.js`) is an HMAC-SHA256 of a
client-supplied device token + coarse platform string — never a raw
fingerprint, never full IP, never full user-agent. If no device token is
supplied, a fresh random one is generated for that attempt rather than
falling back to IP/User-Agent — falling back to IP would silently turn
"same IP" into "same device," which is exactly the anti-pattern the
assignment warns against (NAT/shared Wi-Fi would false-positive constantly).
A real frontend should persist a device token in a secure cookie at
registration and send it on every subsequent request.

## Email masking

`ayanalam@example.com` → `ayan***lam@example.com` (first 4 + last 3 of the
local part). Short local parts (`abc@gmail.com`) mask more conservatively:
`ab***@gmail.com`. Unit tests: `tests/emailMask.test.js`.

## Ad verification abstraction

There is no real ad-provider integration available for this assignment.
`adVerificationService.verifyCompletion(providerName, payload)` defines the
interface a real provider adapter would implement; `dev-test` is a clearly
labeled placeholder that checks structural validity and a timestamp replay
window — **not a real security control**. To go to production, implement a
new provider function against the real ad network's server-to-server
verification API and add it to the `PROVIDERS` map; nothing else in the
pipeline (idempotency, progress tracking, milestone engine) needs to change.

## API summary

See `src/docs/referrals.yaml` (served at `/api/docs` via Swagger UI) for full
request/response shapes. Endpoints:

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | backend generates the referral code |
| POST | `/api/auth/login` | — | |
| POST | `/api/referrals/attribute` | ✓ | the security-critical endpoint |
| GET | `/api/referrals/me` | ✓ | full dashboard, backend-computed |
| GET | `/api/referrals` | ✓ | paginated, `?status=all\|successful\|pending\|spam` |
| GET | `/api/referrals/:id/progress` | ✓ | ownership-checked |
| GET | `/api/referrals/spam` | ✓ | aggregate counts only |
| POST | `/api/referrals/ad-events` | ✓ | verified completion events, not raw counts |

Consistent error codes: `INVALID_REFERRAL_CODE`, `REFERRAL_ALREADY_ASSIGNED`,
`SELF_REFERRAL_DETECTED`, `REFERRAL_NOT_ELIGIBLE`, `RATE_LIMITED`,
`UNAUTHORIZED`, `FORBIDDEN`, `FRAUD_REVIEW`, `VALIDATION_ERROR`,
`NOT_FOUND`, `CONFLICT`.

## Security checklist

- Auth: JWT via `Authorization: Bearer`; identity is **only** ever read from
  the verified token, never from the request body/query/params.
- Authorization: every referral lookup is scoped to `WHERE referrerUserId = req.userId`
  — an unrelated user gets a 404, not the other user's data (see
  `tests/rewards.test.js` "IDOR" case).
- Input validation: Zod schemas on every body/query/params.
- Rate limiting: tiered — attribution (10/10min), ad-events (30/min), auth
  (20/15min), general (120/min). In-memory by default; swap the `store` in
  `middleware/rateLimit.js` for a Redis store for multi-instance deployments.
- CORS: locked to `FRONTEND_URL` (comma-separated list supported), not `*`.
- Security headers: `helmet()`.
- Secrets: `.env` is git-ignored; `.env.example` documents required vars
  with no real values.
- Audit trail: `audit_logs` table, written inside the same transaction as
  the event it records.

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `JWT_SECRET`. Optional:
`JWT_EXPIRES_IN`, `PORT`, `FRONTEND_URL`, `REFERRAL_BASE_URL`, `REDIS_URL`
(enables Redis-backed rate limiting when set — otherwise falls back to
in-memory, which is fine for a single instance).

## Local setup

```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL / JWT_SECRET
npm run migrate             # creates all tables
npm run seed                # loads the reward-milestone configuration
npm run dev                 # starts on PORT (default 4000)
```

Requires a running Postgres instance matching `DATABASE_URL`.

## Testing

```bash
npm test
```

Runs against a real Postgres database (`TEST_DATABASE_URL`, defaults to a
local `veloop_test` DB) using `sequelize.sync()` for schema setup and
Supertest against the actual Express app — no mocking of the DB layer.
Covers, per the assignment's required test list: valid/invalid/duplicate
referral, self-referral (by ID and by shared device with masked-email
response), immutable attribution, the 15-ad and 35-ad milestone tests
(including full-event-replay non-duplication), IDOR protection, malformed
payloads, unauthenticated access, and pagination bounds.

## Deployment

This backend has **not** been deployed to a public URL as part of this
submission — deploying requires provisioning a managed Postgres instance
and a hosting account (Render/Railway/Fly/etc.) that only the project owner
can create. To deploy:

1. Provision Postgres, set `DATABASE_URL` in the host's environment config.
2. Set `JWT_SECRET` (long random value), `FRONTEND_URL` (the deployed
   frontend origin, for CORS), and optionally `REDIS_URL`.
3. Run `npm run migrate && npm run seed` once against the production DB.
4. Start with `npm start`.
5. Point the frontend's `VITE_API_BASE_URL` (see frontend README section)
   at the deployed backend URL.

## Known limitations / assumptions

- **Auth is newly built**, not integrated with an existing VELOOP identity
  system (none exists in the referenced repo). Swappable — see top of this
  file.
- **Ad verification is a dev/test stand-in**, clearly isolated behind
  `adVerificationService`. Not a real anti-cheat control on its own.
- **XP timing assumption** documented above (fires on final milestone /
  `SUCCESSFUL` status, not on raw registration).
- **Rate limiting is in-memory** (fine for one instance; swap for Redis
  before scaling horizontally — the code path is already structured for
  that swap).
- **Not yet deployed live** — see Deployment section for why and what's
  needed.
- **Frontend integration**: see `FRONTEND_INTEGRATION.md` in the repo root
  for what was changed in the React app and what remains.
