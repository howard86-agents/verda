# verda

Turborepo monorepo: `apps/web` (Next.js), `apps/cli` (Bun image pipeline), `packages/data`, `packages/database` (Prisma).

## Setup

```sh
brew install bun gitleaks typos-cli
bun install
```

`bun install` runs `husky` via the `prepare` script, which wires up the git hooks below.

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
bun run dev         # turbo run dev (web + cli + database watchers)
bun run build       # turbo run build
```

## Notes

- `prisma generate` uses a placeholder `DATABASE_URL` if none is set in env, so typecheck and fresh checkouts work without a provisioned database. Commands that actually hit the database (`migrate`, `push`, `studio`) still need a real URL.
- Dependabot runs weekly. If a Dependabot PR bumps versions but CI's `bun install --frozen-lockfile` fails, the bun ecosystem couldn't update `bun.lock` — re-run `bun install` locally and push the updated lockfile.
- The `apps/cli/staging/` directory holds regenerable image artifacts (codex review pipeline) and is gitignored.
