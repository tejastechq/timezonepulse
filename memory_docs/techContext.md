# Tech Context
timestamp: 2025-04-10T18:23:35Z

## Technologies
- **Framework:** Next.js 15 (App Router + some legacy Pages Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with plugins (forms, typography, container queries)
- **UI Libraries:** NextUI, Radix UI, Lucide Icons, Framer Motion, React Spring
- **State Management:** Zustand, Jotai
- **Date/Time:** Luxon, custom timezone utils (Earth + Mars)
- **Data Fetching:** Axios, Next.js API routes
- **Validation:** Zod
- **Testing:** Vitest, Playwright, Testing Library, Jest
- **Linting/Formatting:** ESLint, Prettier, Husky, lint-staged
- **Build Tools:** SWC, Turbopack, pnpm, cross-env
- **Security:** Helmet, Sentry, CSP reporting
- **Other:** DnD Kit, Downshift, Embla Carousel, React Virtual, Recharts

## Setup
- Run `pnpm install` to install dependencies.
- Use `pnpm dev` or `pnpm run dev` to start development server.
- Build with `pnpm build`.
- Lint with `pnpm lint`.
- Test with `pnpm test` or `pnpm test:e2e`.
- Deployment configured for Vercel.

## Constraints
- Requires Node.js >= 18.17.0
- Uses pnpm as package manager.
- Private monorepo style setup (pnpm workspaces implied).
- Some legacy Pages Router code may exist alongside App Router.

## Dependencies
See `package.json` for full list. Key dependencies highlighted above.
