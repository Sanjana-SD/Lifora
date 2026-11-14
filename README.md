# LIFORA

**Your everyday life, organized.** An Android app for your calendar, reminders, tasks, notes, money and quick sums, in
one place. Your data is stored on the phone; there's no account and no cloud sync.

## Features

| Area | What it does |
|---|---|
| Home | Greeting with local weather, quick actions, today's events, reminders and tasks due, today's spending, recent notes |
| Calendar | Month and upcoming views, repeating events, alerts; **Scan** adds dates found in a photo, screenshot or PDF |
| Reminders & Tasks | Due times, repeats, snooze, priorities, on-time notifications |
| Finance | **Import a bank statement PDF** (password-protected PDFs supported); spending by day, category and payee; money in vs out |
| Notes & Checklists | Notes with colours, pins and favourites; checklists with templates |
| Calculator | Basic calculator with history |
| Settings | Light/Dark/System appearance, notification status and a test notification |

Statements and documents are read **on the phone** (PDFBox and Google ML Kit). Only the phone's approximate location
is sent to [Open-Meteo](https://open-meteo.com) to fetch the weather.

## Development

```bash
npm install
npm start          # Expo dev server (press a for Android, w for web)
npm test           # Jest test suite
npm run lint       # ESLint
npx tsc --noEmit   # Type check
```

Reading PDFs and photos, and on-time notifications, use native code that **Expo Go doesn't include**. Build the
development app once and install it on your phone:

```bash
npm run build:dev   # EAS development build (APK)
npm start           # then open the installed LIFORA app
```

The web preview runs everything except reading files and notifications.

## Building for release

Builds run in the cloud with [EAS](https://docs.expo.dev/eas/). Log in once with `npx eas-cli@latest login`.

| Command | Output |
|---|---|
| `npm run build:dev` | Development APK (works with `npm start`) |
| `npm run build:preview` | Installable APK to share for testing |
| `npm run build:production` | Play Store app bundle (AAB) |
| `npx eas-cli@latest submit -p android` | Uploads the latest production build to Play Console (internal track) |

Android permissions: notifications, exact alarms ("Alarms & reminders", so alerts fire on time), approximate location
(weather), camera (photographing documents). Fine location and the microphone are blocked.

## Project structure

```
app/          Screens (Expo Router: every file is a route)
components/   UI components, grouped by feature
services/     Business logic (finance, calendar, notifications, weather, document reading)
database/     SQLite schema, migrations and repositories (the only place with SQL)
hooks/        React hooks that load data for screens
utils/        Pure helpers: statement parser, date extraction, money in paise, notification planner
constants/    Theme colours, spacing and type scale, categories
types/        Shared TypeScript types
tests/        Unit, component and integration tests
docs/         Product requirements and development report
```
