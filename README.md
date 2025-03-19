# World Clock

A sophisticated time management application designed to help users track and visualize time across multiple global timezones. This application provides a robust solution for professionals who work with international teams, schedule global meetings, or need to coordinate activities across different time zones.

[World Clock Dashboard]

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development Guidelines](#development-guidelines)
- [Usage Instructions](#usage-instructions)
- [State Management](#state-management)
- [Time Management](#time-management)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

World Clock is a Next.js application that provides a visual interface for managing and comparing times across multiple timezones. It's built with performance and user experience in mind, utilizing modern React patterns, efficient rendering techniques, and responsive design principles.

The application is particularly useful for:
- Professionals working with distributed teams
- Event planners coordinating global meetings
- Individuals with friends and family in different countries
- Anyone needing to convert times between multiple timezones quickly

## Features

### Core Features

1. **Multi-Timezone Clock Display:** Track time across multiple user-selected timezones simultaneously, with real-time updates.

2. **Multiple View Options:**
   - **Analog Clocks View:** Traditional analog clock faces
   - **Digital View:** Digital time representation
   - **List View:** Times in a scrollable list format

3. **Timezone Management:**
   - Add, remove, and organize multiple timezones
   - Smart timezone selection with search capabilities
   - Automatic detection of user's local timezone
   - DST awareness and transition indicators

4. **Time Planning Tools:**
   - Meeting schedulers for cross-region planning
   - Time visualization across timezones
   - Time slot generation

5. **Personal Notes and Reminders:**
   - Client reminders specific to timezones
   - Personal notes for specific times/timezones
   - Notification system

6. **Contextual Information:**
   - Business hours indication
   - DST alerts and information
   - Local holidays and observances

## Tech Stack

- **Frontend Framework:** Next.js 15.2+ with App Router and Server Components
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Performance Optimizations:** Million.js for React rendering optimization
- **Animation:** Framer Motion
- **UI Components:** Radix UI for accessible components
- **Date/Time Handling:** Luxon for timezone calculations
- **Selection Interface:** Downshift for the timezone selection
- **Package Manager:** pnpm (preferred) or npm
- **Build Optimization:** Turbopack
- **Virtualization:** react-window and react-virtualized for efficient list rendering

## Architecture

The application follows a component-based architecture with clear separation of concerns:

```
/
├── app/                # Next.js App Router pages and layouts
│   ├── page.tsx        # Home page
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── clock/          # Clock-related components
│   │   ├── AnalogClock.tsx       # Analog clock implementation
│   │   ├── DigitalClock.tsx      # Digital clock implementation
│   │   └── TimezoneSelector.tsx  # Timezone selection dialog
│   └── views/          # View-specific components
│       ├── ListView.tsx          # List view implementation
│       ├── ClocksView.tsx        # Clock view implementation
│       └── ...
├── lib/                # Utility functions and helpers
│   └── utils/
│       ├── timezone.ts           # Timezone utilities
│       └── timezoneSearch.ts     # Timezone search functionality
├── store/              # Zustand state management
│   └── timezoneStore.ts          # Timezone state management
├── public/             # Static assets
└── ...
```

### Key Design Principles

1. **Component Composition:** Building complex UI from simple, reusable components
2. **Client-Side State Management:** Using Zustand for efficient state handling
3. **Server Components:** Leveraging Next.js server components where appropriate
4. **Optimistic UI Updates:** Providing immediate feedback for user actions
5. **Virtualization:** Using windowing techniques for rendering large lists
6. **Accessibility:** Ensuring the application is usable by everyone

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm (recommended) or npm
- Git
- A code editor (VSCode recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone ssh://gitdev@192.168.86.22/volume1/git/clock.git

   cd clock
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev:safe
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Environment Setup

The application uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=false

# Performance
NEXT_PUBLIC_ENABLE_MILLION_JS=true

# React Server Components Configuration
NEXT_RSC_STRICT_MODE=false
```

## Development Guidelines

### Git Workflow

This project follows a GitFlow-like branching model:

- `main`: Production-ready code
- `develop`: Integration branch for features
- Feature branches: Individual features (format: `feature/feature-name`)

#### Working with Feature Branches

To create a new feature branch:
```bash
git checkout develop
git checkout -b feature/your-feature-name
```

When a feature is complete:
```bash
git checkout develop
git merge feature/your-feature-name
```

To push changes to the Synology NAS repository:
```bash
git push origin branch-name
```

### Development Scripts

- `pnpm dev` - Start the development server
- `pnpm dev:safe` - Start the development server with RSC strict mode disabled (recommended)
- `pnpm dev:turbo` - Start the development server with Turbopack (faster but might have source map issues)
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Lint the codebase
- `pnpm test` - Run tests
- `pnpm analyze` - Analyze bundle size
- `pnpm clean` - Remove the .next directory
- `pnpm fix-env` - Set up environment variables for development

### Package Manager Requirements

This project uses pnpm as the preferred package manager due to better dependency management and isolation. Important rules to follow:

1. **Always use pnpm commands** instead of npm to avoid dependency conflicts
2. **Use the recommended scripts** (especially `pnpm dev:safe`) for development
3. **Never mix package managers** (npm, yarn, pnpm) in the same project

### Source Maps and Webpack Troubleshooting

If you encounter webpack module initialization errors or source map issues:

1. **Use the safe development script**:
   ```bash
   pnpm dev:safe
   ```
   This runs with React Server Components strict mode disabled.

2. **Clear the build cache**:
   ```bash
   pnpm clean
   ```

3. **Reinstall dependencies** if you encounter module resolution errors:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

4. **Check for browser-tools-mcp conflicts** (see [Troubleshooting](#troubleshooting) section)

5. **Million.js compatibility**: The project uses Million.js for React optimization, but it's configured conservatively to avoid compatibility issues with Next.js 15.2+ and React 19.

## Usage Instructions

### Basic Navigation

- **Switch Between Views:** Use the view selector in the top navigation to switch between Analog, Digital, and List views.
- **Toggle Dark/Light Mode:** Click the theme toggle in the top-right corner.

### Timezone Management

- **Adding a Timezone:** Click the "Add Timezone" button and search for a timezone by name, city, or country.
- **Removing a Timezone:** Click the options menu (three dots) on a timezone card and select "Remove".
- **Changing a Timezone:** Click the options menu on a timezone card and select "Change Timezone".

### Time Highlighting

- **Highlight a Time:** In list view, click on a time to highlight it across all timezones.
- **Clear Highlight:** Click the X button on the highlight indicator or click outside the time columns.
- **Automatic Clearing:** Highlighted times will automatically clear after 60 seconds of inactivity.

### Quick Navigation

Each timezone column has quick navigation buttons:
- **Sun Icon:** Jump to morning (8 AM)
- **Up Arrow:** Jump to noon (12 PM)
- **Down Arrow:** Jump to evening (6 PM)
- **Moon Icon:** Jump to night (9 PM)
- **Clock Icon:** Jump to current time

## State Management

The application uses Zustand for state management, which provides a simple yet powerful API for managing application state.

### Timezone Store

The main state store is `timezoneStore.ts`, which manages:

- Selected timezones
- User's local timezone
- Timezone preferences
- Timezone operations (add, remove, reorder)

Example of state access:

```tsx
import { useTimezoneStore } from '@/store/timezoneStore';

function MyComponent() {
  const { selectedTimezones, addTimezone, removeTimezone } = useTimezoneStore();
  
  // Use the store values and actions
}
```

## Time Management

### Timezone Handling

The application uses Luxon for all date and time calculations due to its robust timezone support. Key utility functions are in `lib/utils/timezone.ts` and include:

- `getAllTimezones()`: Get a list of all available timezones
- `isInDST(timezone)`: Check if a timezone is currently in DST
- `sortTimezonesByRelevance(timezones, query)`: Sort timezones by relevance to a search query

### DST Awareness

The application displays indicators when timezones are in DST or approaching a DST transition. This helps users avoid scheduling issues around timezone changes.

### Time Comparison

The List View allows for direct comparison of times across multiple timezones. Highlighting a time in one timezone shows the equivalent time in all other selected timezones.

## Testing

### Testing Strategy

The project uses a combination of testing approaches:

1. **Unit Tests:** For utility functions and isolated components
2. **Component Tests:** For testing component behavior
3. **Integration Tests:** For testing component interactions
4. **End-to-End Tests:** For testing the complete application flow

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

## Deployment

### Production Build

To create a production build:

```bash
pnpm build
```

### Deployment Options

The application can be deployed to various platforms:

1. **Vercel** (Recommended):
   ```bash
   vercel
   ```

2. **Netlify**:
   Configure `netlify.toml` and connect to your Netlify account.

3. **Self-hosted**:
   Build the application and serve with a static file server or Node.js.

### Server Requirements

- Node.js 18.17 or later
- 512MB RAM minimum (1GB recommended)
- Minimal CPU requirements

## Troubleshooting

### Browser-Tools-MCP Dependency Conflicts

The project contains a `browser-tools-mcp` directory that provides browser inspection capabilities for AI tools. This can cause dependency conflicts if not handled correctly:

#### Symptoms of Conflict

- `TypeError: Cannot read properties of undefined (reading 'call')` in webpack.js
- Module initialization errors in React Server Components
- Packages being moved to `.ignored` directories during installation

#### Prevention

1. **Always use pnpm**: The project has special configuration in pnpm to prevent conflicts
2. **Use the provided scripts**: Run with `pnpm dev:safe` or `pnpm dev:fixed`
3. **Follow isolation guidelines**: The project includes `.npmignore` and specific environment variables to maintain proper isolation

#### Resolution if Issues Occur

If you encounter browser-tools-mcp related dependency conflicts:

1. **Clean the environment**:
   ```bash
   rm -rf node_modules .next
   ```

2. **Reinstall with pnpm only**:
   ```bash
   pnpm install
   ```

3. **Start with safe mode**:
   ```bash
   pnpm dev:safe
   ```

### React 19 + Next.js 15.2+ Compatibility

This project uses React 19 with Next.js 15.2+, which is a cutting-edge combination that may have occasional compatibility issues:

1. **RSC Strict Mode**: The project disables React Server Components strict mode by default to avoid certain edge cases. Use `pnpm dev:safe` for development.

2. **Million.js Integration**: Million.js optimization is configured conservatively to avoid compatibility issues. If you encounter problems:
   - Check the Million.js configuration in `next.config.js`
   - Disable Million.js temporarily by commenting out the million import and using direct export

3. **Module Resolution**: The project includes special module resolution settings in tsconfig and package.json to ensure proper package compatibility.

## Contributing

We welcome contributions to the World Clock project! Please follow these steps:

1. Check the issues page for open tasks or create a new issue describing your proposed enhancement or bug fix.
2. Fork the repository and create a feature branch from `develop`.
3. Make your changes following the code style guidelines.
4. Write tests for your changes.
5. Make sure all tests pass.
6. Submit a pull request to the `develop` branch.

### Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the documentation if necessary.
3. The PR should work in development and pass all tests.
4. A maintainer will review your PR and provide feedback.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Luxon](https://moment.github.io/luxon/) for the excellent date and time handling
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Million.js](https://million.dev/) for React optimization
- All the contributors who have helped make this project better 











Cursor Rules:

