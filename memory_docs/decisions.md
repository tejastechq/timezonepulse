# Decision Journal
timestamp: 2025-04-10T18:25:30Z

## Active Decisions

- [2025-04-10] #ARCH_001 "Adopt Next.js 15 App Router"
  - **Context:** Modernize routing and layouts
  - **Options:** Continue with Pages Router, migrate to App Router
  - **Decision:** Use App Router with nested layouts and server components
  - **Rationale:** Better flexibility, performance, and future-proofing
  - **Components:** #APP_CORE, #UI_LAYOUT
  - **Confidence:** HIGH

- [2025-04-10] #FEAT_001 "Support Mars timezone calculations"
  - **Context:** Unique feature to differentiate app
  - **Options:** Earth timezones only, add Mars time support
  - **Decision:** Add Mars timezone and sol calculations
  - **Rationale:** Novelty, educational value, space mission relevance
  - **Components:** #UTIL_MARS, #COMP_CLOCK
  - **Confidence:** HIGH

- [2025-04-10] #DATA_001 "Integrate real-time weather and news data"
  - **Context:** Enrich timezone dashboard with contextual info
  - **Options:** Static timezone data, add real-time integrations
  - **Decision:** Add API routes and fetchers for weather/news
  - **Rationale:** More engaging and informative experience
  - **Components:** #API_WEATHER, #API_NEWS, #COMP_DASHBOARD
  - **Confidence:** HIGH

- [2025-04-10] #STATE_001 "Use Zustand and Jotai for state management"
  - **Context:** Manage client-side state efficiently
  - **Options:** Redux, Context API, Zustand, Jotai
  - **Decision:** Use Zustand and Jotai
  - **Rationale:** Simplicity, flexibility, modern approach
  - **Components:** #STORE_STATE, #HOOKS
  - **Confidence:** HIGH

- [2025-04-10] #STYLE_001 "Use Tailwind CSS with UI libraries"
  - **Context:** Style the app responsively and efficiently
  - **Options:** CSS modules, Styled Components, Tailwind CSS
  - **Decision:** Tailwind CSS + NextUI + Radix UI
  - **Rationale:** Utility-first, rapid development, accessibility
  - **Components:** #UI_COMPONENTS
  - **Confidence:** HIGH

- [2025-04-10] #TEST_001 "Adopt Vitest, Playwright, Testing Library"
  - **Context:** Ensure code quality and reliability
  - **Options:** Jest, Cypress, Playwright, Vitest
  - **Decision:** Use Vitest for unit, Playwright for e2e, Testing Library for UI
  - **Rationale:** Modern, fast, comprehensive testing
  - **Components:** #TESTS
  - **Confidence:** HIGH

- [2025-04-10] #SEC_001 "Implement security and monitoring"
  - **Context:** Protect app and monitor issues
  - **Options:** None, basic, advanced
  - **Decision:** Use Helmet, Sentry, CSP reporting
  - **Rationale:** Enhance security and observability
  - **Components:** #API, #MIDDLEWARE
  - **Confidence:** HIGH

- [2025-04-10] #DEPS_001 "Handle NextUI Deprecation"
  - **Context:** `@nextui-org/react` is deprecated; project rebranded to HeroUI.
  - **Options:** Migrate immediately, defer migration, replace with different library.
  - **Decision:** Defer migration to HeroUI to a separate task (TASK_002). Continue with other cleanup tasks first.
  - **Rationale:** Migration is significant effort; focus on initial cleanup first.
  - **Components:** #UI_COMPONENTS (primarily NextUI usages)
  - **Confidence:** HIGH
  - **Source:** TASK_001.1

## Historical Decisions
<!-- Add historical decisions here as project evolves -->
