# phakamas

Monorepo of lesson websites (pnpm workspaces + Turborepo). Each app deploys to Vercel as its own project.

- `apps/thai-spelling`: แม่กง lesson (Vite + React + TanStack Router + Tailwind v4)
- `packages/tsconfig`: shared TypeScript base config

## Local development

pnpm is not installed globally, so call it through npx (version pinned in `packageManager`):

```sh
npx -y pnpm@12.16.1 install
npx -y pnpm@12.16.1 dev        # Vite dev server
npx -y pnpm@12.16.1 build      # route generation + typecheck + vite build
npx -y pnpm@12.16.1 test       # Vitest
npx -y pnpm@12.16.1 test:e2e   # builds, then Playwright (headless Chromium) against vite preview
npx -y pnpm@12.16.1 lint       # oxlint
```

First e2e run on a new machine: `cd apps/thai-spelling && npx playwright install chromium`.

## Placeholder audio (`apps/thai-spelling`)

The mp3s in `apps/thai-spelling/public/assets/audio/` are **TTS placeholders** (PyThaiTTS + FastThaiG2P).
**They must be replaced by real teacher recordings before launch.**

Regenerate them whenever Lesson data adds or changes an audio ID (a Vitest test fails while any clip is missing).
Needs Python 3.12, node >= 23 and ffmpeg; keep the venv outside the repo:

```sh
python3.12 -m venv ~/.venvs/phakamas-tts && ~/.venvs/phakamas-tts/bin/pip install pythaitts
~/.venvs/phakamas-tts/bin/python apps/thai-spelling/scripts/gen-audio.py
```

To use KhanomTan v1.1 instead, change the one `ENGINE = ...` line in the script (see its comment).

## Vercel (project for `apps/thai-spelling`)

| Setting | Value |
| --- | --- |
| Root Directory | `apps/thai-spelling` (keep "Include files outside the root directory" on) |
| Framework Preset | Vite |
| Install Command | `npx -y pnpm@12.16.1 install --frozen-lockfile` |
| Build Command | `npx -y pnpm@12.16.1 run build` |
| Output Directory | `dist` |

These are already set in `apps/thai-spelling/vercel.json`, along with the SPA rewrite to `/index.html`.
pnpm finds the workspace root and lockfile from the app subdirectory, so no `cd ../..` is needed.
