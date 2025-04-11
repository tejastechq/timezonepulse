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

## Layout & Sidebar Pattern
- **Sidebar as Layout Wrapper:**  
  The main layout (`app/layout.tsx`) uses `app/components/Sidebar.tsx` as a wrapper for all page content and the footer. This enables:
  - Responsive sidebar with swipe/overlay behavior.
  - Centralized control of layout, header, and navigation.
  - Consistent user experience across all routes.
- **Rationale:**  
  Moved from a floating sidebar (`components/layout/Sidebar.tsx`) to a layout-centric approach for better maintainability, accessibility, and pattern consistency.
- **Pattern:**  
  `Sidebar` implements the LayoutWrapper pattern, receiving children and rendering the sidebar, header, overlay, and main content.

## Design Patterns
- **Component-Based Architecture:** Modular React components, with clear separation between layout, UI primitives, and feature components.
- **Hooks:** Custom hooks for time updates, media queries, debounce.
- **Context Providers:** For integrations and global state.
- **Layout Wrapper:** Sidebar component wraps all main content, enforcing a single source of layout truth.
- **Form Handling:** React Hook Form with Zod validation.
- **Separation of Concerns:** UI, data fetching, and business logic separated. Layout logic is isolated in Sidebar and RootLayout.
- **Responsive Design:** Tailwind CSS utilities and container queries.
- **Progressive Enhancement:** Animations, charts, and interactivity layered on core features.

## Data Flow & State Management
- **State Management:**  
  Zustand (and Jotai) manage timezone state and user preferences, providing a global store accessible to all components.
- **Data Flow:**  
  Data is fetched from Next.js API routes (time, weather, news) using Axios, then passed to UI components via props or context.
- **API Integration Pattern:**  
  External APIs are integrated via serverless API routes, with error handling and security best practices (Helmet, Sentry).

## Technical Decisions
- Use Next.js App Router for modern routing and layouts.
- Support Mars time alongside Earth timezones.
- Integrate real-time weather and news data.
- Use Zustand and Jotai for flexible state management.
- Style with Tailwind CSS and component libraries.
- Validate data with Zod.
- Test with Vitest, Playwright, and Testing Library.
- Monitor and secure with Sentry and Helmet.

---

## Layout & Data Flow Diagram

```mermaid
flowchart TD
  A[Providers] --> B[Sidebar (LayoutWrapper)]
  B --> C[Header]
  B --> D[Sidebar Navigation]
  B --> E[Main Content]
  E --> F[Footer]
  E --> G[Page Components]
  G --> H[Clock/Events/Views]
  H --> I[TimezoneStore (Zustand)]
  H --> J[API Fetchers]
  J --> K[API Routes (time, weather, news)]
  K --> L[External APIs]
```
