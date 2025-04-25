# Clock Project

This is a world clock application built with Next.js and Tailwind CSS. It provides functionalities to view time across different time zones, with options for list, analog, and digital displays.

## Features

- **Multi-View Clock**: Switch between List, Analog, and Digital views to see time in various formats.
- **Time Zone Support**: Display time for multiple time zones simultaneously.
- **Responsive Design**: Optimized for both desktop and mobile devices using Tailwind CSS.

## Installation

To run this project locally, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/clock.git
   cd clock
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. **Start the Development Server**:
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

- Navigate through different views using the switcher buttons (currently under maintenance, see TODO below).
- Add or remove time zones from the list to customize your view.

## TODO

- [ ] Re-enable the List/Analog/Digital view switcher buttons in `components/clock/ViewSwitcher.tsx` after resolving the underlying issues.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue on GitHub for any bugs, feature requests, or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
