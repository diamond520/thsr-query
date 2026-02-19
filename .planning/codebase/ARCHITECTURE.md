# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Single Page Application (SPA) with Vue.js 2, using centralized state management and API service layer

**Key Characteristics:**
- Component-based UI structure with reusable Vue single-file components
- Centralized state management via Vuex for shared application state
- Service layer abstraction for external API calls with request interceptors
- View-based routing using Vue Router with lazy-loaded routes
- External Material Design UI framework (Element UI) for consistent component library

## Layers

**Presentation Layer:**
- Purpose: Render user interface and handle user interactions
- Location: `src/views/`, `src/components/`
- Contains: Vue single-file components (.vue files) with templates, scripts, and styles
- Depends on: Vuex store (via mapGetters/mapActions), API layer
- Used by: Vue Router (for views) and parent components (for sub-components)

**State Management Layer:**
- Purpose: Centralized application state with predictable mutations and async actions
- Location: `src/store/index.js`
- Contains: Vuex store with state, mutations, actions, getters
- Depends on: API service layer
- Used by: Presentation layer components via mapGetters/mapActions

**Service/API Layer:**
- Purpose: Abstract external API calls with unified request/response handling
- Location: `src/api/thrs-api.js`, `src/utils/request.js`
- Contains: API endpoint functions and axios request interceptor configuration
- Depends on: axios HTTP client, Element UI messaging (for error handling)
- Used by: Vuex store actions, components (occasionally for non-state data)

**Routing Layer:**
- Purpose: Define navigation between pages and manage route state
- Location: `src/router/index.js`
- Contains: Vue Router configuration with routes, lazy-loading setup
- Depends on: Views (imported or lazy-loaded)
- Used by: Root App component

## Data Flow

**Query Flow (example: byTime component):**

1. User interacts with form in `src/components/byTime.vue`
2. Form validation triggered via element-ui form component
3. Valid submission calls `getDailyTimetable(params)` from `src/api/thrs-api.js`
4. API function uses axios from `src/utils/request.js` with configured interceptors
5. Request interceptor logs request (debug only)
6. Response interceptor:
   - Validates status code (must be 200)
   - Shows error notification via Element UI Message on non-200 response
   - Returns response.data on success
7. Component receives timetable array, sorts and paginates locally
8. Results rendered in el-table component

**Station Data Flow (initialization):**

1. `byTime.vue` mounted hook calls `this.$store.dispatch('getStations')`
2. Vuex action dispatches `getStations()` from API layer
3. Mutation `setStations` stores raw station data in `state.stations`
4. Getter `stations` transforms raw data to UI-friendly format: `{text: station.StationName.Zh_tw, id: station.StationID}`
5. Components access via `mapGetters(['stations'])` computed property
6. Template renders dropdown options from transformed stations

**State Management:**
- Application state: `state.stations` contains array of station objects
- Mutations: Only way to modify state (setStations)
- Actions: Async operations that commit mutations (getStations)
- Getters: Derived state for presentation (stations getter transforms data)

## Key Abstractions

**API Service Functions:**
- Purpose: Encapsulate specific API endpoint calls with parameter validation
- Examples: `src/api/thrs-api.js` exports functions like `getStations()`, `getDailyTimetable()`, `getGeneralTimetablebyTrainNo()`
- Pattern: Each function returns a promise from axios request with specific URL, method, and parameters

**Vue Components:**
- Purpose: Encapsulate UI, local state, business logic for specific feature area
- Examples: `src/components/byTime.vue` (query by station and time), `src/components/byTrainNo.vue` (query by train number), `src/components/byStation.vue` (query seat availability)
- Pattern: Local component state (data), computed properties, methods for user interaction, mounted lifecycle hook for initialization

**Request Interceptor:**
- Purpose: Centralized request handling (currently minimal - debug logging only)
- Location: `src/utils/request.js` - `service.interceptors.request.use()`
- Pattern: Receives config, returns config; can transform headers, add auth tokens, etc.

**Response Interceptor:**
- Purpose: Unified error handling and response transformation
- Location: `src/utils/request.js` - `service.interceptors.response.use()`
- Pattern: Success path returns response.data; error path shows Element UI Message notification and rejects promise

## Entry Points

**Application Bootstrap:**
- Location: `src/main.js`
- Triggers: Script execution in HTML (bundled by webpack)
- Responsibilities:
  - Import Vue framework and plugins (ElementUI)
  - Mount root Vue instance with router and store
  - Mount to DOM element with id='app'

**Root Component:**
- Location: `src/App.vue`
- Triggers: Mounted by main.js
- Responsibilities: Render router-view outlet for page-level routing

**Home View:**
- Location: `src/views/Home.vue`
- Triggers: Route navigation to '/' (default route)
- Responsibilities:
  - Render el-container with header
  - Display tabbed interface with three query components
  - Serve as main application interface

**About View:**
- Location: `src/views/About.vue`
- Triggers: Route navigation to '/about'
- Responsibilities: Placeholder view (currently minimal)

## Error Handling

**Strategy:** Centralized error capture at HTTP layer with user-facing notifications

**Patterns:**
- Response interceptor catches all HTTP errors (status !== 200)
- Element UI Message component displays error toast notifications
- Error messages auto-dismiss after 5 seconds
- Failed promises are rejected, allowing components to handle failures if needed
- Console warnings logged for debugging in development

**Error Sources:**
- API endpoint failures (timeouts, 4xx/5xx responses)
- Network failures (caught in response error interceptor)
- Invalid request parameters (form validation prevents most cases)

## Cross-Cutting Concerns

**Logging:**
- Request: console.warn() for request errors in development (no-console rule disabled in dev)
- Response: console.warn() for response errors
- Components: console.warn/log for validation failures, data transformations
- Production: No console output enforced via ESLint rule

**Validation:**
- Form validation: Element UI el-form with rules object (required fields, custom validators)
- Custom validator: byTime.vue validates that origin and destination stations differ
- Validation triggers on change/blur events as defined in rules

**Authentication:**
- No authentication mechanism implemented (public API endpoints assumed)
- Request/response interceptors have placeholder for future auth token injection

**Data Transformation:**
- Station data: Raw API response transformed via Vuex getter to {text, id} format
- Time calculations: Helper method `diffTime()` calculates duration between departure/arrival
- Seat status: Filter function transforms API status values (Available/Limited/Full) to Chinese labels

**UI Framework:**
- Element UI provides components: el-form, el-select, el-date-picker, el-table, el-card, el-tabs, el-timeline
- Custom CSS: Minimal styles in App.vue and component scoped styles
- Global styles: normalize.css for reset, Element UI theme CSS, custom style.scss

---

*Architecture analysis: 2026-02-19*
