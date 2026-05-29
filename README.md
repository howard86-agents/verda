# verda

Turborepo monorepo: `apps/web` (Next.js), `apps/cli` (Bun image pipeline), `packages/data`, `packages/database` (Prisma).

## Setup

```sh
brew install bun gitleaks typos-cli
bun install
```

`bun install` runs `husky` via the `prepare` script, which wires up the git hooks below.

## Backend

Production is intentionally browser-only: the Next.js app boots MSW in the client and every app API request is served from the in-browser Dexie store. A stale `NEXT_PUBLIC_API_MODE=real` env value is ignored so production cannot bypass MSW and hit the Postgres-backed Route Handlers.

```sh
cp .env.example .env             # optional local-only settings
bun run dev                      # web + cli + database watchers
```

The Prisma/Postgres package is still present for historical route-handler and migration work, but it is not required for the production client-side MSW path.

### `NEXT_PUBLIC_API_MODE`

| Value | Behaviour |
|---|---|
| unset / `mock` / any value, including stale `real` | MSW intercepts every app API route. No database is required for the production app. |

The compatibility flag is retained only to avoid breaking stale Vercel/local env configuration; it no longer enables real-backend passthrough.

### Optional local Postgres utilities

Only use these commands when deliberately exercising the historical Prisma-backed Route Handlers or migrations:

```sh
docker compose up -d
bun run db:migrate:dev
bun run db:seed
```

`docker-compose` (the v1 binary) and `docker compose` (the Compose v2 plugin) both work; pick whichever your machine has.

| Var | Local utility use |
|---|---|
| `DATABASE_URL` | Runtime URL for historical DB-backed Route Handler tests/scripts. |
| `DIRECT_URL` | Direct URL Prisma uses for migrations / `db push`. |

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
