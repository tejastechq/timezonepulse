# TASK_003: Timezone Card Current Events Tabs

timestamp: 2024-04-08T00:00:00Z
status: In Progress
components: [#UI_TIMEZONE_CARD, #UI_EVENTS_SECTION, #UI_TAB_WEATHER, #UI_TAB_NEWS, #UI_TAB_SPORTS, #UI_FILTER_BAR, #UI_PANEL_WEATHER, #UI_PANEL_NEWS, #UI_PANEL_SPORTS, #SVC_WEATHER, #SVC_NEWS, #SVC_SPORTS, #MODEL_WEATHER, #MODEL_NEWS, #MODEL_SPORTS]
implements_decisions: [#API_004]
generated_decisions: []
confidence: HIGH

## Task Definition
Implement a collapsible timezone card that, when expanded, shows a tabbed interface for Weather, News, and Sports events for the selected timezone/area, with user filters and real, free, production-ready APIs.

## Subtasks
1. ⏱️ SUBTASK_003.1: "UI/UX - Collapse/Expand Logic"
   - Goal: Add click target in top-right; collapse time increments, expand events section.
   - Required contexts: #UI_TIMEZONE_CARD
   - Output: Card animates between collapsed/expanded states.
   - Status: Not Started

2. ⏱️ SUBTASK_003.2: "UI - Tab Bar & Filter Bar"
   - Goal: Implement tab bar ([☀️ Weather] [📰 News] [🏟️ Sports]) and filter bar (category/league).
   - Required contexts: #UI_EVENTS_SECTION, #UI_TAB_WEATHER, #UI_TAB_NEWS, #UI_TAB_SPORTS, #UI_FILTER_BAR
   - Output: Tabs switch content, filters update per tab.
   - Status: Not Started

3. ⏱️ SUBTASK_003.3: "API Integration - Weather"
   - Goal: Integrate Open-Meteo API for weather by timezone/area.
   - Required contexts: #SVC_WEATHER, #MODEL_WEATHER, #UI_PANEL_WEATHER
   - Output: Weather data shown for area, filterable.
   - Status: Not Started

4. ⏱️ SUBTASK_003.4: "API Integration - News"
   - Goal: Integrate NewsData.io API for news by area/category.
   - Required contexts: #SVC_NEWS, #MODEL_NEWS, #UI_PANEL_NEWS
   - Output: News headlines for area, filterable.
   - Status: Not Started

5. ⏱️ SUBTASK_003.5: "API Integration - Sports"
   - Goal: Integrate TheSportsDB API for sports by area/league.
   - Required contexts: #SVC_SPORTS, #MODEL_SPORTS, #UI_PANEL_SPORTS
   - Output: Sports events for area, filterable.
   - Status: Not Started

6. ⏱️ SUBTASK_003.6: "State Management & Integration"
   - Goal: Manage tab state, filter state, API loading/errors, and per-card context.
   - Required contexts: All above components
   - Output: Seamless, robust user experience.
   - Status: Not Started

7. ⏱️ SUBTASK_003.7: "Testing & Documentation"
   - Goal: Test all flows, update documentation, codeMap_root.md, and indexes.
   - Required contexts: All above components, memory_docs/
   - Output: Passing tests, updated docs, new #IDs in codeMap_root.md and indexes/.
   - Status: Not Started

## Generated Decisions
- See #API_004 in decisions.md

## Integration Notes
- Each subtask is isolated per CONTEXT_ISOLATION_PROTOCOL.
- All API keys and endpoints are managed via environment variables and documented in techContext.md.
- UI/UX follows systemPatterns.md for tabbed/collapsible card pattern.
- All new/updated components are indexed and referenced in codeMap_root.md and indexes/. 