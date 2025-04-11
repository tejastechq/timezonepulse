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

- [2025-04-10] #IMPL_004 "Sidebar/Layout Refactor"
  - **Context**: The project previously used a floating sidebar component (`components/layout/Sidebar.tsx`) that was rendered as a sibling in the main layout. This led to complexity in layout management, inconsistent sidebar behavior, and difficulty maintaining a responsive/overlay experience.
  - **Options**: Continue with the floating sidebar as a sibling; Refactor to use a layout-centric Sidebar wrapper (`app/components/Sidebar.tsx`) in `app/layout.tsx`.
  - **Decision**: Refactor the layout to use `app/components/Sidebar.tsx` as the main layout wrapper, removing the floating sidebar and centralizing layout logic.
  - **Rationale**: This approach improves maintainability, enables consistent responsive/overlay sidebar behavior, and aligns with modern Next.js layout patterns.
  - **Components**: #APP_SIDEBAR, #APP_CORE
  - **Confidence**: HIGH
  - **Source**: TASK_001 (Project Audit and Cleanup)

- [2025-04-10] #ARCH_003 "State Management Approach"
  - **Context**: The app requires global state for timezones, user preferences, and real-time data integration.
  - **Options**: Use Redux for all state; Use Zustand and Jotai for lightweight, flexible state management.
  - **Decision**: Use Zustand (and Jotai where appropriate) for client state management.
  - **Rationale**: Zustand provides a simple, scalable API for global state, and Jotai is used for atomic state needs. Both integrate well with Next.js and the modular component structure.
  - **Components**: #STORE_STATE, #APP_CORE, #APP_SIDEBAR
  - **Confidence**: HIGH
  - **Source**: TASK_001

- [2025-04-10] #ARCH_004 "API Integration Pattern"
  - **Context**: The app integrates with external APIs (time, weather, news) and needs a secure, maintainable way to fetch and serve data.
  - **Options**: Fetch data directly from the client; Use Next.js API routes as a serverless proxy layer.
  - **Decision**: Use Next.js API routes for all external data integration, with client fetches via Axios.
  - **Rationale**: This pattern improves security, enables SSR/ISR, and centralizes error handling and rate limiting.
  - **Components**: #API_TIME, #API_WEATHER, #API_NEWS, #APP_CORE
  - **Confidence**: HIGH
  - **Source**: TASK_001
