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

## AI CMS draft generation

Use the CLI to create original CMS article draft scaffolds for AI-assisted editorial population. It can use public editorial references such as `https://www.twreporter.org/` for topic/structure inspiration, but generated rows are always new Verda drafts and are never auto-published.

```sh
# Preview three CMS-ready draft payloads without touching Postgres.
bun run --cwd apps/cli gen:ai-articles -- --dry-run \
  --count 3 \
  --reference-url https://www.twreporter.org/ \
  --theme "urban ecology and everyday wellbeing"

# Write draft articles to Postgres. Source .env first if your shell does not
# already export DATABASE_URL / DIRECT_URL for the database package.
set -a; . ./.env; set +a
bun run --cwd apps/cli gen:ai-articles -- \
  --count 3 \
  --reference-url https://www.twreporter.org/
```

Options:

| Flag | Default | Notes |
|---|---|---|
| `--dry-run` | `false` | Prints JSON payloads only; recommended before every write. |
| `--count` | `3` | Generates 1–10 drafts. |
| `--section` | rotating sections | Restrict to one of `mindful-living`, `nutrition`, `movement`, `earth-garden`, `recipes`. |
| `--theme` | section theme | Adds a specific editorial angle. |
| `--reference-title` | none | Optional inspiration label; validated/truncated as an input signal and not copied into body text. |
| `--reference-url` | none | Stored on `sourceUrl` for editorial traceability. |

Every generated article has `status: "draft"`, an AI review notice in `license`, and TipTap-compatible `bodyJson`. The CLI keeps source references out of draft body text so editors can use them only as inspiration. Editors should fact-check, source, revise, add media, and publish manually from the CMS.

## Notes

- `prisma generate` uses a placeholder `DATABASE_URL` if none is set in env, so typecheck and fresh checkouts work without a provisioned database. Commands that actually hit the database (`migrate`, `push`, `studio`) still need a real URL.
- Dependabot runs weekly. If a Dependabot PR bumps versions but CI's `bun install --frozen-lockfile` fails, the bun ecosystem couldn't update `bun.lock` — re-run `bun install` locally and push the updated lockfile.
- The `apps/cli/staging/` directory holds regenerable image artifacts (codex review pipeline) and is gitignored.
