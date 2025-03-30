import Link from 'next/link';
// Font objects no longer imported here

export default function About() {
  return (
    <div className="bg-white dark:bg-gray-900"> {/* Base background */}
      {/* Section 1: Hero / Why */}
      {/* Reduced bottom padding from py-16 to pb-10 */}
      <div className="bg-gradient-to-b from-blue-50 dark:from-gray-800 to-white dark:to-gray-900 text-center px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Headline - using Poppins */}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white font-poppins">
            Sync Your World with TimezonePulse
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Navigating global time shouldn't be complicated. We built TimezonePulse to provide a simple, intuitive, and reliable way for you to stay connected across timezones.
          </p>
          {/* Optional: Placeholder for a visual element */}
          {/* <div className="my-8 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">Your visual/graphic here</div> */}
        </div>
      </div>

      {/* Section 2: How it Helps You */}
       {/* Reduced top padding from py-16 to pt-10 */}
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <section className="mb-16">
           {/* Section heading - using Poppins */}
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white font-poppins">
            What TimezonePulse Does For You
          </h2>
          <p className="text-lg text-center text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Whether you're coordinating with international colleagues, scheduling meetings across continents, or planning travel, TimezonePulse gives you the clarity you need. Stop guessing and start synchronizing effortlessly.
          </p>
        </section>

        {/* Section 3: Key Features as Benefits */}
        <section>
           {/* Section heading - using Poppins */}
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white font-poppins">
            Everything You Need to Manage Time
          </h2>
          {/* Using a simple grid layout for features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700 dark:text-gray-300">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
               {/* Feature heading - using Poppins */}
              <h3 className="text-xl font-semibold mb-2 font-poppins">Visualize Multiple Timezones</h3>
              <p>See current times side-by-side for all your important locations at a glance.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
               {/* Feature heading - using Poppins */}
              <h3 className="text-xl font-semibold mb-2 font-poppins">Choose Your View</h3>
              <p>Switch between analog, digital, or list views to see time the way you prefer.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
               {/* Feature heading - using Poppins */}
              <h3 className="text-xl font-semibold mb-2 font-poppins">Effortless Scheduling</h3>
              <p>Quickly compare times and find the perfect slot for your global meetings.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
               {/* Feature heading - using Poppins */}
              <h3 className="text-xl font-semibold mb-2 font-poppins">Smart Timezone Search</h3>
              <p>Easily find, add, and manage the timezones that matter to you.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Call to Action / Back Link */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors inline-block text-lg font-medium"
          >
            Go to the Clock
          </Link>
        </div>
      </div>
    </div>
  );
}
