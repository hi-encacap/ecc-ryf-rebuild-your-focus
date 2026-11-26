# ReMind

A Vietnamese, mobile-first, 30-day personal focus practice app. React 19, TypeScript, Vite, shadcn/ui components, and a local IndexedDB store. There is no account, backend, analytics, or automatic synchronization. The immutable curriculum comes from `handoff/program.v1.json`; the handoff is product reference material, not runtime code.

## Run locally

Use Node.js 22+ and npm. Dependencies are pinned by `package-lock.json`.

```sh
npm ci
npm run dev
```

The app serves on port 3000. For the production/PWA build:

```sh
npm run build
npm run preview
```

PWA service workers work on HTTPS or localhost. Development mode is for implementation; test offline behavior against the production preview or the deployed HTTPS site.

## Product and data

The app is designed around today's next action, the supplied 30-day program, daily habits and reflection, focus/reading practice, recall, independent thinking, and descriptive progress. Start with optional personal baseline measurements; blanks mean unknown, and an explicit zero means observed zero. The program is a personal experiment, not a medical assessment or treatment.

Personal records are stored locally in IndexedDB and persist across reloads and offline use after the app shell has been cached. They are associated with the same site origin and browser profile. Opening another hostname, device, private window, or browser does not automatically carry records across. Browser clearing/eviction can remove them. Export backups from Settings; backup JSON contains private data and should be handled accordingly. Local storage is not an encrypted vault.

No browser API here reads Screen Time, blocks other apps, or observes actual attention. Screen-time numbers, interruptions, and assessment results are self-reported. No medical, IQ, or causal improvement claims are made.

## Install on iPhone

1. Open the deployed HTTPS site in Safari while online.
2. Choose **Share → Add to Home Screen**.
3. Open ReMind from its icon and keep a JSON backup of important entries.

iOS can suspend web apps in the background or while locked. A timestamp-based timer can recover elapsed wall-clock time, but cannot prove that it was spent focusing. Confirm actual time when returning after an interruption. The app does not promise background sounds or notifications. Safari and installed web apps can have different storage behavior across iOS versions; export/import when changing context.

## Deploy to AWS

The requested target is a private S3 bucket behind CloudFront, using AWS CLI profile `ecc-sap-sandbox`. The deployment creates HTTPS hosting, Origin Access Control, security headers, correct asset caching, and SPA route handling; it uploads only the static production build.

```sh
node scripts/deploy.mjs --check
npm run deploy
```

The script checks credentials before making changes, reuses the CloudFormation stack, refuses to adopt an unrelated stack, retains old fingerprinted assets, publishes the service worker after the shell and dependencies, and checks the HTTPS endpoints before printing a live URL. Deployment is not an atomic multi-object transaction; on a failed upload, rerun the same command to finish. Previous versioned assets are retained for clients already running them.

**Current deployment blocker:** this Cloud execution environment has no `ecc-sap-sandbox` profile or attached AWS identity. AWS CLI was installed for this task at `/tmp/remind-aws-cli/bin/aws`, and an actual preflight returned `The config profile (ecc-sap-sandbox) could not be found`. No AWS resources have been created, and no live deployment is claimed. Once the profile is securely available here, run:

```sh
REMIND_AWS_CLI=/tmp/remind-aws-cli/bin/aws node scripts/deploy.mjs
```

AWS endpoints may also require an environment network grant; the current environment initially allowed package registries only. Do not paste credentials into the app, source, or chat. See [deployment details](docs/DEPLOYMENT.md) for profile, region, stack, permissions, caching, and retry behavior.

## Source organization

| Path | Responsibility |
| --- | --- |
| `src/components/ui/` | shadcn/ui building blocks |
| `src/domain/` | Dates, targets, scoring, analytics, and timer state |
| `src/data/` | Local storage, validation, and backup boundaries |
| `src/content/program.v1.json` | Versioned 30-day curriculum |
| `src/design-tokens.css` | Shared visual tokens |
| `src/assets/`, `public/` | Same-origin illustration and app icons |
| `infra/cloudformation.json` | Private S3 and CloudFront infrastructure |
| `scripts/deploy.mjs` | Idempotent static deployment workflow |
| `DESIGN_SYSTEM.md` | Visual direction and component guidance |

## Verification

```sh
npm test
npm run test:e2e
npm run build
```

Verified on 26 November 2026:

- Production TypeScript/Vite build passed.
- **38 unit tests passed** for calendar/targets/scoring/analytics, timer state, storage and backups.
- **10 Playwright tests passed** in Chromium against the production build: optional baseline, daily submission/N/A, offline logging/reload, export/reset/import, restore on first launch, invalid input retained for correction, manual and restored timers, concurrent tabs, hidden recall answers, 360px navigation/layout, manifest and PNG icon dimensions.
- Personal logging generated no non-GET network requests in the browser test.
- npm production dependency audit: **0 vulnerabilities**. Full audit reports 4 moderate build-tool findings through Workbox/glob/minimatch; the registry reports no compatible fix. These tools are not shipped as a runtime server, and build globs are project-controlled.
- Actual Safari/iPhone installation and live AWS HTTPS behavior are not verified yet. Chromium mobile viewports verify layout, not every iOS behavior.

Browser tests need the production preview running on port 3000. The default runner uses `/usr/bin/chromium`; set `REMIND_CHROMIUM` for another installed Chromium executable. Test data uses isolated browser contexts and is not bundled into the app.

Deployment checks already executed: `node --check scripts/deploy.mjs`, CloudFormation structural invariants, and `cfn-lint infra/cloudformation.json` passed. The real AWS identity preflight failed only because the requested profile was unavailable; live CloudFormation validation, upload, and HTTPS verification remain blocked.

## Design provenance

The user requested Hallmark for the design system. No connected Hallmark tool or matching plugin was found. A dedicated design subagent created the local design system instead; this repository does not claim output from the external Hallmark service. See `DESIGN_SYSTEM.md` for the applied visual rules.

## Verified preview artifacts

- `artifacts/today-desktop-preview.png`: fresh desktop Today view.
- `artifacts/mobile-preview.png`: fresh 390px mobile view.
- `artifacts/today-mobile.png`: full 360px layout.

All preview personal metrics are unknown, with no fabricated user history. See `docs/DEPLOY_READY.md` for continuing deployment from a newly published Cloud environment.
