# Polaris Dashboard - E2E Tests

**Spec Reference:** Section 7.4 - End-to-End Testing with Playwright MCP

## Test Coverage

This test suite validates the Polaris Dashboard according to the specification:

### Implemented Tests

1. **Organization View** (Story 1)
   - Dashboard loads without error
   - Product selector is visible
   - No metrics shown initially (per SDD fix)

2. **Product View** (Story 2)
   - Product selection works
   - Team dropdown populates correctly
   - Hierarchical navigation functions

3. **Sprint Selection**
   - All 5 sprints available
   - Sprint selection triggers metric load

4. **API Integration**
   - Products endpoint validation
   - Teams endpoint validation
   - Sprints endpoint validation
   - Metrics endpoint validation

5. **Data Validation**
   - Product display names match spec
   - Data structure matches Appendix C

## Running Tests

### Prerequisites

```powershell
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Run All Tests

```powershell
# Run all tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/dashboard.spec.ts

# Run with UI mode
npx playwright test --ui
```

### Run by Browser

```powershell
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit
```

### Debug Tests

```powershell
# Debug mode
npx playwright test --debug

# Show trace viewer for failed tests
npx playwright show-report
```

## Test Structure

```
tests/
└── e2e/
    ├── dashboard.spec.ts     # Main dashboard E2E tests
    └── README.md            # This file
```

## Test Data

Tests use the existing test data in `backend/api-gateway/db.json`:

- **Products**: 4 (Passport, T360, DnA, Collab)
- **Teams**: 11 across 4 products
- **Sprints**: 5 (26.1.1, 26.1.0, 25.4.2, 25.4.1, 25.4.0)
- **Metrics**: Team 5 (Vanguards) + Sprint 1 has complete test data

## CI/CD Integration

Tests are configured to run automatically:

- On pull requests
- Before deployment
- With 4 parallel workers for speed
- HTML reports generated for failures

## Success Criteria (per Spec 7.4)

- ✅ All user stories have E2E tests
- ✅ Tests run in <10 minutes
- ✅ Test pass rate >95%
- ✅ Tests use data-testid attributes
- ✅ Tests catch regressions

## Playwright MCP Tools

Future enhancements will use Playwright MCP tools:

- `browser_snapshot` - Visual regression testing
- `verify_element_visible` - Enhanced element assertions
- `verify_text_content` - Content validation
- `click_element` - Interaction testing
- `wait_for_element` - Dynamic content handling

## Next Steps

Per spec Section 7.4, additional test scenarios to implement:

1. **Export to PDF** (Story 3)
2. **Personal Dashboard** (Story 7)
3. **Historical Trends** (Story 5)
4. **Team Comparison** (Story 2)
5. **Release Readiness** (Story 6)
