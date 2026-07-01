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
}

model Board {
  id        String   @id @default(uuid())
  title     String
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  columns   Column[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId])
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
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([columnId])
}
```

Hierarchy: `Board → Column → Sticker`. Stickers do NOT have a direct FK to Board — ownership chain goes through `Column.board.ownerId`. No `(columnId, order)` unique constraint — transient duplicates are valid mid-transaction during reorder.

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
- Reorder strategy is **integer with reindex on shift**, not fractional. Gaps are allowed (DELETE doesn't close them). Migrate to LexoRank only when collaborative editing makes integer reindex painful.

## Ownership Patterns

- Ownership lives in services, not controllers (so it works from gateways/CLI).
- Sticker ownership chain: load with `select: {column: {select: {boardId: true, board: {select: {ownerId: true}}}}}` — single JOIN, minimal payload, type-safe.
- Cross-board moves (e.g., sticker dragged to a column on a different board the user also owns) are explicitly rejected as `ForbiddenException` even though the user technically has access — semantic boundary, not just authz.

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

# Testing the API (requires curl + jq)
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}' | jq -r '.accessToken')

curl http://localhost:3000/boards -H "Authorization: Bearer $TOKEN"
```

## Current API Endpoints

```
POST   /auth/register             - public
POST   /auth/login                - public, returns { accessToken } + sets refresh cookie
POST   /auth/refresh              - rotates refresh token, returns new accessToken
POST   /auth/logout                - revokes refresh token

GET    /boards                    - auth, only owner's boards (no relations)
GET    /boards/:id                - auth, only owner's; returns board with columns
                                     and their stickers, both sorted by `order` asc
POST   /boards                    - auth, creates with current user as owner;
                                     atomically seeds 3 default columns
                                     (Went Well / To Improve / Action Items)
PATCH  /boards/:id                - auth, only owner; partial update (title)
DELETE /boards/:id                - auth, only owner

POST   /columns                   - auth, only on owned boards
GET    /columns/board/:boardId    - auth, only on owned boards (no stickers)
PATCH  /columns/:id               - auth, only owner; partial update.
                                     If `order` changes → atomic reindex via $transaction
DELETE /columns/:id               - auth, only owner; cascade-deletes its stickers

POST   /stickers                  - auth, only on owned boards
PATCH  /stickers/:id              - auth, only owner; partial update.
                                     If `order`/`columnId` change → atomic
                                     reindex via $transaction
DELETE /stickers/:id              - auth, only owner; gaps in `order` are fine
```

## What's NOT Built Yet

- Voting on stickers
- WebSocket gateway for real-time updates
- BullMQ background jobs (e.g., PDF export)
- Tests (unit + e2e)
- Logging (Pino) and observability (Sentry)
- Swagger/OpenAPI
- Rate limiting (`@nestjs/throttler`)
- Production deployment
- Helper to dedupe ownership checks (currently repeated across BoardsService / ColumnsService / StickersService — extraction candidate)

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