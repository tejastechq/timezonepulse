# World Clock

A time management application designed to help users track and visualize time across multiple global timezones. This application provides a robust solution for professionals who work with international teams, schedule global meetings, or need to coordinate activities across different time zones.

## Git Workflow

This project follows a GitFlow-like branching model:

- `main`: Production-ready code 
- `develop`: Integration branch for features
- Feature branches: Individual features (format: `feature/feature-name`)

### Working with Feature Branches

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

## Core Features

1. **Multi-Timezone Clock Display:** Track time across multiple user-selected timezones simultaneously, with real-time updates.

2. **Multiple View Options:**
   - **Analog Clocks View:** Traditional analog clock faces
   - **Digital View:** Digital time representation
   - **List View:** Times in a scrollable list format

3. **Timezone Management:**
   - Add, remove, and organize multiple timezones
   - Smart timezone selection with search
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

- **Next.js 15.2+** with App Router
- **React 19**
- **TypeScript**
- **TailwindCSS** for styling
- **Zustand** for state management
- **Framer Motion** for animations
- **Radix UI** for accessible UI components
- **Luxon** for timezone handling and date manipulation
- **Downshift** for the timezone selection interface

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/world-clock.git
   cd world-clock
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Development Configuration

#### Development Scripts

- `pnpm dev` - Start the development server with Turbopack (faster but might have source map issues on Windows)
- `pnpm dev:webpack` - Start the development server with standard Webpack (better source map support)
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Lint the codebase

#### Source Maps Troubleshooting

If you encounter source map warnings or errors in your development environment:

1. **Use Webpack Instead of Turbopack**: 
   ```bash
   pnpm dev:webpack
   ```
   This uses standard Webpack which has better source map support, especially on Windows.

2. **Clear Next.js Cache**:
   ```bash
   npx rimraf .next
   ```
   This removes any potentially corrupted cache files.

3. **Source Map Configuration**:
   The project includes optimized source map settings in `next.config.js`. For development, we use `cheap-module-source-map` which balances performance and debugging capability.

4. **Million.js and Source Maps**:
   If source map issues persist, you might need to temporarily disable Million.js in the Next.js configuration.

## Usage

- **Adding a Timezone:** Click the "Add Timezone" button and search for a timezone by name, city, or country.
- **Removing a Timezone:** Click the options menu (three dots) on a timezone card and select "Remove".
- **Changing View Mode:** Use the view selector in the top-right corner to switch between analog, digital, and list views.
- **Highlighting a Time:** In list view, click on a time to highlight it across all timezones.

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components/clock` - Clock-related components
- `/lib/utils` - Utility functions for timezone handling
- `/store` - Zustand state management

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Luxon](https://moment.github.io/luxon/) for the excellent date and time handling
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Framer Motion](https://www.framer.com/motion/) for smooth animations 