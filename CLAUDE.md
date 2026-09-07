# Retropad — NestJS Backend in ./backend

## Project Overview

Retropad is a backend API for a collaborative retrospective board (a mini-Miro for Agile retrospectives). Users create boards, add stickers in columns, vote, and collaborate in real-time.

This is a learning project / portfolio piece targeting the Dutch / European mid-level full-stack market.

**Frontend (in `./frontend`)**: Next.js 16 App Router, TanStack Query, TypeScript, FSD architecture, Playwright e2e. See `./frontend/CLAUDE.md` for details (that file is gitignored — it lives only in the working copy, so a fresh clone won't have it).

Feature parity: every backend endpoint below has a frontend surface — boards CRUD, columns (incl. drag-reorder), stickers (inline edit, author-gated actions), members management, **dot-voting with a remaining-budget pill and a view-only sort-by-votes toggle**, and live board updates over WebSocket.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript (strict mode)
- **Framework**: NestJS 10+
- **Database**: PostgreSQL 16 (in Docker)
- **ORM**: Prisma 7 with `@prisma/adapter-pg` driver adapter
- **Auth**: Passport.js + `passport-jwt`, bcrypt for password hashing
- **Validation**: class-validator + class-transformer via global ValidationPipe
- **Config**: `@nestjs/config` with env validation

## Architecture Conventions

### Layered Architecture (strict)

```
Controller (HTTP only) → Service (business logic) → Prisma (DB)
```

- Controllers know about HTTP — they extract data, call services, return responses.
- Services know about business rules — never about HTTP, never use `req`/`res`.
- Services accept primitives or DTOs as arguments. They return data or throw exceptions.
- Authorization checks (ownership) live in services, not controllers — so logic is reusable from WebSocket gateways or CLI later.

### Module Organization (feature-first)

Each feature has its own folder with its module, controller, service, and DTOs:

```
src/
  auth/          # JWT-auth: login, register, refresh tokens, strategies, guards
  users/         # User CRUD (used by auth)
  boards/        # Boards (with owner); auto-seeds 3 default columns on create
  columns/       # Columns (belong to a board)
  stickers/      # Stickers (belong to a column, ordered)
  members/       # Board members (EDITOR/VIEWER collaborators, added by email)
  board-access/  # BoardAccessService — central role resolution + authz asserts
  votes/         # Dot-voting on stickers (multi-dot, budget per user per board)
  realtime/      # socket.io gateway + BoardEventsService (see Realtime section)
  prisma/        # Global PrismaService
  config/        # Env validation
```

### Naming Conventions

- Files: `feature.controller.ts`, `feature.service.ts`, `feature.module.ts`, `dto/create-feature.dto.ts`
- Classes: `BoardsController`, `BoardsService`, `CreateBoardDto`
- DTOs always have `.dto.ts` suffix
- Database fields: camelCase (Prisma converts to PostgreSQL snake_case automatically when needed via `@map`)

### DTOs and Validation

- Every endpoint accepting input has a DTO class with `class-validator` decorators.
- Global `ValidationPipe` is configured with: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- Avoid redundant validators — `@IsUUID()` already implies `@IsString()` and non-empty.

### Error Handling

Use built-in NestJS HTTP exceptions:
- `404 NotFoundException` — resource doesn't exist
- `403 ForbiddenException` — exists but no access (we choose explicit 403 over hidden 404)
- `401 UnauthorizedException` — auth missing/invalid
- `409 ConflictException` — resource already exists (e.g., duplicate email)

For login: same error message for "no user" and "wrong password" — prevents user enumeration.

## Database Schema (Prisma)

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  boards       Board[]
  memberships  BoardMember[]
  stickers     Sticker[]
}

model Board {
  id        String   @id @default(uuid())
  title     String
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  columns   Column[]
  members   BoardMember[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId])
}

// OWNER is never stored — synthesized from Board.ownerId (single source of truth)
enum BoardRole {
  EDITOR
  VIEWER
}

model BoardMember {
  boardId   String
  userId    String
  role      BoardRole @default(EDITOR)
  createdAt DateTime  @default(now())
  board     Board     @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([boardId, userId])
  @@index([userId])
}

model Column {
  id        String    @id @default(uuid())
  title     String
  order     Int
  boardId   String
  board     Board     @relation(fields: [boardId], references: [id], onDelete: Cascade)
  stickers  Sticker[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  @@index([boardId])
}

model Sticker {
  id        String   @id @default(uuid())
  content   String
  color     String   @default("yellow")
  order     Int
  columnId  String
  column    Column   @relation(fields: [columnId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([columnId])
  @@index([authorId])
}

model Vote {
  stickerId String
  userId    String
  boardId   String
  count     Int      @default(1)
  sticker   Sticker  @relation(fields: [stickerId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@id([stickerId, userId])
  @@index([boardId, userId])
  @@index([userId])
}
```

Hierarchy: `Board → Column → Sticker`. Stickers do NOT have a direct FK to Board — ownership chain goes through `Column.board.ownerId`. `Sticker.authorId` is the creating user (pre-existing rows were backfilled with the board owner in the `sticker_author` migration); deleting a user cascade-deletes their stickers even on other people's boards — consciously consistent with the rest of the schema. No `(columnId, order)` unique constraint — transient duplicates are valid mid-transaction during reorder.

`Vote` is multi-dot (`count`), one row per (sticker, user). It is the one place that **deliberately breaks** the "no direct FK to Board" rule: `boardId` is denormalized so the vote-limit aggregate and the per-board totals are single-table queries. This is safe only because `StickersService` rejects cross-board moves, which makes a sticker's board immutable — do not relax that check without revisiting this column. Index order matters: `[boardId, userId]` leads with `boardId` so it serves both `WHERE boardId` (totals) and `WHERE boardId AND userId` (limit check), while the separate `[userId]` exists for the FK cascade, which the composite can't serve (leftmost-prefix rule).

**Always**: index foreign keys you filter on. Postgres doesn't auto-index FKs.

## JWT Auth Flow

- `JwtStrategy` (in `auth/strategies/`) extends `PassportStrategy(Strategy)` — Passport calls its `validate(payload)`.
- `validate()` looks up the user by `payload.sub` in the database, strips `passwordHash`, returns `safeUser`.
- The returned object lands in `request.user`.
- `JwtAuthGuard extends AuthGuard('jwt')` — uses the strategy by name.
- Custom `@CurrentUser()` decorator extracts `request.user` typed as `SafeUser = Omit<User, 'passwordHash'>`.

Guards are applied at controller level: `@UseGuards(JwtAuthGuard)` above `@Controller()`.

## Configuration

- `prisma.config.ts` in `backend/` — Prisma CLI configuration (datasource URL via `env()`). It resolves `env("DATABASE_URL")` **eagerly, at file load**, so any CLI command fails without it — which is why the Docker build stage deliberately does not copy this file (`prisma generate` needs only the schema).
- `schema.prisma` does NOT contain `url` (Prisma 7 change).
- `PrismaService` constructs `PrismaClient` with `new PrismaPg({ connectionString })` adapter.
- Env vars validated on app start via `class-validator` in `src/config/env.validation.ts`.
- Always use `configService.getOrThrow<T>('KEY')` — fail-fast on missing env.
- `CORS_ORIGIN` (required, comma-separated) is the single source of allowed browser origins for **both** HTTP CORS and the socket.io handshake. `PORT` is optional (defaults to 3000).
- `tsconfig.build.json` pins `rootDir: ./src` and excludes `prisma.config.ts`. Without it TypeScript infers `backend/` as the common root and emits `dist/src/main.js`, silently breaking `npm run start:prod` (`node dist/main`). Watch out for stale `tsconfig.build.tsbuildinfo`: with `incremental: true` and `deleteOutDir: true`, a stale cache produces a green build with an empty `dist/`.

## Code Style

- TypeScript strict mode.
- Prefer `Prisma.ModelGetPayload<{include: ...}>` for typing query results with relations — never lie about types.
- Always `await` Prisma calls — silent floating promises are dangerous.
- Use `select` instead of `include` for endpoints that return data to clients (avoids leaking sensitive fields).
- ESLint rule `@typescript-eslint/no-floating-promises` should be `error`.

## Atomicity Patterns

- **Nested writes** for atomic creation of related records — single Prisma call wraps everything in one implicit transaction. Used in `BoardsService.create` to seed 3 default columns when a board is created.
- **`prisma.$transaction(async (tx) => {...})`** (interactive) when writes depend on prior reads or branching logic. Used in `StickersService.update` for drag-drop reorder: `updateMany` with `{order: {decrement/increment: 1}}` shifts siblings, then `update` moves the target. All siblings in one row-level lock scope.
- **`prisma.$transaction([...])`** (array form) when several independent *reads* must agree with each other — they run on one snapshot. Used in `BoardsService.findOne` so the board tree, the per-sticker vote totals and the requester's own votes can't disagree, and in `MembersService.remove` to drop a membership and that member's votes together.
- **Serializable + retry** in `VotesService`: the vote-limit check is a read the write depends on, so it runs at `Serializable`. Postgres may abort it with a serialization failure (Prisma `P2034`) — the transaction never applied, so `withSerializableRetry` replays it up to `SERIALIZATION_MAX_ATTEMPTS` (3) with jittered backoff, and answers `409` if contention persists. Never surface `P2034` as a 500; and never "fix" it by lowering the isolation level.
- Reorder strategy is **integer with reindex on shift**, not fractional. Gaps are allowed (DELETE doesn't close them). Migrate to LexoRank only when collaborative editing makes integer reindex painful.

## Authorization: Roles & BoardAccessService

All board authorization goes through `BoardAccessService` (`src/board-access/`) — never inline `ownerId` checks in feature services:

- `getRole(boardId, userId): 'OWNER' | 'EDITOR' | 'VIEWER' | null` — single query (ownerId + filtered membership); throws 404 if the board doesn't exist. OWNER is synthesized from `Board.ownerId`.
- `assertCanView` — any role (read board/columns/stickers, members list).
- `assertCanEdit` — OWNER | EDITOR (create/update/delete stickers).
- `assertCanManage` — OWNER only (rename/delete board, manage members, ALL column
  mutations — columns are board structure; EDITOR deleting a column would
  cascade-delete other people's stickers, bypassing the sticker-author rule).
- `assertCanTouchSticker(boardId, userId, authorId)` — per-sticker rule on top of `assertCanEdit`: EDITOR may update/move/delete only stickers they authored; OWNER moderates all. Used by `StickersService.update/remove`.
- Asserts return the resolved role, so callers get `myRole` for free (used in board payloads).

Other rules:
- Authorization lives in services, not controllers (so it works from gateways/CLI).
- Sticker/column services load only `boardId` via their FK chain, then delegate to `BoardAccessService`.
- Cross-board sticker moves are rejected as `ForbiddenException` even when the user has access to both boards — semantic boundary in `StickersService`, not authz.
- Adding members by email deliberately allows probing which emails are registered (404 vs 400/409) — accepted tradeoff (same as Trello), documented for interviews.

## Realtime (WebSocket)

`src/realtime/` — socket.io gateway (`@nestjs/websockets`). CORS comes from `CorsIoAdapter` (`src/realtime/cors-io.adapter.ts`), registered in `main.ts` via `app.useWebSocketAdapter`, **not** from the `@WebSocketGateway()` decorator: decorator arguments are evaluated at module import time, before `ConfigModule` has loaded `.env`, so `process.env` there would disagree with what `main.ts` sees. The adapter reads the same `CORS_ORIGIN` through `ConfigService`. Never put `cors` back into the decorator — the adapter silently overrides it. Design: HTTP for reads + mutations, WS is an **invalidation bell only** — `board:changed {boardId}` → client refetches. No granular per-entity events (reconnect resync = refetch, self-healing).

- **Auth**: socket.io middleware registered in `afterInit` verifies the `access_token` httpOnly cookie (JWT) *before* the connection is accepted — middlewares run to completion before any client packet, unlike `handleConnection`, which races fast clients. Failure → `connect_error 'Unauthorized'`; the frontend reacts with `refreshSession()` + one retry.
- **Wire contract** (mirrored by hand in `frontend/src/shared/api/socket/events.ts`): `board:join {boardId}` → ack `{ok}` (gated by `BoardAccessService.assertCanView`, rooms `board:{id}`), `board:changed {boardId}`.
- **Event flow**: feature services stay HTTP/WS-free — they call `BoardEventsService` (typed facade over EventEmitter2, exported by `RealtimeModule`) after commit in all 10 mutations; the gateway `@OnEvent`-listens and broadcasts to the room. Internal bus names are dot-style (`board.changed`), wire names colon-style (`board:changed`) — two contracts, never merged.
- **Echo suppression**: mutations carry an `x-socket-id` header (auto-stamped by the frontend's ofetch `onRequest`); `@SocketId()` decorator → service param → `.except(initiatorSocketId)`. Never used for authorization — the client can put anything there.
- Gateway declares its **own `ValidationPipe`** with a `WsException` factory — global pipes never reach gateways (SocketModule builds its pipe context without `ApplicationConfig`).
- Known tradeoffs: a removed member stays in the room until disconnect (gets bells only, no data); malformed join payload → ack never fires (client uses `.timeout()`); no `board:leave` — the client filters events by `boardId`.

## Common Commands

```bash
# Start dev server with watch
npm run start:dev

# Database
docker compose up -d                     # start Postgres
npx prisma migrate dev --name <name>     # create + apply migration
npx prisma generate                       # regenerate client (always after schema change!)
npx prisma studio                        # visual DB browser
npx prisma migrate reset                 # nuke and re-apply (dev only!)

# Testing the API — auth is httpOnly-cookie based (access_token + refresh_token
# cookies; login response body contains only the user object, NO accessToken)
curl -s -c /tmp/jar -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

curl -s -b /tmp/jar http://localhost:3000/boards
```

```bash
# Frontend (from ./frontend) — dev server runs on :3001, not :3000
npm run dev

# E2E — needs Docker Postgres + backend on :3000 already running;
# Playwright starts (or reuses) the frontend itself
npm run test:e2e                 # both projects (desktop + mobile)
npm run test:e2e -- --project=mobile
npm run test:e2e:ui              # watch/debug mode
npm run test:e2e:report          # last HTML report
npx playwright install chromium  # one-time, only browser we use
```

## Current API Endpoints

```
GET    /health                    - public, {status:'ok'}; liveness only, no DB
                                     ping (the app cannot reach listen() with a
                                     dead DB — Prisma $connect runs first)

POST   /auth/register             - public
POST   /auth/login                - public, sets access_token + refresh_token
                                     httpOnly cookies; body = { user } only
POST   /auth/refresh              - rotates refresh token, re-sets cookies
POST   /auth/logout                - revokes refresh token

GET    /boards                    - auth, boards the user owns OR is a member of;
                                     each item includes `myRole`
GET    /boards/:id                - auth, any role; returns board with columns,
                                     stickers (sorted by `order` asc, each with
                                     author {id,name,email} and votes {total,mine})
                                     + `myRole` + `myVotes {spent,left,max}`
POST   /boards                    - auth, creates with current user as owner;
                                     atomically seeds 3 default columns
                                     (Went Well / To Improve / Action Items)
PATCH  /boards/:id                - auth, OWNER only; partial update (title)
DELETE /boards/:id                - auth, OWNER only

GET    /boards/:boardId/members   - auth, any role; owner synthesized as first
                                     entry ({role: OWNER}), then EDITOR/VIEWER rows
POST   /boards/:boardId/members   - auth, OWNER only; body {email, role?};
                                     404 unknown email, 400 owner's email,
                                     409 already a member; default role EDITOR
PATCH  /boards/:boardId/members/:userId - auth, OWNER only; body {role};
                                     404 if not a member
DELETE /boards/:boardId/members/:userId - auth, OWNER removes anyone;
                                     a member may remove themself (self-leave);
                                     403 removing the owner; also deletes that
                                     member's votes on the board (same transaction)

POST   /columns                   - auth, OWNER only
GET    /columns/board/:boardId    - auth, any role (no stickers)
PATCH  /columns/:id               - auth, OWNER only; partial update.
                                     If `order` changes → atomic reindex via $transaction
DELETE /columns/:id               - auth, OWNER only; cascade-deletes its stickers

POST   /stickers                  - auth, OWNER|EDITOR; requester becomes author
PATCH  /stickers/:id              - auth, OWNER any sticker, EDITOR only own
                                     (403 otherwise); partial update. If `order`/
                                     `columnId` change → atomic reindex via
                                     $transaction
DELETE /stickers/:id              - auth, OWNER any sticker, EDITOR only own;
                                     gaps in `order` are fine

POST   /stickers/:stickerId/votes - auth, ANY role incl. VIEWER (participants
                                     vote); no body. Adds one dot (upsert →
                                     count+1). 403 when the per-board budget
                                     (MAX_VOTES_COUNT = 5) is spent, 409 on
                                     persistent serialization contention
DELETE /stickers/:stickerId/votes - auth, ANY role; removes one dot
                                     (count-1, row deleted at 1). 404 if the
                                     user has no vote on that sticker —
                                     counts never go negative
```

## Voting

Classic dot-voting. `MAX_VOTES_COUNT` and `SERIALIZATION_MAX_ATTEMPTS` live in `src/votes/votes.constants.ts` — the budget is imported by `BoardsService` so the client gets it as `myVotes.max` instead of hardcoding 5 in the UI.

- **Any role may vote, including VIEWER** — viewers are retro participants, so votes are gated by `assertCanView`, not `assertCanEdit`.
- **Aggregates only leave the server.** The payload exposes `votes {total, mine}` per sticker and `myVotes {spent, left, max}` per board; individual `Vote` rows never reach Node, let alone the client. Dot-voting stays anonymous by construction — adding a "who voted" view means a new endpoint and a deliberate decision, not a payload tweak.
- The budget is **per user per board**, not per sticker: all 5 dots may go on one sticker.
- Deleting a sticker cascade-deletes its votes, which refunds those dots. Removing a member deletes their votes on that board.
- No way to reset a voting round yet — a second round on the same board would accumulate. Belongs with retro phases.

**Frontend side** (`features/sticker/vote-sticker`, `features/sticker/sort-by-votes`):

- `VoteControl` renders the dots per sticker (capped at 7, then `+N`), the user's own dots styled apart, and Vote / − buttons. It is rendered for **every** role — gating it by `canEditBoard` would be wrong.
- `VotesBudget` shows `left/max` from `board.myVotes`; `canAddMore = votesLeft > 0` disables the Vote button client-side, but the 403 from the server remains the real limit.
- Vote mutations are **not** optimistic: `onSettled` invalidates the board query and refetches the aggregates (the WS bell handles everyone else). Deliberate — the budget and the per-sticker totals must agree, and hand-rolling that in the cache buys little.
- Sort-by-votes is **view-only**: `sortStickersByVotes` re-ranks a copy (`total` desc, ties by persisted `order`), state lives in a `useState` hook and resets on remount. It never issues a reorder mutation — `order` on the server is untouched.

## Testing

The only real tests in the repo are **frontend Playwright e2e** (`frontend/e2e/`). They drive the full stack — Next dev server on :3001, NestJS on :3000, Docker Postgres.

- `playwright.config.ts` auto-starts / reuses the frontend (`webServer`), but **the backend must already be running** — Playwright can't boot it because it needs the database. A failing `setupBoard` almost always means the API is down.
- Two projects, both chromium: `desktop` (1280×800) and `mobile` (390×844, `isMobile`/`hasTouch` hand-rolled). Playwright's iPhone descriptors default to WebKit, which we don't install — only `npx playwright install chromium` is required.
- `e2e/helpers/board.ts` seeds state **through the API, not the UI**: register → login → create board (auto-seeds 3 columns) → post stickers, using `page.context().request` so the auth cookies land in the browser context and a subsequent `page.goto()` renders logged in. Each run uses a fresh random email — tests never share a user, so they stay parallel-safe. There is no teardown; the dev database accumulates e2e rows (`prisma migrate reset` when it bothers you).
- Viewport-specific assertions use `test.skip(test.info().project.name !== 'mobile', ...)` rather than a separate file.
- `BoardPage` returns `null` until the board + `me` queries resolve — always wait for a real element (`getByTestId('board-column')`) before measuring layout.
- Selectors are `data-testid` (`board-column`, `board-scroll`), added deliberately for tests; don't replace them with text/class selectors.

Backend has **no working tests**: every `*.spec.ts` is an untouched `nest g` stub that instantiates a service with no providers, so `npm test` in `backend/` fails. Backend verification so far is curl/smoke scripts. When you do write them, delete the stubs rather than patching them.

## Deployment (in progress, started 2026-08-17)

Target: a single Ubuntu 24.04 VPS, images built **on the server** (`git pull && docker compose up -d --build`), nginx in front, **TLS terminated by Cloudflare**. Domain `dkhomutov.dev` (Cloudflare): `retropad.dkhomutov.dev` for the frontend, `api-retropad.dkhomutov.dev` for the API — both deliberately **first-level** subdomains, see the 2026-08-30 block. `.dev` is HSTS-preloaded in browsers, so there is no plain-HTTP stage to test against — TLS from the first request.

Done so far:

- **Backend prod wiring** — `CORS_ORIGIN`/`PORT` via `ConfigService`, `CorsIoAdapter`, `enableShutdownHooks()`, `trust proxy` (production only), `GET /health`.
- **`backend/Dockerfile`** — three stages on `node:22-bookworm-slim`: `base` (installs `openssl`), `build`, `runtime`. Verified end to end: image builds, migrations apply, register/login/CORS work, `docker stop` exits 0 in ~0.5s.

Non-obvious constraints baked into that Dockerfile — do not "clean them up":

- `openssl` is installed in the shared `base` stage, so build and runtime agree. Installing it in `runtime` only makes Prisma re-detect the libssl version, decide the bundled engine is wrong, and try to download a new one into `node_modules` at startup — which fails under `USER node` (root-owned files) and kills the container.
- `prisma` is a **production** dependency, not a dev one: `npm prune --omit=dev` runs in the build stage, and the runtime needs the CLI for `migrate deploy`. Cost: the CLI drags Prisma Studio's React bundle in, ~290 MB of the 853 MB image. Accepted deliberately — splitting migrations into a second image makes total disk usage worse on a single-node deploy.
- `CMD` is `sh -c "prisma migrate deploy && exec node dist/main"`. The `exec` is load-bearing: without it `sh` stays PID 1, Docker's SIGTERM never reaches Node, and `docker stop` degrades into a 10-second wait plus SIGKILL — silently discarding every shutdown hook.
- `backend/.dockerignore` must keep excluding `*.tsbuildinfo` (see the Configuration section for why).

Added 2026-08-18 — steps 2b through 5 of the plan:
- **`frontend/Dockerfile`** — two stages on `node:22-bookworm-slim`, 402 MB. `output: 'standalone'` was added to `frontend/next.config.ts` (with permission) so the runtime stage copies only Next's traced dependency set plus `.next/static` and `public/`, instead of the full `node_modules`. Entry point is `node server.js`, not `next start` — standalone builds its own server.
- **`NEXT_PUBLIC_API_URL` is a build argument, not a runtime env var.** Next inlines `NEXT_PUBLIC_*` into the browser bundle during `next build`, so changing the API origin needs `docker compose ... build frontend`, never just a restart. Verified by grepping the compiled chunk inside the image.
- **`docker-compose.prod.yml`** — postgres (healthcheck-gated, no published port) + backend + frontend + nginx; only nginx publishes 80/443. `.env.prod.example` documents the variables; compose reads `.env` on the server automatically.
- **`nginx/conf.d/retropad.conf`** — one HTTP server block (301 to HTTPS) and two HTTPS blocks. `map $http_upgrade $connection_upgrade` is required because `Connection` is hop-by-hop: nginx drops the client's copy and it has to be re-set per request or socket.io never upgrades.
- **`DEPLOY.md`** — DNS, server prerequisites (compose plugin, swap, the ufw footguns), secrets, certificates, and backups. Rewritten 2026-08-30 when TLS moved to Cloudflare. It stops after "Clone and configure": the deploy procedure, the verification pass and troubleshooting are **not written yet**.

The whole stack was verified locally before touching the VPS: self-signed certificates dropped into the same volume, `curl --resolve` pointing the real hostnames at 127.0.0.1. Green: HTTP→HTTPS 301, frontend 200, `/health`, register + login with `HttpOnly; Secure; SameSite=Lax` cookies, an authorized `GET /boards`, CORS headers present only for the configured origin, socket.io polling handshake and a raw `101 Switching Protocols` upgrade through nginx.

Cookie note for this domain layout: `SameSite=Lax` works even though the frontend and the API are different origins, because both are subdomains of `dkhomutov.dev` — same registrable domain means same-site. Moving the frontend to another domain would force `SameSite=None`.

Changed 2026-08-30 — TLS moved from Let's Encrypt/certbot to Cloudflare:

- **Two certificates, not one.** With the orange cloud on the connection splits in half. Browser ↔ Cloudflare uses Cloudflare's **Universal SSL** edge certificate (automatic, free, private key never leaves Cloudflare). Cloudflare ↔ nginx uses a **Cloudflare Origin CA** certificate installed on the VPS, valid 15 years and trusted **only** by Cloudflare's edge. certbot, the ACME webroot, the chicken-and-egg first issue, the renewal cron and the Let's Encrypt rate limits are all gone.
- **The API host was renamed `api.retropad.dkhomutov.dev` → `api-retropad.dkhomutov.dev`.** Universal SSL covers the apex plus **one** level of subdomain (`dkhomutov.dev`, `*.dkhomutov.dev`) — TLS wildcards do not nest. A two-level name would make browsers reject the edge certificate, and `.dev` being HSTS-preloaded means there is no "proceed anyway" button to click past it. Deeper names need Advanced Certificate Manager ($10/month per zone). Do not "tidy" that hyphen back into a dot.
- **Cloudflare's SSL mode must be Full (strict).** Flexible produces an infinite redirect loop — it speaks plain HTTP to an origin that redirects to HTTPS. Full encrypts but accepts any certificate at all, including an attacker's.
- **The site now works only while the record is proxied.** The origin certificate is not browser-trusted, so turning the orange cloud off breaks it. That is the price paid for never renewing anything.
- **Certificates are a bind mount, not a named volume**: `./nginx/certs` → `/etc/nginx/certs:ro`, with a `.gitignore` in it excluding `*.pem`/`*.key`. The `letsencrypt` external volume and `nginx/certbot/www` are gone. A bind mount survives `docker compose down -v` for the same reason `external: true` did.
- **`trust proxy` went from 1 to 2** in `main.ts`: there are two proxies in front of Nest now, and the value counts hops from the right. Not cosmetic — `auth.controller.ts` stores `req.ip` with every refresh token, so at `1` every session would be stamped with a Cloudflare edge address instead of the user's. It is also the precondition for the still-unbuilt rate limiting.
- **socket.io survives Cloudflare** because its default `pingInterval` is 25 s against Cloudflare's 100 s WebSocket idle timeout on the Free plan. Changing the ping settings would start dropping connections in production only.
- Re-verified locally: self-signed certificate in `nginx/certs`, dummy upstreams aliased `frontend`/`backend` on a throwaway network, `curl --resolve`. Green — config parses, both certificates load, HTTP→HTTPS 301 on both hosts, and TLS + SNI select the right server block for each name.

The VPS is **shared with another long-running service that owns port 443**, and that shapes the deploy. Host-specific details (ports, addresses, firewall state) live in `DEPLOY.md`, which is **gitignored** — like `frontend/CLAUDE.md`, it exists only in the working copy, so a fresh clone won't have it.

- **Port 443 on the host is taken and is not negotiable.** nginx publishes **`8443:443`** instead: it still listens on 443 *inside* its container, only the host mapping differs. A **Cloudflare Origin Rule** (Free plan, 10 rules) rewrites the destination port to 8443 for both hostnames. The destination port an Origin Rule may point at is unrestricted (1-65535); 8443 is convention, not a requirement. Cloudflare's 443/2053/2083/2087/2096/8443 list governs ports *visitors* may connect to, which is a different question.
- **Port 80 is not published at all.** Under Full (strict) Cloudflare only ever reaches the origin over HTTPS, and the edge does the http→https redirect. The `listen 80` block stays in the nginx config for local testing.
- **SSH is not on port 22 on this host.** The `ufw allow OpenSSH` profile opens 22, so the usual `allow OpenSSH && ufw enable` recipe would lock the server out permanently. Never hand over firewall commands without checking the live `ss -tlnp` first.
- **Docker was already installed from Ubuntu's `docker.io` package** (server is Ubuntu 22.04, not 24.04). It ships **no compose v2 plugin**, so `docker compose` does not exist there — installed as a standalone CLI plugin rather than by adding docker.com's repo, which would fight the existing packages.
- **Docker publishes ports around ufw** (its own `DOCKER` iptables chain runs first), so ufw cannot hide a published container port. Do not present ufw as the way to force traffic through Cloudflare — that needs Authenticated Origin Pulls or an interface-bound publish.
- 3.8 GB RAM, 2 vCPU, 79 GB disk, and **no swap** — `next build` peaks around 1.5 GB, and with zero swap the kernel goes straight to the OOM killer, which may well pick the co-tenant service rather than the build. A 2 GB swapfile is a prerequisite, not a nicety.

Added 2026-09-03 — the pre-deploy pass over an audit of the whole stack:

- **Every container is capped, in both directions.** `x-logging` anchor (`json-file`, `max-size: 10m`, `max-file: 3`) plus `mem_limit` per service — 512m postgres, 512m backend, 384m frontend, 64m nginx. Both caps exist for the **co-tenant VPN**, not for Retropad: unbounded `json-file` logs eat the 79 GB disk out from under it, and an unbounded container lets the kernel's OOM killer choose its own victim. Note that `mem_limit` does **not** apply to `--build` — that is what the swapfile is for.
- **Deliberately no `NODE_OPTIONS=--max-old-space-size`.** It was added and then removed the same day: Node has been container-aware since v12 (`uv_get_constrained_memory` → cgroup `memory.max`), so on Ubuntu 22.04's cgroup v2 it already sizes V8's heap from `mem_limit`, not from the host's 3.8 GB. Pinning the heap by hand only overrides a correct default with a guess — and a guess set near the limit is actively worse, because the V8 heap is one slice of the container's memory and the Prisma engine, buffers and native allocations live outside it.
- **`scripts/backup-db.sh`** — `pg_dump` through the running container, gzip, integrity check, 7-day rotation; cron line, restore procedure and off-site copy documented in `DEPLOY.md`. Two non-obvious bits: a dump that dies halfway still produces a *valid* gzip, so the check has to be on the payload (`gzip -t` + non-empty), and the write goes to a `.part` file removed by an `EXIT` trap, so a failed run can never leave something that looks like a backup. Credentials stay inside the container (`sh -c` expands `$POSTGRES_*` there), so nothing sensitive reaches the crontab or `ps`.
- **`npm audit fix`** on both projects: frontend 4 → 0, backend 14 → 4. The four left (`prisma`, `@prisma/config`, `deepmerge-ts`, `mysql2`) are Prisma **CLI** transitives, reachable only at `migrate deploy` time, and clearing them means downgrading to Prisma 6 — deliberately not done. The runtime-path ones that mattered are gone: `socket.io-parser` (memory exhaustion over the public WS), `multer`, `body-parser`, `qs`.

Still to do before real users: rate limiting on `/auth` (`@nestjs/throttler`), `set_real_ip_from` for Cloudflare so client IPs are neither wrong nor forgeable, `helmet` + the cheap security headers, and error/loading states on the frontend (`BoardPage` renders `null` forever when the board query fails). Then the first real deploy on the VPS (`DEPLOY.md` end to end) and GitHub Actions CI.

## What's NOT Built Yet

- BullMQ background jobs (e.g., PDF export)
- Backend tests — unit (services with mocked Prisma) and e2e (supertest against a test database)
- Frontend e2e coverage beyond board layout — no test yet for voting, members, permissions or the WS bell
- Optimistic updates for voting (currently invalidate + refetch)
- Voting rounds / reset (needs retro phases first)
- Logging (Pino) and observability (Sentry)
- Swagger/OpenAPI
- Rate limiting (`@nestjs/throttler`) — note `main.ts` already sets `trust proxy` in production, which is its precondition
- Production deployment — **in progress**, see the Deployment section below
- Pending-invitation flow (current member add is immediate, existing users only)
- Repo-wide prettier pass (~950 pre-existing `prettier/prettier` errors; config disagrees with de-facto 4-space/double-quote style)

## Working with This Codebase

When adding a new feature:
1. Create a feature folder under `src/`.
2. Run `nest g module <name>`, `nest g controller <name>`, `nest g service <name>`.
3. Add DTOs with class-validator.
4. Service does the business logic + ownership checks. Controller is thin.
5. If touching the schema: edit `schema.prisma` → `migrate dev` → `generate`.
6. If new env vars: add to `.env`, register in `env.validation.ts`.

## Important Files

- @./LEARNING.md — the re-learning curriculum (13 modules over the project's own code) plus the running list of known bugs/tech debt found in it. Two rules: the findings listed there are **teaching material, not a backlog** — do not fix them ahead of their module; and when a module is completed, tick it in the progress list.

## IMPORTANT
- Redact this file after significant changes to track all our progress both on frontend and backend