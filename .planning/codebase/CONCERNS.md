# Codebase Concerns

**Analysis Date:** 2026-02-19

## Tech Debt

**Outdated Vue 2 Stack:**
- Issue: Codebase uses Vue 2.6, Element UI 2.13, and Vue CLI 4, which are both deprecated. Vue 2 reached end of life in December 2024. Modern Vue 3 offers better performance, smaller bundle size, and improved TypeScript support.
- Files: `package.json`, `src/main.js`, all `*.vue` components
- Impact: No security updates, performance issues, difficulty attracting contributors familiar with modern Vue, incompatibility with new tooling ecosystems
- Fix approach: Migrate to Vue 3 with Vite build tool and TypeScript. This is a major refactor requiring component updates and dependency replacement (Vue Router 4, Vuex → Pinia).

**No TypeScript:**
- Issue: Entire codebase written in JavaScript without any TypeScript support. No type safety for API responses, component props, or store state.
- Files: All `src/**/*.js` and `src/**/*.vue` files
- Impact: Runtime errors slip through undetected, IDE support is minimal, refactoring is risky, API response shape changes from THSR are uncaught
- Fix approach: Gradually migrate to TypeScript, starting with API layer (`src/api/`) and store, then components.

**Deprecated Axios Version:**
- Issue: Using `axios@0.19.2` from 2020. Latest version is 1.x with multiple security and bug fixes.
- Files: `package.json`, `src/utils/request.js`
- Impact: Known vulnerabilities, missing performance improvements, incompatible with newer security patterns
- Fix approach: Update to `axios@^1.6.0` and review request/response interceptor patterns for compatibility.

**Missing Build Configuration:**
- Issue: No `vue.config.js` file present. Using Vue CLI defaults without explicit configuration for optimization, code splitting, or environment handling.
- Files: Project root
- Impact: Limited control over bundle size, no explicit optimization for production, harder to debug build issues
- Fix approach: Create explicit `vue.config.js` with production optimizations (minification, tree-shaking, lazy-loading).

## Known Bugs

**Uncaught Pagination Error in byTime Component:**
- Symptoms: User clicks "next" button on pagination, component may crash if timetable list is empty or has fewer items than expected
- Files: `src/components/byTime.vue` (lines 159-162)
- Trigger: Loading times when no results are returned, then attempting pagination. The `next()` method has no bounds checking for empty arrays.
- Workaround: None. Component appears functional but lacks defensive programming. Code at line 161 attempts comparison without checking if timetable array exists.

**Time Calculation Incorrectness in byTime Component:**
- Symptoms: Travel time display shows incorrect minutes when duration is less than 60 minutes (e.g., 45 minutes may display as "0:045" due to string concatenation)
- Files: `src/components/byTime.vue` (lines 163-171)
- Trigger: Any journey under 1 hour. Line 170 shows: `${mm > 10 ? mm : '0' + mm}` which fails for times like 5 minutes, producing "05" but not handling the base case properly for single-digit calculations.
- Workaround: Visually inspect results, understand that display is wrong but data is correct.

**Unvalidated API Response Data:**
- Symptoms: If THSR API changes response structure, app crashes with undefined errors rather than graceful degradation
- Files: `src/components/byTime.vue` (line 58), `src/components/byTrainNo.vue` (lines 35, 77-78), `src/components/byStation.vue` (line 34)
- Trigger: Deep property access without null checks: `form.fromStation.text`, `scope.row.DestinationStopTime.ArrivalTime`, `item.GeneralTimetable.GeneralTrainInfo.TrainNo`
- Workaround: None. Crashes silently.

## Security Considerations

**Missing API Authentication:**
- Risk: All requests to THSR API are unauthenticated. If the API requires authentication via API key or OAuth, these requests will fail or expose sensitive data.
- Files: `src/utils/request.js`, `src/api/thrs-api.js`
- Current mitigation: Axios interceptors exist but don't add any auth headers. Relying on open API endpoint assumption.
- Recommendations: Verify if THSR API requires authentication. If yes, add API key via environment variable: `process.env.VUE_APP_THSR_API_KEY` in request interceptor (line 10-18).

**Debug Logging in Production:**
- Risk: Console warnings and errors are logged in production builds, potentially exposing stack traces or sensitive API responses to end users.
- Files: `src/utils/request.js` (lines 15, 35), `src/components/byTime.vue` (line 182), `src/components/byStation.vue` (lines 94, 130, 139), `src/components/byTrainNo.vue` (line 86)
- Current mitigation: ESLint rule `'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off'` exists in `.eslintrc.js` but console statements are NOT wrapped in `if (process.env.NODE_ENV !== 'production')` checks
- Recommendations:
  1. Remove all `console.log()` and `console.warn()` statements
  2. Use proper logging library (e.g., `winston`, `pino`) for production monitoring
  3. Add pre-commit hook to catch console statements before deployment

**No CORS Headers Handling:**
- Risk: Cross-Origin requests to THSR API may fail silently if CORS headers are misconfigured. Error handling doesn't distinguish between CORS failures and other network errors.
- Files: `src/utils/request.js` (response error handler at lines 34-42)
- Current mitigation: Generic error handler shows user message but doesn't provide diagnostic information
- Recommendations: Add specific handling for CORS errors with user-friendly messages. Consider proxy layer for development vs. production.

**Hardcoded API Endpoint:**
- Risk: API base URL is hardcoded in source code (`https://ptx.transportdata.tw/MOTC/v2/Rail/THSR` at line 3 of `request.js`)
- Files: `src/utils/request.js`
- Current mitigation: No mitigation. URL is visible in built JavaScript.
- Recommendations: Move to environment variable: `process.env.VUE_APP_API_BASE_URL` with defaults in `.env.local`.

## Performance Bottlenecks

**Inefficient Time Comparison Logic:**
- Problem: Every time a form changes, time comparisons create new Date objects multiple times. The `getTimetable()` method (byTime.vue lines 187-217) creates ~6-8 Date objects per result item for sorting and filtering.
- Files: `src/components/byTime.vue` (lines 195-216)
- Cause: Using string parsing to Date conversion (`new Date('1970/01/01 ' + timeString)`) repeatedly instead of once during API response normalization
- Improvement path: Transform API response once in `getDailyTimetable()` API function to return objects with pre-parsed time values. Memoize date comparisons.

**Missing Pagination Optimization:**
- Problem: All timetable results are loaded into memory and then sliced in frontend. No server-side pagination. If an API call returns 1000+ results, all are kept in component state.
- Files: `src/components/byTime.vue` (line 140), `src/components/byStation.vue`
- Cause: Using `timetable.slice(this.index, this.index + this.offset)` requires all data in memory
- Improvement path: Implement server-side pagination if THSR API supports it, or implement virtual scrolling with windowed lists.

**Repeated API Calls:**
- Problem: `getTimetable()` in byTrainNo component (line 61 in `mounted()` and line 12 in `remote-method`) will execute on component mount even if user hasn't interacted yet
- Files: `src/components/byTrainNo.vue` (lines 60-61, 64-66)
- Cause: `getTimetable()` is called immediately in `mounted()` to populate options, then called again as user types (remote-method). No debouncing or caching.
- Improvement path: Add debouncing to `getTimetable()` when used as remote-method, cache results with TTL.

## Fragile Areas

**byTime Component (228 lines):**
- Files: `src/components/byTime.vue`
- Why fragile: Largest component in codebase with multiple responsibilities: form validation, time parsing, data transformation, API calls, UI rendering. Mixes business logic with presentation. Complex state management (timetable array, index, offset). Multiple methods doing similar date parsing.
- Safe modification: Extract date/time utilities to `src/utils/timeUtils.js`, separate data fetching from UI logic using composable pattern, add unit tests for `diffTime()` and `getTimetable()` methods
- Test coverage: Zero. Component has no unit tests despite complex logic.

**byStation Component (149 lines):**
- Files: `src/components/byStation.vue`
- Why fragile: Complex computed properties filtering data (northward/southward) without defensive checks. Filter at line 117 assumes `Direction` property always exists. No error handling for empty API responses.
- Safe modification: Add prop validation, add defensive checks in filters, extract filter logic to computed property in store
- Test coverage: Zero. No validation that API response structure matches expectations.

**byTrainNo Component (97 lines):**
- Files: `src/components/byTrainNo.vue`
- Why fragile: Remote-method handler (line 12) calls API without debouncing. No error state if API fails during search. Line 70 checks `result.length === 0` but doesn't handle actual API errors.
- Safe modification: Add debouncing via lodash or native solution, add error boundaries, wrap API calls in try-catch
- Test coverage: Zero.

**Request Interceptor (45 lines):**
- Files: `src/utils/request.js`
- Why fragile: Response handler checks `response.status !== 200` (line 23) but in typical axios usage, 4xx/5xx errors go to error handler, not success handler. This condition may never be true. No timeout handling beyond axios default. Error messages shown to user are raw error strings which could be confusing or reveal stack traces.
- Safe modification: Simplify response handler, ensure error messages are user-friendly, add timeout retry logic, test with actual API failures
- Test coverage: Zero.

## Scaling Limits

**No Caching Strategy:**
- Current capacity: Each user query hits API directly. No client-side or server-side caching.
- Limit: If THSR API rate-limits requests or goes down, app becomes completely non-functional. Repeated queries for same stations/trains cause redundant API calls.
- Scaling path: Implement:
  1. Browser localStorage cache with TTL (e.g., stations list cached for 24 hours)
  2. IndexedDB for timetable results
  3. Service Worker for offline support and smart cache invalidation

**No Error Recovery:**
- Current capacity: Single API failure = broken feature
- Limit: No retry logic, no fallback, no graceful degradation
- Scaling path: Add exponential backoff retry logic in request interceptor, implement circuit breaker pattern for repeated failures, show cached data as fallback when possible

**Synchronous Data Loading:**
- Current capacity: Page renders nothing until stations are fetched (store action in Home.vue mounted hook)
- Limit: If stations API is slow, entire UI is blocked
- Scaling path: Load stations in background, show loading state, implement skeleton screens, lazy-load data as user navigates

## Dependencies at Risk

**Node-sass → Deprecated:**
- Risk: `node-sass@4.12.0` is deprecated in favor of `dart-sass`. Node-sass has known compatibility issues with newer Node versions (18+) and may fail to install on ARM Macs.
- Impact: Build failures on new environments, inability to use modern Node versions, missing security updates
- Migration plan: Replace with `sass@^1.69.0` (drop-in replacement, same API). Update `sass-loader` to `^13.3.0`.

**Babel-eslint → Deprecated:**
- Risk: `babel-eslint@10.0.3` is deprecated. Should use `@babel/eslint-parser`.
- Impact: No support for new JavaScript features, security vulnerabilities
- Migration plan: Replace with `@babel/eslint-parser@^7.23.0`.

**Element UI → Inactive:**
- Risk: Element UI (Vue 2) is in maintenance mode with minimal updates. Component library will not receive new features or major improvements. Vue 3 version (`element-plus`) has different API.
- Impact: Cannot use modern UI patterns, accessibility issues may not be fixed, no TypeScript support
- Migration plan: When migrating to Vue 3, switch to `element-plus@^2.4.0`.

**Vue CLI → Deprecated:**
- Risk: Vue CLI is in maintenance mode as teams move to Vite. No new features, slower builds, larger bundles.
- Impact: Build performance degradation, missing modern bundling optimizations
- Migration plan: Migrate to Vite with `npm create vite@latest -- --template vue` after Vue 3 migration.

## Missing Critical Features

**No Error Boundary / Error Handling:**
- Problem: No global error handler or error boundary components. If any component throws an error, entire app crashes to blank screen.
- Blocks: Reliable user experience, debugging in production, error reporting
- Recommendation: Implement global error handler in main.js with Vue.config.errorHandler, add error boundary component for critical sections, integrate error tracking service (Sentry)

**No Loading States:**
- Problem: API calls have no loading indicator. User doesn't know if request is pending or failed.
- Blocks: User trust, clear UX, ability to cancel requests
- Recommendation: Add loading spinners during API calls, implement request cancellation (axios CancelToken), show appropriate empty states

**No Input Validation Before API Call:**
- Problem: Form validation only checks required fields. No validation of date format, no validation that departure date is today or future, no validation that selected stations are different (byTime has validator at line 102 but others don't).
- Blocks: Sending bad requests to API, confusing error messages
- Recommendation: Add comprehensive validation schema using library like `vuelidate` or `yup`

**No Responsive Design Testing:**
- Problem: No evidence of responsive design testing. Element UI grid used but not tested on mobile viewports.
- Blocks: Mobile usability, accessibility
- Recommendation: Add mobile viewport testing to development workflow, implement touch-friendly interaction patterns

## Test Coverage Gaps

**Zero Unit Tests:**
- What's not tested: All business logic, utility functions, API integration, store mutations/actions, component logic
- Files: Entire `src/` directory, especially `src/utils/request.js`, `src/api/thrs-api.js`, `src/store/index.js`
- Risk: Regressions go unnoticed, refactoring is dangerous, edge cases like empty results or malformed API responses are untested
- Priority: **High** - Add test suite with minimum 60% coverage. Start with critical paths: time parsing logic, API calls, data transformation.

**No E2E Tests:**
- What's not tested: Full user workflows (search by time → view results → navigate), integration between components, API response handling
- Files: All components
- Risk: Features work in isolation but break when combined
- Priority: **Medium** - Use Cypress or Playwright to test critical user journeys after unit tests are in place.

**No Integration Tests:**
- What's not tested: API integration with real THSR endpoints, store state management across components
- Files: `src/api/`, `src/store/`
- Risk: API changes break app silently, store mutations cause cascading failures
- Priority: **Medium** - Add integration tests using mock API server (MSW) or fixtures before E2E tests.

---

*Concerns audit: 2026-02-19*
