# verda

Turborepo monorepo: `apps/web` (Next.js), `apps/cli` (Bun image pipeline), `packages/data`, `packages/database` (Prisma).

## Setup

```sh
brew install bun gitleaks typos-cli
bun install
```

`bun install` runs `husky` via the `prepare` script, which wires up the git hooks below.

## Backend

The public stories read path is migrating to a real Postgres backend behind the `NEXT_PUBLIC_API_MODE` flag (issue #126). The rest of the surface stays on the in-browser Dexie + MSW store while later issues land their own slices.

```sh
cp .env.example .env             # DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_API_MODE
docker compose up -d             # local Postgres 15 on :5432
bun run db:migrate:dev           # apply Prisma migrations
bun run db:seed                  # 5 sections + 20 brand stories
bun run dev                      # web + cli + database watchers
```

`docker-compose` (the v1 binary) and `docker compose` (the Compose v2 plugin) both work; pick whichever your machine has.

### `NEXT_PUBLIC_API_MODE`

| Value | Behaviour |
|---|---|
| `mock` (default; also when unset or unrecognised) | MSW intercepts every route, including the migrated stories endpoints. No DB needed. |
| `real` | MSW drops the migrated handlers, the request bypasses the worker, and the real Next.js Route Handlers under `apps/web/app/api/stories/...` serve from Postgres. |

The flag must be set at build time so Next can inline it into the client bundle. Per-route migration decisions live in the `migratedStoriesHandlers` array in `apps/web/app/mocks/handlers.ts` — each future migrated route appends to that list.

### Connection-URL shape

The two-URL Supavisor shape is mirrored locally so production cutover is config-only:

| Var | Local | Production |
|---|---|---|
| `DATABASE_URL` | docker-compose Postgres on `:5432` (with `pgbouncer=true`) | Supavisor pooler on `:6543` |
| `DIRECT_URL` | docker-compose Postgres on `:5432` | direct Postgres on `:5432` |

The runtime client (`packages/database/src/client.ts`) uses `DATABASE_URL`; the Prisma CLI uses `DIRECT_URL` for migrations.

## Quality gates

| Gate | Runs | Bypass |
|---|---|---|
| `pre-commit` (husky) | `ultracite fix` on staged files, `gitleaks --staged` | `git commit --no-verify` |
| `commit-msg` (husky) | `commitlint` against Conventional Commits | `git commit --no-verify` |
| `pre-push` (husky) | `ultracite check`, `turbo run typecheck`, `typos`, `gitleaks` on history | `git push --no-verify` |
| `ci.yml` (GitHub Actions) | Lint + typecheck + spell-check + secret scan | n/a (required for merge) |

Build is **not** in CI — Vercel handles `apps/web` previews and surfaces build errors there.

## Common scripts

```sh
bun run check       # ultracite lint (read-only)
bun run fix         # ultracite lint + autofix
bun run typecheck   # turbo run typecheck across all workspaces
bun test            # bun's built-in test runner across all workspaces
bun run dev         # turbo run dev (web + cli + database watchers)
bun run build       # turbo run build
```

Server tests in `apps/web/app/api/stories/route.test.ts` skip themselves when `DATABASE_URL` is missing or points at the placeholder so `bun test` stays green in CI without a provisioned database; locally they exercise the full Postgres-backed read path.

## Notes

- `prisma generate` uses a placeholder `DATABASE_URL` if none is set in env, so typecheck and fresh checkouts work without a provisioned database. Commands that actually hit the database (`migrate`, `push`, `studio`) still need a real URL.
- Dependabot runs weekly. If a Dependabot PR bumps versions but CI's `bun install --frozen-lockfile` fails, the bun ecosystem couldn't update `bun.lock` — re-run `bun install` locally and push the updated lockfile.
- The `apps/cli/staging/` directory holds regenerable image artifacts (codex review pipeline) and is gitignored.
