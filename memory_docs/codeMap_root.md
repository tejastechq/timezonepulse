# CodeMap Root
timestamp: 2025-04-10T18:25:55Z

## PROJECT_STRUCTURE
[clock]/
  app/ [CORE]
    layout.tsx #[APP_CORE] "Root layout" @index[layouts] ^critical
    page.tsx #[PAGE_HOME] "Home page" @index[pages]
    about/page.tsx #[PAGE_ABOUT] "About page" @index[pages]
    current-events/page.tsx #[PAGE_EVENTS] "Current events" @index[pages]
    grid-test/page.tsx #[PAGE_GRID] "Grid test" @index[pages]
    home/page.tsx #[PAGE_HOME_ALT] "Alternate home" @index[pages]
    list-view/page.tsx #[PAGE_LIST] "List view" @index[pages]
    mobilev2/page.tsx #[PAGE_MOBILE] "Mobile view" @index[pages]
    api/time/ #[API_TIME] "Time API" @index[api]
    api/weather/ #[API_WEATHER] "Weather API" @index[api]
    api/news/ #[API_NEWS] "News API" @index[api]
    api/cleanup/ #[API_CLEANUP] "Cleanup API" @index[api]
    api/csp-report/ #[API_CSP] "CSP report API" @index[api]
    components/ #[APP_COMPONENTS] "App-specific components" @index[components]
    contexts/ #[APP_CONTEXTS] "Context providers" @index[contexts]
  components/ [UI]
    clock/ #[COMP_CLOCK] "Clock components" @index[components]
    dev/ #[COMP_DEV] "Dev tools" @index[components]
    error/ #[COMP_ERROR] "Error boundaries" @index[components]
    events/ #[COMP_EVENTS] "Event components" @index[components]
    layout/ #[COMP_LAYOUT] "Layout components" @index[components]
    mobile/ #[COMP_MOBILE] "Mobile components" @index[components]
    performance/ #[COMP_PERF] "Performance tools" @index[components]
    seo/ #[COMP_SEO] "SEO components" @index[components]
    ui/ #[COMP_UI] "UI primitives" @index[components]
    views/ #[COMP_VIEWS] "View components" @index[components]
  lib/ [UTIL]
    hooks/ #[HOOKS] "Custom hooks" @index[hooks]
    utils/ #[UTILS] "Utility functions" @index[utils]
    timezone-utils.ts #[UTIL_TZ] "Timezone utilities" @index[utils]
    mars-timezone.ts #[UTIL_MARS] "Mars timezone calculations" @index[utils]
  store/
    timezoneStore.ts #[STORE_STATE] "Timezone state store" @index[state]
  public/ [ASSETS]
    images/, icons/, screenshots/, scripts/, shortcuts/
  scripts/
    generate-secrets.js #[SCRIPT_SECRETS] "Secret generation script" @index[scripts]
  tests/ [TESTS]
    README.md, e2e tests, unit tests
  memory_docs/ [DOCS]
    (Memory Bank documentation)
  cline-reports/, SECURITY/, docs/ [DOCS]
    (Reports, security images, documentation)

## FLOW_DIAGRAMS

### Main Timezone Flow
```mermaid
flowchart TD
  A[User loads app] --> B[Root layout (layout.tsx)]
  B --> C{Route}
  C -->|Home| D[page.tsx]
  C -->|List| E[list-view/page.tsx]
  C -->|Grid| F[grid-test/page.tsx]
  C -->|Mobile| G[mobilev2/page.tsx]
  D & E & F & G --> H[Clock components]
  H --> I[Timezone utils]
  H --> J[Mars timezone utils]
  H --> K[API fetchers]
  K --> L[API routes (time, weather, news)]
  L --> M[External APIs]
