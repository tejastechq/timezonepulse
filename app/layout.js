import './globals.css';

export const metadata = {
  title: 'World Clock',
  description: 'A global time management application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
} 