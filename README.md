# LIFORA

**Your everyday life, organized.**

LIFORA is an all-in-one, offline-first personal life management app for
Android — calendar, reminders, tasks, finance tracking (with bank statement
CSV import), notes and checklists, and a calculator suite, all in one place
with no account and no internet dependency.

The full specification lives in [`Lifora_Complete_PRD.md`](./Lifora_Complete_PRD.md)
(or [`Lifora_Complete_PRD.pdf`](./Lifora_Complete_PRD.pdf)) — read Section 14
for the phased build order this codebase follows.

## Stack

React Native + Expo + TypeScript + Expo Router, with Expo SQLite for local
storage. See PRD Section 6 for the full technology list and rationale.

## Getting started

```bash
npm install
npm start
```

Then press `a` to open on an Android emulator, or scan the QR code with
Expo Go on a physical device.

## Scripts

| Script | Purpose |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` | Start the dev server and open on Android |
| `npm test` | Run the Jest test suite |
| `npm run build:preview` | Build an installable preview APK via EAS (from Phase 11 onward) |
| `npm run build:production` | Build a production AAB via EAS (from Phase 11 onward) |

## Project structure

Follows the folder layout documented in PRD Section 10: `app/` for
Expo Router screens, `components/` for UI, `services/` for business logic,
`database/` for the SQLite schema, migrations, and repositories, `hooks/`,
`utils/`, `types/`, and `constants/`. Folders are added incrementally as
each phase in Section 14 builds them — not scaffolded empty up front.

## Status

**Phase 1 — Project Foundation** complete: navigation shell, Light/Dark/
System theming, the shared component library (`Button`, `Card`, `Input`,
`EmptyState`, `ConfirmDialog`), and the local database connection with its
first migration (categories + app settings, seeded on first launch).
