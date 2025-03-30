// This is a special MCP Server Component that will be rendered statically
// with high priority to improve LCP
export default function HeadingMCP() {
  return (
    <h2 
      className="text-2xl font-bold mb-6 text-center" 
      id="main-heading"
      style={{ minHeight: '32px' }}
    >
      TimeZonePulse
    </h2>
  );
}
