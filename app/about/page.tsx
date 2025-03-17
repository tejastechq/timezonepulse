import Link from 'next/link';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">About World Clock</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="mb-4">
          World Clock is a sophisticated time management application designed to help users track and visualize time across multiple global timezones. 
          It provides a robust solution for professionals who work with international teams, schedule global meetings, or need to coordinate activities across different time zones.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Multi-Timezone Clock Display:</strong> Track time across multiple user-selected timezones simultaneously with real-time updates.
          </li>
          <li>
            <strong>Multiple View Options:</strong> Switch between analog clocks, digital displays, and list views.
          </li>
          <li>
            <strong>Timezone Management:</strong> Add, remove, and organize multiple timezones with smart search capabilities.
          </li>
          <li>
            <strong>Time Planning Tools:</strong> Highlight specific times to visualize them across all selected timezones.
          </li>
          <li>
            <strong>Visual Indicators:</strong> Business hours indication, night time indication, and DST status indicators.
          </li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Technology</h2>
        <p className="mb-4">
          World Clock is built with modern web technologies, including:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Next.js for the framework</li>
          <li>React for the UI components</li>
          <li>TypeScript for type safety</li>
          <li>Tailwind CSS for styling</li>
          <li>Luxon for timezone handling</li>
          <li>Zustand for state management</li>
          <li>Framer Motion for animations</li>
        </ul>
      </section>
      
      <div className="mt-8">
        <Link 
          href="/" 
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
} 