# Enterprise-Grade Playwright Architecture

## Folder Structure

```
aircanada-playwright-e2e/
├── src/
│   ├── pages/          # Page Objects (stable business pages)
│   │   ├── HomePage.ts
│   │   ├── ResultsPage.ts
│   │   ├── ReviewPage.ts
│   │   ├── PassengerPage.ts
│   │   ├── SeatSelectionPage.ts
│   │   ├── OptionsPage.ts
│   │   └── PaymentPage.ts
│   ├── components/     # Reusable UI components
│   │   ├── ResultsFiltersComponent.ts
│   │   └── FlightCardComponent.ts
│   ├── guards/         # Transient state handlers
│   │   ├── CookieGuard.ts
│   │   └── LoadingGuard.ts
│   └── flows/          # Business workflows
│       └── BookingFlow.ts
├── tests/
│   └── e2e/            # Test specifications
│       └── booking.smoke.spec.ts
├── fixtures/           # Test data
│   └── searchData.ts
└── playwright.config.ts
```

## Architecture Principles

### 1. **Pages** (`src/pages/`)
- Represent stable business pages (Home, Results, Review, Passenger, etc.)
- Encapsulate page-specific locators and actions
- Do NOT model transient pages (loading, redirects)

### 2. **Components** (`src/components/`)
- Reusable UI components (Filters, Flight Cards)
- Encapsulate complex selection logic (e.g., cheapest fare selection)
- Can be composed within Pages

### 3. **Guards** (`src/guards/`)
- Handle transient/optional states:
  - **CookieGuard**: Accepts cookie consent if present (safe no-op)
  - **LoadingGuard**: Waits for stable page signals (unique locators/URLs)
- Called opportunistically after navigation/clicks
- Do NOT wait for spinners; wait for stable signals

### 4. **Flows** (`src/flows/`)
- High-level business workflows
- Orchestrate Pages, Components, and Guards
- Encapsulate complete business processes
- Tests should be thin and only call Flow methods

### 5. **Tests** (`tests`)
- Thin test specifications
- Only orchestrate Flows
- Tagged with `@smoke`, `@regression`, etc.

## Business Flow

```
Home (search) 
  → Results (filter max 1 stop, select first card → cheapest fare)
  → Review
  → Passenger (fill minimal info)
  → Seat Selection (skip)
  → Options (skip all)
  → Payment (STOP - no submission)
```

## Key Selection Rules

### Results Filtering
- Open filters
- Set Max 1 stop
- Apply filters

### Flight Selection
- **One-way**: Select first card → cheapest fare
- **Return**: 
  - Outbound: First card → cheapest fare
  - Inbound: First card → cheapest fare

### Seat Selection
- Always skip seats
- Click "Next flight" (if present for return trips)
- Click "Continue to travel options"

## Running Tests

```bash
# Run smoke tests only
npx playwright test --grep @smoke

# Run with UI
npx playwright test --headed --grep @smoke

# Debug mode
npx playwright test --headed --debug --grep @smoke
```

## Best Practices

1. **No hard waits**: Use `waitFor()` with stable signals
2. **Prefer role-based locators**: `getByRole()`, `getByLabel()`, `getByTestId()`
3. **CI-ready**: Retries, trace on failure, artifacts only on failure
4. **Low flake**: Robust locators, stable page signals, safe guards
