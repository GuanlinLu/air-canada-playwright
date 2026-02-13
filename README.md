# Air Canada Booking – Playwright E2E

Portfolio-quality E2E tests for the Air Canada booking funnel: **Home → Results (filter + select) → Review → Passenger → Seat selection (skip) → Options → Payment** (stop at payment; no submission).

## Tech stack

- **Playwright** + **TypeScript**
- **Page Object Model** (`src/pages`) + **Component objects** (`src/components`)
- **Guards** for transient states (cookie consent, loading)
- **Flow classes** for business workflows
- **Playwright Test** only (no Jest/Cucumber)
- CI-friendly (retries, trace on first retry, screenshot/video on failure)

## Project structure

```
aircanada-playwright-e2e/
├── .github/workflows/
│   └── playwright.yml         # CI: run tests on push/PR (main, master)
├── playwright.config.ts      # Chromium + WebKit, baseURL, timeouts
├── tsconfig.json
├── fixtures/
│   └── searchData.ts         # Origin, destination, dates (roll-forward)
├── tests/
│   └── booking.smoke.spec.ts # Smoke tests (return + one-way, uses BookingFlow)
├── src/
│   ├── pages/                # Page objects
│   │   ├── HomePage.ts
│   │   ├── ResultsPage.ts
│   │   ├── ReviewPage.ts
│   │   ├── PassengerPage.ts
│   │   ├── SeatSelectionPage.ts
│   │   ├── OptionsPage.ts
│   │   └── PaymentPage.ts
│   ├── components/          # Reusable UI components
│   │   ├── ResultsFiltersComponent.ts  # Filter button, Stops, Max. 1 stop, Done
│   │   └── FlightCardComponent.ts      # First row + cheapest fare selection
│   ├── guards/              # Transient state handling
│   │   ├── CookieGuard.ts    # Accept cookie banner (#onetrust-accept-btn-handler)
│   │   └── LoadingGuard.ts  # Wait for stable page signals (results, review, etc.)
│   └── flows/
│       └── BookingFlow.ts   # End-to-end booking workflow
└── ARCHITECTURE.md          # Detailed architecture notes
```

## Test flow (smoke)

1. **Home**: Search (origin, destination, dates) → CookieGuard → search.
2. **Results**: Ensure loaded → **open filter first** → Max. 1 stop → Done → select first row → cheapest fare (return: outbound then inbound).
3. **Review** → **Passenger** (minimal info) → **Seat selection** (skip) → **Options** → **Payment** (assert only).

## CI/CD (GitHub Actions)

Tests run on **push and pull_request** to `main` or `master`:

- **Workflow:** `.github/workflows/playwright.yml`
- **Job:** Install deps → Install Chromium + WebKit → `npm run test`
- **Artifacts:** `playwright-report` (always, 7 days); `test-results` (traces/videos/screenshots on failure only, 7 days)

Set `CI: true` is already used by your config (fewer workers, `forbidOnly`).

## Commands

```bash
npm install
npx playwright install          # install browsers

npm run test                    # all tests
npm run test:smoke              # smoke spec (booking.smoke.spec.ts)
npx playwright test --grep "@smoke"   # smoke-tagged tests only
npm run test:headed             # headed mode
npm run test:ui                 # Playwright UI
npm run report                  # open last HTML report
```

## Design notes

- **Locators**: Prefer `getByRole` / `getByLabel`; use stable IDs where provided (e.g. filter, cookie accept, date confirm).
- **No `waitForTimeout`**: Waits use stable signals (LoadingGuard) or content visibility.
- **Results page**: First action is **click filter** → set Max. 1 stop → Done → then select first flight row and cheapest fare.
- **Consent**: CookieGuard uses `#onetrust-accept-btn-handler`; safe to call after navigation.
- **Tags**: Smoke tests use `@smoke`; run with `--grep "@smoke"`.

For more detail on architecture (pages, components, guards, flows), see **ARCHITECTURE.md**.
