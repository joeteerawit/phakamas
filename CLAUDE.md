# phakamas

Interactive Thai reading lesson website (มาตราแม่กง). Spec: `apps/thai-spelling/docs/mae-kong-spec.md`.

## Working rules

- **Language**: always reply to the user in Thai. Code, identifiers, and commit messages stay in English.
- **Git**: trunk-based development on `main`. Short-lived work only, commit straight to `main` (no long-lived feature branches).
- **Tech stack**: React + Vite + TanStack Router (TypeScript), pnpm workspaces + Turborepo.
- **Testing**: Vitest + Testing Library for logic; Playwright for flows, always run headless.
- **Grilling**: restart question numbers at Q1 every round.
- **Repo shape**: monorepo holding more than one website; each website deploys to Vercel as its own project.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `joeteerawit/phakamas`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five triage roles plus Type / Scope / Page / Area / Status labels for filtering, updated as tickets move. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context: root `GLOSSARY-MAP.md` points to one `GLOSSARY.md` per app (apps don't share vocabulary). See `docs/agents/domain.md`.
