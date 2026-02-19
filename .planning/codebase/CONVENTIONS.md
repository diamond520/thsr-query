# Coding Conventions

**Analysis Date:** 2026-02-19

## Naming Patterns

**Files:**
- Vue components: `camelCase` (e.g., `byTime.vue`, `byStation.vue`)
- JavaScript modules: `camelCase` (e.g., `request.js`, `thrs-api.js`)
- API methods: `kebab-case` in filenames, `camelCase` for function names
- Directory names: lowercase (e.g., `/api`, `/components`, `/utils`, `/store`, `/router`)

**Functions:**
- Named exports use `camelCase` (e.g., `getStations`, `getDailyTimetable`, `getGeneralTimetablebyTrainNo`)
- Vue component methods use `camelCase` (e.g., `onSubmit`, `getSeatStatusList`, `diffTime`, `stationValidClear`)
- Internal utilities use `camelCase` (e.g., `mapGetters` from Vuex)

**Variables:**
- Component data properties: `camelCase` (e.g., `activeName`, `form`, `rules`, `availableSeats`)
- Object properties: Mix of cases based on external API (e.g., `OriginStationID`, `StationName.Zh_tw` from API)
- Boolean flags: `camelCase` with clear intent (e.g., `arrive`, `valid`)

**Types:**
- Vue component names: PascalCase in registration (e.g., `byTime`, `byStation`)
- Vuex store names: camelCase (e.g., `stations`)

## Code Style

**Formatting:**
- 2-space indentation (observed throughout)
- No semicolons at end of statements (JavaScript)
- Template strings with backticks for interpolation (e.g., `` `${scope.row.OriginStopTime.DepartureTime} - ${scope.row.DestinationStopTime.ArrivalTime}` ``)
- Multi-line object literals properly indented

**Linting:**
- Tool: ESLint (`eslint: ^6.7.2`)
- Config: `.eslintrc.js`
- Key rules:
  - `plugin:vue/essential` - Vue best practices
  - `eslint:recommended` - ESLint recommended rules
  - Parser: `babel-eslint` for ES6+ support
  - `no-console`: error in production, off in development
  - `no-debugger`: error in production, off in development

**Formatting tools:**
- No Prettier configuration detected
- Relies on ESLint for formatting guidance

## Import Organization

**Order:**
1. Framework imports (Vue, Vuex, Vue Router)
2. Component imports (components, views)
3. API/service imports
4. Utility imports
5. Style imports (CSS/SCSS)

**Examples from codebase:**
```javascript
// src/main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'normalize.css'
import './assets/style.scss'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
```

**Path Aliases:**
- `@/` is used throughout to reference `/src` directory (e.g., `@/api/thrs-api`, `@/utils/request`, `@/components/byTime.vue`)
- Configured via Vue CLI (standard webpack alias)

## Error Handling

**Patterns:**
- Promise-based error rejection (not try-catch)
- Interceptor-based error handling in axios request layer (`src/utils/request.js`)
- Form validation via Element UI validation rules with callback pattern
- Error display through Element UI Message component

**Example from `src/utils/request.js`:**
```javascript
service.interceptors.response.use(
  response => {
    const res = response.data
    if (response.status !== 200) {
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5000
      })
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return response.data
    }
  },
  error => {
    console.warn('err' + error) // for debug
    Message({
      message: error.message,
      type: 'error',
      duration: 5000
    })
    return Promise.reject(error)
  }
)
```

**Example form validation from `src/components/byTime.vue`:**
```javascript
var validateArriveAndDeparture = (rule, value, callback) => {
  if (this.form.fromStation === this.form.toStation) {
    callback(new Error('起訖站不可以相同'))
  } else {
    callback()
  }
}
```

## Logging

**Framework:** `console` object (no logging library)

**Patterns:**
- `console.log()` for data inspection (e.g., `console.log('value', value)`, `console.log('result', result)`)
- `console.warn()` for error/warning messages (e.g., `console.warn(error)`, `console.warn('error submit!!')`)
- Comments indicate debug intent: `// for debug`
- Removed from production builds via ESLint `no-console: 'error'` in production

**Current usage in codebase:**
- `src/utils/request.js`: debug warnings in interceptors
- `src/components/byStation.vue`: data logging in filters and methods
- `src/components/byTime.vue`: commented-out logs and submit warnings
- Inconsistent cleanup (some logs removed, some remain)

## Comments

**When to Comment:**
- Path aliases explanation (e.g., `// @ is an alias to /src`)
- Webpack configuration for code splitting (e.g., `// webpackChunkName: "about"`)
- Debug indicators (e.g., `// for debug`)
- Commented-out code left in place for reference

**JSDoc/TSDoc:**
- Not used in this codebase
- No type annotations detected
- Comments are minimal and ad-hoc

## Function Design

**Size:** Functions generally small to medium (10-30 lines typical)

**Parameters:**
- Named destructuring used in API functions (e.g., `getDailyTimetable({OriginStationID, DestinationStationID, TrainDate})`)
- Component methods receive event objects and validation callbacks
- Single parameter for simple operations

**Return Values:**
- Functions return promises (async operations)
- Components return component objects with data/methods
- API functions return axios promise chains
- Vuex getters return mapped/transformed data

## Module Design

**Exports:**
- Named exports for API functions (e.g., `export function getStations() { ... }`)
- Default exports for Vue components and Vuex store
- Single export per utility module (e.g., axios instance in `request.js`)

**Barrel Files:**
- Not used; direct imports from source files
- Each API endpoint module exported directly

**Patterns:**
- API layer (`src/api/thrs-api.js`): named function exports that wrap request utility
- Utils layer (`src/utils/request.js`): default export of configured axios instance
- Components: default export of Vue component definition objects
- Store: default export of Vuex store instance

---

*Convention analysis: 2026-02-19*
