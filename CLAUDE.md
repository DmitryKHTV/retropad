# Retropad

Collaborative board for Agile retrospectives: boards with columns and stickers,
roles, dot-voting and live updates.

- `./backend` — NestJS API (this file).
- `./frontend` — Next.js 16 App Router, TanStack Query, TypeScript, FSD, Playwright e2e.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript (strict mode)
- **Framework**: NestJS 10+
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7 with the `@prisma/adapter-pg` driver adapter
- **Auth**: Passport.js + `passport-jwt` (httpOnly cookies), bcrypt
- **Validation**: class-validator + class-transformer via global `ValidationPipe`
- **Realtime**: socket.io via `@nestjs/websockets`
- **Config**: `@nestjs/config` with env validation

## Architecture

```
Controller (HTTP only) → Service (business logic) → Prisma (DB)
```

- Controllers extract data, call services, return responses.
- Services never touch `req`/`res`; they take primitives or DTOs, return data or throw.
- Authorization lives in services, so it is reusable from gateways or a CLI.

Feature-first modules under `src/`: `auth`, `users`, `boards`, `columns`,
`stickers`, `members`, `board-access`, `votes`, `realtime`, `prisma`, `config`.

### Conventions

- Files `feature.controller.ts`, `feature.service.ts`, `feature.module.ts`, `dto/create-feature.dto.ts`.
- Every endpoint with input has a DTO. Global `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- No redundant validators — `@IsUUID()` already implies a non-empty string.
- Errors: `404` missing, `403` exists but no access (explicit, not a hidden 404), `401` auth, `409` duplicate.
- Login answers the same for "no user" and "wrong password".
- Type relation queries with `Prisma.ModelGetPayload<...>`; use `select` for client payloads.
- Always `await` Prisma calls; `@typescript-eslint/no-floating-promises` is `error`.

## Data Model

`Board → Column → Sticker`, plus `User`, `BoardMember`, `Vote`, `RefreshToken`
(`backend/prisma/schema.prisma` is the source of truth).

- Stickers have no FK to Board; ownership goes through `Column.board`.
- `Sticker.authorId` is the creator.
- `BoardRole` is `EDITOR | VIEWER`; OWNER is never stored — it is synthesized from `Board.ownerId`.
- No `(columnId, order)` unique constraint — transient duplicates are valid mid-reorder.
- `Vote` is multi-dot (`count`), one row per (sticker, user), and deliberately denormalizes
  `boardId` so budget checks and totals are single-table queries. Safe only because
  cross-board sticker moves are rejected — do not relax that without revisiting the column.
  Index `[boardId, userId]` serves both lookups; `[userId]` exists for the FK cascade.
- Always index foreign keys you filter on.

## Auth

- `JwtStrategy.validate()` loads the user by `payload.sub`, strips `passwordHash`, returns `SafeUser`.
- `JwtAuthGuard` at controller level; `@CurrentUser()` extracts `request.user`.
- Access and refresh tokens travel as httpOnly cookies; login returns only `{ user }`.
- `@nestjs/throttler` guards `/auth` only (register, login, refresh have their own limits).
  Not an `APP_GUARD`: board endpoints are hit in bursts by drag-and-drop and voting.

## Configuration

- `prisma.config.ts` holds the datasource URL and resolves `DATABASE_URL` eagerly, at load.
  The Docker build stage does not copy it — `prisma generate` needs only the schema.
- `PrismaService` builds `PrismaClient` with `new PrismaPg({ connectionString })`.
- Env is validated on startup in `src/config/env.validation.ts`; read it with `configService.getOrThrow`.
- `CORS_ORIGIN` (comma-separated) is the single source of allowed origins for HTTP and socket.io.
- `tsconfig.build.json` pins `rootDir: ./src`; a stale `tsconfig.build.tsbuildinfo` can produce a
  green build with an empty `dist/` — delete it and `dist/` when that happens.

## Atomicity

- **Nested writes** for atomic creation — `BoardsService.create` seeds 3 default columns.
- **Interactive `$transaction`** when writes depend on reads — sticker/column reorder shifts
  siblings with `updateMany` then moves the target.
- **Array `$transaction`** for reads that must agree — `BoardsService.findOne` (tree + vote
  totals + my votes), `MembersService.remove` (membership + that member's votes).
- **Serializable + retry** in `VotesService`: the budget check is a read the write depends on.
  Serialization failures (`P2034`) are retried with jittered backoff and answered with `409` if
  contention persists — never a `500`, and never "fixed" by lowering the isolation level.
- Ordering is integer with reindex on shift; gaps are allowed.

## Authorization

All board authorization goes through `BoardAccessService` — never inline `ownerId` checks:

- `getRole(boardId, userId)` → `OWNER | EDITOR | VIEWER | null` (404 if the board is missing).
- `assertCanView` — any role. `assertCanEdit` — OWNER | EDITOR.
- `assertCanManage` — OWNER only: board settings, members and **all column mutations**
  (an EDITOR deleting a column would cascade-delete other people's stickers).
- `assertCanTouchSticker` — EDITOR may change only stickers they authored; OWNER moderates all.
- Asserts return the resolved role, which feeds `myRole` in payloads.
- Cross-board sticker moves are rejected (`403`) even with access to both boards.
- Adding members by email reveals whether an email is registered — accepted tradeoff, as in Trello.

## Realtime

HTTP carries reads and mutations; the socket is an **invalidation bell** —
`board:changed {boardId}` makes the client refetch. No per-entity events, so a
reconnect resyncs itself.

- CORS for socket.io comes from `CorsIoAdapter` (via `ConfigService`), not the
  `@WebSocketGateway()` decorator, whose arguments are evaluated before `.env` is loaded.
- Auth is a socket.io middleware in `afterInit` that verifies the `access_token` cookie before
  the connection is accepted (unlike `handleConnection`, which races fast clients).
- Wire contract (mirrored in `frontend/src/shared/api/socket/events.ts`): `board:join {boardId}` →
  ack `{ok}` (gated by `assertCanView`, room `board:{id}`), `board:changed {boardId}`.
- Services call `BoardEventsService` after commit; the gateway listens with `@OnEvent` and
  broadcasts. Internal names are dot-style (`board.changed`), wire names colon-style.
- Echo suppression: the `x-socket-id` header → `@SocketId()` → `.except(id)`. Never used for authz.
- The gateway declares its own `ValidationPipe` with a `WsException` factory — global pipes do
  not reach gateways.

## Voting

`MAX_VOTES_COUNT` (5 per user per board) lives in `src/votes/votes.constants.ts` and reaches the
client as `myVotes.max`.

- Any role votes, including VIEWER (`assertCanView`).
- Only aggregates leave the server: `votes {total, mine}` per sticker, `myVotes {spent, left, max}`
  per board. Voting is anonymous by construction.
- Deleting a sticker refunds its dots; removing a member deletes their votes on that board.
- Frontend: vote mutations invalidate and refetch rather than update optimistically, so the
  budget and totals always agree. Sort-by-votes is view-only and never persists `order`.

## Deployment

Docker Compose behind nginx and Cloudflare (TLS: Universal SSL at the edge, Origin CA at nginx,
mode Full (strict)). GitHub Actions builds images to GHCR and deploys on push to `master`.

- `backend/Dockerfile`: `openssl` is installed in the shared base stage (runtime-only install makes
  Prisma re-download its engine and crash as `USER node`); `prisma` is a production dependency
  because the runtime runs `migrate deploy`; `CMD` ends with `exec node dist/main` so SIGTERM
  reaches Node.
- `frontend/Dockerfile` uses Next's `standalone` output. `NEXT_PUBLIC_API_URL` is a **build
  argument** — changing it needs a rebuild, not a restart.
- The API host is `api-retropad.dkhomutov.dev` (hyphen, not a dot): Universal SSL covers one
  subdomain level only.
- nginx restores the visitor IP from `CF-Connecting-IP` (`cloudflare-real-ip.conf`), so Nest runs
  with `trust proxy` = 1. Never read `req.ips[0]` — the left side of `X-Forwarded-For` is client-controlled.
- Security headers: the API sets `nosniff` and drops `X-Powered-By`; document headers live in the
  frontend server block in nginx. Do not duplicate `nosniff` in the API block (`add_header` appends).
- `scripts/backup-db.sh` dumps Postgres from inside the container, verifies the archive and rotates
  seven days of dumps.

## Testing

Frontend Playwright e2e in `frontend/e2e/` drive the full stack (Next on :3001, API on :3000, Postgres).

- The backend must already be running; Playwright only starts the frontend.
- Projects `desktop` (1280×800) and `mobile` (390×844), both chromium.
- `e2e/helpers/board.ts` seeds through the API with a fresh user per test — parallel-safe.
- Selectors are `data-testid`; `StatusMessage` also carries `data-tone`, because loading and
  error share the testid.

## Common Commands

```bash
# backend
npm run start:dev
docker compose up -d                     # Postgres
npx prisma migrate dev --name <name>
npx prisma generate                      # after every schema change

# frontend (dev server on :3001)
npm run dev
npm run test:e2e                         # needs Postgres + backend running
npx playwright install chromium
```

## Adding a Feature

1. Feature folder under `src/`, `nest g module|controller|service <name>`.
2. DTOs with class-validator.
3. Business logic and authorization in the service; thin controller.
4. Schema change: edit `schema.prisma` → `migrate dev` → `generate`.
5. New env var: `.env` + `env.validation.ts`.
6. Mutation touching a board: call `BoardEventsService` after commit.
