# System Patterns
timestamp: 2025-04-10T18:25:12Z

## Architecture
- **Framework:** Next.js 15 App Router with some legacy Pages Router.
- **Rendering:** Hybrid SSR (Server-Side Rendering) and CSR (Client-Side Rendering).
- **Routing:** File-based routing with nested layouts and API routes.
- **Data Layer:** API routes for time, weather, news; client fetches via Axios.
- **State Management:** Zustand and Jotai for client state.
- **Styling:** Tailwind CSS with NextUI and Radix UI components.
- **Unique Feature:** Mars timezone calculations and display.
- **Deployment:** Optimized for Vercel.

## Design Patterns
- **Component-Based Architecture:** Modular React components.
- **Hooks:** Custom hooks for time updates, media queries, debounce.
- **Context Providers:** For integrations and global state.
- **Form Handling:** React Hook Form with Zod validation.
- **Separation of Concerns:** UI, data fetching, and business logic separated.
- **Responsive Design:** Tailwind CSS utilities and container queries.
- **Progressive Enhancement:** Animations, charts, and interactivity layered on core features.

## Technical Decisions
- Use Next.js App Router for modern routing and layouts.
- Support Mars time alongside Earth timezones.
- Integrate real-time weather and news data.
- Use Zustand and Jotai for flexible state management.
- Style with Tailwind CSS and component libraries.
- Validate data with Zod.
- Test with Vitest, Playwright, and Testing Library.
- Monitor and secure with Sentry and Helmet.
