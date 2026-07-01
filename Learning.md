# Retropad — Learning Context

This file captures the mentor-style learning context. Use it when continuing the NestJS course in a new chat or in Claude Code.

## Background

The developer's prior experience: **Next.js, React, TypeScript, RTK Query**. Strong frontend, very limited backend (Express was used long ago, mostly forgotten).

The teaching style requested: **build a real project together**, layer by layer. Each lesson introduces ~1 new concept, has working code, and ends with a hands-on task. The mentor explains by leading questions where possible, and gives clear corrections when the developer's intuition is off.

## Curriculum Followed So Far

### ✅ Lesson 1 — Architecture and DI fundamentals
- Why feature-first folders, not type-first.
- What modules, providers, controllers are. The IoC container.
- Constructor-based DI. `@Injectable()`, `@Module`, `@Controller`.

### ✅ Lesson 2 — Validation with DTOs
- `class-validator` + `class-transformer`.
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`.
- Why DTOs are classes, not interfaces (decorators need runtime).

### ✅ Lesson 3 — Prisma + PostgreSQL in Docker
- Prisma 7 with new `prisma.config.ts` and `@prisma/adapter-pg`.
- Migrations vs `generate` (different concerns).
- Service-Controller-DB layering. Why services should not know HTTP.
- Critical bug studied: forgetting `await` on Prisma calls.

### ✅ Lesson 4 — Relations and types
- `Board → Sticker` 1-to-many. Foreign keys, indexes on FKs (Postgres doesn't auto-index).
- N+1 problem and how Prisma avoids it via `IN` clause batching.
- Defense in depth: code-level "exists" checks + DB FK constraints.
- Typing query results: `Prisma.ModelGetPayload<{include: ...}>`.

### ✅ Lesson 5 — JWT auth (part 1)
- bcrypt salt rounds, why slow hashing is good.
- JWT anatomy: header.payload.signature, payload not encrypted.
- `JwtModule.registerAsync` with `useFactory` (Dynamic Module pattern).
- `JwtModuleOptions` typing, `getOrThrow` for fail-fast on missing env.
- Same error for "user not found" and "wrong password" (no user enumeration).

### ✅ Lesson 6 — Guards and Passport (part 2)
- Passport strategies vs guards: connected through string name `'jwt'`.
- The "two registries" mental model:
    1. NestJS DI container (typed, internal).
    2. Passport global registry (string-keyed, external).
- `JwtStrategy.validate(payload)` returns user → ends up in `request.user`.
- Custom `@CurrentUser()` decorator with `SafeUser` type.
- Singleton: one strategy instance for the whole app.
- Guard chains run sequentially; first failure stops the chain.

### ✅ Lesson 7 — Owner-based authorization
- Schema: `Board.ownerId` with FK + index.
- Migration pain: NOT NULL on a non-empty table. Solutions for dev (reset) vs prod (multi-step).
- `findAllByOwner`, ownership check in services (not controllers).
- 403 vs 404 trade-off: clarity vs information leakage.
- Service receives `requesterId` as argument — stays transport-agnostic.

## 🛑 Big Stop — Current Position

The course was paused intentionally to revisit topics in depth before adding more concepts. The MVP backend is functional but not yet exhaustively understood.

The developer wants to **deeply understand** what was built — not just have working code.

### Topics for Deep Review (developer to choose order)

1. **Architecture and DI** — go deeper than "module is a box". Singleton vs request-scoped. Hierarchy. The IoC container internals.
2. **Request lifecycle** — full chain: middleware → guards → interceptors → pipes → handler → response. Where each can intervene.
3. **Prisma deeper** — transactions (`$transaction`), select vs include trade-offs, migrations in production.
4. **Validation and DTOs** — how class-validator works under the hood, custom validators, why class-transformer.
5. **JWT and Passport** — HMAC, JWE vs JWT, stateful vs stateless, common holes (XSS token theft, CSRF), when NOT to use JWT.
6. **Configuration and secrets** — why `.env` is bad in prod, Vault/AWS Secrets Manager, typed `configuration.ts`.
7. **Hands-on consolidation task** — implement `PATCH /boards/:id` independently, get reviewed.

### Next Topics After Review (not yet started)

- Refresh tokens (production-grade auth flow)
- Testing (unit + e2e + supertest)
- WebSocket Gateway for real-time
- Presence (cursors, online users)
- CRDT via Yjs for collaborative editing
- BullMQ queues (PDF export job)
- Logging (Pino), observability (Sentry)
- Swagger / OpenAPI
- Microservices (extract notifications)
- Production deployment

## Mentor Mode — How to Continue

When resuming this curriculum:

- Treat this as a **mid-course pause for deep understanding**, not a from-scratch teaching.
- The developer prefers: leading questions when possible, but direct correction when intuition is wrong. Don't be vague.
- Always relate new ideas to **what was already built in this project** — not abstract examples.
- After each concept, give a small concrete task (modify our code, break-and-fix, answer a sharp question).
- Identify bugs and anti-patterns explicitly when reviewing the developer's code; don't soften critical issues.
- Goal target: passing a mid-level full-stack interview at a Dutch / EU company (Booking, Adyen, Picnic, Mollie, Miro). Speak in those terms when relevant.

## Repo Conventions Already Established

See @./CLAUDE.md for full project conventions and architecture notes.