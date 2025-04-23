# System Patterns

timestamp: 2024-06-09T00:00:00Z

## Architecture
- Modular directory structure (components, app, store, lib, types)
- Likely uses Next.js or React for UI and routing
- State management via custom store (e.g., timezoneStore)
- Utility libraries for shared logic
- TypeScript for type safety

## Patterns (inferred)
- Component-based UI (React/Next.js)
- Separation of concerns (UI, state, utilities, types)
- Theming and customization (ThemeToggle, BackgroundSelector)
- Responsive/mobile-first design
- Static asset management (public/)

## UI/UX Pattern: Timezone Card Events Tab System

### Components
- #UI_TIMEZONE_CARD: Main timezone card, handles collapse/expand
- #UI_EVENTS_SECTION: Container for events (shown on expand)
- #UI_TAB_WEATHER, #UI_TAB_NEWS, #UI_TAB_SPORTS: Tab buttons for switching event type
- #UI_FILTER_BAR: Filter controls (category, league, etc.)
- #UI_PANEL_WEATHER, #UI_PANEL_NEWS, #UI_PANEL_SPORTS: Content panels for each event type

### Pattern
- User clicks the top-right area of #UI_TIMEZONE_CARD
- Time increments section collapses (hides)
- #UI_EVENTS_SECTION expands, showing tab bar and filter bar
- Tab bar allows switching between Weather, News, Sports
- Only one panel is visible at a time (tabbed interface)
- Filter bar updates the content in the active panel
- All data is contextual to the timezone/area of the card
- Smooth animation for collapse/expand and tab switching

### Accessibility
- Tabs are keyboard-navigable
- ARIA roles for tablist, tab, tabpanel

## To be updated as more patterns are discovered during analysis. 