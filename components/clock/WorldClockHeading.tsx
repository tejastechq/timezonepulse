// This is a Server Component that will be rendered statically
// and sent as part of the initial HTML, improving LCP
export default function WorldClockHeading() {
  return (
    <h2 
      className="text-2xl font-bold mb-6 text-center"
      id="main-heading"
      // Add explicit dimensions to prevent layout shift
      style={{ minHeight: '32px' }}
    >
      World Clock
    </h2>
  );
} 