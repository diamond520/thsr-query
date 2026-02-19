# External Integrations

**Analysis Date:** 2026-02-19

## APIs & External Services

**Taiwan THSR (High-Speed Rail) Public Transport API:**
- Service: Taiwan MOTC (Ministry of Transportation and Communications) THSR API
- SDK/Client: axios 0.19.2
- Base URL: `https://ptx.transportdata.tw/MOTC/v2/Rail/THSR`
- Configuration file: `src/utils/request.js`

**API Endpoints Used:**
- `GET /Station` - Retrieves all station information
- `GET /DailyTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}` - Retrieves daily timetable for origin-destination pair
- `GET /GeneralTimetable?top=300` - Retrieves general timetable (first 300 records)
- `GET /GeneralTimetable/TrainNo/{TrainNo}?top=1` - Retrieves specific train information by train number
- `GET /AvailableSeatStatusList/{StationID}` - Retrieves available seat status at a station

**API Integration Details:**
- Implementation: `src/api/thrs-api.js` - Wraps all API calls
- Request handler: `src/utils/request.js` - Axios instance with interceptors
- Request timeout: 5000ms
- Response handling: Checks HTTP 200 status, displays error messages via Element UI Message component

## Data Storage

**Databases:**
- Not applicable - Client-side only application, no backend database

**File Storage:**
- Not applicable - No file upload/download functionality

**Caching:**
- Browser cache only - HTTP responses cached per browser behavior
- In-memory state: Vuex store caches station list in `src/store/index.js`

## Authentication & Identity

**Auth Provider:**
- None detected - THSR public API requires no authentication

**API Access:**
- Public endpoint - No API key or authentication token required
- Accessible without authentication headers

## Monitoring & Observability

**Error Tracking:**
- Not detected - No error tracking service integrated

**Logs:**
- Browser console only - Console.warn() calls for debugging in development
- Error messages displayed to user via Element UI Message component with 5-second timeout
- Production mode disables console output (eslint rule)

## CI/CD & Deployment

**Hosting:**
- Static file hosting required (dist/ folder)
- No backend server required
- Can be deployed to any static file hosting service (GitHub Pages, Netlify, Vercel, etc.)

**CI Pipeline:**
- Not detected - No CI/CD configuration found

**Build Output:**
- `dist/` directory (in .gitignore) - Output of `yarn run build`

## Environment Configuration

**Required env vars:**
- `BASE_URL` - Router base path (defaults to `/` via vue.config.js)
- `NODE_ENV` - Automatically managed by Vue CLI (development/production)

**Optional env vars:**
- `.env.local` - Local environment overrides (gitignored)
- `.env.[mode].local` - Mode-specific local overrides (gitignored)

**Secrets location:**
- Not applicable - No secrets or API keys required for public THSR API

## Webhooks & Callbacks

**Incoming:**
- Not applicable - Client-side only application

**Outgoing:**
- Not applicable - THSR API is pull-only (no webhooks)

## Browser Compatibility

**Target Browsers:**
- > 1% market share globally
- Last 2 versions of major browsers
- Transpiled to ES5 via Babel for older browser support

---

*Integration audit: 2026-02-19*
