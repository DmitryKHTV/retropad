# Retropad — NestJS Backend in ./backend

## Project Overview

Retropad is a backend API for a collaborative retrospective board (a mini-Miro for Agile retrospectives). Users create boards, add stickers in columns, vote, and collaborate in real-time.

This is a learning project / portfolio piece targeting the Dutch / European mid-level full-stack market.

**Frontend (in `./frontend`)**: Next.js 16 App Router, TanStack Query, TypeScript, FSD architecture. See `./frontend/CLAUDE.md` for details.

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

- `prisma.config.ts` at repo root — Prisma CLI configuration (datasource URL via `env()`).
- `schema.prisma` does NOT contain `url` (Prisma 7 change).
- `PrismaService` constructs `PrismaClient` with `new PrismaPg({ connectionString })` adapter.
- Env vars validated on app start via `class-validator` in `src/config/env.validation.ts`.
- Always use `configService.getOrThrow<T>('KEY')` — fail-fast on missing env.

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

`src/realtime/` — socket.io gateway (`@nestjs/websockets`), CORS origin :3001 with credentials. Design: HTTP for reads + mutations, WS is an **invalidation bell only** — `board:changed {boardId}` → client refetches. No granular per-entity events (reconnect resync = refetch, self-healing).

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

## Current API Endpoints

```
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

## What's NOT Built Yet

- Voting UI on the frontend (backend is done: dots on stickers, remaining-votes counter, sort-by-votes view)
- BullMQ background jobs (e.g., PDF export)
- Tests (unit + e2e) — the `*.spec.ts` files are untouched `nest g` stubs and currently fail (they instantiate services with no providers). Verification so far is smoke scripts, not Jest.
- Logging (Pino) and observability (Sentry)
- Swagger/OpenAPI
- Rate limiting (`@nestjs/throttler`)
- Production deployment
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

- @./LEARNING.md — current learning state and the curriculum we're following


## IMPORTANT 
- Redact this file after significant changes to track all our progress both on frontend and backend