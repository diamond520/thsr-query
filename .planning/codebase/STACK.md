# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- JavaScript (ES6+) - Vue.js application code and utilities

**Supporting:**
- HTML/SCSS - Templates and styling in Vue Single File Components

## Runtime

**Environment:**
- Node.js (version not pinned, implied 12.x+ based on dependency versions)

**Package Manager:**
- Yarn (specified via yarn.lock lockfile present)
- Lockfile: `yarn.lock` (present)

## Frameworks

**Core:**
- Vue.js 2.6.11 - Progressive JavaScript framework for UI
- Vue Router 3.1.5 - Client-side routing for single-page application
- Vuex 3.1.2 - State management for shared application state

**UI Component Library:**
- Element UI 2.13.0 - Vue.js component library for dashboard/form UI
- normalize.css 8.0.1 - CSS normalization for cross-browser consistency

**Build & Development:**
- @vue/cli-service 4.2.0 - Vue CLI service for dev/build operations
- @vue/cli-plugin-babel 4.2.0 - Babel transpilation plugin for Vue CLI
- @vue/cli-plugin-eslint 4.2.0 - ESLint integration plugin for Vue CLI
- vue-template-compiler 2.6.11 - Compiles Vue templates to render functions

## Testing

**Framework:**
- Not detected - No testing framework configured in dependencies

## Build/Dev Tools

**Code Quality:**
- ESLint 6.7.2 - JavaScript linting and code quality checks
- eslint-plugin-vue 6.1.2 - Vue.js specific ESLint rules
- babel-eslint 10.0.3 - Babel parser for ESLint to understand modern JS

**CSS Processing:**
- node-sass 4.12.0 - Node.js Sass compiler
- sass-loader 8.0.2 - Webpack loader for Sass/SCSS files

**JavaScript Transpilation:**
- Babel 7.x (via @vue/cli-plugin-babel preset) - ES6+ to ES5 transpilation

## Key Dependencies

**Critical:**
- axios 0.19.2 - HTTP client for making API requests to THSR service
- core-js 3.6.4 - Polyfills for modern JavaScript features in older browsers

**Infrastructure:**
- element-ui 2.13.0 - Component library dependency (peer of Vue.js)

## Configuration

**Environment:**
- Environment variables configured via process.env.BASE_URL for router base path
- No .env files detected - uses Vue CLI defaults
- Production mode enforces no-console and no-debugger rules

**Build:**
- Babel configuration: `babel.config.js` - Uses Vue CLI preset
- ESLint configuration: `.eslintrc.js` - Vue + ESLint recommended rules
- Browser support: `.browserslistrc` - Targets > 1% market share, last 2 versions

## Platform Requirements

**Development:**
- Node.js 12.x or higher (inferred from dependency versions)
- Yarn package manager
- Git for version control

**Production:**
- Static file hosting for built Vue.js SPA
- Requires HTTPS for external API calls (THSR API uses https://ptx.transportdata.tw/)
- No backend server required - client-side only application

---

*Stack analysis: 2026-02-19*
